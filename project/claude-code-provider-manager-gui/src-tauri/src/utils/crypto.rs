use crate::errors::{AppError, Result};
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use rand::RngCore;
use sha2::{Digest, Sha256};

pub struct EncryptionManager {
    cipher: Aes256Gcm,
}

impl EncryptionManager {
    pub fn new() -> Result<Self> {
        let key = Self::derive_app_key()?;
        let cipher = Aes256Gcm::new(&key.into());
        
        Ok(Self { cipher })
    }

    fn derive_app_key() -> Result<[u8; 32]> {
        // 使用设备唯一标识符和应用信息生成密钥
        let device_id = Self::get_device_id()?;
        let app_info = "claude-code-provider-manager-v1";
        
        let mut hasher = Sha256::new();
        hasher.update(device_id.as_bytes());
        hasher.update(app_info.as_bytes());
        
        let hash = hasher.finalize();
        let mut key = [0u8; 32];
        key.copy_from_slice(&hash);
        
        Ok(key)
    }

    fn get_device_id() -> Result<String> {
        // 尝试获取设备唯一标识符
        #[cfg(windows)]
        {
            Self::get_windows_device_id()
        }
        #[cfg(target_os = "macos")]
        {
            Self::get_macos_device_id()
        }
        #[cfg(target_os = "linux")]
        {
            Self::get_linux_device_id()
        }
    }

    #[cfg(windows)]
    fn get_windows_device_id() -> Result<String> {
        use std::process::Command;
        
        let output = Command::new("wmic")
            .args(["csproduct", "get", "uuid", "/value"])
            .output()
            .map_err(|e| AppError::System {
                message: format!("Failed to get Windows device ID: {}", e),
            })?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        for line in output_str.lines() {
            if line.starts_with("UUID=") {
                return Ok(line.trim_start_matches("UUID=").to_string());
            }
        }

        // 备用方案：使用机器名
        std::env::var("COMPUTERNAME").map_err(|_| AppError::System {
            message: "Failed to get device identifier".to_string(),
        })
    }

    #[cfg(target_os = "macos")]
    fn get_macos_device_id() -> Result<String> {
        use std::process::Command;
        
        let output = Command::new("system_profiler")
            .args(["SPHardwareDataType"])
            .output()
            .map_err(|e| AppError::System {
                message: format!("Failed to get macOS device ID: {}", e),
            })?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        for line in output_str.lines() {
            if line.contains("Hardware UUID:") {
                if let Some(uuid) = line.split(':').nth(1) {
                    return Ok(uuid.trim().to_string());
                }
            }
        }

        // 备用方案：使用主机名
        std::env::var("HOSTNAME").or_else(|_| {
            std::env::var("HOST")
        }).map_err(|_| AppError::System {
            message: "Failed to get device identifier".to_string(),
        })
    }

    #[cfg(target_os = "linux")]
    fn get_linux_device_id() -> Result<String> {
        use std::fs;
        
        // 尝试读取机器ID
        if let Ok(machine_id) = fs::read_to_string("/etc/machine-id") {
            return Ok(machine_id.trim().to_string());
        }
        
        if let Ok(machine_id) = fs::read_to_string("/var/lib/dbus/machine-id") {
            return Ok(machine_id.trim().to_string());
        }

        // 备用方案：使用主机名
        std::env::var("HOSTNAME").map_err(|_| AppError::System {
            message: "Failed to get device identifier".to_string(),
        })
    }

    pub fn encrypt(&self, data: &str) -> Result<String> {
        // 生成随机nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 加密数据
        let ciphertext = self
            .cipher
            .encrypt(nonce, data.as_bytes())
            .map_err(|e| AppError::Encryption {
                message: format!("Failed to encrypt data: {}", e),
            })?;

        // 组合nonce和密文
        let mut result = Vec::new();
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        // Base64编码
        Ok(general_purpose::STANDARD.encode(result))
    }

    pub fn decrypt(&self, encrypted_data: &str) -> Result<String> {
        // Base64解码
        let data = general_purpose::STANDARD
            .decode(encrypted_data)
            .map_err(|e| AppError::Decryption {
                message: format!("Failed to decode base64: {}", e),
            })?;

        if data.len() < 12 {
            return Err(AppError::Decryption {
                message: "Invalid data length".to_string(),
            });
        }

        // 分离nonce和密文
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        // 解密
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| AppError::Decryption {
                message: format!("Failed to decrypt data: {}", e),
            })?;

        String::from_utf8(plaintext).map_err(|e| AppError::Decryption {
            message: format!("Failed to convert decrypted data to string: {}", e),
        })
    }
}

pub fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(salt.as_bytes());
    let hash = hasher.finalize();
    general_purpose::STANDARD.encode(hash)
}

pub fn generate_salt() -> String {
    let mut salt = [0u8; 32];
    OsRng.fill_bytes(&mut salt);
    general_purpose::STANDARD.encode(salt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let manager = EncryptionManager::new().unwrap();
        let original = "test-auth-token-12345";
        
        let encrypted = manager.encrypt(original).unwrap();
        assert_ne!(encrypted, original);
        
        let decrypted = manager.decrypt(&encrypted).unwrap();
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_hash_password() {
        let password = "test_password";
        let salt = "test_salt";
        
        let hash1 = hash_password(password, salt);
        let hash2 = hash_password(password, salt);
        
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, password);
    }
}