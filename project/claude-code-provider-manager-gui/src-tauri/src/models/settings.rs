use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub theme: Theme,
    pub language: String,
    pub auto_validate: bool,
    pub auto_start: bool,
    pub start_minimized: bool,
    pub close_to_tray: bool,
    pub claude_code_path: Option<String>,
    pub default_working_directory: Option<String>,
    pub startup_args: Vec<String>,
    pub update_check: bool,
    pub telemetry: bool,
    pub notifications: NotificationSettings,
    pub security: SecuritySettings,
}

impl AppSettings {
    pub fn new() -> Self {
        Self {
            theme: Theme::System,
            language: "zh-CN".to_string(),
            auto_validate: true,
            auto_start: false,
            start_minimized: false,
            close_to_tray: true,
            claude_code_path: None,
            default_working_directory: None,
            startup_args: Vec::new(),
            update_check: true,
            telemetry: false,
            notifications: NotificationSettings::default(),
            security: SecuritySettings::default(),
        }
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Theme {
    #[serde(rename = "light")]
    Light,
    #[serde(rename = "dark")]
    Dark,
    #[serde(rename = "system")]
    System,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::System
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NotificationSettings {
    pub enabled: bool,
    pub show_validation_results: bool,
    pub show_provider_switch: bool,
    pub show_launch_status: bool,
    pub show_errors: bool,
    pub sound_enabled: bool,
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            show_validation_results: true,
            show_provider_switch: true,
            show_launch_status: true,
            show_errors: true,
            sound_enabled: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecuritySettings {
    pub auto_lock_timeout: Option<u32>, // 分钟
    pub require_confirmation_for_delete: bool,
    pub require_confirmation_for_switch: bool,
    pub clear_clipboard_on_exit: bool,
    pub log_sensitive_operations: bool,
}

impl Default for SecuritySettings {
    fn default() -> Self {
        Self {
            auto_lock_timeout: Some(30),
            require_confirmation_for_delete: true,
            require_confirmation_for_switch: false,
            clear_clipboard_on_exit: true,
            log_sensitive_operations: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchConfig {
    pub session_id: String,
    pub working_directory: Option<String>,
    pub args: Vec<String>,
    pub env_vars: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub session_id: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub status: ProcessStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ProcessStatus {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "stopped")]
    Stopped,
    #[serde(rename = "error")]
    Error(String),
}