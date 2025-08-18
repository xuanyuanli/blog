use crate::models::EnvironmentInfo;
use crate::services::{ConfigService, EnvironmentService};
use crate::errors::Result;
use std::sync::Arc;
use std::collections::HashMap;

#[tauri::command]
pub async fn switch_environment(
    config_service: tauri::State<'_, Arc<ConfigService>>,
    env_service: tauri::State<'_, Arc<EnvironmentService>>,
    provider_id: String,
) -> Result<()> {
    // 切换活跃提供商
    let provider = config_service.switch_provider(&provider_id).await?;
    
    // 设置环境变量
    env_service.set_claude_environment(&provider)?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_current_environment(
    env_service: tauri::State<'_, Arc<EnvironmentService>>,
) -> Result<EnvironmentInfo> {
    Ok(env_service.get_current_environment())
}

#[tauri::command]
pub async fn clear_environment(
    env_service: tauri::State<'_, Arc<EnvironmentService>>,
) -> Result<()> {
    env_service.clear_claude_environment();
    Ok(())
}

#[tauri::command]
pub async fn get_all_env_vars(
    env_service: tauri::State<'_, Arc<EnvironmentService>>,
) -> Result<HashMap<String, String>> {
    Ok(env_service.get_all_env_vars())
}