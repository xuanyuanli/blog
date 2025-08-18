use crate::models::{LaunchConfig, ProcessInfo, ProcessStatus};
use crate::services::SystemService;
use crate::errors::Result;
use std::sync::Arc;
use std::collections::HashMap;

#[tauri::command]
pub async fn launch_claude_code(
    system_service: tauri::State<'_, Arc<SystemService>>,
    config: LaunchConfig,
) -> Result<ProcessInfo> {
    system_service.launch_claude_code(config).await
}

#[tauri::command]
pub async fn get_process_status(
    system_service: tauri::State<'_, Arc<SystemService>>,
    session_id: String,
) -> Result<ProcessStatus> {
    system_service.get_process_status(&session_id)
}

#[tauri::command]
pub async fn terminate_process(
    system_service: tauri::State<'_, Arc<SystemService>>,
    session_id: String,
) -> Result<()> {
    system_service.terminate_process(&session_id)
}

#[tauri::command]
pub async fn list_active_processes(
    system_service: tauri::State<'_, Arc<SystemService>>,
) -> Result<Vec<String>> {
    Ok(system_service.list_active_processes())
}

#[tauri::command]
pub async fn cleanup_finished_processes(
    system_service: tauri::State<'_, Arc<SystemService>>,
) -> Result<Vec<String>> {
    Ok(system_service.cleanup_finished_processes())
}

#[tauri::command]
pub async fn get_system_info(
    system_service: tauri::State<'_, Arc<SystemService>>,
) -> Result<HashMap<String, String>> {
    Ok(system_service.get_system_info().await)
}

#[tauri::command]
pub async fn open_file_manager(
    system_service: tauri::State<'_, Arc<SystemService>>,
    path: Option<String>,
) -> Result<()> {
    system_service.open_file_manager(path.as_deref())
}

#[tauri::command]
pub async fn open_url(
    system_service: tauri::State<'_, Arc<SystemService>>,
    url: String,
) -> Result<()> {
    system_service.open_url(&url)
}