import { app, BrowserWindow } from 'electron';
import { configManager } from '../config/ConfigManager';
import { ipcHandler } from '../ipc/IPCHandler';

// 深度链接动作类型
export type DeepLinkAction = 
  | 'provider'
  | 'settings'
  | 'launch'
  | 'import'
  | 'export'
  | 'validate'
  | 'switch';

// 深度链接参数
export interface DeepLinkParams {
  [key: string]: string | undefined;
}

// 深度链接信息
export interface DeepLinkInfo {
  url: string;
  protocol: string;
  action: DeepLinkAction;
  params: DeepLinkParams;
  timestamp: string;
}

// 深度链接管理器
export class DeepLinkManager {
  private mainWindow: BrowserWindow | null = null;
  private pendingLinks: DeepLinkInfo[] = [];
  private isInitialized = false;

  constructor() {
    this.setupDeepLinks();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.isInitialized = true;
    
    // 处理待处理的链接
    this.processPendingLinks();
  }

  private setupDeepLinks(): void {
    // 注册支持的协议
    this.registerProtocols();
    
    // 处理深度链接事件
    this.setupEventHandlers();
    
    // 处理命令行参数
    this.handleCommandLineArgs();
  }

  private registerProtocols(): void {
    const protocols = ['claude-code', 'claude', 'ccp'];
    
    protocols.forEach(protocol => {
      if (!app.isDefaultProtocolClient(protocol)) {
        if (app.setAsDefaultProtocolClient(protocol)) {
          console.log(`Registered protocol: ${protocol}://`);
        } else {
          console.warn(`Failed to register protocol: ${protocol}://`);
        }
      } else {
        console.log(`Protocol already registered: ${protocol}://`);
      }
    });
  }

  private setupEventHandlers(): void {
    // macOS 文件打开事件
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleDeepLink(url);
    });

    // Windows 和 Linux 通过命令行参数处理
    if (process.platform !== 'darwin') {
      app.on('second-instance', (event, commandLine) => {
        // 处理第二个实例的命令行参数
        commandLine.forEach(arg => {
          if (arg.startsWith('claude-code://') || 
              arg.startsWith('claude://') || 
              arg.startsWith('ccp://')) {
            this.handleDeepLink(arg);
          }
        });
      });
    }
  }

  private handleCommandLineArgs(): void {
    const args = process.argv.slice(1);
    
    args.forEach(arg => {
      if (arg.startsWith('claude-code://') || 
          arg.startsWith('claude://') || 
          arg.startsWith('ccp://')) {
        this.handleDeepLink(arg);
      }
    });
  }

  private handleDeepLink(url: string): void {
    try {
      const linkInfo = this.parseDeepLink(url);
      
      console.log('Received deep link:', linkInfo);
      
      if (this.isInitialized && this.mainWindow) {
        this.processDeepLink(linkInfo);
      } else {
        // 保存链接等待处理
        this.pendingLinks.push(linkInfo);
        console.log('Main window not ready, link queued:', linkInfo.url);
      }
    } catch (error) {
      console.error('Failed to handle deep link:', error);
    }
  }

  private parseDeepLink(url: string): DeepLinkInfo {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.replace(':', '');
    
    // 解析动作
    const action = this.parseAction(urlObj.pathname);
    
    // 解析参数
    const params: DeepLinkParams = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      url,
      protocol,
      action,
      params,
      timestamp: new Date().toISOString(),
    };
  }

  private parseAction(pathname: string): DeepLinkAction {
    // 移除开头的 '/'
    const cleanPath = pathname.replace(/^\//, '');
    
    // 根据路径确定动作
    switch (cleanPath) {
      case 'provider':
      case 'providers':
        return 'provider';
      case 'settings':
      case 'config':
        return 'settings';
      case 'launch':
      case 'start':
        return 'launch';
      case 'import':
        return 'import';
      case 'export':
        return 'export';
      case 'validate':
        return 'validate';
      case 'switch':
        return 'switch';
      default:
        // 默认为设置页面
        return 'settings';
    }
  }

  private async processDeepLink(linkInfo: DeepLinkInfo): Promise<void> {
    try {
      // 显示主窗口
      this.showMainWindow();
      
      // 根据动作类型处理
      switch (linkInfo.action) {
        case 'provider':
          await this.handleProviderAction(linkInfo);
          break;
        case 'settings':
          await this.handleSettingsAction(linkInfo);
          break;
        case 'launch':
          await this.handleLaunchAction(linkInfo);
          break;
        case 'import':
          await this.handleImportAction(linkInfo);
          break;
        case 'export':
          await this.handleExportAction(linkInfo);
          break;
        case 'validate':
          await this.handleValidateAction(linkInfo);
          break;
        case 'switch':
          await this.handleSwitchAction(linkInfo);
          break;
        default:
          console.warn('Unknown deep link action:', linkInfo.action);
      }
      
      // 发送深度链接事件到渲染进程
      this.mainWindow?.webContents.send('deep-link-processed', linkInfo);
      
    } catch (error) {
      console.error('Failed to process deep link:', error);
      
      // 发送错误事件到渲染进程
      this.mainWindow?.webContents.send('deep-link-error', {
        link: linkInfo.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleProviderAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    if (params.id) {
      // 切换到指定提供商
      this.mainWindow?.webContents.send('deep-link-switch-provider', {
        providerId: params.id,
      });
    } else if (params.action === 'add') {
      // 添加新提供商
      this.mainWindow?.webContents.send('deep-link-add-provider', {
        baseUrl: params.baseUrl,
        name: params.name,
        model: params.model,
      });
    } else {
      // 打开提供商管理页面
      this.mainWindow?.webContents.send('deep-link-manage-providers');
    }
  }

  private async handleSettingsAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    if (params.section) {
      // 打开指定设置部分
      this.mainWindow?.webContents.send('deep-link-open-settings', {
        section: params.section,
      });
    } else {
      // 打开设置页面
      this.mainWindow?.webContents.send('deep-link-open-settings');
    }
  }

  private async handleLaunchAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    this.mainWindow?.webContents.send('deep-link-launch-claude-code', {
      providerId: params.provider,
      workingDirectory: params.dir,
      args: params.args?.split(',') || [],
    });
  }

  private async handleImportAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    this.mainWindow?.webContents.send('deep-link-import-config', {
      url: params.url,
      format: params.format,
    });
  }

  private async handleExportAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    this.mainWindow?.webContents.send('deep-link-export-config', {
      format: params.format,
      includeProviders: params.includeProviders !== 'false',
      includeSettings: params.includeSettings !== 'false',
    });
  }

  private async handleValidateAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    if (params.id) {
      this.mainWindow?.webContents.send('deep-link-validate-provider', {
        providerId: params.id,
      });
    } else if (params.baseUrl) {
      this.mainWindow?.webContents.send('deep-link-validate-url', {
        baseUrl: params.baseUrl,
        authToken: params.token,
        model: params.model,
      });
    }
  }

  private async handleSwitchAction(linkInfo: DeepLinkInfo): Promise<void> {
    const { params } = linkInfo;
    
    if (params.id) {
      this.mainWindow?.webContents.send('deep-link-switch-provider', {
        providerId: params.id,
      });
    }
  }

  private processPendingLinks(): void {
    if (this.pendingLinks.length === 0) {
      return;
    }
    
    console.log(`Processing ${this.pendingLinks.length} pending deep links`);
    
    // 处理所有待处理的链接
    this.pendingLinks.forEach(linkInfo => {
      this.processDeepLink(linkInfo);
    });
    
    // 清空待处理列表
    this.pendingLinks = [];
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      
      // 如果窗口最小化，恢复
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
    }
  }

  // 公共方法
  generateDeepLink(action: DeepLinkAction, params: DeepLinkParams = {}): string {
    const protocol = 'claude-code';
    const queryString = new URLSearchParams(params).toString();
    const path = action === 'settings' ? '' : action;
    
    return `${protocol}://${path}${queryString ? '?' + queryString : ''}`;
  }

  async testDeepLink(url: string): Promise<boolean> {
    try {
      const linkInfo = this.parseDeepLink(url);
      
      // 验证链接格式
      if (!this.isValidDeepLink(linkInfo)) {
        return false;
      }
      
      // 测试处理（不实际执行）
      console.log('Deep link test passed:', linkInfo);
      return true;
    } catch (error) {
      console.error('Deep link test failed:', error);
      return false;
    }
  }

  private isValidDeepLink(linkInfo: DeepLinkInfo): boolean {
    // 验证协议
    const validProtocols = ['claude-code', 'claude', 'ccp'];
    if (!validProtocols.includes(linkInfo.protocol)) {
      return false;
    }
    
    // 验证动作
    const validActions: DeepLinkAction[] = [
      'provider', 'settings', 'launch', 'import', 'export', 'validate', 'switch'
    ];
    if (!validActions.includes(linkInfo.action)) {
      return false;
    }
    
    // 验证必要参数
    if (linkInfo.action === 'provider' && linkInfo.params.action === 'add') {
      if (!linkInfo.params.baseUrl) {
        return false;
      }
    }
    
    if (linkInfo.action === 'launch' && !linkInfo.params.provider) {
      return false;
    }
    
    return true;
  }

  getRegisteredProtocols(): string[] {
    return ['claude-code', 'claude', 'ccp'];
  }

  isProtocolRegistered(protocol: string): boolean {
    return app.isDefaultProtocolClient(protocol);
  }

  async registerProtocol(protocol: string): Promise<boolean> {
    try {
      if (!app.isDefaultProtocolClient(protocol)) {
        return app.setAsDefaultProtocolClient(protocol);
      }
      return true;
    } catch (error) {
      console.error(`Failed to register protocol ${protocol}:`, error);
      return false;
    }
  }

  async unregisterProtocol(protocol: string): Promise<boolean> {
    try {
      if (app.isDefaultProtocolClient(protocol)) {
        return app.removeAsDefaultProtocolClient(protocol);
      }
      return true;
    } catch (error) {
      console.error(`Failed to unregister protocol ${protocol}:`, error);
      return false;
    }
  }

  // 获取待处理的链接数量
  getPendingLinksCount(): number {
    return this.pendingLinks.length;
  }

  // 清空待处理的链接
  clearPendingLinks(): void {
    this.pendingLinks = [];
  }
}

// 导出单例实例
export const deepLinkManager = new DeepLinkManager();