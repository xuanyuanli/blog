import { ipcMain, BrowserWindow, dialog, shell, Notification } from 'electron';
import { configManager } from '../config/ConfigManager';
import { secureStorage } from '../security/SecureStorage';
import { crossPlatformAdapter } from '../platform/CrossPlatformAdapter';
import { apiService } from '../services/ApiService';

// IPC 处理器
export class IPCHandler {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  // 注册所有 IPC 处理器
  registerHandlers(): void {
    this.registerConfigHandlers();
    this.registerProviderHandlers();
    this.registerSecurityHandlers();
    this.registerSystemHandlers();
    this.registerUIHandlers();
    this.registerFileHandlers();
    this.registerNetworkHandlers();
  }

  // 配置相关处理器
  private registerConfigHandlers(): void {
    // 获取配置
    ipcMain.handle('get-config', async () => {
      try {
        return await configManager.loadConfig();
      } catch (error) {
        console.error('Failed to get config:', error);
        throw error;
      }
    });

    // 更新配置
    ipcMain.handle('update-config', async (event, updates) => {
      try {
        await configManager.updateConfig(updates);
        return { success: true };
      } catch (error) {
        console.error('Failed to update config:', error);
        throw error;
      }
    });

    // 重置配置
    ipcMain.handle('reset-config', async () => {
      try {
        await configManager.resetConfig();
        return { success: true };
      } catch (error) {
        console.error('Failed to reset config:', error);
        throw error;
      }
    });

    // 导出配置
    ipcMain.handle('export-config', async () => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow!, {
          title: '导出配置',
          defaultPath: 'claude-code-config.json',
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, message: '导出已取消' };
        }

        await configManager.exportConfig(result.filePath);
        return { success: true, message: '配置导出成功' };
      } catch (error) {
        console.error('Failed to export config:', error);
        throw error;
      }
    });

    // 导入配置
    ipcMain.handle('import-config', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          title: '导入配置',
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['openFile'],
        });

        if (result.canceled || !result.filePaths.length) {
          return { success: false, message: '导入已取消' };
        }

        await configManager.importConfig(result.filePaths[0]);
        return { success: true, message: '配置导入成功' };
      } catch (error) {
        console.error('Failed to import config:', error);
        throw error;
      }
    });
  }

  // 提供商相关处理器
  private registerProviderHandlers(): void {
    // 获取所有提供商
    ipcMain.handle('get-providers', async () => {
      try {
        const config = await configManager.loadConfig();
        return config.providers;
      } catch (error) {
        console.error('Failed to get providers:', error);
        throw error;
      }
    });

    // 获取激活的提供商
    ipcMain.handle('get-active-provider', async () => {
      try {
        return await configManager.getActiveProvider();
      } catch (error) {
        console.error('Failed to get active provider:', error);
        throw error;
      }
    });

    // 添加提供商
    ipcMain.handle('add-provider', async (event, providerData) => {
      try {
        const newProvider = await configManager.addProvider(providerData);
        
        // 如果启用了加密，存储认证令牌
        if (providerData.authToken) {
          await secureStorage.storeProviderToken(newProvider.id, providerData.authToken);
        }
        
        return newProvider;
      } catch (error) {
        console.error('Failed to add provider:', error);
        throw error;
      }
    });

    // 更新提供商
    ipcMain.handle('update-provider', async (event, id, updates) => {
      try {
        await configManager.updateProvider(id, updates);
        
        // 如果更新了认证令牌，存储到安全存储
        if (updates.authToken) {
          await secureStorage.storeProviderToken(id, updates.authToken);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Failed to update provider:', error);
        throw error;
      }
    });

    // 删除提供商
    ipcMain.handle('delete-provider', async (event, id) => {
      try {
        await configManager.deleteProvider(id);
        
        // 删除安全存储中的认证令牌
        await secureStorage.deleteProviderToken(id);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to delete provider:', error);
        throw error;
      }
    });

    // 切换激活的提供商
    ipcMain.handle('switch-provider', async (event, id) => {
      try {
        await configManager.setActiveProvider(id);
        const activeProvider = await configManager.getActiveProvider();
        return activeProvider;
      } catch (error) {
        console.error('Failed to switch provider:', error);
        throw error;
      }
    });

    // 验证提供商
    ipcMain.handle('validate-provider', async (event, id) => {
      try {
        const provider = await configManager.getProvider(id);
        if (!provider) {
          throw new Error('Provider not found');
        }

        // 从安全存储中获取认证令牌
        const authToken = await secureStorage.getProviderToken(id);
        
        const result = await apiService.validateProvider(
          provider.baseUrl,
          authToken || '',
          provider.model
        );
        
        // 更新提供商验证状态
        await configManager.updateProvider(id, {
          isValid: result.isValid,
          lastValidated: new Date().toISOString(),
        });
        
        return result;
      } catch (error) {
        console.error('Failed to validate provider:', error);
        throw error;
      }
    });

    // 启动 Claude Code
    ipcMain.handle('launch-claude-code', async (event, config) => {
      try {
        const activeProvider = await configManager.getActiveProvider();
        if (!activeProvider) {
          throw new Error('No active provider configured');
        }

        // 从安全存储中获取认证令牌
        const authToken = await secureStorage.getProviderToken(activeProvider.id);
        
        const launchConfig = {
          ...config,
          envVars: {
            ANTHROPIC_BASE_URL: activeProvider.baseUrl,
            ANTHROPIC_AUTH_TOKEN: authToken || '',
            ANTHROPIC_MODEL: activeProvider.model,
            ANTHROPIC_SMALL_FAST_MODEL: activeProvider.smallFastModel,
            ...config?.envVars,
          },
        };

        const result = await apiService.launchClaudeCode(launchConfig);
        
        // 发送通知
        this.sendNotification('Claude Code 已启动', 'Claude Code 已成功启动');
        
        return result;
      } catch (error) {
        console.error('Failed to launch Claude Code:', error);
        this.sendNotification('启动失败', '无法启动 Claude Code', 'error');
        throw error;
      }
    });
  }

  // 安全相关处理器
  private registerSecurityHandlers(): void {
    // 存储加密数据
    ipcMain.handle('store-encrypted-data', async (event, key, data) => {
      try {
        await secureStorage.storeEncryptedConfig(key, data);
        return { success: true };
      } catch (error) {
        console.error('Failed to store encrypted data:', error);
        throw error;
      }
    });

    // 获取加密数据
    ipcMain.handle('get-encrypted-data', async (event, key) => {
      try {
        return await secureStorage.getEncryptedConfig(key);
      } catch (error) {
        console.error('Failed to get encrypted data:', error);
        throw error;
      }
    });

    // 加密数据
    ipcMain.handle('encrypt-data', async (event, data) => {
      try {
        return await secureStorage.storage.encryptData(data);
      } catch (error) {
        console.error('Failed to encrypt data:', error);
        throw error;
      }
    });

    // 解密数据
    ipcMain.handle('decrypt-data', async (event, encryptedData) => {
      try {
        return await secureStorage.storage.decryptData(encryptedData);
      } catch (error) {
        console.error('Failed to decrypt data:', error);
        throw error;
      }
    });
  }

  // 系统相关处理器
  private registerSystemHandlers(): void {
    // 获取系统信息
    ipcMain.handle('get-system-info', async () => {
      try {
        return {
          platform: process.platform,
          arch: process.arch,
          version: process.version,
          appVersion: require('../../package.json').version,
          features: crossPlatformAdapter.getFeatures(),
        };
      } catch (error) {
        console.error('Failed to get system info:', error);
        throw error;
      }
    });

    // 最小化窗口
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    // 最大化窗口
    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.restore();
      } else {
        this.mainWindow?.maximize();
      }
    });

    // 关闭窗口
    ipcMain.handle('close-window', () => {
      this.mainWindow?.close();
    });

    // 显示对话框
    ipcMain.handle('show-dialog', async (event, options) => {
      try {
        const result = await dialog.showMessageBox(this.mainWindow!, options);
        return result;
      } catch (error) {
        console.error('Failed to show dialog:', error);
        throw error;
      }
    });

    // 显示文件对话框
    ipcMain.handle('show-file-dialog', async (event, options) => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, options);
        return result;
      } catch (error) {
        console.error('Failed to show file dialog:', error);
        throw error;
      }
    });

    // 显示保存对话框
    ipcMain.handle('show-save-dialog', async (event, options) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow!, options);
        return result;
      } catch (error) {
        console.error('Failed to show save dialog:', error);
        throw error;
      }
    });

    // 打开外部链接
    ipcMain.handle('open-external', async (event, url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error('Failed to open external URL:', error);
        throw error;
      }
    });

    // 显示通知
    ipcMain.handle('show-notification', async (event, title, body, type = 'info') => {
      try {
        this.sendNotification(title, body, type);
        return { success: true };
      } catch (error) {
        console.error('Failed to show notification:', error);
        throw error;
      }
    });

    // 设置自动启动
    ipcMain.handle('set-auto-start', async (event, enabled) => {
      try {
        if (enabled) {
          await crossPlatformAdapter.enableAutoStart();
        } else {
          await crossPlatformAdapter.disableAutoStart();
        }
        return { success: true };
      } catch (error) {
        console.error('Failed to set auto start:', error);
        throw error;
      }
    });
  }

  // UI 相关处理器
  private registerUIHandlers(): void {
    // 设置主题
    ipcMain.handle('set-theme', async (event, theme) => {
      try {
        await configManager.updateSettings({ theme });
        return { success: true };
      } catch (error) {
        console.error('Failed to set theme:', error);
        throw error;
      }
    });

    // 设置语言
    ipcMain.handle('set-language', async (event, language) => {
      try {
        await configManager.updateSettings({ language });
        return { success: true };
      } catch (error) {
        console.error('Failed to set language:', error);
        throw error;
      }
    });

    // 刷新界面
    ipcMain.handle('refresh-ui', () => {
      this.mainWindow?.reload();
    });

    // 开发者工具
    ipcMain.handle('toggle-dev-tools', () => {
      this.mainWindow?.webContents.toggleDevTools();
    });
  }

  // 文件相关处理器
  private registerFileHandlers(): void {
    // 读取文件
    ipcMain.handle('read-file', async (event, filePath) => {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        return content;
      } catch (error) {
        console.error('Failed to read file:', error);
        throw error;
      }
    });

    // 写入文件
    ipcMain.handle('write-file', async (event, filePath, content) => {
      try {
        const fs = require('fs');
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
      } catch (error) {
        console.error('Failed to write file:', error);
        throw error;
      }
    });

    // 检查文件是否存在
    ipcMain.handle('file-exists', async (event, filePath) => {
      try {
        const fs = require('fs');
        return fs.existsSync(filePath);
      } catch (error) {
        console.error('Failed to check file existence:', error);
        return false;
      }
    });

    // 获取文件信息
    ipcMain.handle('get-file-info', async (event, filePath) => {
      try {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        return {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        };
      } catch (error) {
        console.error('Failed to get file info:', error);
        throw error;
      }
    });
  }

  // 网络相关处理器
  private registerNetworkHandlers(): void {
    // 测试网络连接
    ipcMain.handle('test-network-connection', async (event, url) => {
      try {
        return await apiService.testConnection(url);
      } catch (error) {
        console.error('Failed to test network connection:', error);
        throw error;
      }
    });

    // 获取网络状态
    ipcMain.handle('get-network-status', async () => {
      try {
        return await apiService.getNetworkStatus();
      } catch (error) {
        console.error('Failed to get network status:', error);
        throw error;
      }
    });
  }

  // 辅助方法
  private sendNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    try {
      const config = configManager.getConfig();
      
      if (!config.ui.notifications.enabled) {
        return;
      }

      const notification = new Notification({
        title,
        body,
        silent: !config.ui.notifications.soundEnabled,
      });

      notification.show();
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
}

// 导出单例实例
export const ipcHandler = new IPCHandler();