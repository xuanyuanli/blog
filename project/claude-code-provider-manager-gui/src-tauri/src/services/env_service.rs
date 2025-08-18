use crate::errors::{AppError, Result};
use crate::models::{Provider, EnvironmentInfo};
use std::collections::HashMap;

pub struct EnvironmentService;

impl EnvironmentService {
    pub fn new() -> Self {
        Self
    }

    pub fn set_claude_environment(&self, provider: &Provider) -> Result<()> {
        std::env::set_var("ANTHROPIC_BASE_URL", &provider.base_url);
        std::env::set_var("ANTHROPIC_MODEL", &provider.model);
        std::env::set_var("ANTHROPIC_SMALL_FAST_MODEL", &provider.small_fast_model);
        
        // 只有在有令牌时才设置
        if let Some(ref token) = provider.auth_token {
            std::env::set_var("ANTHROPIC_AUTH_TOKEN", token);
        }
        
        tracing::info!("Environment variables set for provider: {}", provider.name);
        Ok(())
    }

    pub fn get_current_environment(&self) -> EnvironmentInfo {
        EnvironmentInfo {
            base_url: std::env::var("ANTHROPIC_BASE_URL").ok(),
            model: std::env::var("ANTHROPIC_MODEL").ok(),
            small_fast_model: std::env::var("ANTHROPIC_SMALL_FAST_MODEL").ok(),
            provider_name: None, // 无法从环境变量推断
            is_authenticated: std::env::var("ANTHROPIC_AUTH_TOKEN").is_ok(),
            last_validated: None,
        }
    }

    pub fn clear_claude_environment(&self) {
        std::env::remove_var("ANTHROPIC_BASE_URL");
        std::env::remove_var("ANTHROPIC_AUTH_TOKEN");
        std::env::remove_var("ANTHROPIC_MODEL");
        std::env::remove_var("ANTHROPIC_SMALL_FAST_MODEL");
        
        tracing::info!("Claude environment variables cleared");
    }

    pub fn get_all_env_vars(&self) -> HashMap<String, String> {
        std::env::vars()
            .filter(|(key, _)| key.starts_with("ANTHROPIC_"))
            .collect()
    }

    pub fn backup_current_env(&self) -> HashMap<String, Option<String>> {
        let mut backup = HashMap::new();
        let claude_vars = ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_MODEL", "ANTHROPIC_SMALL_FAST_MODEL"];
        
        for var in &claude_vars {
            backup.insert(var.to_string(), std::env::var(var).ok());
        }
        
        backup
    }

    pub fn restore_env(&self, backup: &HashMap<String, Option<String>>) {
        for (key, value) in backup {
            match value {
                Some(val) => std::env::set_var(key, val),
                None => std::env::remove_var(key),
            }
        }
        
        tracing::info!("Environment variables restored from backup");
    }
}