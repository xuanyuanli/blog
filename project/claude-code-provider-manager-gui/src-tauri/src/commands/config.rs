use crate::models::{Configuration, AppSettings};
use crate::services::ConfigService;
use crate::errors::Result;
use std::sync::Arc;

#[tauri::command]
pub async fn load_config(config_service: tauri::State<'_, Arc<ConfigService>>) -> Result<Configuration> {
    config_service.load_config()?;
    Ok(config_service.get_config())
}

#[tauri::command]
pub async fn save_config(config_service: tauri::State<'_, Arc<ConfigService>>) -> Result<()> {
    config_service.save_config().await
}

#[tauri::command]
pub async fn export_config(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    include_tokens: bool,
) -> Result<String> {
    config_service.export_config(include_tokens).await
}

#[tauri::command]
pub async fn import_config(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    config_json: String,
    merge: bool,
) -> Result<Configuration> {
    config_service.import_config(&config_json, merge).await
}

#[tauri::command]
pub async fn update_settings(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    settings: AppSettings,
) -> Result<()> {
    config_service.update_settings(settings)
}

#[tauri::command]
pub async fn cleanup_old_backups(
    config_service: tauri::State<'_, Arc<ConfigService>>,
) -> Result<Vec<String>> {
    let removed_paths = config_service.cleanup_old_backups()?;
    Ok(removed_paths.into_iter().map(|p| p.to_string_lossy().to_string()).collect())
}