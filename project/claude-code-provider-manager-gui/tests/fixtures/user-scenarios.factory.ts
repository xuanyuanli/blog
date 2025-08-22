/**
 * 用户场景测试数据工厂
 * 提供各种用户使用场景的测试数据
 */

import { AppConfig } from '@/types';
import { createDefaultConfig, createConfigWithProviders } from './configurations.factory';
import { createValidProvider, createProviderWithSecrets } from './providers.factory';

/**
 * 首次使用用户场景
 */
export function createFirstTimeUser(): {
  config: AppConfig;
  workflow: Array<{ step: string; description: string; expectedOutcome: string }>;
} {
  return {
    config: createDefaultConfig(),
    workflow: [
      {
        step: 'app_launch',
        description: '用户首次启动应用',
        expectedOutcome: '显示欢迎界面和引导',
      },
      {
        step: 'add_first_provider',
        description: '用户添加第一个 Provider',
        expectedOutcome: '成功创建 Provider 并自动激活',
      },
      {
        step: 'validate_provider',
        description: '验证 Provider 配置',
        expectedOutcome: '显示验证过程和结果',
      },
      {
        step: 'launch_claude_code',
        description: '启动 Claude Code',
        expectedOutcome: 'Claude Code 成功启动，环境变量正确设置',
      },
    ],
  };
}

/**
 * 资深用户场景
 */
export function createPowerUser(): {
  config: AppConfig;
  workflow: Array<{ step: string; description: string; expectedOutcome: string }>;
} {
  const config = createConfigWithProviders(5);
  
  // 设置为高级用户配置
  config.settings.autoValidate = true;
  config.settings.autoStart = true;
  config.ui.behavior.autoRefresh = true;
  config.ui.behavior.rememberLastProvider = true;
  config.ui.appearance.compactMode = true;
  config.advanced.debugMode = true;
  
  return {
    config,
    workflow: [
      {
        step: 'quick_launch',
        description: '应用快速启动（已配置自动启动）',
        expectedOutcome: '应用在后台快速启动，最小化到托盘',
      },
      {
        step: 'bulk_operations',
        description: '批量管理多个 Provider',
        expectedOutcome: '支持批量验证、导入/导出配置',
      },
      {
        step: 'advanced_settings',
        description: '使用高级设置和自定义环境变量',
        expectedOutcome: '正确应用高级配置，支持调试模式',
      },
      {
        step: 'keyboard_shortcuts',
        description: '使用快捷键快速切换 Provider',
        expectedOutcome: '快捷键响应正常，Provider 切换流畅',
      },
      {
        step: 'system_integration',
        description: '使用系统集成功能（托盘、开机启动）',
        expectedOutcome: '系统集成功能正常工作',
      },
    ],
  };
}

/**
 * 迁移用户场景
 */
export function createMigrationUser(): {
  oldConfig: any;
  newConfig: AppConfig;
  workflow: Array<{ step: string; description: string; expectedOutcome: string }>;
} {
  const oldConfig = {
    // 模拟旧版本配置格式
    providers: [
      {
        id: 'legacy-1',
        name: 'Legacy Provider',
        endpoint: 'https://api.anthropic.com', // 旧字段名
        apiKey: 'sk-ant-legacy-key',
        model: 'claude-v1',
        active: true,
      }
    ],
    settings: {
      theme: 'light',
      lang: 'en', // 旧字段名
      autoValidation: true, // 旧字段名
    },
  };
  
  const newConfig = createDefaultConfig();
  newConfig.providers = [
    createValidProvider({
      name: 'Migrated Provider',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-sonnet-20240229',
      isActive: true,
    })
  ];
  
  return {
    oldConfig,
    newConfig,
    workflow: [
      {
        step: 'detect_old_config',
        description: '检测到旧版本配置文件',
        expectedOutcome: '显示迁移提示和备份选项',
      },
      {
        step: 'backup_config',
        description: '备份旧配置',
        expectedOutcome: '成功创建配置备份文件',
      },
      {
        step: 'migrate_data',
        description: '迁移配置数据',
        expectedOutcome: '正确转换数据格式，保持功能一致性',
      },
      {
        step: 'validate_migration',
        description: '验证迁移结果',
        expectedOutcome: '所有 Provider 正常工作，设置保持一致',
      },
      {
        step: 'cleanup_old_files',
        description: '清理旧文件（可选）',
        expectedOutcome: '提供清理选项，保留备份',
      },
    ],
  };
}

/**
 * 问题用户场景（用于错误处理测试）
 */
export function createProblematicUser(): {
  config: AppConfig;
  scenarios: Array<{
    name: string;
    trigger: string;
    expectedError: string;
    recovery: string;
  }>;
} {
  const config = createConfigWithProviders(3);
  
  // 添加一些有问题的 Provider
  config.providers.push(
    createValidProvider({
      name: 'Problematic Provider',
      baseUrl: 'https://invalid-url.example.com',
      isActive: false,
    }),
    createProviderWithSecrets({
      name: 'Corrupted Provider',
      // 模拟损坏的数据
    } as any)
  );
  
  return {
    config,
    scenarios: [
      {
        name: 'invalid_provider',
        trigger: '用户添加无效的 Provider URL',
        expectedError: 'Provider 验证失败，显示具体错误信息',
        recovery: '提供修正建议，允许用户重新编辑',
      },
      {
        name: 'network_issues',
        trigger: '网络连接问题导致验证失败',
        expectedError: '显示网络错误，提供重试选项',
        recovery: '自动重试机制，或手动重试按钮',
      },
      {
        name: 'corrupted_config',
        trigger: '配置文件损坏',
        expectedError: '检测到配置损坏，提示恢复选项',
        recovery: '从备份恢复或重置为默认配置',
      },
      {
        name: 'permission_denied',
        trigger: '系统权限不足',
        expectedError: '显示权限错误，提供解决方案',
        recovery: '提示用户授权或以管理员身份运行',
      },
      {
        name: 'claude_code_not_found',
        trigger: 'Claude Code 未安装或路径错误',
        expectedError: '检测到 Claude Code 不可用',
        recovery: '提供安装指导或手动设置路径',
      },
    ],
  };
}

/**
 * 企业用户场景
 */
export function createEnterpriseUser(): {
  config: AppConfig;
  workflow: Array<{ step: string; description: string; expectedOutcome: string }>;
} {
  const config = createConfigWithProviders(20); // 大量 Provider
  
  // 企业级安全设置
  config.security = {
    encryptSensitiveData: true,
    requireConfirmationForDelete: true,
    requireConfirmationForSwitch: true,
    clearClipboardOnExit: true,
    logSensitiveOperations: true,
    sessionTimeout: 900000, // 15分钟
  };
  
  // 企业级网络设置
  config.advanced.networkSettings = {
    proxyEnabled: true,
    timeout: 60000,
    retryAttempts: 5,
    retryDelay: 2000,
  };
  
  // 禁用遥测
  config.settings.telemetry = false;
  
  return {
    config,
    workflow: [
      {
        step: 'centralized_management',
        description: '集中管理大量 Provider',
        expectedOutcome: '支持分组、搜索、批量操作',
      },
      {
        step: 'security_compliance',
        description: '符合企业安全要求',
        expectedOutcome: '数据加密、访问控制、审计日志',
      },
      {
        step: 'proxy_support',
        description: '通过企业代理访问 API',
        expectedOutcome: '代理配置正常工作，支持认证',
      },
      {
        step: 'configuration_deployment',
        description: '批量部署配置到多台机器',
        expectedOutcome: '支持配置模板和批量导入',
      },
      {
        step: 'monitoring_logging',
        description: '监控和日志记录',
        expectedOutcome: '详细的操作日志和性能监控',
      },
    ],
  };
}

/**
 * 开发者用户场景
 */
export function createDeveloperUser(): {
  config: AppConfig;
  workflow: Array<{ step: string; description: string; expectedOutcome: string }>;
} {
  const config = createConfigWithProviders(10);
  
  // 开发者特定设置
  config.advanced.debugMode = true;
  config.advanced.logLevel = 'debug';
  config.ui.behavior.autoRefresh = false; // 手动控制
  config.settings.autoValidate = false; // 手动验证
  
  // 自定义环境变量
  config.advanced.customEnvironment = {
    CLAUDE_DEBUG: 'true',
    CLAUDE_LOG_LEVEL: 'debug',
    CUSTOM_API_ENDPOINT: 'https://api-dev.example.com',
  };
  
  return {
    config,
    workflow: [
      {
        step: 'development_setup',
        description: '设置开发环境',
        expectedOutcome: '启用调试模式，详细日志输出',
      },
      {
        step: 'api_testing',
        description: '测试不同的 API 配置',
        expectedOutcome: '支持快速切换和测试不同 Provider',
      },
      {
        step: 'custom_environments',
        description: '使用自定义环境变量',
        expectedOutcome: '正确设置和应用自定义环境变量',
      },
      {
        step: 'debugging_issues',
        description: '调试 API 连接问题',
        expectedOutcome: '详细的错误信息和调试输出',
      },
      {
        step: 'automation_scripting',
        description: '通过 CLI 或 API 自动化操作',
        expectedOutcome: '支持脚本化管理和集成',
      },
    ],
  };
}

/**
 * 创建用户场景测试套件
 */
export function createUserScenarioTestSuite(): {
  firstTime: ReturnType<typeof createFirstTimeUser>;
  power: ReturnType<typeof createPowerUser>;
  migration: ReturnType<typeof createMigrationUser>;
  problematic: ReturnType<typeof createProblematicUser>;
  enterprise: ReturnType<typeof createEnterpriseUser>;
  developer: ReturnType<typeof createDeveloperUser>;
} {
  return {
    firstTime: createFirstTimeUser(),
    power: createPowerUser(),
    migration: createMigrationUser(),
    problematic: createProblematicUser(),
    enterprise: createEnterpriseUser(),
    developer: createDeveloperUser(),
  };
}