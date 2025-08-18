use crate::models::{ValidationResult, ConnectionTest};
use crate::utils::ValidationService;
use crate::errors::Result;
use std::sync::Arc;

#[tauri::command]
pub async fn validate_provider_connection(
    base_url: String,
    auth_token: String,
) -> Result<ConnectionTest> {
    let validation_service = ValidationService::new()?;
    validation_service.validate_connection(&base_url, &auth_token).await
}

#[tauri::command]
pub async fn validate_provider_full(
    provider_id: String,
    base_url: String,
    auth_token: String,
    model: String,
) -> Result<ValidationResult> {
    let validation_service = ValidationService::new()?;
    validation_service.validate_provider_full(&provider_id, &base_url, &auth_token, &model).await
}

#[tauri::command]
pub async fn validate_url_format(url: String) -> Result<()> {
    ValidationService::validate_url_format(&url)
}

#[tauri::command]
pub async fn validate_auth_token_format(token: String) -> Result<()> {
    ValidationService::validate_auth_token_format(&token)
}

#[tauri::command]
pub async fn validate_model_name(model: String) -> Result<()> {
    ValidationService::validate_model_name(&model)
}