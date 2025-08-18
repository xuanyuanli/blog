use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::{Provider, AppSettings};

#[derive(Debug, Serialize, Deserialize)]
pub struct Configuration {
    pub version: String,
    pub active_provider_id: Option<String>,
    pub providers: Vec<Provider>,
    pub settings: AppSettings,
    pub metadata: ConfigMetadata,
}

impl Configuration {
    pub fn new() -> Self {
        Self {
            version: "1.0.0".to_string(),
            active_provider_id: None,
            providers: Vec::new(),
            settings: AppSettings::default(),
            metadata: ConfigMetadata::new(),
        }
    }

    pub fn get_active_provider(&self) -> Option<&Provider> {
        self.active_provider_id
            .as_ref()
            .and_then(|id| self.providers.iter().find(|p| &p.id == id))
    }

    pub fn get_active_provider_mut(&mut self) -> Option<&mut Provider> {
        let active_id = self.active_provider_id.clone();
        active_id
            .as_ref()
            .and_then(|id| self.providers.iter_mut().find(|p| &p.id == id))
    }

    pub fn set_active_provider(&mut self, provider_id: String) -> bool {
        if self.providers.iter().any(|p| p.id == provider_id) {
            // 将之前的活跃提供商设为非活跃
            for provider in &mut self.providers {
                provider.is_active = provider.id == provider_id;
            }
            self.active_provider_id = Some(provider_id);
            self.metadata.update_timestamp();
            true
        } else {
            false
        }
    }

    pub fn add_provider(&mut self, mut provider: Provider) {
        // 如果这是第一个提供商，自动设为活跃
        if self.providers.is_empty() {
            provider.is_active = true;
            self.active_provider_id = Some(provider.id.clone());
        }
        self.providers.push(provider);
        self.metadata.update_timestamp();
    }

    pub fn update_provider(&mut self, id: &str, updates: super::UpdateProviderRequest) -> bool {
        if let Some(provider) = self.providers.iter_mut().find(|p| p.id == id) {
            if let Some(name) = updates.name {
                provider.name = name;
            }
            if let Some(base_url) = updates.base_url {
                provider.base_url = base_url;
            }
            if let Some(model) = updates.model {
                provider.model = model;
            }
            if let Some(small_fast_model) = updates.small_fast_model {
                provider.small_fast_model = small_fast_model;
            }
            if let Some(tags) = updates.tags {
                provider.tags = Some(tags);
            }
            if let Some(description) = updates.description {
                provider.description = Some(description);
            }
            provider.update_timestamp();
            self.metadata.update_timestamp();
            true
        } else {
            false
        }
    }

    pub fn remove_provider(&mut self, id: &str) -> bool {
        let initial_len = self.providers.len();
        self.providers.retain(|p| p.id != id);
        
        if self.providers.len() < initial_len {
            // 如果删除的是当前活跃的提供商
            if self.active_provider_id.as_ref() == Some(&id.to_string()) {
                // 设置第一个提供商为活跃，或者清空活跃提供商
                if let Some(first_provider) = self.providers.first_mut() {
                    first_provider.is_active = true;
                    self.active_provider_id = Some(first_provider.id.clone());
                } else {
                    self.active_provider_id = None;
                }
            }
            self.metadata.update_timestamp();
            true
        } else {
            false
        }
    }

    pub fn get_provider_by_id(&self, id: &str) -> Option<&Provider> {
        self.providers.iter().find(|p| p.id == id)
    }

    pub fn get_provider_by_id_mut(&mut self, id: &str) -> Option<&mut Provider> {
        self.providers.iter_mut().find(|p| p.id == id)
    }
}

impl Default for Configuration {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigMetadata {
    pub config_version: String,
    pub last_modified: DateTime<Utc>,
    pub backup_enabled: bool,
    pub encryption_enabled: bool,
    pub created_at: DateTime<Utc>,
}

impl ConfigMetadata {
    pub fn new() -> Self {
        let now = Utc::now();
        Self {
            config_version: "1.0.0".to_string(),
            last_modified: now,
            backup_enabled: true,
            encryption_enabled: true,
            created_at: now,
        }
    }

    pub fn update_timestamp(&mut self) {
        self.last_modified = Utc::now();
    }
}

impl Default for ConfigMetadata {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnvironmentInfo {
    pub base_url: Option<String>,
    pub model: Option<String>,
    pub small_fast_model: Option<String>,
    pub provider_name: Option<String>,
    pub is_authenticated: bool,
    pub last_validated: Option<DateTime<Utc>>,
}

impl EnvironmentInfo {
    pub fn from_provider(provider: &Provider) -> Self {
        Self {
            base_url: Some(provider.base_url.clone()),
            model: Some(provider.model.clone()),
            small_fast_model: Some(provider.small_fast_model.clone()),
            provider_name: Some(provider.name.clone()),
            is_authenticated: provider.auth_token.is_some(),
            last_validated: None,
        }
    }

    pub fn empty() -> Self {
        Self {
            base_url: None,
            model: None,
            small_fast_model: None,
            provider_name: None,
            is_authenticated: false,
            last_validated: None,
        }
    }
}