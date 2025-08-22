/**
 * Mock 策略统一导出和管理
 */

import networkMocks from './network-layer.mock';
import systemMocks from './system-layer.mock';
import externalApiMocks from './external-api.mock';

// 导出各层级 Mock
export { default as networkMocks } from './network-layer.mock';
export { default as systemMocks } from './system-layer.mock';
export { default as externalApiMocks } from './external-api.mock';

// 导出具体的 Mock 类
export { 
  MockHttpClient, 
  MockWebSocket, 
  MockNetworkStatus 
} from './network-layer.mock';

export {
  MockFileSystem,
  MockSystemTray,
  MockShortcutManager,
  MockEncryptionService,
  MockPlatformServices
} from './system-layer.mock';

export {
  MockClaudeApiServer,
  MockProviderValidationService,
  MockClaudeCodeLauncher,
  ErrorInjector
} from './external-api.mock';

/**
 * 全局 Mock 管理器
 */
export class MockManager {
  private static instance: MockManager;

  private constructor() {}

  static getInstance(): MockManager {
    if (!MockManager.instance) {
      MockManager.instance = new MockManager();
    }
    return MockManager.instance;
  }

  /**
   * 初始化所有 Mock
   */
  initialize() {
    // 启动外部 API Mock 服务
    externalApiMocks.startAll();
    
    // 设置默认场景
    this.setupDefaultScenario();
  }

  /**
   * 重置所有 Mock
   */
  reset() {
    networkMocks.reset();
    systemMocks.reset();
    externalApiMocks.reset();
  }

  /**
   * 设置测试场景
   */
  setScenario(scenario: TestScenario) {
    this.reset();
    
    switch (scenario) {
      case 'normal':
        this.setupNormalScenario();
        break;
      case 'offline':
        this.setupOfflineScenario();
        break;
      case 'slow-network':
        this.setupSlowNetworkScenario();
        break;
      case 'error-prone':
        this.setupErrorProneScenario();
        break;
      case 'claude-code-missing':
        this.setupClaudeCodeMissingScenario();
        break;
      case 'security-restricted':
        this.setupSecurityRestrictedScenario();
        break;
      default:
        this.setupDefaultScenario();
    }
  }

  /**
   * 默认场景
   */
  private setupDefaultScenario() {
    networkMocks.scenarios.normal();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.normal();
  }

  /**
   * 正常场景
   */
  private setupNormalScenario() {
    networkMocks.scenarios.normal();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.normal();
  }

  /**
   * 离线场景
   */
  private setupOfflineScenario() {
    networkMocks.scenarios.offline();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.apiUnavailable();
  }

  /**
   * 慢速网络场景
   */
  private setupSlowNetworkScenario() {
    networkMocks.scenarios.slow();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.highLatency();
  }

  /**
   * 错误频发场景
   */
  private setupErrorProneScenario() {
    networkMocks.scenarios.unstable();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.errorProne();
  }

  /**
   * Claude Code 缺失场景
   */
  private setupClaudeCodeMissingScenario() {
    networkMocks.scenarios.normal();
    systemMocks.scenarios.windows();
    externalApiMocks.scenarios.claudeCodeMissing();
  }

  /**
   * 安全受限场景
   */
  private setupSecurityRestrictedScenario() {
    networkMocks.scenarios.normal();
    systemMocks.scenarios.restricted();
    externalApiMocks.scenarios.normal();
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      network: networkMocks.networkStatus.getStatus(),
      systemTray: systemMocks.systemTray.getStatus(),
      shortcuts: systemMocks.shortcutManager.getRegisteredShortcuts(),
      fileAssociations: systemMocks.platformServices.getFileAssociations(),
      protocols: systemMocks.platformServices.getProtocols(),
      claudeCodeInstalled: externalApiMocks.claudeCodeLauncher.isClaudeCodeInstalled(),
    };
  }
}

/**
 * 测试场景类型
 */
export type TestScenario = 
  | 'normal'
  | 'offline'
  | 'slow-network'
  | 'error-prone'
  | 'claude-code-missing'
  | 'security-restricted';

/**
 * Mock 环境配置
 */
export interface MockEnvironmentConfig {
  scenario: TestScenario;
  networkDelay?: number;
  errorRate?: number;
  platform?: 'win32' | 'darwin' | 'linux';
  claudeCodeInstalled?: boolean;
  autoStart?: boolean;
}

/**
 * 配置 Mock 环境
 */
export function configureMockEnvironment(config: MockEnvironmentConfig) {
  const manager = MockManager.getInstance();
  
  // 设置基础场景
  manager.setScenario(config.scenario);
  
  // 自定义配置
  if (config.networkDelay !== undefined) {
    networkMocks.httpClient.setNetworkDelay(config.networkDelay);
  }
  
  if (config.errorRate !== undefined) {
    networkMocks.httpClient.setFailureRate(config.errorRate);
  }
  
  if (config.platform) {
    systemMocks.platformServices.setPlatform(config.platform);
  }
  
  if (config.claudeCodeInstalled !== undefined) {
    externalApiMocks.claudeCodeLauncher.setInstalled(config.claudeCodeInstalled);
  }
  
  if (config.autoStart !== undefined) {
    systemMocks.platformServices.setAutoStart(config.autoStart);
  }
}

/**
 * 获取全局 Mock 管理器实例
 */
export const mockManager = MockManager.getInstance();

// 默认导出
export default {
  networkMocks,
  systemMocks,
  externalApiMocks,
  MockManager,
  mockManager,
  configureMockEnvironment,
};