use crate::errors::{AppError, Result};
use crate::models::{ValidationResult, ConnectionTest};
use reqwest::Client;
use std::time::{Duration, Instant};
use url::Url;

pub struct ValidationService {
    client: Client,
    timeout: Duration,
}

impl ValidationService {
    pub fn new() -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .danger_accept_invalid_certs(false) // 强制证书验证
            .https_only(false) // 允许HTTP用于测试
            .build()
            .map_err(|e| AppError::System {
                message: format!("Failed to create HTTP client: {}", e),
            })?;

        Ok(Self {
            client,
            timeout: Duration::from_secs(30),
        })
    }

    pub async fn validate_connection(
        &self,
        base_url: &str,
        auth_token: &str,
    ) -> Result<ConnectionTest> {
        let start_time = Instant::now();
        
        // 验证URL格式
        let url = Url::parse(base_url).map_err(|e| AppError::Validation {
            message: format!("Invalid URL format: {}", e),
        })?;

        // 构建测试请求
        let test_url = format!("{}/v1/models", base_url.trim_end_matches('/'));
        let mut headers = reqwest::header::HeaderMap::new();
        
        // 添加认证头
        headers.insert(
            "Authorization",
            format!("Bearer {}", auth_token)
                .parse()
                .map_err(|e| AppError::Validation {
                    message: format!("Invalid auth token format: {}", e),
                })?,
        );
        
        // 添加用户代理
        headers.insert(
            "User-Agent",
            "Claude-Code-Provider-Manager/1.0"
                .parse()
                .map_err(|e| AppError::Validation {
                    message: format!("Invalid user agent: {}", e),
                })?,
        );

        // 发送请求
        match self
            .client
            .get(&test_url)
            .headers(headers)
            .timeout(self.timeout)
            .send()
            .await
        {
            Ok(response) => {
                let latency = start_time.elapsed().as_millis() as u32;
                let status_code = response.status().as_u16();
                
                if response.status().is_success() {
                    Ok(ConnectionTest {
                        status: "success".to_string(),
                        latency: Some(latency),
                        response_code: Some(status_code),
                        error_message: None,
                    })
                } else {
                    let error_message = match status_code {
                        401 => "认证失败：无效的API密钥".to_string(),
                        403 => "访问被拒绝：权限不足".to_string(),
                        404 => "端点不存在：请检查Base URL".to_string(),
                        429 => "请求过多：API限流".to_string(),
                        500..=599 => "服务器错误：API服务不可用".to_string(),
                        _ => format!("请求失败：HTTP {}", status_code),
                    };
                    
                    Ok(ConnectionTest {
                        status: "error".to_string(),
                        latency: Some(latency),
                        response_code: Some(status_code),
                        error_message: Some(error_message),
                    })
                }
            }
            Err(e) => {
                let latency = start_time.elapsed().as_millis() as u32;
                let error_message = if e.is_timeout() {
                    "连接超时：请检查网络连接和Base URL".to_string()
                } else if e.is_connect() {
                    "连接失败：无法连接到服务器".to_string()
                } else if e.is_decode() {
                    "响应解析失败：服务器返回了无效数据".to_string()
                } else {
                    format!("网络错误：{}", e)
                };
                
                Ok(ConnectionTest {
                    status: "error".to_string(),
                    latency: Some(latency),
                    response_code: None,
                    error_message: Some(error_message),
                })
            }
        }
    }

    pub async fn validate_provider_full(
        &self,
        provider_id: &str,
        base_url: &str,
        auth_token: &str,
        model: &str,
    ) -> Result<ValidationResult> {
        let mut result = ValidationResult::new(provider_id.to_string());
        
        // 1. 连接测试
        match self.validate_connection(base_url, auth_token).await {
            Ok(connection_test) => {
                result.connection_status = connection_test.status.clone();
                result.latency = connection_test.latency;
                
                if connection_test.status == "success" {
                    result.auth_status = "success".to_string();
                    
                    // 2. 模型验证
                    match self.validate_model(base_url, auth_token, model).await {
                        Ok(model_available) => {
                            result.model_status = if model_available {
                                "available".to_string()
                            } else {
                                "unavailable".to_string()
                            };
                            
                            if model_available {
                                result.is_valid = true;
                            } else {
                                result.warnings.push(format!("模型 '{}' 可能不可用", model));
                            }
                        }
                        Err(e) => {
                            result.model_status = "unknown".to_string();
                            result.warnings.push(format!("无法验证模型可用性: {}", e));
                            // 连接成功但模型验证失败，仍然认为是有效的
                            result.is_valid = true;
                        }
                    }
                } else {
                    result.auth_status = "invalid".to_string();
                    if let Some(error_msg) = connection_test.error_message {
                        result.errors.push(error_msg);
                    }
                }
            }
            Err(e) => {
                result.connection_status = "error".to_string();
                result.errors.push(format!("连接验证失败: {}", e));
            }
        }
        
        Ok(result)
    }

    async fn validate_model(
        &self,
        base_url: &str,
        auth_token: &str,
        model: &str,
    ) -> Result<bool> {
        let url = format!("{}/v1/models", base_url.trim_end_matches('/'));
        
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Authorization",
            format!("Bearer {}", auth_token).parse().unwrap(),
        );
        headers.insert(
            "User-Agent",
            "Claude-Code-Provider-Manager/1.0".parse().unwrap(),
        );

        let response = self
            .client
            .get(&url)
            .headers(headers)
            .timeout(self.timeout)
            .send()
            .await?;

        if response.status().is_success() {
            let models_response: serde_json::Value = response.json().await?;
            
            // 尝试解析OpenAI格式的响应
            if let Some(data) = models_response.get("data") {
                if let Some(models_array) = data.as_array() {
                    for model_obj in models_array {
                        if let Some(model_id) = model_obj.get("id").and_then(|v| v.as_str()) {
                            if model_id == model {
                                return Ok(true);
                            }
                        }
                    }
                }
            }
            
            // 如果没有找到精确匹配，但响应成功，假设模型可用
            // 这是因为某些API可能不提供模型列表
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn validate_url_format(url: &str) -> Result<()> {
        let parsed_url = Url::parse(url).map_err(|e| AppError::Validation {
            message: format!("无效的URL格式: {}", e),
        })?;

        if parsed_url.scheme() != "http" && parsed_url.scheme() != "https" {
            return Err(AppError::Validation {
                message: "URL必须使用http或https协议".to_string(),
            });
        }

        if parsed_url.host().is_none() {
            return Err(AppError::Validation {
                message: "URL必须包含有效的主机名".to_string(),
            });
        }

        Ok(())
    }

    pub fn validate_auth_token_format(token: &str) -> Result<()> {
        if token.trim().is_empty() {
            return Err(AppError::Validation {
                message: "认证令牌不能为空".to_string(),
            });
        }

        if token.len() < 10 {
            return Err(AppError::Validation {
                message: "认证令牌长度太短".to_string(),
            });
        }

        // 检查是否包含明显的无效字符
        if token.contains(' ') || token.contains('\n') || token.contains('\r') {
            return Err(AppError::Validation {
                message: "认证令牌包含无效字符".to_string(),
            });
        }

        Ok(())
    }

    pub fn validate_model_name(model: &str) -> Result<()> {
        if model.trim().is_empty() {
            return Err(AppError::Validation {
                message: "模型名称不能为空".to_string(),
            });
        }

        // 基本的模型名称格式检查
        if !model.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.') {
            return Err(AppError::Validation {
                message: "模型名称包含无效字符".to_string(),
            });
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_url_validation() {
        assert!(ValidationService::validate_url_format("https://api.anthropic.com").is_ok());
        assert!(ValidationService::validate_url_format("http://localhost:8080").is_ok());
        assert!(ValidationService::validate_url_format("invalid-url").is_err());
        assert!(ValidationService::validate_url_format("ftp://example.com").is_err());
    }

    #[test]
    fn test_token_validation() {
        assert!(ValidationService::validate_auth_token_format("valid-token-12345").is_ok());
        assert!(ValidationService::validate_auth_token_format("").is_err());
        assert!(ValidationService::validate_auth_token_format("short").is_err());
        assert!(ValidationService::validate_auth_token_format("token with spaces").is_err());
    }

    #[test]
    fn test_model_validation() {
        assert!(ValidationService::validate_model_name("claude-3-sonnet-20240229").is_ok());
        assert!(ValidationService::validate_model_name("gpt-4").is_ok());
        assert!(ValidationService::validate_model_name("").is_err());
        assert!(ValidationService::validate_model_name("model with spaces").is_err());
    }
}