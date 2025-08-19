import { app, Menu, Tray, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';
import { configManager } from '../config/ConfigManager';
import { ipcHandler } from '../ipc/IPCHandler';

// 托盘菜单项
interface TrayMenuItem {
  label: string;
  click?: () => void;
  type?: 'normal' | 'separator' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  submenu?: TrayMenuItem[];
  accelerator?: string;
  role?: string;
}

// 托盘管理器
export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private contextMenu: Electron.Menu | null = null;

  constructor() {
    this.setupTray();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private setupTray(): void {
    try {
      const icon = this.getTrayIcon();
      this.tray = new Tray(icon);
      
      this.tray.setToolTip('Claude Code Provider Manager');
      this.tray.on('click', this.handleTrayClick.bind(this));
      this.tray.on('right-click', this.handleTrayRightClick.bind(this));
      this.tray.on('double-click', this.handleTrayDoubleClick.bind(this));
      
      this.updateContextMenu();
      
      console.log('Tray initialized successfully');
    } catch (error) {
      console.error('Failed to initialize tray:', error);
    }
  }

  private getTrayIcon(): Electron.NativeImage {
    try {
      const iconPath = path.join(__dirname, '../../assets/icons');
      const platform = process.platform;
      
      let iconFile: string;
      if (platform === 'win32') {
        iconFile = 'tray-icon.ico';
      } else if (platform === 'darwin') {
        iconFile = 'tray-icon.png';
      } else {
        iconFile = 'tray-icon.png';
      }
      
      const iconFullPath = path.join(iconPath, iconFile);
      
      try {
        const image = nativeImage.createFromPath(iconFullPath);
        if (image.isEmpty()) {
          throw new Error('Icon file is empty');
        }
        return image;
      } catch (error) {
        console.warn('Failed to load tray icon from file, using default:', error);
        return this.createDefaultIcon();
      }
    } catch (error) {
      console.error('Failed to get tray icon:', error);
      return this.createDefaultIcon();
    }
  }

  private createDefaultIcon(): Electron.NativeImage {
    // 创建一个简单的默认图标
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 绘制一个简单的图标
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText('C', 4, 12);
    }
    
    return nativeImage.createFromDataURL(canvas.toDataURL());
  }

  private updateContextMenu(): void {
    const config = configManager.getConfig();
    const menuItems = this.getMenuItems(config);
    
    this.contextMenu = Menu.buildFromTemplate(menuItems as any);
    this.tray?.setContextMenu(this.contextMenu);
  }

  private getMenuItems(config: any): TrayMenuItem[] {
    const activeProvider = config.providers.find((p: any) => p.isActive);
    
    return [
      {
        label: 'Claude Code Provider Manager',
        enabled: false,
        visible: true,
      },
      { type: 'separator' },
      {
        label: '显示主窗口',
        click: () => this.showMainWindow(),
        accelerator: 'CmdOrCtrl+Shift+O',
      },
      {
        label: '隐藏主窗口',
        click: () => this.hideMainWindow(),
        accelerator: 'CmdOrCtrl+Shift+H',
        visible: this.mainWindow?.isVisible(),
      },
      { type: 'separator' },
      {
        label: '当前提供商',
        enabled: false,
        visible: !!activeProvider,
      },
      {
        label: activeProvider ? activeProvider.name : '无激活提供商',
        enabled: false,
        visible: !!activeProvider,
      },
      {
        label: '启动 Claude Code',
        click: () => this.launchClaudeCode(),
        accelerator: 'CmdOrCtrl+Shift+L',
        enabled: !!activeProvider,
      },
      { type: 'separator' },
      {
        label: '提供商管理',
        submenu: this.getProviderSubmenu(config),
      },
      {
        label: '设置',
        click: () => this.openSettings(),
        accelerator: 'CmdOrCtrl+,',
      },
      { type: 'separator' },
      {
        label: '开机自启动',
        type: 'checkbox',
        checked: config.settings.autoStart,
        click: () => this.toggleAutoStart(),
      },
      {
        label: '关闭到托盘',
        type: 'checkbox',
        checked: config.settings.closeToTray,
        click: () => this.toggleCloseToTray(),
      },
      { type: 'separator' },
      {
        label: '检查更新',
        click: () => this.checkForUpdates(),
      },
      {
        label: '关于',
        click: () => this.showAbout(),
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => this.quitApp(),
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      },
    ];
  }

  private getProviderSubmenu(config: any): TrayMenuItem[] {
    const providerItems: TrayMenuItem[] = config.providers.map((provider: any) => ({
      label: provider.name,
      type: 'radio',
      checked: provider.isActive,
      click: () => this.switchProvider(provider.id),
    }));

    return [
      ...providerItems,
      { type: 'separator' },
      {
        label: '添加提供商',
        click: () => this.addProvider(),
      },
      {
        label: '管理提供商',
        click: () => this.manageProviders(),
      },
    ];
  }

  // 事件处理器
  private handleTrayClick(): void {
    const config = configManager.getConfig();
    if (config.settings.closeToTray) {
      if (this.mainWindow?.isVisible()) {
        this.hideMainWindow();
      } else {
        this.showMainWindow();
      }
    }
  }

  private handleTrayRightClick(): void {
    this.updateContextMenu();
    this.tray?.popUpContextMenu();
  }

  private handleTrayDoubleClick(): void {
    this.showMainWindow();
  }

  // 操作方法
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

  private hideMainWindow(): void {
    this.mainWindow?.hide();
  }

  private launchClaudeCode(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-launch-claude-code');
    }
  }

  private openSettings(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-open-settings');
      this.showMainWindow();
    }
  }

  private async toggleAutoStart(): Promise<void> {
    try {
      const config = configManager.getConfig();
      const newAutoStart = !config.settings.autoStart;
      
      await configManager.updateSettings({ autoStart: newAutoStart });
      
      // 更新托盘菜单
      this.updateContextMenu();
      
      // 通知主进程
      if (this.mainWindow) {
        this.mainWindow.webContents.send('auto-start-changed', { enabled: newAutoStart });
      }
    } catch (error) {
      console.error('Failed to toggle auto start:', error);
    }
  }

  private async toggleCloseToTray(): Promise<void> {
    try {
      const config = configManager.getConfig();
      const newCloseToTray = !config.settings.closeToTray;
      
      await configManager.updateSettings({ closeToTray: newCloseToTray });
      
      // 更新托盘菜单
      this.updateContextMenu();
      
      // 通知主进程
      if (this.mainWindow) {
        this.mainWindow.webContents.send('close-to-tray-changed', { enabled: newCloseToTray });
      }
    } catch (error) {
      console.error('Failed to toggle close to tray:', error);
    }
  }

  private switchProvider(providerId: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-switch-provider', { providerId });
    }
  }

  private addProvider(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-add-provider');
      this.showMainWindow();
    }
  }

  private manageProviders(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-manage-providers');
      this.showMainWindow();
    }
  }

  private checkForUpdates(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-check-updates');
    }
  }

  private showAbout(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('tray-show-about');
      this.showMainWindow();
    }
  }

  private quitApp(): void {
    const config = configManager.getConfig();
    
    if (config.settings.closeToTray) {
      // 如果启用了关闭到托盘，显示确认对话框
      const { dialog } = require('electron');
      const result = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['退出', '取消'],
        defaultId: 0,
        cancelId: 1,
        title: '确认退出',
        message: '确定要退出 Claude Code Provider Manager 吗？',
        detail: '退出后将无法接收托盘通知。',
      });
      
      if (result === 0) {
        app.quit();
      }
    } else {
      app.quit();
    }
  }

  // 公共方法
  updateTrayIcon(): void {
    if (this.tray) {
      const icon = this.getTrayIcon();
      this.tray.setImage(icon);
    }
  }

  updateTrayTooltip(tooltip: string): void {
    this.tray?.setToolTip(tooltip);
  }

  showBalloon(title: string, content: string): void {
    if (this.tray && process.platform === 'win32') {
      this.tray.displayBalloon({
        title,
        content,
        iconType: 'info',
      });
    }
  }

  flashTray(flash: boolean = true): void {
    if (this.tray && process.platform === 'win32') {
      this.tray.setHighlightMode(flash ? 'always' : 'never');
    }
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  // 状态更新
  updateProviderStatus(providers: any[]): void {
    this.updateContextMenu();
    
    // 更新托盘提示
    const activeProvider = providers.find(p => p.isActive);
    if (activeProvider) {
      const tooltip = `Claude Code Provider Manager - ${activeProvider.name}`;
      this.updateTrayTooltip(tooltip);
    }
  }

  showNotification(title: string, body: string): void {
    // 使用托盘显示通知
    this.showBalloon(title, body);
    
    // 在支持的平台上闪烁托盘图标
    this.flashTray(true);
    setTimeout(() => this.flashTray(false), 3000);
  }
}

// 导出单例实例
export const trayManager = new TrayManager();