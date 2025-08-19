import { app, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { configManager } from '../config/ConfigManager';
import { ipcHandler } from '../ipc/IPCHandler';

// 文件类型定义
export interface FileType {
  extension: string;
  name: string;
  description: string;
  mimeType?: string;
  icon?: string;
  handler: (filePath: string) => Promise<void>;
}

// 文件关联管理器
export class FileAssociationManager {
  private supportedFileTypes: FileType[];
  private mainWindow: Electron.BrowserWindow | null = null;

  constructor() {
    this.supportedFileTypes = this.initializeFileTypes();
    this.setupFileAssociations();
  }

  setMainWindow(window: Electron.BrowserWindow): void {
    this.mainWindow = window;
  }

  private initializeFileTypes(): FileType[] {
    return [
      {
        extension: '.claude',
        name: 'Claude Config',
        description: 'Claude Code Provider Configuration',
        mimeType: 'application/json',
        handler: this.handleClaudeConfigFile.bind(this),
      },
      {
        extension: '.ccp',
        name: 'Claude Code Provider',
        description: 'Claude Code Provider Settings',
        mimeType: 'application/json',
        handler: this.handleClaudeProviderFile.bind(this),
      },
      {
        extension: '.json',
        name: 'JSON Configuration',
        description: 'Claude Code JSON Configuration',
        mimeType: 'application/json',
        handler: this.handleJsonConfigFile.bind(this),
      },
    ];
  }

  private setupFileAssociations(): void {
    // 处理命令行参数（文件打开）
    this.handleCommandLineFiles();
    
    // 处理文件打开事件（macOS）
    app.on('open-file', this.handleOpenFile.bind(this));
    
    // 注册文件关联
    this.registerFileAssociations();
  }

  private handleCommandLineFiles(): void {
    const files = process.argv.slice(1);
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        this.handleFile(file);
      }
    });
  }

  private async handleOpenFile(event: Electron.Event, filePath: string): Promise<void> {
    event.preventDefault();
    
    try {
      await this.handleFile(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showFileError(`无法打开文件: ${filePath}`, error);
    }
  }

  private async handleFile(filePath: string): Promise<void> {
    try {
      const extension = path.extname(filePath).toLowerCase();
      const fileType = this.supportedFileTypes.find(ft => ft.extension === extension);
      
      if (!fileType) {
        throw new Error(`不支持的文件类型: ${extension}`);
      }
      
      console.log(`Handling file: ${filePath} (${fileType.name})`);
      
      // 等待主窗口准备就绪
      await this.waitForMainWindow();
      
      // 调用对应的处理器
      await fileType.handler(filePath);
      
    } catch (error) {
      console.error('Failed to handle file:', error);
      throw error;
    }
  }

  private async waitForMainWindow(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.mainWindow && this.mainWindow.webContents) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // 超时保护
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  // 文件处理器
  private async handleClaudeConfigFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      // 验证配置格式
      if (!this.validateClaudeConfig(config)) {
        throw new Error('无效的 Claude 配置文件格式');
      }
      
      // 发送到主窗口处理
      this.mainWindow?.webContents.send('file-open-claude-config', {
        filePath,
        config,
      });
      
      // 显示主窗口
      this.showMainWindow();
      
    } catch (error) {
      console.error('Failed to handle Claude config file:', error);
      throw error;
    }
  }

  private async handleClaudeProviderFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const providerConfig = JSON.parse(content);
      
      // 验证提供商配置格式
      if (!this.validateProviderConfig(providerConfig)) {
        throw new Error('无效的 Claude 提供商配置文件格式');
      }
      
      // 发送到主窗口处理
      this.mainWindow?.webContents.send('file-open-claude-provider', {
        filePath,
        providerConfig,
      });
      
      // 显示主窗口
      this.showMainWindow();
      
    } catch (error) {
      console.error('Failed to handle Claude provider file:', error);
      throw error;
    }
  }

  private async handleJsonConfigFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      // 尝试识别配置类型
      if (this.validateClaudeConfig(config)) {
        await this.handleClaudeConfigFile(filePath);
      } else if (this.validateProviderConfig(config)) {
        await this.handleClaudeProviderFile(filePath);
      } else {
        // 通用 JSON 配置导入
        this.mainWindow?.webContents.send('file-open-json-config', {
          filePath,
          config,
        });
        
        this.showMainWindow();
      }
      
    } catch (error) {
      console.error('Failed to handle JSON config file:', error);
      throw error;
    }
  }

  // 配置验证器
  private validateClaudeConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      (config.providers || config.settings || config.ui)
    );
  }

  private validateProviderConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      config.name &&
      config.baseUrl &&
      config.model
    );
  }

  // 文件关联注册
  private registerFileAssociations(): void {
    // 在开发环境中，这里主要用于日志记录
    // 在生产环境中，需要在打包时配置文件关联
    
    console.log('Supported file types:', this.supportedFileTypes.map(ft => ({
      extension: ft.extension,
      name: ft.name,
      description: ft.description,
    })));
    
    // 注册协议处理器
    this.registerProtocolHandlers();
  }

  private registerProtocolHandlers(): void {
    // 注册自定义协议
    const protocols = ['claude', 'claude-code', 'ccp'];
    
    protocols.forEach(protocol => {
      if (!app.isDefaultProtocolClient(protocol)) {
        if (app.setAsDefaultProtocolClient(protocol)) {
          console.log(`Registered as default protocol client for: ${protocol}`);
        }
      }
    });
  }

  // 公共方法
  async openFile(): Promise<void> {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        title: '打开配置文件',
        filters: [
          {
            name: 'Claude 配置文件',
            extensions: ['claude', 'ccp', 'json'],
          },
          {
            name: '所有文件',
            extensions: ['*'],
          },
        ],
        properties: ['openFile'],
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        await this.handleFile(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showFileError('无法打开文件', error);
    }
  }

  async saveFile(data: any, defaultPath?: string): Promise<void> {
    try {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        title: '保存配置文件',
        defaultPath: defaultPath || 'config.claude',
        filters: [
          {
            name: 'Claude 配置文件',
            extensions: ['claude'],
          },
          {
            name: 'Claude 提供商文件',
            extensions: ['ccp'],
          },
          {
            name: 'JSON 文件',
            extensions: ['json'],
          },
          {
            name: '所有文件',
            extensions: ['*'],
          },
        ],
      });
      
      if (!result.canceled && result.filePath) {
        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(result.filePath, content, 'utf8');
        
        // 发送保存成功事件
        this.mainWindow?.webContents.send('file-saved', {
          filePath: result.filePath,
        });
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      this.showFileError('无法保存文件', error);
    }
  }

  async exportConfig(): Promise<void> {
    try {
      const config = await configManager.loadConfig();
      const exportData = this.prepareExportData(config);
      
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        title: '导出配置',
        defaultPath: 'claude-code-config.claude',
        filters: [
          {
            name: 'Claude 配置文件',
            extensions: ['claude'],
          },
          {
            name: 'JSON 文件',
            extensions: ['json'],
          },
        ],
      });
      
      if (!result.canceled && result.filePath) {
        const content = JSON.stringify(exportData, null, 2);
        fs.writeFileSync(result.filePath, content, 'utf8');
        
        this.mainWindow?.webContents.send('config-exported', {
          filePath: result.filePath,
        });
      }
    } catch (error) {
      console.error('Failed to export config:', error);
      this.showFileError('无法导出配置', error);
    }
  }

  async importConfig(): Promise<void> {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        title: '导入配置',
        filters: [
          {
            name: 'Claude 配置文件',
            extensions: ['claude', 'ccp', 'json'],
          },
          {
            name: '所有文件',
            extensions: ['*'],
          },
        ],
        properties: ['openFile'],
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const content = fs.readFileSync(result.filePaths[0], 'utf8');
        const importData = JSON.parse(content);
        
        // 验证导入数据
        if (!this.validateImportData(importData)) {
          throw new Error('无效的配置文件格式');
        }
        
        // 合并配置
        await this.mergeConfig(importData);
        
        this.mainWindow?.webContents.send('config-imported', {
          filePath: result.filePaths[0],
        });
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      this.showFileError('无法导入配置', error);
    }
  }

  // 辅助方法
  private prepareExportData(config: any): any {
    // 移除敏感信息
    const exportData = JSON.parse(JSON.stringify(config));
    
    if (exportData.providers) {
      exportData.providers = exportData.providers.map((provider: any) => ({
        ...provider,
        authToken: undefined,
      }));
    }
    
    return exportData;
  }

  private validateImportData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      (data.providers || data.settings || data.ui)
    );
  }

  private async mergeConfig(importData: any): Promise<void> {
    const currentConfig = await configManager.loadConfig();
    
    // 简单的合并策略
    const mergedConfig = {
      ...currentConfig,
      providers: [
        ...currentConfig.providers,
        ...(importData.providers || []),
      ],
      settings: {
        ...currentConfig.settings,
        ...importData.settings,
      },
      ui: {
        ...currentConfig.ui,
        ...importData.ui,
      },
    };
    
    await configManager.updateConfig(mergedConfig);
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private showFileError(message: string, error?: any): void {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    dialog.showErrorBox('文件操作错误', `${message}\n\n${errorMessage}`);
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('file-error', {
        message,
        error: errorMessage,
      });
    }
  }

  // 获取文件信息
  async getFileInfo(filePath: string): Promise<any> {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        content: content,
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  // 获取支持的文件类型
  getSupportedFileTypes(): FileType[] {
    return [...this.supportedFileTypes];
  }

  // 检查文件是否支持
  isFileSupported(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return this.supportedFileTypes.some(ft => ft.extension === extension);
  }

  // 打开文件所在目录
  async revealFile(filePath: string): Promise<void> {
    try {
      await shell.showItemInFolder(filePath);
    } catch (error) {
      console.error('Failed to reveal file:', error);
      this.showFileError('无法打开文件所在目录', error);
    }
  }
}

// 导出单例实例
export const fileAssociationManager = new FileAssociationManager();