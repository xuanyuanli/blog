import { globalShortcut, BrowserWindow, app } from 'electron';
import { configManager } from '../config/ConfigManager';
import { trayManager } from './TrayManager';

// 快捷键配置
export interface ShortcutConfig {
  id: string;
  accelerator: string;
  description: string;
  enabled: boolean;
  global: boolean;
  action: () => void;
}

// 快捷键管理器
export class ShortcutManager {
  private mainWindow: BrowserWindow | null = null;
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private registeredShortcuts: Set<string> = new Set();

  constructor() {
    this.initializeShortcuts();
    this.setupEventHandlers();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private initializeShortcuts(): void {
    // 定义默认快捷键
    const defaultShortcuts: ShortcutConfig[] = [
      {
        id: 'show-hide',
        accelerator: 'CommandOrControl+Shift+C',
        description: '显示/隐藏主窗口',
        enabled: true,
        global: true,
        action: this.toggleWindow.bind(this),
      },
      {
        id: 'new-provider',
        accelerator: 'CommandOrControl+Shift+N',
        description: '新建提供商',
        enabled: true,
        global: true,
        action: this.newProvider.bind(this),
      },
      {
        id: 'quick-launch',
        accelerator: 'CommandOrControl+Shift+L',
        description: '快速启动 Claude Code',
        enabled: true,
        global: true,
        action: this.quickLaunch.bind(this),
      },
      {
        id: 'validate-provider',
        accelerator: 'CommandOrControl+Shift+V',
        description: '验证当前提供商',
        enabled: true,
        global: true,
        action: this.validateProvider.bind(this),
      },
      {
        id: 'switch-provider',
        accelerator: 'CommandOrControl+Shift+S',
        description: '切换提供商',
        enabled: true,
        global: true,
        action: this.switchProvider.bind(this),
      },
      {
        id: 'settings',
        accelerator: 'CommandOrControl+Shift+,',
        description: '打开设置',
        enabled: true,
        global: true,
        action: this.openSettings.bind(this),
      },
      {
        id: 'export-config',
        accelerator: 'CommandOrControl+Shift+E',
        description: '导出配置',
        enabled: true,
        global: true,
        action: this.exportConfig.bind(this),
      },
      {
        id: 'import-config',
        accelerator: 'CommandOrControl+Shift+I',
        description: '导入配置',
        enabled: true,
        global: true,
        action: this.importConfig.bind(this),
      },
    ];

    // 添加到快捷键映射
    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });

    // 从配置加载快捷键设置
    this.loadShortcutsFromConfig();
  }

  private setupEventHandlers(): void {
    // 应用失去焦点时检查快捷键
    app.on('browser-window-blur', () => {
      this.checkShortcutsStatus();
    });

    // 应用获得焦点时检查快捷键
    app.on('browser-window-focus', () => {
      this.checkShortcutsStatus();
    });

    // 应用激活时注册快捷键
    app.on('activate', () => {
      this.registerAllShortcuts();
    });

    // 应用退出前注销快捷键
    app.on('before-quit', () => {
      this.unregisterAllShortcuts();
    });
  }

  private async loadShortcutsFromConfig(): Promise<void> {
    try {
      const config = await configManager.loadConfig();
      
      // 如果配置中有快捷键设置，更新默认快捷键
      if (config.advanced?.shortcuts) {
        Object.entries(config.advanced.shortcuts).forEach(([id, settings]: [string, any]) => {
          const shortcut = this.shortcuts.get(id);
          if (shortcut) {
            shortcut.accelerator = settings.accelerator || shortcut.accelerator;
            shortcut.enabled = settings.enabled !== false;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load shortcuts from config:', error);
    }
  }

  // 注册所有快捷键
  registerAllShortcuts(): void {
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.enabled && shortcut.global) {
        this.registerShortcut(id);
      }
    });
  }

  // 注销所有快捷键
  unregisterAllShortcuts(): void {
    this.registeredShortcuts.forEach(accelerator => {
      globalShortcut.unregister(accelerator);
    });
    this.registeredShortcuts.clear();
  }

  // 注册单个快捷键
  registerShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut || !shortcut.enabled || !shortcut.global) {
      return false;
    }

    try {
      // 检查是否已经注册
      if (this.registeredShortcuts.has(shortcut.accelerator)) {
        console.warn(`Shortcut already registered: ${shortcut.accelerator}`);
        return false;
      }

      const success = globalShortcut.register(shortcut.accelerator, shortcut.action);
      
      if (success) {
        this.registeredShortcuts.add(shortcut.accelerator);
        console.log(`Shortcut registered: ${shortcut.accelerator} (${id})`);
        return true;
      } else {
        console.error(`Failed to register shortcut: ${shortcut.accelerator} (${id})`);
        return false;
      }
    } catch (error) {
      console.error(`Error registering shortcut ${id}:`, error);
      return false;
    }
  }

  // 注销单个快捷键
  unregisterShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      return false;
    }

    try {
      const success = globalShortcut.unregister(shortcut.accelerator);
      
      if (success) {
        this.registeredShortcuts.delete(shortcut.accelerator);
        console.log(`Shortcut unregistered: ${shortcut.accelerator} (${id})`);
        return true;
      } else {
        console.error(`Failed to unregister shortcut: ${shortcut.accelerator} (${id})`);
        return false;
      }
    } catch (error) {
      console.error(`Error unregistering shortcut ${id}:`, error);
      return false;
    }
  }

  // 检查快捷键状态
  checkShortcutsStatus(): void {
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.enabled && shortcut.global) {
        const isRegistered = globalShortcut.isRegistered(shortcut.accelerator);
        
        if (!isRegistered && !this.registeredShortcuts.has(shortcut.accelerator)) {
          // 尝试重新注册
          this.registerShortcut(id);
        }
      }
    });
  }

  // 快捷键动作
  private toggleWindow(): void {
    if (this.mainWindow?.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showMainWindow();
    }
  }

  private newProvider(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-new-provider');
  }

  private quickLaunch(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-quick-launch');
  }

  private validateProvider(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-validate-provider');
  }

  private switchProvider(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-switch-provider');
  }

  private openSettings(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-open-settings');
  }

  private exportConfig(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-export-config');
  }

  private importConfig(): void {
    this.showMainWindow();
    this.mainWindow?.webContents.send('shortcut-import-config');
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
    }
  }

  // 公共方法
  updateShortcut(id: string, accelerator: string, enabled: boolean): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      return false;
    }

    // 注销旧快捷键
    if (this.registeredShortcuts.has(shortcut.accelerator)) {
      this.unregisterShortcut(id);
    }

    // 更新快捷键配置
    shortcut.accelerator = accelerator;
    shortcut.enabled = enabled;

    // 注册新快捷键
    if (enabled) {
      return this.registerShortcut(id);
    }

    return true;
  }

  enableShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      return false;
    }

    shortcut.enabled = true;
    return this.registerShortcut(id);
  }

  disableShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) {
      return false;
    }

    shortcut.enabled = false;
    return this.unregisterShortcut(id);
  }

  getShortcut(id: string): ShortcutConfig | undefined {
    return this.shortcuts.get(id);
  }

  getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  getRegisteredShortcuts(): string[] {
    return Array.from(this.registeredShortcuts);
  }

  isShortcutRegistered(accelerator: string): boolean {
    return this.registeredShortcuts.has(accelerator);
  }

  // 测试快捷键是否可用
  testShortcut(accelerator: string): boolean {
    try {
      // 临时注册测试快捷键
      const testSuccess = globalShortcut.register(accelerator, () => {
        // 立即注销测试快捷键
        globalShortcut.unregister(accelerator);
      });
      
      if (testSuccess) {
        // 注销测试快捷键
        globalShortcut.unregister(accelerator);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error testing shortcut:', error);
      return false;
    }
  }

  // 获取快捷键冲突
  getShortcutConflicts(accelerator: string): string[] {
    const conflicts: string[] = [];
    
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.accelerator === accelerator) {
        conflicts.push(id);
      }
    });
    
    return conflicts;
  }

  // 保存快捷键配置
  async saveShortcutsToConfig(): Promise<void> {
    try {
      const shortcutsConfig: Record<string, any> = {};
      
      this.shortcuts.forEach((shortcut, id) => {
        shortcutsConfig[id] = {
          accelerator: shortcut.accelerator,
          enabled: shortcut.enabled,
        };
      });
      
      await configManager.updateConfig({
        advanced: {
          shortcuts: shortcutsConfig,
        },
      });
    } catch (error) {
      console.error('Failed to save shortcuts to config:', error);
    }
  }

  // 重置快捷键到默认值
  resetShortcutsToDefaults(): void {
    this.unregisterAllShortcuts();
    this.shortcuts.clear();
    this.initializeShortcuts();
    this.registerAllShortcuts();
  }

  // 获取快捷键统计信息
  getShortcutStats(): {
    total: number;
    enabled: number;
    registered: number;
    conflicts: number;
  } {
    const total = this.shortcuts.size;
    const enabled = Array.from(this.shortcuts.values()).filter(s => s.enabled).length;
    const registered = this.registeredShortcuts.size;
    
    // 检查冲突
    const accelerators = Array.from(this.shortcuts.values()).map(s => s.accelerator);
    const uniqueAccelerators = new Set(accelerators);
    const conflicts = accelerators.length - uniqueAccelerators.size;
    
    return {
      total,
      enabled,
      registered,
      conflicts,
    };
  }
}

// 导出单例实例
export const shortcutManager = new ShortcutManager();