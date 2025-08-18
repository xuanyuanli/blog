use crate::errors::{AppError, Result};
use async_trait::async_trait;
use std::collections::HashMap;

#[async_trait]
pub trait SecureStorageBackend: Send + Sync {
    async fn store_token(&self, provider_id: &str, token: &str) -> Result<()>;
    async fn get_token(&self, provider_id: &str) -> Result<Option<String>>;
    async fn delete_token(&self, provider_id: &str) -> Result<()>;
    async fn list_tokens(&self) -> Result<Vec<String>>;
    async fn clear_all(&self) -> Result<()>;
}

pub struct SecurityService {
    backend: Box<dyn SecureStorageBackend>,
}

impl SecurityService {
    pub fn new() -> Result<Self> {
        let backend = Self::create_platform_backend()?;
        Ok(Self { backend })
    }

    fn create_platform_backend() -> Result<Box<dyn SecureStorageBackend>> {
        #[cfg(windows)]
        {
            Ok(Box::new(WindowsSecureStorage::new()?))
        }
        #[cfg(target_os = "macos")]
        {
            Ok(Box::new(MacOSSecureStorage::new()?))
        }
        #[cfg(target_os = "linux")]
        {
            Ok(Box::new(LinuxSecureStorage::new()?))
        }
    }

    pub async fn store_token(&self, provider_id: &str, token: &str) -> Result<()> {
        self.backend.store_token(provider_id, token).await
    }

    pub async fn get_token(&self, provider_id: &str) -> Result<Option<String>> {
        self.backend.get_token(provider_id).await
    }

    pub async fn delete_token(&self, provider_id: &str) -> Result<()> {
        self.backend.delete_token(provider_id).await
    }

    pub async fn list_tokens(&self) -> Result<Vec<String>> {
        self.backend.list_tokens().await
    }

    pub async fn clear_all_tokens(&self) -> Result<()> {
        self.backend.clear_all().await
    }
}

// Windows 安全存储实现
#[cfg(windows)]
pub struct WindowsSecureStorage {
    app_name: String,
}

#[cfg(windows)]
impl WindowsSecureStorage {
    pub fn new() -> Result<Self> {
        Ok(Self {
            app_name: "ClaudeCodeProviderManager".to_string(),
        })
    }

    fn get_registry_key(&self, provider_id: &str) -> String {
        format!("SOFTWARE\\{}\\Tokens\\{}", self.app_name, provider_id)
    }
}

#[cfg(windows)]
#[async_trait]
impl SecureStorageBackend for WindowsSecureStorage {
    async fn store_token(&self, provider_id: &str, token: &str) -> Result<()> {
        use windows::Win32::System::Registry::*;
        use windows::Win32::Foundation::*;
        use windows::Win32::Security::Cryptography::*;
        use std::ptr;

        // 使用DPAPI加密令牌
        let token_bytes = token.as_bytes();
        let mut data_in = CRYPT_INTEGER_BLOB {
            cbData: token_bytes.len() as u32,
            pbData: token_bytes.as_ptr() as *mut u8,
        };

        let mut data_out = CRYPT_INTEGER_BLOB::default();
        
        unsafe {
            let result = CryptProtectData(
                &mut data_in,
                None,
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut data_out,
            );

            if result == FALSE {
                return Err(AppError::Encryption {
                    message: "Failed to encrypt token with DPAPI".to_string(),
                });
            }

            // 将加密数据写入注册表
            let key_path = self.get_registry_key(provider_id);
            let mut key: HKEY = HKEY::default();
            
            let result = RegCreateKeyExA(
                HKEY_CURRENT_USER,
                windows::core::PCSTR(key_path.as_ptr()),
                0,
                None,
                REG_OPTION_NON_VOLATILE,
                KEY_WRITE,
                ptr::null_mut(),
                &mut key,
                ptr::null_mut(),
            );

            if result.is_err() {
                LocalFree(HLOCAL(data_out.pbData as isize));
                return Err(AppError::System {
                    message: "Failed to create registry key".to_string(),
                });
            }

            let encrypted_data = std::slice::from_raw_parts(
                data_out.pbData,
                data_out.cbData as usize,
            );

            let result = RegSetValueExA(
                key,
                windows::core::PCSTR(b"token\0".as_ptr()),
                0,
                REG_BINARY,
                Some(encrypted_data),
            );

            RegCloseKey(key);
            LocalFree(HLOCAL(data_out.pbData as isize));

            if result.is_err() {
                return Err(AppError::System {
                    message: "Failed to write encrypted token to registry".to_string(),
                });
            }
        }

        Ok(())
    }

    async fn get_token(&self, provider_id: &str) -> Result<Option<String>> {
        use windows::Win32::System::Registry::*;
        use windows::Win32::Foundation::*;
        use windows::Win32::Security::Cryptography::*;
        use std::ptr;

        let key_path = self.get_registry_key(provider_id);
        let mut key: HKEY = HKEY::default();

        unsafe {
            let result = RegOpenKeyExA(
                HKEY_CURRENT_USER,
                windows::core::PCSTR(key_path.as_ptr()),
                0,
                KEY_READ,
                &mut key,
            );

            if result.is_err() {
                return Ok(None); // 键不存在
            }

            let mut data_size: u32 = 0;
            let result = RegQueryValueExA(
                key,
                windows::core::PCSTR(b"token\0".as_ptr()),
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                &mut data_size,
            );

            if result.is_err() {
                RegCloseKey(key);
                return Ok(None);
            }

            let mut encrypted_data = vec![0u8; data_size as usize];
            let result = RegQueryValueExA(
                key,
                windows::core::PCSTR(b"token\0".as_ptr()),
                ptr::null_mut(),
                ptr::null_mut(),
                Some(encrypted_data.as_mut_ptr()),
                &mut data_size,
            );

            RegCloseKey(key);

            if result.is_err() {
                return Err(AppError::System {
                    message: "Failed to read encrypted token from registry".to_string(),
                });
            }

            // 使用DPAPI解密
            let mut data_in = CRYPT_INTEGER_BLOB {
                cbData: encrypted_data.len() as u32,
                pbData: encrypted_data.as_mut_ptr(),
            };

            let mut data_out = CRYPT_INTEGER_BLOB::default();

            let result = CryptUnprotectData(
                &mut data_in,
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                0,
                &mut data_out,
            );

            if result == FALSE {
                return Err(AppError::Decryption {
                    message: "Failed to decrypt token with DPAPI".to_string(),
                });
            }

            let decrypted_data = std::slice::from_raw_parts(
                data_out.pbData,
                data_out.cbData as usize,
            );

            let token = String::from_utf8(decrypted_data.to_vec())
                .map_err(|e| AppError::Decryption {
                    message: format!("Failed to convert decrypted data to string: {}", e),
                })?;

            LocalFree(HLOCAL(data_out.pbData as isize));

            Ok(Some(token))
        }
    }

    async fn delete_token(&self, provider_id: &str) -> Result<()> {
        use windows::Win32::System::Registry::*;

        let key_path = self.get_registry_key(provider_id);
        
        unsafe {
            let result = RegDeleteKeyA(
                HKEY_CURRENT_USER,
                windows::core::PCSTR(key_path.as_ptr()),
            );

            if result.is_err() {
                // 键可能不存在，这不是错误
                return Ok(());
            }
        }

        Ok(())
    }

    async fn list_tokens(&self) -> Result<Vec<String>> {
        // 实现列出所有存储的令牌ID
        // 这里简化实现，实际应该遍历注册表
        Ok(Vec::new())
    }

    async fn clear_all(&self) -> Result<()> {
        // 实现清除所有令牌
        // 这里简化实现，实际应该删除整个注册表分支
        Ok(())
    }
}

// macOS Keychain 实现
#[cfg(target_os = "macos")]
pub struct MacOSSecureStorage {
    service_name: String,
}

#[cfg(target_os = "macos")]
impl MacOSSecureStorage {
    pub fn new() -> Result<Self> {
        Ok(Self {
            service_name: "claude-code-provider-manager".to_string(),
        })
    }
}

#[cfg(target_os = "macos")]
#[async_trait]
impl SecureStorageBackend for MacOSSecureStorage {
    async fn store_token(&self, provider_id: &str, token: &str) -> Result<()> {
        use security_framework::passwords::*;

        set_generic_password(&self.service_name, provider_id, token.as_bytes())
            .map_err(|e| AppError::System {
                message: format!("Failed to store token in keychain: {}", e),
            })?;

        Ok(())
    }

    async fn get_token(&self, provider_id: &str) -> Result<Option<String>> {
        use security_framework::passwords::*;

        match find_generic_password(&self.service_name, provider_id) {
            Ok(password_data) => {
                let token = String::from_utf8(password_data)
                    .map_err(|e| AppError::Decryption {
                        message: format!("Failed to convert keychain data to string: {}", e),
                    })?;
                Ok(Some(token))
            }
            Err(_) => Ok(None), // 不存在
        }
    }

    async fn delete_token(&self, provider_id: &str) -> Result<()> {
        use security_framework::passwords::*;

        // 删除可能不存在的项目不应该返回错误
        let _ = delete_generic_password(&self.service_name, provider_id);
        Ok(())
    }

    async fn list_tokens(&self) -> Result<Vec<String>> {
        // 简化实现
        Ok(Vec::new())
    }

    async fn clear_all(&self) -> Result<()> {
        // 简化实现
        Ok(())
    }
}

// Linux Secret Service 实现
#[cfg(target_os = "linux")]
pub struct LinuxSecureStorage {
    service_name: String,
}

#[cfg(target_os = "linux")]
impl LinuxSecureStorage {
    pub fn new() -> Result<Self> {
        Ok(Self {
            service_name: "claude-code-provider-manager".to_string(),
        })
    }
}

#[cfg(target_os = "linux")]
#[async_trait]
impl SecureStorageBackend for LinuxSecureStorage {
    async fn store_token(&self, provider_id: &str, token: &str) -> Result<()> {
        use keyring::Entry;

        let entry = Entry::new(&self.service_name, provider_id)
            .map_err(|e| AppError::System {
                message: format!("Failed to create keyring entry: {}", e),
            })?;

        entry.set_password(token)
            .map_err(|e| AppError::System {
                message: format!("Failed to store token in keyring: {}", e),
            })?;

        Ok(())
    }

    async fn get_token(&self, provider_id: &str) -> Result<Option<String>> {
        use keyring::Entry;

        let entry = Entry::new(&self.service_name, provider_id)
            .map_err(|e| AppError::System {
                message: format!("Failed to create keyring entry: {}", e),
            })?;

        match entry.get_password() {
            Ok(token) => Ok(Some(token)),
            Err(_) => Ok(None), // 不存在
        }
    }

    async fn delete_token(&self, provider_id: &str) -> Result<()> {
        use keyring::Entry;

        let entry = Entry::new(&self.service_name, provider_id)
            .map_err(|e| AppError::System {
                message: format!("Failed to create keyring entry: {}", e),
            })?;

        // 删除可能不存在的项目不应该返回错误
        let _ = entry.delete_password();
        Ok(())
    }

    async fn list_tokens(&self) -> Result<Vec<String>> {
        // 简化实现
        Ok(Vec::new())
    }

    async fn clear_all(&self) -> Result<()> {
        // 简化实现
        Ok(())
    }
}

// 内存存储实现（用于测试）
pub struct MemorySecureStorage {
    storage: std::sync::Arc<parking_lot::RwLock<HashMap<String, String>>>,
}

impl MemorySecureStorage {
    pub fn new() -> Self {
        Self {
            storage: std::sync::Arc::new(parking_lot::RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl SecureStorageBackend for MemorySecureStorage {
    async fn store_token(&self, provider_id: &str, token: &str) -> Result<()> {
        let mut storage = self.storage.write();
        storage.insert(provider_id.to_string(), token.to_string());
        Ok(())
    }

    async fn get_token(&self, provider_id: &str) -> Result<Option<String>> {
        let storage = self.storage.read();
        Ok(storage.get(provider_id).cloned())
    }

    async fn delete_token(&self, provider_id: &str) -> Result<()> {
        let mut storage = self.storage.write();
        storage.remove(provider_id);
        Ok(())
    }

    async fn list_tokens(&self) -> Result<Vec<String>> {
        let storage = self.storage.read();
        Ok(storage.keys().cloned().collect())
    }

    async fn clear_all(&self) -> Result<()> {
        let mut storage = self.storage.write();
        storage.clear();
        Ok(())
    }
}