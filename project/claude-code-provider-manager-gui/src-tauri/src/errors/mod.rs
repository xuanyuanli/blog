use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("网络请求错误: {0}")]
    Request(#[from] reqwest::Error),

    #[error("配置错误: {message}")]
    Config { message: String },

    #[error("验证错误: {message}")]
    Validation { message: String },

    #[error("加密错误: {message}")]
    Encryption { message: String },

    #[error("解密错误: {message}")]
    Decryption { message: String },

    #[error("提供商不存在: {id}")]
    ProviderNotFound { id: String },

    #[error("权限不足: {permission}")]
    PermissionDenied { permission: String },

    #[error("系统错误: {message}")]
    System { message: String },

    #[error("未知错误: {message}")]
    Unknown { message: String },
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;