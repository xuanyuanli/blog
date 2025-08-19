import { app, BrowserWindow, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { configManager } from './config/ConfigManager';
import { secureStorage } from './security/SecureStorage';
import { crossPlatformAdapter } from './platform/CrossPlatformAdapter';
import { ipcHandler } from './ipc/IPCHandler';
import { apiService } from './services/ApiService';
import { trayManager } from './system/TrayManager';
import { fileAssociationManager } from './system/FileAssociationManager';
import { deepLinkManager } from './system/DeepLinkManager';
import { shortcutManager } from './system/ShortcutManager';

class MainApplication {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // 应用准备就绪
    app.whenReady().then(() => {
      this.initializeApp();
    });

    // 窗口全部关闭
    app.on('window-all-closed', () => {
      this.handleAllWindowsClosed();
    });

    // 应用激活
    app.on('activate', () => {
      this.handleAppActivate();
    });

    // 应用退出前
    app.on('before-quit', () => {
      this.handleBeforeQuit();
    });

    // 处理深度链接（macOS）
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleDeepLink(url);
    });
  }

  private async initializeApp(): Promise<void> {
    try {
      console.log('Initializing Claude Code Provider Manager...');
      
      // 初始化配置
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // 设置用户模型
      if (config.settings.autoStart) {
        await crossPlatformAdapter.enableAutoStart();
      }

      // 创建主窗口
      this.createMainWindow();
      
      // 注册 IPC 处理器
      ipcHandler.setMainWindow(this.mainWindow);
      ipcHandler.registerHandlers();
      
      // 设置系统管理器
      this.setupSystemManagers();
      
      // 注册全局快捷键
      shortcutManager.registerAllShortcuts();
      
      // 设置平台特定功能
      this.setupPlatformFeatures();
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showErrorDialog('初始化失败', '应用初始化过程中发生错误，请检查日志。');
    }
  }

  private createMainWindow(): void {
    const config = configManager.getConfig();
    const platformConfig = crossPlatformAdapter.getConfig();
    
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      ...platformConfig.windowOptions,
      show: false,
      webPreferences: {
        ...platformConfig.windowOptions.webPreferences,
        preload: path.join(__dirname, '../preload.js'),
      },
    };

    this.mainWindow = crossPlatformAdapter.createMainWindow();
    
    // 设置适配器和管理器的主窗口引用
    crossPlatformAdapter.setMainWindow(this.mainWindow);
    trayManager.setMainWindow(this.mainWindow);
    fileAssociationManager.setMainWindow(this.mainWindow);
    deepLinkManager.setMainWindow(this.mainWindow);
    shortcutManager.setMainWindow(this.mainWindow);

    // 加载应用内容
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:1420');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }

    // 窗口事件处理
    this.setupWindowEvents();
  }

  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    // 窗口准备显示
    this.mainWindow.on('ready-to-show', () => {
      const config = configManager.getConfig();
      if (!config.settings.startMinimized) {
        this.mainWindow?.show();
      }
    });

    // 窗口关闭
    this.mainWindow.on('close', (event) => {
      const config = configManager.getConfig();
      
      if (config.settings.closeToTray && !this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // 窗口关闭后
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // 页面加载完成
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('Main window loaded successfully');
    });

    // 页面加载失败
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
      console.error('Failed to load window:', errorCode, errorDesc);
      this.showErrorDialog('加载失败', `无法加载应用界面: ${errorDesc}`);
    });

    // 渲染进程崩溃
    this.mainWindow.webContents.on('crashed', () => {
      console.error('Renderer process crashed');
      this.showErrorDialog('应用崩溃', '应用发生崩溃，将重新启动。');
      this.restartApp();
    });

    // 不响应
    this.mainWindow.on('unresponsive', () => {
      console.warn('Window became unresponsive');
      this.showErrorDialog('应用无响应', '应用当前无响应，请等待或强制关闭。');
    });

    // 恢复响应
    this.mainWindow.on('responsive', () => {
      console.log('Window became responsive again');
    });
  }

  // 设置系统管理器
  private setupSystemManagers(): void {
    // 系统管理器在主窗口创建时设置
    console.log('System managers setup completed');
  }

  private setupPlatformFeatures(): void {
    const config = configManager.getConfig();
    
    // 设置菜单
    this.setupMenu();
    
    // 托盘管理器会自动根据配置初始化
    // 文件关联管理器会自动处理文件关联
    // 深度链接管理器会自动处理深度链接
    // 快捷键管理器已经注册了快捷键
  }

  private setupMenu(): void {
    const config = configManager.getConfig();
    const template = this.getMenuTemplate();
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private getMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    const config = configManager.getConfig();
    
    return [
      {
        label: '文件',
        submenu: [
          {
            label: '新建提供商',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-provider');
            },
          },
          { type: 'separator' },
          {
            label: '导入配置',
            click: () => {
              this.mainWindow?.webContents.send('menu-import-config');
            },
          },
          {
            label: '导出配置',
            click: () => {
              this.mainWindow?.webContents.send('menu-export-config');
            },
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.quitApp();
            },
          },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { type: 'separator' },
          { role: 'selectall', label: '全选' },
        ],
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload', label: '刷新' },
          { role: 'forceReload', label: '强制刷新' },
          { type: 'separator' },
          { role: 'resetZoom', label: '重置缩放' },
          { role: 'zoomIn', label: '放大' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '全屏' },
          { type: 'separator' },
          {
            label: '开发者工具',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              this.mainWindow?.webContents.toggleDevTools();
            },
          },
        ],
      },
      {
        label: '工具',
        submenu: [
          {
            label: '验证提供商',
            click: () => {
              this.mainWindow?.webContents.send('menu-validate-provider');
            },
          },
          {
            label: '启动 Claude Code',
            accelerator: 'CmdOrCtrl+L',
            click: () => {
              this.mainWindow?.webContents.send('menu-launch-claude-code');
            },
          },
          { type: 'separator' },
          {
            label: '设置',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-settings');
            },
          },
        ],
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '查看文档',
            click: async () => {
              await this.mainWindow?.webContents.send('menu-open-docs');
            },
          },
          {
            label: '报告问题',
            click: async () => {
              await this.mainWindow?.webContents.send('menu-report-issue');
            },
          },
          {
            label: '检查更新',
            click: () => {
              this.mainWindow?.webContents.send('menu-check-update');
            },
          },
          { type: 'separator' },
          {
            label: '关于',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            },
          },
        ],
      },
    ];
  }

  
  private handleAllWindowsClosed(): void {
    if (process.platform !== 'darwin') {
      this.quitApp();
    }
  }

  private handleAppActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    } else {
      this.mainWindow?.show();
    }
  }

  private handleBeforeQuit(): void {
    this.isQuitting = true;
    
    // 清理资源
    this.cleanup();
  }

  private handleDeepLink(url: string): void {
    // 处理深度链接
    console.log('Handling deep link:', url);
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('deep-link', { url });
    } else {
      this.createMainWindow();
    }
  }

  private cleanup(): void {
    // 注销全局快捷键
    globalShortcut.unregisterAll();
    
    // 保存配置
    configManager.saveConfig().catch(console.error);
    
    // 清理其他资源
    console.log('Application cleanup completed');
  }

  private showErrorDialog(title: string, message: string): void {
    const { dialog } = require('electron');
    dialog.showErrorBox(title, message);
  }

  private restartApp(): void {
    app.relaunch();
    app.exit(0);
  }

  private quitApp(): void {
    this.isQuitting = true;
    app.quit();
  }

  // 公共方法
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public showMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    } else {
      this.createMainWindow();
    }
  }

  public hideMainWindow(): void {
    this.mainWindow?.hide();
  }

  public minimizeMainWindow(): void {
    this.mainWindow?.minimize();
  }

  public maximizeMainWindow(): void {
    this.mainWindow?.maximize();
  }

  public quit(): void {
    this.quitApp();
  }
}

// 启动应用
const mainApp = new MainApp();

export { mainApp };