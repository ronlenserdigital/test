//! Optional AI provider transport (Anthropic Messages API).
//!
//! The webview builds the request body; Rust attaches the API key from the OS
//! credential store and sends it to a fixed endpoint. The key never returns to
//! the webview and neither the key nor the request/response bodies are logged.

use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;
use tokio::sync::oneshot;

const ENDPOINT: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2023-06-01";
const KEY_NAME: &str = "anthropic_api_key";

#[derive(Default)]
pub struct AiState {
    cancels: Mutex<HashMap<String, oneshot::Sender<()>>>,
}

#[derive(Serialize)]
pub struct AiResponse {
    /// HTTP status, or 0 for transport failures / cancellation.
    status: u16,
    body: Value,
    retry_after: Option<String>,
    cancelled: bool,
    error: Option<String>,
}

fn failure(msg: impl Into<String>) -> AiResponse {
    AiResponse { status: 0, body: Value::Null, retry_after: None, cancelled: false, error: Some(msg.into()) }
}

#[tauri::command]
pub async fn ai_messages(
    state: tauri::State<'_, AiState>,
    request_id: String,
    body: Value,
    betas: Vec<String>,
) -> Result<AiResponse, String> {
    let key = match crate::secrets::get(KEY_NAME) {
        Ok(Some(k)) => k,
        Ok(None) => return Ok(failure("No API key saved. Add one in Settings → AI assistance.")),
        Err(e) => return Ok(failure(e)),
    };
    if !body.is_object() {
        return Ok(failure("invalid request body"));
    }
    // Only allow well-formed beta flag names through as headers.
    let betas: Vec<String> = betas
        .into_iter()
        .filter(|b| !b.is_empty() && b.chars().all(|c| c.is_ascii_alphanumeric() || c == '-'))
        .collect();

    let (tx, rx) = oneshot::channel::<()>();
    state.cancels.lock().map_err(|_| "lock poisoned")?.insert(request_id.clone(), tx);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client
        .post(ENDPOINT)
        .header("x-api-key", key)
        .header("anthropic-version", API_VERSION)
        .header("content-type", "application/json")
        .json(&body);
    if !betas.is_empty() {
        req = req.header("anthropic-beta", betas.join(","));
    }

    let send = async {
        let resp = req.send().await.map_err(|e| {
            if e.is_timeout() {
                "The AI provider timed out.".to_string()
            } else if e.is_connect() {
                "Could not reach the AI provider. Check your internet connection.".to_string()
            } else {
                "Network error while contacting the AI provider.".to_string()
            }
        })?;
        let status = resp.status().as_u16();
        let retry_after = resp
            .headers()
            .get("retry-after")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());
        let body: Value = resp.json().await.unwrap_or(Value::Null);
        Ok::<_, String>(AiResponse { status, body, retry_after, cancelled: false, error: None })
    };

    let result = tokio::select! {
        r = send => match r { Ok(v) => v, Err(e) => failure(e) },
        _ = rx => AiResponse { status: 0, body: Value::Null, retry_after: None, cancelled: true, error: None },
    };
    if let Ok(mut m) = state.cancels.lock() {
        m.remove(&request_id);
    }
    Ok(result)
}

#[tauri::command]
pub fn ai_cancel(state: tauri::State<'_, AiState>, request_id: String) -> Result<bool, String> {
    let tx = state.cancels.lock().map_err(|_| "lock poisoned")?.remove(&request_id);
    Ok(match tx {
        Some(tx) => tx.send(()).is_ok(),
        None => false,
    })
}
