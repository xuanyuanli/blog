import { app, BrowserWindow, ipcMain, shell, globalShortcut, powerMonitor } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { secureStorage } from '../security/SecureStorage';

// 平台类型
export type Platform = 'windows' | 'macos' | 'linux';

// 平台特性
export interface PlatformFeatures {
  platform: Platform;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  supportsTray: boolean;
  supportsNotifications: boolean;
  supportsGlobalShortcuts: boolean;
  supportsAutoStart: boolean;
  supportsFileAssociation: boolean;
  supportsDeepLinks: boolean;
}

// 平台特定配置
export interface PlatformConfig {
  windowOptions: Electron.BrowserWindowConstructorOptions;
  trayOptions: {
    icon: string;
    tooltip: string;
  };
  shortcuts: {
    showHide: string;
    newProvider: string;
    quickLaunch: string;
  };
  fileAssociations: {
    extensions: string[];
    name: string;
    description: string;
  };
  deepLinkProtocol: string;
}

// 跨平台适配器
export class CrossPlatformAdapter {
  private features: PlatformFeatures;
  private config: PlatformConfig;
  private mainWindow: BrowserWindow | null = null;
  private tray: Electron.Tray | null = null;

  constructor() {
    this.features = this.detectPlatform();
    this.config = this.getPlatformConfig();
    this.setupPlatformSpecifics();
  }

  private detectPlatform(): PlatformFeatures {
    const platform = process.platform;
    
    return {
      platform: platform === 'win32' ? 'windows' : 
              platform === 'darwin' ? 'macos' : 'linux',
      isWindows: platform === 'win32',
      isMacOS: platform === 'darwin',
      isLinux: platform === 'linux',
      supportsTray: true, // 所有主流平台都支持
      supportsNotifications: true,
      supportsGlobalShortcuts: true,
      supportsAutoStart: true,
      supportsFileAssociation: true,
      supportsDeepLinks: true,
    };
  }

  private getPlatformConfig(): PlatformConfig {
    const baseConfig: PlatformConfig = {
      windowOptions: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          sandbox: true,
          preload: path.join(__dirname, '../preload.js'),
        },
        show: false,
      },
      trayOptions: {
        icon: this.getPlatformIcon(),
        tooltip: 'Claude Code Provider Manager',
      },
      shortcuts: {
        showHide: 'CommandOrControl+Shift+C',
        newProvider: 'CommandOrControl+Shift+N',
        quickLaunch: 'CommandOrControl+Shift+L',
      },
      fileAssociations: {
        extensions: ['.claude', '.ccp'],
        name: 'ClaudeCodeProvider',
        description: 'Claude Code Provider Configuration',
      },
      deepLinkProtocol: 'claude-code',
    };

    // 平台特定调整
    if (this.features.isWindows) {
      baseConfig.windowOptions.frame = true;
      baseConfig.windowOptions.titleBarStyle = 'default';
      baseConfig.shortcuts.showHide = 'Ctrl+Shift+C';
      baseConfig.shortcuts.newProvider = 'Ctrl+Shift+N';
      baseConfig.shortcuts.quickLaunch = 'Ctrl+Shift+L';
    } else if (this.features.isMacOS) {
      baseConfig.windowOptions.frame = false;
      baseConfig.windowOptions.titleBarStyle = 'hiddenInset';
      baseConfig.windowOptions.vibrancy = 'sidebar';
      baseConfig.windowOptions.visualEffectState = 'active';
    } else if (this.features.isLinux) {
      baseConfig.windowOptions.frame = true;
      baseConfig.windowOptions.titleBarStyle = 'default';
      baseConfig.windowOptions.icon = this.getPlatformIcon();
    }

    return baseConfig;
  }

  private getPlatformIcon(): string {
    const iconPath = path.join(__dirname, '../../assets/icons');
    
    if (this.features.isWindows) {
      return path.join(iconPath, 'icon.ico');
    } else if (this.features.isMacOS) {
      return path.join(iconPath, 'icon.icns');
    } else {
      return path.join(iconPath, 'icon.png');
    }
  }

  private setupPlatformSpecifics(): void {
    // 设置应用协议
    if (this.features.supportsDeepLinks) {
      this.setupDeepLinks();
    }

    // 设置文件关联
    if (this.features.supportsFileAssociation) {
      this.setupFileAssociations();
    }

    // 设置电源监控
    this.setupPowerMonitoring();

    // 设置平台特定的菜单
    this.setupPlatformMenu();
  }

  private setupDeepLinks(): void {
    if (app.isDefaultProtocolClient(this.config.deepLinkProtocol)) {
      return;
    }

    if (app.setAsDefaultProtocolClient(this.config.deepLinkProtocol)) {
      console.log(`Set as default protocol client for ${this.config.deepLinkProtocol}`);
    }

    // 处理深度链接
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleDeepLink(url);
    });
  }

  private setupFileAssociations(): void {
    // 注册文件关联（需要在打包时配置）
    console.log('File associations configured:', this.config.fileAssociations);
  }

  private setupPowerMonitoring(): void {
    powerMonitor.on('suspend', () => {
      console.log('System is suspending');
      this.handleSystemSuspend();
    });

    powerMonitor.on('resume', () => {
      console.log('System is resuming');
      this.handleSystemResume();
    });

    powerMonitor.on('on-ac', () => {
      console.log('System is on AC power');
      this.handlePowerSourceChange(true);
    });

    powerMonitor.on('on-battery', () => {
      console.log('System is on battery power');
      this.handlePowerSourceChange(false);
    });
  }

  private setupPlatformMenu(): void {
    if (this.features.isMacOS) {
      this.setupMacOSMenu();
    } else if (this.features.isWindows) {
      this.setupWindowsMenu();
    } else {
      this.setupLinuxMenu();
    }
  }

  private setupMacOSMenu(): void {
    const { Menu } = require('electron');
    
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'File',
        submenu: [
          { role: 'close' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupWindowsMenu(): void {
    const { Menu } = require('electron');
    
    const template = [
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupLinuxMenu(): void {
    const { Menu } = require('electron');
    
    const template = [
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  // 事件处理器
  private handleDeepLink(url: string): void {
    console.log('Handling deep link:', url);
    
    // 解析深度链接
    const urlObj = new URL(url);
    const action = urlObj.pathname.replace('/', '');
    
    switch (action) {
      case 'provider':
        this.handleProviderDeepLink(urlObj.searchParams);
        break;
      case 'settings':
        this.handleSettingsDeepLink(urlObj.searchParams);
        break;
      case 'launch':
        this.handleLaunchDeepLink(urlObj.searchParams);
        break;
      default:
        console.log('Unknown deep link action:', action);
    }
  }

  private handleProviderDeepLink(params: URLSearchParams): void {
    const providerId = params.get('id');
    const action = params.get('action');
    
    if (providerId && action) {
      // 通过 IPC 发送到渲染进程
      if (this.mainWindow) {
        this.mainWindow.webContents.send('deep-link-provider', { providerId, action });
      }
    }
  }

  private handleSettingsDeepLink(params: URLSearchParams): void {
    const section = params.get('section');
    
    if (section) {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('deep-link-settings', { section });
      }
    }
  }

  private handleLaunchDeepLink(params: URLSearchParams): void {
    const providerId = params.get('provider');
    const workingDir = params.get('dir');
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('deep-link-launch', { providerId, workingDir });
    }
  }

  private handleSystemSuspend(): void {
    // 系统即将挂起，保存状态
    console.log('Saving state before system suspend');
    if (this.mainWindow) {
      this.mainWindow.webContents.send('system-suspend');
    }
  }

  private handleSystemResume(): void {
    // 系统恢复，可能需要刷新状态
    console.log('Restoring state after system resume');
    if (this.mainWindow) {
      this.mainWindow.webContents.send('system-resume');
    }
  }

  private handlePowerSourceChange(isOnAC: boolean): void {
    // 电源源变化，可能需要调整性能设置
    console.log('Power source changed:', isOnAC ? 'AC' : 'Battery');
    if (this.mainWindow) {
      this.mainWindow.webContents.send('power-source-change', { isOnAC });
    }
  }

  // 公共方法
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  getFeatures(): PlatformFeatures {
    return this.features;
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  // 窗口管理
  createMainWindow(): BrowserWindow {
    const win = new BrowserWindow(this.config.windowOptions);
    
    win.on('ready-to-show', () => {
      win.show();
    });

    win.on('closed', () => {
      this.mainWindow = null;
    });

    return win;
  }

  // 全局快捷键
  registerGlobalShortcuts(): void {
    if (!this.features.supportsGlobalShortcuts) {
      return;
    }

    // 显示/隐藏窗口
    globalShortcut.register(this.config.shortcuts.showHide, () => {
      if (this.mainWindow) {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
        }
      }
    });

    // 新建提供商
    globalShortcut.register(this.config.shortcuts.newProvider, () => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('global-shortcut-new-provider');
      }
    });

    // 快速启动
    globalShortcut.register(this.config.shortcuts.quickLaunch, () => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('global-shortcut-quick-launch');
      }
    });
  }

  unregisterGlobalShortcuts(): void {
    globalShortcut.unregisterAll();
  }

  // 自动启动
  async enableAutoStart(): Promise<void> {
    if (!this.features.supportsAutoStart) {
      return;
    }

    try {
      if (this.features.isMacOS) {
        app.setLoginItemSettings({
          openAtLogin: true,
          openAsHidden: true,
        });
      } else if (this.features.isWindows) {
        const { app } = require('electron');
        app.setLoginItemSettings({
          openAtLogin: true,
          path: process.execPath,
        });
      } else if (this.features.isLinux) {
        // Linux 自动启动需要创建 .desktop 文件
        await this.createLinuxAutoStartFile();
      }
    } catch (error) {
      console.error('Failed to enable auto start:', error);
    }
  }

  async disableAutoStart(): Promise<void> {
    if (!this.features.supportsAutoStart) {
      return;
    }

    try {
      app.setLoginItemSettings({
        openAtLogin: false,
      });
      
      if (this.features.isLinux) {
        await this.removeLinuxAutoStartFile();
      }
    } catch (error) {
      console.error('Failed to disable auto start:', error);
    }
  }

  private async createLinuxAutoStartFile(): Promise<void> {
    const desktopEntry = `[Desktop Entry]
Type=Application
Name=Claude Code Provider Manager
Exec=${process.execPath}
Icon=${this.getPlatformIcon()}
Terminal=false
Categories=Utility;
X-GNOME-Autostart-enabled=true`;

    const autostartDir = path.join(process.env.HOME || '', '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'claude-code-provider-manager.desktop');

    if (!fs.existsSync(autostartDir)) {
      fs.mkdirSync(autostartDir, { recursive: true });
    }

    fs.writeFileSync(desktopFile, desktopEntry);
  }

  private async removeLinuxAutoStartFile(): Promise<void> {
    const autostartDir = path.join(process.env.HOME || '', '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'claude-code-provider-manager.desktop');

    if (fs.existsSync(desktopFile)) {
      fs.unlinkSync(desktopFile);
    }
  }
}

// 导出单例实例
export const crossPlatformAdapter = new CrossPlatformAdapter();