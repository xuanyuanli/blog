use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub base_url: String,
    // auth_token 不在配置文件中存储，仅在内存中临时使用
    #[serde(skip)]
    pub auth_token: Option<String>,
    pub model: String,
    pub small_fast_model: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

impl Provider {
    pub fn new(
        name: String,
        base_url: String,
        model: String,
        small_fast_model: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            base_url,
            auth_token: None,
            model,
            small_fast_model,
            created_at: now,
            updated_at: now,
            is_active: false,
            tags: None,
            description: None,
        }
    }

    pub fn with_auth_token(mut self, token: String) -> Self {
        self.auth_token = Some(token);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = Some(tags);
        self
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn update_timestamp(&mut self) {
        self.updated_at = Utc::now();
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProviderRequest {
    pub name: String,
    pub base_url: String,
    pub auth_token: String,
    pub model: String,
    pub small_fast_model: String,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProviderRequest {
    pub name: Option<String>,
    pub base_url: Option<String>,
    pub auth_token: Option<String>,
    pub model: Option<String>,
    pub small_fast_model: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub provider_id: String,
    pub is_valid: bool,
    pub connection_status: String, // "success", "timeout", "error"
    pub auth_status: String,       // "success", "invalid", "expired"
    pub model_status: String,      // "available", "unavailable", "unknown"
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub latency: Option<u32>,
    pub tested_at: DateTime<Utc>,
}

impl ValidationResult {
    pub fn new(provider_id: String) -> Self {
        Self {
            provider_id,
            is_valid: false,
            connection_status: "unknown".to_string(),
            auth_status: "unknown".to_string(),
            model_status: "unknown".to_string(),
            errors: Vec::new(),
            warnings: Vec::new(),
            latency: None,
            tested_at: Utc::now(),
        }
    }

    pub fn success(provider_id: String, latency: u32) -> Self {
        Self {
            provider_id,
            is_valid: true,
            connection_status: "success".to_string(),
            auth_status: "success".to_string(),
            model_status: "available".to_string(),
            errors: Vec::new(),
            warnings: Vec::new(),
            latency: Some(latency),
            tested_at: Utc::now(),
        }
    }

    pub fn error(provider_id: String, error_message: String) -> Self {
        Self {
            provider_id,
            is_valid: false,
            connection_status: "error".to_string(),
            auth_status: "unknown".to_string(),
            model_status: "unknown".to_string(),
            errors: vec![error_message],
            warnings: Vec::new(),
            latency: None,
            tested_at: Utc::now(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTest {
    pub status: String,
    pub latency: Option<u32>,
    pub response_code: Option<u16>,
    pub error_message: Option<String>,
}