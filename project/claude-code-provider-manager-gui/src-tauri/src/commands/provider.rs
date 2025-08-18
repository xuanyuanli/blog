use crate::models::{Provider, CreateProviderRequest, UpdateProviderRequest};
use crate::services::ConfigService;
use crate::errors::Result;
use std::sync::Arc;

#[tauri::command]
pub async fn get_providers(config_service: tauri::State<'_, Arc<ConfigService>>) -> Result<Vec<Provider>> {
    Ok(config_service.get_providers())
}

#[tauri::command]
pub async fn get_provider_by_id(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    id: String,
) -> Result<Option<Provider>> {
    Ok(config_service.get_provider_by_id(&id))
}

#[tauri::command]
pub async fn get_active_provider(config_service: tauri::State<'_, Arc<ConfigService>>) -> Result<Option<Provider>> {
    Ok(config_service.get_active_provider())
}

#[tauri::command]
pub async fn add_provider(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    request: CreateProviderRequest,
) -> Result<Provider> {
    config_service.add_provider(request).await
}

#[tauri::command]
pub async fn update_provider(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    id: String,
    request: UpdateProviderRequest,
) -> Result<Provider> {
    config_service.update_provider(&id, request).await
}

#[tauri::command]
pub async fn delete_provider(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    id: String,
) -> Result<()> {
    config_service.delete_provider(&id).await
}

#[tauri::command]
pub async fn switch_provider(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    id: String,
) -> Result<Provider> {
    config_service.switch_provider(&id).await
}