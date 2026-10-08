//! Save exported data (backups, CSV/JSON exports, original files) to a
//! location the user picks in the native Save dialog. The webview supplies
//! only the bytes and a suggested file name; it cannot choose a path itself.

use tauri::ipc::{InvokeBody, Request};
use tauri_plugin_dialog::DialogExt;

fn safe_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | ' ') { c } else { '_' })
        .collect();
    let trimmed = cleaned.trim_matches(|c| c == '.' || c == ' ');
    if trimmed.is_empty() { "export".into() } else { trimmed.chars().take(120).collect() }
}

/// Body: raw bytes. Header `x-file-name`: suggested name. Returns false if the user cancelled.
#[tauri::command]
pub async fn export_file(app: tauri::AppHandle, request: Request<'_>) -> Result<bool, String> {
    let name = request
        .headers()
        .get("x-file-name")
        .and_then(|v| v.to_str().ok())
        .map(safe_name)
        .unwrap_or_else(|| "export".into());
    let InvokeBody::Raw(data) = request.body() else {
        return Err("expected raw bytes".into());
    };
    let data = data.clone();
    let ext = name.rsplit('.').next().filter(|e| *e != name).map(|e| e.to_string());
    let (tx, rx) = tokio::sync::oneshot::channel();
    let mut dialog = app.dialog().file().set_file_name(&name);
    if let Some(ext) = &ext {
        dialog = dialog.add_filter(ext.to_uppercase(), &[ext.as_str()]);
    }
    dialog.save_file(move |path| {
        let _ = tx.send(path);
    });
    let Some(path) = rx.await.map_err(|_| "dialog closed unexpectedly".to_string())? else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, data).map_err(|e| format!("could not save file: {e}"))?;
    Ok(true)
}
