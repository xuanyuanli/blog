import { contextBridge, ipcRenderer } from 'electron';
import type { 
  AppConfig, 
  ProviderConfig, 
  ValidationResult, 
  LaunchConfig, 
  LaunchResult 
} from '../main/config/ConfigManager';

// 暴露给渲染进程的 API
const electronAPI = {
  // 配置管理
  config: {
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (updates: Partial<AppConfig>) => ipcRenderer.invoke('update-config', updates),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    exportConfig: () => ipcRenderer.invoke('export-config'),
    importConfig: () => ipcRenderer.invoke('import-config'),
  },

  // 提供商管理
  providers: {
    getProviders: () => ipcRenderer.invoke('get-providers'),
    getActiveProvider: () => ipcRenderer.invoke('get-active-provider'),
    addProvider: (providerData: Omit<ProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => 
      ipcRenderer.invoke('add-provider', providerData),
    updateProvider: (id: string, updates: Partial<ProviderConfig>) => 
      ipcRenderer.invoke('update-provider', id, updates),
    deleteProvider: (id: string) => ipcRenderer.invoke('delete-provider', id),
    switchProvider: (id: string) => ipcRenderer.invoke('switch-provider', id),
    validateProvider: (id: string) => ipcRenderer.invoke('validate-provider', id),
  },

  // Claude Code 启动
  claudeCode: {
    launch: (config: LaunchConfig) => ipcRenderer.invoke('launch-claude-code', config),
  },

  // 安全功能
  security: {
    storeEncryptedData: (key: string, data: any) => 
      ipcRenderer.invoke('store-encrypted-data', key, data),
    getEncryptedData: (key: string) => ipcRenderer.invoke('get-encrypted-data', key),
    encryptData: (data: string) => ipcRenderer.invoke('encrypt-data', data),
    decryptData: (encryptedData: string) => ipcRenderer.invoke('decrypt-data', encryptedData),
  },

  // 系统功能
  system: {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    showDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('show-dialog', options),
    showFileDialog: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('show-file-dialog', options),
    showSaveDialog: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('show-save-dialog', options),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    showNotification: (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => 
      ipcRenderer.invoke('show-notification', title, body, type),
    setAutoStart: (enabled: boolean) => ipcRenderer.invoke('set-auto-start', enabled),
  },

  // UI 功能
  ui: {
    setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('set-theme', theme),
    setLanguage: (language: string) => ipcRenderer.invoke('set-language', language),
    refreshUI: () => ipcRenderer.invoke('refresh-ui'),
    toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools'),
  },

  // 文件操作
  files: {
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
    fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
    getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
  },

  // 网络功能
  network: {
    testConnection: (url: string) => ipcRenderer.invoke('test-network-connection', url),
    getNetworkStatus: () => ipcRenderer.invoke('get-network-status'),
  },

  // 事件监听
  events: {
    on: (channel: string, callback: (data: any) => void) => {
      const validChannels = [
        'deep-link',
        'deep-link-provider',
        'deep-link-settings',
        'deep-link-launch',
        'system-suspend',
        'system-resume',
        'power-source-change',
        'global-shortcut-new-provider',
        'global-shortcut-quick-launch',
        'menu-new-provider',
        'menu-import-config',
        'menu-export-config',
        'menu-validate-provider',
        'menu-launch-claude-code',
        'menu-open-settings',
        'menu-open-docs',
        'menu-report-issue',
        'menu-check-update',
        'menu-about',
      ];

      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, data) => callback(data));
      } else {
        console.warn(`Invalid event channel: ${channel}`);
      }
    },

    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },

    once: (channel: string, callback: (data: any) => void) => {
      const validChannels = [
        'deep-link',
        'deep-link-provider',
        'deep-link-settings',
        'deep-link-launch',
        'system-suspend',
        'system-resume',
        'power-source-change',
        'global-shortcut-new-provider',
        'global-shortcut-quick-launch',
        'menu-new-provider',
        'menu-import-config',
        'menu-export-config',
        'menu-validate-provider',
        'menu-launch-claude-code',
        'menu-open-settings',
        'menu-open-docs',
        'menu-report-issue',
        'menu-check-update',
        'menu-about',
      ];

      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, data) => callback(data));
      } else {
        console.warn(`Invalid event channel: ${channel}`);
      }
    },
  },
};

// 类型定义
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 开发时的一些便利函数
if (process.env.NODE_ENV === 'development') {
  // 添加调试信息
  console.log('Electron API exposed:', Object.keys(electronAPI));
  
  // 添加全局错误处理
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
  
  // 添加未处理的 Promise 错误处理
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

// 安全检查：确保没有敏感信息泄露
const secureContextCheck = () => {
  // 检查是否有敏感的全局变量
  const sensitiveKeys = ['apiKey', 'secret', 'token', 'password', 'auth'];
  const globalKeys = Object.keys(window);
  
  for (const key of globalKeys) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      console.warn(`Potential sensitive global variable detected: ${key}`);
    }
  }
  
  // 检查 localStorage 和 sessionStorage
  const storageKeys = [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ];
  
  for (const key of storageKeys) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      console.warn(`Potential sensitive storage key detected: ${key}`);
    }
  }
};

// 执行安全检查
secureContextCheck();

// 提供一些工具函数
const utils = {
  // 生成唯一 ID
  generateId: () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // 节流函数
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // 格式化文件大小
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // 格式化日期
  formatDate: (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },
  
  // 验证 URL
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // 验证邮箱
  isValidEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

// 暴露工具函数到全局作用域
contextBridge.exposeInMainWorld('utils', utils);

// 导出类型（用于 TypeScript）
export type ElectronAPI = typeof electronAPI;
export type Utils = typeof utils;