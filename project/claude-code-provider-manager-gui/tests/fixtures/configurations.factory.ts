/**
 * 配置文件测试数据工厂
 * 提供各种配置场景的测试数据
 */

import { AppConfig, Settings } from '@/types';
import { createValidProvider, createLargeDatasetProviders } from './providers.factory';

/**
 * 创建默认配置
 */
export function createDefaultConfig(): AppConfig {
  return {
    providers: [],
    settings: {
      theme: 'system',
      language: 'zh-CN',
      autoValidate: true,
      autoStart: false,
      startMinimized: false,
      closeToTray: true,
      startupArgs: [],
      updateCheck: true,
      telemetry: false,
    },
    security: {
      encryptSensitiveData: true,
      requireConfirmationForDelete: true,
      requireConfirmationForSwitch: true,
      clearClipboardOnExit: false,
      logSensitiveOperations: true,
      sessionTimeout: 3600000, // 1小时
    },
    ui: {
      notifications: {
        enabled: true,
        showValidationResults: true,
        showProviderSwitch: true,
        showLaunchStatus: true,
        showErrors: true,
        soundEnabled: false,
      },
      appearance: {
        fontSize: 'medium',
        fontFamily: 'system-ui',
        accentColor: '#3b82f6',
        compactMode: false,
        showStatusBar: true,
        showSidebar: true,
      },
      behavior: {
        autoHideSidebar: false,
        autoRefresh: true,
        refreshInterval: 30000,
        rememberLastProvider: true,
        confirmOnExit: false,
      },
    },
    advanced: {
      debugMode: false,
      logLevel: 'info',
      maxLogFiles: 10,
      logRetentionDays: 30,
      customEnvironment: {},
      networkSettings: {
        proxyEnabled: false,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
    },
  };
}

/**
 * 创建包含多个 Provider 的配置
 */
export function createConfigWithProviders(providerCount: number = 3): AppConfig {
  const config = createDefaultConfig();
  
  config.providers = [
    createValidProvider({
      name: 'Primary Provider',
      isActive: true,
    }),
    ...createLargeDatasetProviders(providerCount - 1),
  ];
  
  return config;
}

/**
 * 创建损坏的配置 (用于错误恢复测试)
 */
export function createCorruptedConfig(type: 'invalid-json' | 'missing-fields' | 'wrong-types' = 'invalid-json'): any {
  const base = createDefaultConfig();
  
  switch (type) {
    case 'invalid-json':
      return '{ "providers": [invalid json'; // 无效JSON
    
    case 'missing-fields':
      return {
        // 缺少必要字段
        providers: base.providers,
        // settings 字段缺失
      };
    
    case 'wrong-types':
      return {
        providers: 'not-an-array', // 错误的数据类型
        settings: {
          theme: 123, // 应该是字符串
          autoValidate: 'true', // 应该是布尔值
        },
      };
    
    default:
      return base;
  }
}

/**
 * 创建历史版本配置 (用于迁移测试)
 */
export function createLegacyConfig(version: 'v1.0' | 'v1.1' | 'v1.2' = 'v1.0'): any {
  switch (version) {
    case 'v1.0':
      return {
        providers: [
          {
            id: 'legacy-1',
            name: 'Legacy Provider',
            endpoint: 'https://api.anthropic.com', // 旧字段名
            apiKey: 'legacy-key', // 旧的认证方式
            model: 'claude-v1',
            active: true, // 旧字段名
          }
        ],
        settings: {
          theme: 'light',
          lang: 'en', // 旧字段名
          autoValidation: true, // 旧字段名
        },
      };
    
    case 'v1.1':
      return {
        providers: [
          {
            id: 'legacy-2',
            name: 'Legacy Provider v1.1',
            baseUrl: 'https://api.anthropic.com',
            authToken: 'bearer-token',
            model: 'claude-v1.3',
            smallModel: 'claude-instant-v1', // 旧字段名
            isActive: true,
          }
        ],
        settings: {
          theme: 'dark',
          language: 'en-US',
          autoValidate: true,
          notifications: true, // 简化的通知设置
        },
      };
    
    case 'v1.2':
      return {
        ...createDefaultConfig(),
        version: '1.2.0', // 版本信息
        providers: [
          createValidProvider({
            // v1.2 还没有 smallFastModel 字段
            smallFastModel: undefined,
          } as any)
        ],
      };
    
    default:
      return createDefaultConfig();
  }
}

/**
 * 创建压力测试配置
 */
export function createStressTestConfig(): AppConfig {
  const config = createDefaultConfig();
  
  // 大量 Provider
  config.providers = createLargeDatasetProviders(1000);
  
  // 复杂的自定义环境变量
  config.advanced.customEnvironment = {};
  for (let i = 0; i < 100; i++) {
    config.advanced.customEnvironment[`CUSTOM_VAR_${i}`] = `value-${i}`.repeat(100);
  }
  
  return config;
}

/**
 * 创建各种主题配置
 */
export function createThemeConfigs(): {
  light: AppConfig;
  dark: AppConfig;
  system: AppConfig;
  highContrast: AppConfig;
} {
  const base = createDefaultConfig();
  
  return {
    light: {
      ...base,
      settings: {
        ...base.settings,
        theme: 'light',
      },
      ui: {
        ...base.ui,
        appearance: {
          ...base.ui.appearance,
          accentColor: '#2563eb',
        },
      },
    },
    
    dark: {
      ...base,
      settings: {
        ...base.settings,
        theme: 'dark',
      },
      ui: {
        ...base.ui,
        appearance: {
          ...base.ui.appearance,
          accentColor: '#3b82f6',
        },
      },
    },
    
    system: {
      ...base,
      settings: {
        ...base.settings,
        theme: 'system',
      },
    },
    
    highContrast: {
      ...base,
      settings: {
        ...base.settings,
        theme: 'dark',
      },
      ui: {
        ...base.ui,
        appearance: {
          ...base.ui.appearance,
          accentColor: '#ffff00',
          fontSize: 'large',
        },
      },
    },
  };
}

/**
 * 创建安全配置测试数据
 */
export function createSecurityConfigs(): {
  high: AppConfig;
  medium: AppConfig;
  low: AppConfig;
  custom: AppConfig;
} {
  const base = createDefaultConfig();
  
  return {
    high: {
      ...base,
      security: {
        encryptSensitiveData: true,
        requireConfirmationForDelete: true,
        requireConfirmationForSwitch: true,
        clearClipboardOnExit: true,
        logSensitiveOperations: true,
        sessionTimeout: 900000, // 15分钟
      },
    },
    
    medium: {
      ...base,
      security: {
        encryptSensitiveData: true,
        requireConfirmationForDelete: true,
        requireConfirmationForSwitch: false,
        clearClipboardOnExit: false,
        logSensitiveOperations: true,
        sessionTimeout: 3600000, // 1小时
      },
    },
    
    low: {
      ...base,
      security: {
        encryptSensitiveData: false,
        requireConfirmationForDelete: false,
        requireConfirmationForSwitch: false,
        clearClipboardOnExit: false,
        logSensitiveOperations: false,
        sessionTimeout: 86400000, // 24小时
      },
    },
    
    custom: {
      ...base,
      security: {
        encryptSensitiveData: true,
        requireConfirmationForDelete: false,
        requireConfirmationForSwitch: true,
        clearClipboardOnExit: true,
        logSensitiveOperations: false,
        sessionTimeout: 7200000, // 2小时
      },
    },
  };
}

/**
 * 创建网络配置测试数据
 */
export function createNetworkConfigs(): {
  default: AppConfig;
  proxy: AppConfig;
  slowNetwork: AppConfig;
  unreliableNetwork: AppConfig;
} {
  const base = createDefaultConfig();
  
  return {
    default: base,
    
    proxy: {
      ...base,
      advanced: {
        ...base.advanced,
        networkSettings: {
          proxyEnabled: true,
          timeout: 60000,
          retryAttempts: 5,
          retryDelay: 2000,
        },
      },
    },
    
    slowNetwork: {
      ...base,
      advanced: {
        ...base.advanced,
        networkSettings: {
          proxyEnabled: false,
          timeout: 120000, // 2分钟
          retryAttempts: 3,
          retryDelay: 5000,
        },
      },
    },
    
    unreliableNetwork: {
      ...base,
      advanced: {
        ...base.advanced,
        networkSettings: {
          proxyEnabled: false,
          timeout: 30000,
          retryAttempts: 10, // 多次重试
          retryDelay: 1000,
        },
      },
    },
  };
}