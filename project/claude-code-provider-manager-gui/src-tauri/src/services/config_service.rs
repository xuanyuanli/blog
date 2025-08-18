use crate::errors::{AppError, Result};
use crate::models::{Configuration, Provider, CreateProviderRequest, UpdateProviderRequest};
use crate::utils::{FileSystemManager, EncryptionManager};
use crate::services::SecurityService;
use std::sync::Arc;
use parking_lot::RwLock;

pub struct ConfigService {
    config: Arc<RwLock<Configuration>>,
    fs_manager: FileSystemManager,
    encryption_manager: EncryptionManager,
    security_service: Arc<SecurityService>,
}

impl ConfigService {
    pub fn new(security_service: Arc<SecurityService>) -> Result<Self> {
        let fs_manager = FileSystemManager::new()?;
        let encryption_manager = EncryptionManager::new()?;
        
        let config = Arc::new(RwLock::new(Configuration::new()));
        
        let service = Self {
            config,
            fs_manager,
            encryption_manager,
            security_service,
        };
        
        // 尝试加载现有配置
        if let Err(e) = service.load_config() {
            tracing::warn!("Failed to load existing config: {}", e);
            // 如果加载失败，使用默认配置
        }
        
        Ok(service)
    }

    pub fn load_config(&self) -> Result<()> {
        let config_path = self.fs_manager.get_config_file_path();
        
        if !self.fs_manager.file_exists(&config_path) {
            tracing::info!("Config file does not exist, using default configuration");
            return Ok(());
        }

        let config_content = self.fs_manager.read_file(&config_path)?;
        let mut config: Configuration = serde_json::from_str(&config_content)?;
        
        // 从安全存储加载敏感数据需要异步运行时，暂时跳过
        // TODO: 在异步上下文中处理
        
        // 更新内存中的配置
        {
            let mut config_guard = self.config.write();
            *config_guard = config;
        }
        
        Ok(())
    }

    pub async fn save_config(&self) -> Result<()> {
        let config_path = self.fs_manager.get_config_file_path();
        
        // 创建备份
        if self.fs_manager.file_exists(&config_path) {
            let _ = self.fs_manager.backup_file(&config_path)?;
        }
        
        // 获取配置的副本用于序列化（不包含敏感数据）
        let config_for_save = {
            let config_guard = self.config.read();
            config_guard.clone()
        };
        
        // 序列化配置（auth_token字段会被跳过）
        let config_json = serde_json::to_string_pretty(&config_for_save)?;
        
        // 原子写入配置文件
        self.fs_manager.write_file_atomic(&config_path, &config_json)?;
        
        // 保存敏感数据到安全存储
        for provider in &config_for_save.providers {
            if let Some(ref token) = provider.auth_token {
                self.security_service.store_token(&provider.id, token).await?;
            }
        }
        
        tracing::info!("Configuration saved successfully");
        Ok(())
    }

    pub fn get_config(&self) -> Configuration {
        self.config.read().clone()
    }

    pub fn get_providers(&self) -> Vec<Provider> {
        self.config.read().providers.clone()
    }

    pub fn get_provider_by_id(&self, id: &str) -> Option<Provider> {
        self.config.read().get_provider_by_id(id).cloned()
    }

    pub fn get_active_provider(&self) -> Option<Provider> {
        self.config.read().get_active_provider().cloned()
    }

    pub async fn add_provider(&self, request: CreateProviderRequest) -> Result<Provider> {
        // 验证输入
        crate::utils::ValidationService::validate_url_format(&request.base_url)?;
        crate::utils::ValidationService::validate_auth_token_format(&request.auth_token)?;
        crate::utils::ValidationService::validate_model_name(&request.model)?;
        crate::utils::ValidationService::validate_model_name(&request.small_fast_model)?;
        
        // 创建新的提供商
        let mut provider = Provider::new(
            request.name,
            request.base_url,
            request.model,
            request.small_fast_model,
        ).with_auth_token(request.auth_token);
        
        if let Some(tags) = request.tags {
            provider = provider.with_tags(tags);
        }
        
        if let Some(description) = request.description {
            provider = provider.with_description(description);
        }
        
        // 添加到配置
        {
            let mut config_guard = self.config.write();
            config_guard.add_provider(provider.clone());
        }
        
        // 保存配置
        self.save_config().await?;
        
        tracing::info!("Added new provider: {} ({})", provider.name, provider.id);
        Ok(provider)
    }

    pub async fn update_provider(&self, id: &str, request: UpdateProviderRequest) -> Result<Provider> {
        // 验证输入
        if let Some(ref base_url) = request.base_url {
            crate::utils::ValidationService::validate_url_format(base_url)?;
        }
        if let Some(ref auth_token) = request.auth_token {
            crate::utils::ValidationService::validate_auth_token_format(auth_token)?;
        }
        if let Some(ref model) = request.model {
            crate::utils::ValidationService::validate_model_name(model)?;
        }
        if let Some(ref small_fast_model) = request.small_fast_model {
            crate::utils::ValidationService::validate_model_name(small_fast_model)?;
        }
        
        // 更新提供商
        let updated_provider = {
            let mut config_guard = self.config.write();
            if !config_guard.update_provider(id, request.clone()) {
                return Err(AppError::ProviderNotFound {
                    id: id.to_string(),
                });
            }
            
            config_guard.get_provider_by_id(id).unwrap().clone()
        };
        
        // 如果有新的auth_token，更新安全存储
        if let Some(ref new_token) = request.auth_token {
            self.security_service.store_token(id, new_token).await?;
        }
        
        // 保存配置
        self.save_config().await?;
        
        tracing::info!("Updated provider: {} ({})", updated_provider.name, id);
        Ok(updated_provider)
    }

    pub async fn delete_provider(&self, id: &str) -> Result<()> {
        // 从配置中删除
        let was_removed = {
            let mut config_guard = self.config.write();
            config_guard.remove_provider(id)
        };
        
        if !was_removed {
            return Err(AppError::ProviderNotFound {
                id: id.to_string(),
            });
        }
        
        // 从安全存储中删除令牌
        if let Err(e) = self.security_service.delete_token(id).await {
            tracing::warn!("Failed to delete token for provider {}: {}", id, e);
        }
        
        // 保存配置
        self.save_config().await?;
        
        tracing::info!("Deleted provider: {}", id);
        Ok(())
    }

    pub async fn switch_provider(&self, id: &str) -> Result<Provider> {
        // 检查提供商是否存在
        let provider = self.get_provider_by_id(id)
            .ok_or_else(|| AppError::ProviderNotFound {
                id: id.to_string(),
            })?;
        
        // 切换活跃提供商
        {
            let mut config_guard = self.config.write();
            if !config_guard.set_active_provider(id.to_string()) {
                return Err(AppError::ProviderNotFound {
                    id: id.to_string(),
                });
            }
        }
        
        // 保存配置
        self.save_config().await?;
        
        tracing::info!("Switched to provider: {} ({})", provider.name, id);
        Ok(provider)
    }

    pub async fn export_config(&self, include_tokens: bool) -> Result<String> {
        let config = if include_tokens {
            // 导出包含令牌的完整配置（注意安全性）
            self.config.read().clone()
        } else {
            // 导出不包含令牌的配置
            let mut config = self.config.read().clone();
            for provider in &mut config.providers {
                provider.auth_token = None;
            }
            config
        };
        
        serde_json::to_string_pretty(&config).map_err(|e| AppError::Serialization(e))
    }

    pub async fn import_config(&self, config_json: &str, merge: bool) -> Result<Configuration> {
        let imported_config: Configuration = serde_json::from_str(config_json)?;
        
        // 验证导入的配置
        for provider in &imported_config.providers {
            crate::utils::ValidationService::validate_url_format(&provider.base_url)?;
            crate::utils::ValidationService::validate_model_name(&provider.model)?;
            crate::utils::ValidationService::validate_model_name(&provider.small_fast_model)?;
        }
        
        if merge {
            // 合并配置
            let mut config_guard = self.config.write();
            
            for provider in imported_config.providers {
                // 检查是否已存在同名或同URL的提供商
                let exists = config_guard.providers.iter().any(|p| {
                    p.name == provider.name || p.base_url == provider.base_url
                });
                
                if !exists {
                    config_guard.add_provider(provider.clone());
                    
                    // 如果导入的提供商有令牌，保存到安全存储
                    if let Some(ref token) = provider.auth_token {
                        self.security_service.store_token(&provider.id, token).await?;
                    }
                }
            }
            
            // 合并设置
            config_guard.settings = imported_config.settings;
        } else {
            // 替换配置
            let mut config_guard = self.config.write();
            *config_guard = imported_config;
            
            // 保存所有令牌到安全存储
            for provider in &config_guard.providers {
                if let Some(ref token) = provider.auth_token {
                    self.security_service.store_token(&provider.id, token).await?;
                }
            }
        }
        
        // 保存配置
        self.save_config().await?;
        
        let final_config = self.config.read().clone();
        tracing::info!("Imported configuration with {} providers", final_config.providers.len());
        
        Ok(final_config)
    }

    pub fn update_settings(&self, settings: crate::models::AppSettings) -> Result<()> {
        {
            let mut config_guard = self.config.write();
            config_guard.settings = settings;
            config_guard.metadata.update_timestamp();
        }
        
        // 保存配置（异步操作在后台进行）
        let self_clone = self.clone();
        tokio::spawn(async move {
            if let Err(e) = self_clone.save_config().await {
                tracing::error!("Failed to save settings: {}", e);
            }
        });
        
        Ok(())
    }
    
    pub fn cleanup_old_backups(&self) -> Result<Vec<std::path::PathBuf>> {
        self.fs_manager.cleanup_old_backups(5) // 保留最近5个备份
    }
}

// 实现Clone以支持异步操作
impl Clone for ConfigService {
    fn clone(&self) -> Self {
        Self {
            config: Arc::clone(&self.config),
            fs_manager: FileSystemManager::new().expect("Failed to create filesystem manager"),
            encryption_manager: EncryptionManager::new().expect("Failed to create encryption manager"),
            security_service: Arc::clone(&self.security_service),
        }
    }
}