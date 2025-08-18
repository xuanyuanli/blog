use crate::errors::{AppError, Result};
use crate::models::{LaunchConfig, ProcessInfo, ProcessStatus};
use std::collections::HashMap;
use std::process::{Child, Command};
use std::sync::Arc;
use parking_lot::Mutex;
use tokio::time::{Duration, timeout};

pub struct SystemService {
    active_processes: Arc<Mutex<HashMap<String, Child>>>,
}

impl SystemService {
    pub fn new() -> Self {
        Self {
            active_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn launch_claude_code(&self, config: LaunchConfig) -> Result<ProcessInfo> {
        // 验证claude-code命令是否可用
        self.check_claude_code_available().await?;

        let mut cmd = Command::new("claude-code");
        
        // 设置工作目录
        if let Some(ref work_dir) = config.working_directory {
            cmd.current_dir(work_dir);
        }
        
        // 添加启动参数
        for arg in &config.args {
            cmd.arg(arg);
        }
        
        // 设置环境变量
        for (key, value) in &config.env_vars {
            cmd.env(key, value);
        }
        
        // 启动进程
        let child = cmd.spawn().map_err(|e| AppError::System {
            message: format!("Failed to launch claude-code: {}", e),
        })?;
        
        let pid = child.id();
        let process_info = ProcessInfo {
            pid,
            session_id: config.session_id.clone(),
            started_at: chrono::Utc::now(),
            status: ProcessStatus::Running,
        };
        
        // 存储进程引用
        {
            let mut processes = self.active_processes.lock();
            processes.insert(config.session_id, child);
        }
        
        tracing::info!("Launched claude-code with PID: {}", pid);
        Ok(process_info)
    }

    async fn check_claude_code_available(&self) -> Result<()> {
        // 尝试执行 claude-code --version 来检查是否可用
        let output = timeout(Duration::from_secs(10), async {
            Command::new("claude-code")
                .arg("--version")
                .output()
        })
        .await
        .map_err(|_| AppError::System {
            message: "Timeout while checking claude-code availability".to_string(),
        })?
        .map_err(|e| AppError::System {
            message: format!("claude-code command not found: {}", e),
        })?;

        if !output.status.success() {
            return Err(AppError::System {
                message: "claude-code command is not working properly".to_string(),
            });
        }

        Ok(())
    }

    pub fn get_process_status(&self, session_id: &str) -> Result<ProcessStatus> {
        let mut processes = self.active_processes.lock();
        
        if let Some(child) = processes.get_mut(session_id) {
            match child.try_wait() {
                Ok(Some(exit_status)) => {
                    if exit_status.success() {
                        Ok(ProcessStatus::Stopped)
                    } else {
                        Ok(ProcessStatus::Error(format!("Process exited with code: {:?}", exit_status.code())))
                    }
                }
                Ok(None) => Ok(ProcessStatus::Running),
                Err(e) => Ok(ProcessStatus::Error(format!("Failed to check process status: {}", e))),
            }
        } else {
            Err(AppError::System {
                message: format!("Process with session ID '{}' not found", session_id),
            })
        }
    }

    pub fn terminate_process(&self, session_id: &str) -> Result<()> {
        let mut processes = self.active_processes.lock();
        
        if let Some(mut child) = processes.remove(session_id) {
            match child.kill() {
                Ok(_) => {
                    let _ = child.wait(); // 清理僵尸进程
                    tracing::info!("Terminated process with session ID: {}", session_id);
                    Ok(())
                }
                Err(e) => Err(AppError::System {
                    message: format!("Failed to terminate process: {}", e),
                }),
            }
        } else {
            Err(AppError::System {
                message: format!("Process with session ID '{}' not found", session_id),
            })
        }
    }

    pub fn list_active_processes(&self) -> Vec<String> {
        let processes = self.active_processes.lock();
        processes.keys().cloned().collect()
    }

    pub fn cleanup_finished_processes(&self) -> Vec<String> {
        let mut processes = self.active_processes.lock();
        let mut finished = Vec::new();
        
        processes.retain(|session_id, child| {
            match child.try_wait() {
                Ok(Some(_)) => {
                    finished.push(session_id.clone());
                    false // 移除已完成的进程
                }
                Ok(None) => true, // 保留运行中的进程
                Err(_) => {
                    finished.push(session_id.clone());
                    false // 移除有错误的进程
                }
            }
        });
        
        if !finished.is_empty() {
            tracing::info!("Cleaned up {} finished processes", finished.len());
        }
        
        finished
    }

    pub async fn get_system_info(&self) -> HashMap<String, String> {
        let mut info = HashMap::new();
        
        // 操作系统信息
        info.insert("os".to_string(), std::env::consts::OS.to_string());
        info.insert("arch".to_string(), std::env::consts::ARCH.to_string());
        info.insert("family".to_string(), std::env::consts::FAMILY.to_string());
        
        // 当前用户
        if let Ok(user) = std::env::var("USER").or_else(|_| std::env::var("USERNAME")) {
            info.insert("user".to_string(), user);
        }
        
        // 主目录
        if let Some(home) = dirs::home_dir() {
            info.insert("home".to_string(), home.to_string_lossy().to_string());
        }
        
        // 配置目录
        if let Some(config) = dirs::config_dir() {
            info.insert("config_dir".to_string(), config.to_string_lossy().to_string());
        }
        
        // Claude Code 可用性
        info.insert("claude_code_available".to_string(), 
            self.check_claude_code_available().await.is_ok().to_string());
        
        info
    }

    pub fn open_file_manager(&self, path: Option<&str>) -> Result<()> {
        let path = path.unwrap_or(".");
        
        #[cfg(windows)]
        {
            Command::new("explorer")
                .arg(path)
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open file manager: {}", e),
                })?;
        }
        
        #[cfg(target_os = "macos")]
        {
            Command::new("open")
                .arg(path)
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open file manager: {}", e),
                })?;
        }
        
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(path)
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open file manager: {}", e),
                })?;
        }
        
        Ok(())
    }

    pub fn open_url(&self, url: &str) -> Result<()> {
        #[cfg(windows)]
        {
            Command::new("cmd")
                .args(["/c", "start", url])
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open URL: {}", e),
                })?;
        }
        
        #[cfg(target_os = "macos")]
        {
            Command::new("open")
                .arg(url)
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open URL: {}", e),
                })?;
        }
        
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(url)
                .spawn()
                .map_err(|e| AppError::System {
                    message: format!("Failed to open URL: {}", e),
                })?;
        }
        
        Ok(())
    }
}

impl Drop for SystemService {
    fn drop(&mut self) {
        // 清理所有活跃进程
        let mut processes = self.active_processes.lock();
        for (session_id, mut child) in processes.drain() {
            tracing::info!("Cleaning up process on drop: {}", session_id);
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}