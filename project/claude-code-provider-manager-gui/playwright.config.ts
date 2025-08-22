import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 * E2E测试的Playwright配置
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // 全局设置
  timeout: 30 * 1000, // 30秒超时
  expect: {
    timeout: 5000, // 断言超时5秒
  },
  
  // 并行执行配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // CI环境中禁用test.only
  retries: process.env.CI ? 2 : 0, // CI环境中重试2次
  workers: process.env.CI ? 1 : undefined, // CI环境中使用单worker
  
  // 报告配置
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/e2e-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/e2e-junit.xml' 
    }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // 输出配置
  outputDir: 'test-results/e2e-output',
  
  // 全局设置
  use: {
    // 基础URL（当应用运行时）
    baseURL: 'http://localhost:1420',
    
    // 浏览器配置
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    
    // 截图和视频
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 其他设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 忽略HTTPS错误（用于测试自签名证书）
    ignoreHTTPSErrors: true,
    
    // 用户代理
    userAgent: 'Claude Code E2E Test Agent',
    
    // 额外的HTTP头
    extraHTTPHeaders: {
      'X-Test-Runner': 'Playwright',
    },
  },

  // 项目配置 - 不同的测试环境
  projects: [
    // Electron测试（主要测试环境）
    {
      name: 'electron-main',
      testMatch: /.*\.(e2e|spec)\.ts/,
      use: {
        // Electron特定配置
        ...devices['Desktop Chrome'],
      },
    },
    
    // Web版本测试（如果有）
    {
      name: 'chromium-web',
      testMatch: /.*\.web\.e2e\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173', // Vite开发服务器
      },
    },
    
    // 不同浏览器测试
    {
      name: 'webkit-web',
      testMatch: /.*\.web\.e2e\.ts/,
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:5173',
      },
    },
    
    {
      name: 'firefox-web',
      testMatch: /.*\.web\.e2e\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:5173',
      },
    },
    
    // 移动设备模拟（响应式测试）
    {
      name: 'mobile-chrome',
      testMatch: /.*\.mobile\.e2e\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:5173',
      },
    },
    
    {
      name: 'mobile-safari',
      testMatch: /.*\.mobile\.e2e\.ts/,
      use: {
        ...devices['iPhone 12'],
        baseURL: 'http://localhost:5173',
      },
    },
    
    // 性能测试
    {
      name: 'performance',
      testMatch: /.*\.performance\.e2e\.ts/,
      timeout: 60000, // 性能测试需要更长时间
      use: {
        ...devices['Desktop Chrome'],
        // 性能测试特定设置
        video: 'off', // 关闭视频以减少开销
      },
    },
    
    // 可访问性测试
    {
      name: 'accessibility',
      testMatch: /.*\.a11y\.e2e\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // 可访问性测试设置
        reducedMotion: 'reduce',
        forcedColors: 'active',
      },
    },
  ],

  // Web服务器配置
  webServer: [
    {
      command: 'npm run tauri:dev',
      port: 1420,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2分钟启动时间
      env: {
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        NODE_ENV: 'test',
        VITE_E2E_TEST: 'true',
      },
    },
  ],
  
  // 测试匹配模式
  testMatch: [
    '**/tests/e2e/**/*.e2e.{ts,js}',
    '**/tests/e2e/**/*.spec.{ts,js}',
  ],
  
  // 忽略的文件
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-electron/**',
    '**/*.d.ts',
  ],
  
  // 元数据
  metadata: {
    'test-type': 'e2e',
    'app-name': 'Claude Code Provider Manager',
    'test-environment': process.env.NODE_ENV || 'test',
    'platform': process.platform,
    'node-version': process.version,
  },
});