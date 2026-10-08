//! Optional API keys stored in the OS credential store via the `keyring` crate
//! (Windows Credential Manager, macOS/iOS Keychain, Linux Secret Service).
//!
//! The webview can save, delete, or ask whether a key exists. It can never read
//! a key back: provider requests that need a key are made from Rust (`ai.rs`).

const SERVICE: &str = "com.studymode.app";

#[cfg(any(windows, target_os = "macos", target_os = "ios", target_os = "linux"))]
mod imp {
    use super::SERVICE;

    fn entry(name: &str) -> Result<keyring::Entry, String> {
        keyring::Entry::new(SERVICE, name).map_err(|e| format!("credential store unavailable: {e}"))
    }

    pub fn set(name: &str, value: &str) -> Result<(), String> {
        entry(name)?
            .set_password(value)
            .map_err(|e| format!("could not save credential: {e}"))
    }

    pub fn get(name: &str) -> Result<Option<String>, String> {
        match entry(name)?.get_password() {
            Ok(v) => Ok(Some(v)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("could not read credential: {e}")),
        }
    }

    pub fn delete(name: &str) -> Result<(), String> {
        match entry(name)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(format!("could not delete credential: {e}")),
        }
    }

    pub const AVAILABLE: bool = true;
}

#[cfg(not(any(windows, target_os = "macos", target_os = "ios", target_os = "linux")))]
mod imp {
    const MSG: &str = "secure credential storage is not implemented on this platform";
    pub fn set(_: &str, _: &str) -> Result<(), String> {
        Err(MSG.into())
    }
    pub fn get(_: &str) -> Result<Option<String>, String> {
        Err(MSG.into())
    }
    pub fn delete(_: &str) -> Result<(), String> {
        Err(MSG.into())
    }
    pub const AVAILABLE: bool = false;
}

pub use imp::get;

fn valid_name(name: &str) -> bool {
    matches!(name, "anthropic_api_key")
}

#[tauri::command]
pub fn secret_set(name: String, value: String) -> Result<(), String> {
    if !valid_name(&name) {
        return Err("unknown secret".into());
    }
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("empty value".into());
    }
    imp::set(&name, trimmed)
}

#[tauri::command]
pub fn secret_exists(name: String) -> Result<bool, String> {
    if !valid_name(&name) {
        return Err("unknown secret".into());
    }
    Ok(imp::get(&name)?.is_some())
}

#[tauri::command]
pub fn secret_delete(name: String) -> Result<(), String> {
    if !valid_name(&name) {
        return Err("unknown secret".into());
    }
    imp::delete(&name)
}

#[tauri::command]
pub fn secret_store_available() -> bool {
    imp::AVAILABLE
}
