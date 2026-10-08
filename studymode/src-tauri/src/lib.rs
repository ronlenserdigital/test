mod ai;
mod db;
mod export;
mod files;
mod secrets;

use serde::Serialize;
use std::sync::Mutex;
use tauri::Manager;

#[derive(Serialize)]
struct AppInfo {
    platform: &'static str,
    data_dir: String,
    version: String,
}

#[tauri::command]
fn app_info(app: tauri::AppHandle) -> Result<AppInfo, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(AppInfo {
        platform: std::env::consts::OS,
        data_dir: dir.display().to_string(),
        version: app.package_info().version.to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let conn = db::open(&dir.join("studymode.sqlite3"))?;
            app.manage(db::DbState(Mutex::new(conn)));
            app.manage(files::FileRoot(dir.join("files")));
            app.manage(ai::AiState::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_info,
            db::db_execute,
            db::db_exec_script,
            db::db_select,
            db::db_batch,
            files::file_put,
            files::file_get,
            files::file_delete,
            files::file_list,
            secrets::secret_set,
            secrets::secret_exists,
            secrets::secret_delete,
            secrets::secret_store_available,
            ai::ai_messages,
            ai::ai_cancel,
            export::export_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running StudyMode");
}
