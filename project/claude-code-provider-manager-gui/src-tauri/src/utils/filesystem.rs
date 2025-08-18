use crate::errors::{AppError, Result};
use std::fs;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};

pub struct FileSystemManager {
    config_dir: PathBuf,
}

impl FileSystemManager {
    pub fn new() -> Result<Self> {
        let config_dir = Self::get_config_dir()?;
        
        // 确保配置目录存在
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir).map_err(|e| AppError::Io(e))?;
        }
        
        Ok(Self { config_dir })
    }

    pub fn get_config_dir() -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| AppError::System {
                message: "Failed to get config directory".to_string(),
            })?
            .join("claude-code-provider-manager");
        
        Ok(config_dir)
    }

    pub fn get_config_file_path(&self) -> PathBuf {
        self.config_dir.join("config.json")
    }

    pub fn get_backup_file_path(&self) -> PathBuf {
        self.config_dir.join("config.backup.json")
    }

    pub fn get_logs_dir(&self) -> PathBuf {
        self.config_dir.join("logs")
    }

    pub fn get_cache_dir(&self) -> PathBuf {
        self.config_dir.join("cache")
    }

    pub fn ensure_directory_exists(&self, path: &Path) -> Result<()> {
        if !path.exists() {
            fs::create_dir_all(path).map_err(|e| AppError::Io(e))?;
        }
        Ok(())
    }

    pub fn read_file(&self, path: &Path) -> Result<String> {
        fs::read_to_string(path).map_err(|e| AppError::Io(e))
    }

    pub fn write_file(&self, path: &Path, content: &str) -> Result<()> {
        // 确保父目录存在
        if let Some(parent) = path.parent() {
            self.ensure_directory_exists(parent)?;
        }

        fs::write(path, content).map_err(|e| AppError::Io(e))
    }

    pub fn write_file_atomic(&self, path: &Path, content: &str) -> Result<()> {
        // 使用临时文件进行原子写入
        let temp_path = path.with_extension("tmp");
        
        // 写入临时文件
        self.write_file(&temp_path, content)?;
        
        // 原子重命名
        fs::rename(&temp_path, path).map_err(|e| AppError::Io(e))?;
        
        Ok(())
    }

    pub fn backup_file(&self, source: &Path) -> Result<PathBuf> {
        if !source.exists() {
            return Err(AppError::System {
                message: format!("Source file does not exist: {:?}", source),
            });
        }

        let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!(
            "{}.backup.{}",
            source.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("config"),
            timestamp
        );
        
        let backup_path = self.config_dir.join(backup_name);
        fs::copy(source, &backup_path).map_err(|e| AppError::Io(e))?;
        
        Ok(backup_path)
    }

    pub fn list_backup_files(&self) -> Result<Vec<BackupInfo>> {
        let mut backups = Vec::new();
        
        if !self.config_dir.exists() {
            return Ok(backups);
        }

        let entries = fs::read_dir(&self.config_dir).map_err(|e| AppError::Io(e))?;
        
        for entry in entries {
            let entry = entry.map_err(|e| AppError::Io(e))?;
            let path = entry.path();
            
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                if filename.contains(".backup.") {
                    let metadata = fs::metadata(&path).map_err(|e| AppError::Io(e))?;
                    let modified = metadata.modified().map_err(|e| AppError::Io(e))?;
                    
                    backups.push(BackupInfo {
                        path: path.clone(),
                        filename: filename.to_string(),
                        size: metadata.len(),
                        created_at: DateTime::from(modified),
                    });
                }
            }
        }
        
        // 按创建时间倒序排列
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        Ok(backups)
    }

    pub fn cleanup_old_backups(&self, keep_count: usize) -> Result<Vec<PathBuf>> {
        let backups = self.list_backup_files()?;
        let mut removed = Vec::new();
        
        for backup in backups.into_iter().skip(keep_count) {
            fs::remove_file(&backup.path).map_err(|e| AppError::Io(e))?;
            removed.push(backup.path);
        }
        
        Ok(removed)
    }

    pub fn get_file_size(&self, path: &Path) -> Result<u64> {
        let metadata = fs::metadata(path).map_err(|e| AppError::Io(e))?;
        Ok(metadata.len())
    }

    pub fn file_exists(&self, path: &Path) -> bool {
        path.exists() && path.is_file()
    }

    pub fn directory_exists(&self, path: &Path) -> bool {
        path.exists() && path.is_dir()
    }

    pub fn delete_file(&self, path: &Path) -> Result<()> {
        if path.exists() {
            fs::remove_file(path).map_err(|e| AppError::Io(e))?;
        }
        Ok(())
    }

    pub fn get_temp_file(&self, prefix: &str) -> PathBuf {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S_%3f");
        self.config_dir.join(format!("{}_{}.tmp", prefix, timestamp))
    }
}

#[derive(Debug, Clone)]
pub struct BackupInfo {
    pub path: PathBuf,
    pub filename: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_file_operations() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        let content = "test content";
        
        let fs_manager = FileSystemManager::new().unwrap();
        
        // 测试写入和读取
        fs_manager.write_file(&test_file, content).unwrap();
        assert!(fs_manager.file_exists(&test_file));
        
        let read_content = fs_manager.read_file(&test_file).unwrap();
        assert_eq!(read_content, content);
        
        // 测试备份
        let backup_path = fs_manager.backup_file(&test_file).unwrap();
        assert!(fs_manager.file_exists(&backup_path));
        
        let backup_content = fs_manager.read_file(&backup_path).unwrap();
        assert_eq!(backup_content, content);
    }

    #[test]
    fn test_atomic_write() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("atomic_test.txt");
        let content = "atomic content";
        
        let fs_manager = FileSystemManager::new().unwrap();
        
        fs_manager.write_file_atomic(&test_file, content).unwrap();
        assert!(fs_manager.file_exists(&test_file));
        
        let read_content = fs_manager.read_file(&test_file).unwrap();
        assert_eq!(read_content, content);
    }
}