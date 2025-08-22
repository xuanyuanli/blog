/**
 * 系统层 Mock
 * 模拟文件系统、系统托盘、快捷键、加密服务等系统相关功能
 */

/**
 * 文件系统 Mock
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  private permissions: Map<string, { read: boolean; write: boolean }> = new Map();

  /**
   * 模拟文件读取
   */
  async readFile(path: string): Promise<string> {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }

    const permission = this.permissions.get(path);
    if (permission && !permission.read) {
      throw new Error(`EACCES: permission denied, open '${path}'`);
    }

    return this.files.get(path)!;
  }

  /**
   * 模拟文件写入
   */
  async writeFile(path: string, content: string): Promise<void> {
    const permission = this.permissions.get(path);
    if (permission && !permission.write) {
      throw new Error(`EACCES: permission denied, open '${path}'`);
    }

    this.files.set(path, content);
    
    // 自动创建目录
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (dir) {
      this.directories.add(dir);
    }
  }

  /**
   * 模拟文件删除
   */
  async deleteFile(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }

    this.files.delete(path);
  }

  /**
   * 模拟文件存在检查
   */
  exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  /**
   * 模拟目录创建
   */
  async mkdir(path: string): Promise<void> {
    this.directories.add(path);
  }

  /**
   * 模拟文件权限设置
   */
  setPermissions(path: string, permissions: { read: boolean; write: boolean }) {
    this.permissions.set(path, permissions);
  }

  /**
   * 重置文件系统
   */
  reset() {
    this.files.clear();
    this.directories.clear();
    this.permissions.clear();
  }

  /**
   * 获取所有文件
   */
  getAllFiles() {
    return Array.from(this.files.keys());
  }
}

/**
 * 系统托盘 Mock
 */
export class MockSystemTray {
  private isVisible = false;
  private tooltip = '';
  private iconPath = '';
  private contextMenu: any = null;
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * 显示托盘图标
   */
  show() {
    this.isVisible = true;
    this.emit('show');
  }

  /**
   * 隐藏托盘图标
   */
  hide() {
    this.isVisible = false;
    this.emit('hide');
  }

  /**
   * 设置工具提示
   */
  setToolTip(tooltip: string) {
    this.tooltip = tooltip;
  }

  /**
   * 设置图标
   */
  setImage(iconPath: string) {
    this.iconPath = iconPath;
  }

  /**
   * 设置右键菜单
   */
  setContextMenu(menu: any) {
    this.contextMenu = menu;
  }

  /**
   * 添加事件监听器
   */
  on(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * 模拟点击事件
   */
  simulateClick() {
    this.emit('click');
  }

  /**
   * 模拟右键点击
   */
  simulateRightClick() {
    this.emit('right-click');
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isVisible: this.isVisible,
      tooltip: this.tooltip,
      iconPath: this.iconPath,
      hasContextMenu: this.contextMenu !== null,
    };
  }
}

/**
 * 快捷键管理 Mock
 */
export class MockShortcutManager {
  private registeredShortcuts: Map<string, Function> = new Map();
  private isEnabled = true;

  /**
   * 注册快捷键
   */
  register(accelerator: string, callback: Function): boolean {
    if (this.registeredShortcuts.has(accelerator)) {
      return false; // 快捷键已被注册
    }

    this.registeredShortcuts.set(accelerator, callback);
    return true;
  }

  /**
   * 取消注册快捷键
   */
  unregister(accelerator: string): boolean {
    return this.registeredShortcuts.delete(accelerator);
  }

  /**
   * 取消注册所有快捷键
   */
  unregisterAll() {
    this.registeredShortcuts.clear();
  }

  /**
   * 检查快捷键是否已注册
   */
  isRegistered(accelerator: string): boolean {
    return this.registeredShortcuts.has(accelerator);
  }

  /**
   * 模拟快捷键触发
   */
  simulateShortcut(accelerator: string) {
    if (!this.isEnabled) return;
    
    const callback = this.registeredShortcuts.get(accelerator);
    if (callback) {
      callback();
    }
  }

  /**
   * 启用/禁用快捷键
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 获取所有注册的快捷键
   */
  getRegisteredShortcuts() {
    return Array.from(this.registeredShortcuts.keys());
  }
}

/**
 * 加密服务 Mock
 */
export class MockEncryptionService {
  private key = 'mock-encryption-key';

  /**
   * 加密数据
   */
  async encrypt(data: string): Promise<string> {
    // 简单的模拟加密（实际不安全，仅用于测试）
    const encoded = Buffer.from(data).toString('base64');
    return `encrypted:${encoded}`;
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!encryptedData.startsWith('encrypted:')) {
      throw new Error('Invalid encrypted data format');
    }

    const encoded = encryptedData.substring('encrypted:'.length);
    return Buffer.from(encoded, 'base64').toString();
  }

  /**
   * 生成密钥
   */
  generateKey(): string {
    return 'mock-key-' + Math.random().toString(36).substring(2);
  }

  /**
   * 设置加密密钥
   */
  setKey(key: string) {
    this.key = key;
  }

  /**
   * 验证加密数据
   */
  isEncrypted(data: string): boolean {
    return data.startsWith('encrypted:');
  }
}

/**
 * 平台特定功能 Mock
 */
export class MockPlatformServices {
  private platform: 'win32' | 'darwin' | 'linux' = 'win32';
  private autoStartEnabled = false;
  private fileAssociations: Map<string, string> = new Map();
  private protocols: Set<string> = new Set();

  /**
   * 设置平台
   */
  setPlatform(platform: 'win32' | 'darwin' | 'linux') {
    this.platform = platform;
  }

  /**
   * 获取平台
   */
  getPlatform() {
    return this.platform;
  }

  /**
   * 设置开机自启动
   */
  setAutoStart(enabled: boolean): boolean {
    this.autoStartEnabled = enabled;
    return true;
  }

  /**
   * 检查开机自启动状态
   */
  getAutoStartStatus(): boolean {
    return this.autoStartEnabled;
  }

  /**
   * 注册文件关联
   */
  registerFileAssociation(extension: string, appPath: string): boolean {
    this.fileAssociations.set(extension, appPath);
    return true;
  }

  /**
   * 取消文件关联
   */
  unregisterFileAssociation(extension: string): boolean {
    return this.fileAssociations.delete(extension);
  }

  /**
   * 注册协议处理器
   */
  registerProtocolHandler(protocol: string): boolean {
    this.protocols.add(protocol);
    return true;
  }

  /**
   * 取消协议处理器
   */
  unregisterProtocolHandler(protocol: string): boolean {
    return this.protocols.delete(protocol);
  }

  /**
   * 获取注册的文件关联
   */
  getFileAssociations() {
    return Array.from(this.fileAssociations.entries());
  }

  /**
   * 获取注册的协议
   */
  getProtocols() {
    return Array.from(this.protocols);
  }

  /**
   * 模拟系统通知
   */
  showNotification(title: string, body: string, icon?: string) {
    // 在测试环境中记录通知而不是实际显示
    return {
      title,
      body,
      icon,
      timestamp: Date.now(),
    };
  }
}

/**
 * 创建系统层 Mock 工厂
 */
export function createSystemMocks() {
  const fileSystem = new MockFileSystem();
  const systemTray = new MockSystemTray();
  const shortcutManager = new MockShortcutManager();
  const encryptionService = new MockEncryptionService();
  const platformServices = new MockPlatformServices();

  return {
    fileSystem,
    systemTray,
    shortcutManager,
    encryptionService,
    platformServices,

    // 重置所有 Mock
    reset: () => {
      fileSystem.reset();
      shortcutManager.unregisterAll();
      shortcutManager.setEnabled(true);
      systemTray.hide();
      encryptionService.setKey('mock-encryption-key');
      platformServices.setPlatform('win32');
      platformServices.setAutoStart(false);
    },

    // 预设场景
    scenarios: {
      // Windows 环境
      windows: () => {
        platformServices.setPlatform('win32');
        platformServices.setAutoStart(true);
        systemTray.show();
        shortcutManager.register('Ctrl+Shift+C', () => {});
      },

      // macOS 环境
      macos: () => {
        platformServices.setPlatform('darwin');
        platformServices.setAutoStart(true);
        systemTray.show();
        shortcutManager.register('Cmd+Shift+C', () => {});
      },

      // Linux 环境
      linux: () => {
        platformServices.setPlatform('linux');
        platformServices.setAutoStart(false);
        systemTray.show();
        shortcutManager.register('Ctrl+Shift+C', () => {});
      },

      // 权限受限环境
      restricted: () => {
        fileSystem.setPermissions('/restricted/file.json', { read: false, write: false });
        platformServices.setAutoStart(false);
        shortcutManager.setEnabled(false);
      },
    },
  };
}

// 默认导出
export default createSystemMocks();