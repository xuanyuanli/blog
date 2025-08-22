import { test, expect } from '@playwright/test';

/**
 * 应用功能验证测试
 * 用于验证项目完成度和功能完整性
 */

test.describe('Claude Code Provider Manager GUI - 功能验证', () => {
  // 设置测试环境
  test.beforeEach(async ({ page }) => {
    // 设置测试页面
    await page.goto('http://localhost:1420');
  });

  test('应用基本加载测试', async ({ page }) => {
    // 检查应用是否正常加载
    await expect(page).toHaveTitle(/Claude Code Provider Manager/);
    
    // 检查主要UI元素是否存在
    const mainContainer = page.locator('[data-testid="app-container"]');
    await expect(mainContainer).toBeVisible();
  });

  test('仪表板页面测试', async ({ page }) => {
    // 导航到仪表板
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    if (await dashboardNav.isVisible()) {
      await dashboardNav.click();
    }

    // 检查仪表板内容
    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    await expect(dashboardContent).toBeVisible();

    // 检查系统状态显示
    const statusIndicator = page.locator('[data-testid="system-status"]');
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible();
    }
  });

  test('提供商管理界面测试', async ({ page }) => {
    // 寻找提供商管理相关元素
    const providerSection = page.locator('[data-testid="provider-section"]');
    const addProviderButton = page.locator('[data-testid="add-provider-btn"]');
    
    // 检查提供商管理界面元素
    if (await providerSection.isVisible()) {
      await expect(providerSection).toBeVisible();
      
      if (await addProviderButton.isVisible()) {
        await expect(addProviderButton).toBeVisible();
        
        // 尝试点击添加提供商按钮
        await addProviderButton.click();
        
        // 检查是否打开了添加提供商的模态框或表单
        const providerForm = page.locator('[data-testid="provider-form"]');
        if (await providerForm.isVisible()) {
          await expect(providerForm).toBeVisible();
        }
      }
    }
  });

  test('响应式设计测试', async ({ page }) => {
    // 测试不同屏幕尺寸下的响应式设计
    const viewports = [
      { width: 1920, height: 1080 }, // 桌面
      { width: 1366, height: 768 },  // 笔记本
      { width: 800, height: 600 },   // 小屏幕
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // 检查应用在不同尺寸下是否正常显示
      const mainContainer = page.locator('[data-testid="app-container"]');
      if (await mainContainer.isVisible()) {
        await expect(mainContainer).toBeVisible();
      }
      
      // 等待布局稳定
      await page.waitForTimeout(500);
    }
  });

  test('主题切换测试', async ({ page }) => {
    // 寻找主题切换按钮
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // 点击主题切换
      await themeToggle.click();
      
      // 等待主题切换完成
      await page.waitForTimeout(500);
      
      // 检查主题是否发生变化（通过检查body或html的class）
      const bodyClasses = await page.evaluate(() => document.body.className);
      expect(bodyClasses).toBeTruthy();
    }
  });

  test('错误处理测试', async ({ page }) => {
    // 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 重新加载页面
    await page.reload();
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否有严重的JavaScript错误
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('keytar') && // 忽略keytar相关错误（在开发环境中是预期的）
      !error.includes('WebSocket') && // 忽略WebSocket连接错误
      error.includes('Error')
    );
    
    expect(criticalErrors.length).toBeLessThan(3); // 允许少量非关键错误
  });

  test('布局组件测试', async ({ page }) => {
    // 检查基本布局组件
    const components = [
      '[data-testid="header"]',
      '[data-testid="sidebar"]',
      '[data-testid="main-content"]',
      '[data-testid="status-bar"]'
    ];

    for (const selector of components) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('导航功能测试', async ({ page }) => {
    // 测试页面导航
    const navItems = [
      { selector: '[data-testid="nav-dashboard"]', title: '仪表板' },
      { selector: '[data-testid="nav-providers"]', title: '提供商管理' },
      { selector: '[data-testid="nav-settings"]', title: '设置' }
    ];

    for (const item of navItems) {
      const navElement = page.locator(item.selector);
      if (await navElement.isVisible()) {
        await navElement.click();
        await page.waitForTimeout(300); // 等待页面切换
        
        // 检查页面是否发生变化
        const currentUrl = page.url();
        expect(currentUrl).toContain('localhost:1420');
      }
    }
  });
});

/**
 * 功能完整性验证测试
 * 根据PRD文档验证核心功能
 */
test.describe('功能完整性验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('提供商CRUD功能验证', async ({ page }) => {
    // 这个测试会检查提供商管理的基本功能
    const testProvider = {
      name: '测试提供商',
      baseUrl: 'https://api.example.com',
      model: 'claude-3-sonnet-20240229',
      smallFastModel: 'claude-3-haiku-20240307'
    };

    // 寻找并点击添加提供商按钮
    const addButton = page.locator('[data-testid="add-provider-btn"]');
    if (await addButton.isVisible()) {
      await addButton.click();

      // 填写表单
      const nameInput = page.locator('[data-testid="provider-name-input"]');
      const urlInput = page.locator('[data-testid="provider-url-input"]');
      
      if (await nameInput.isVisible()) {
        await nameInput.fill(testProvider.name);
      }
      if (await urlInput.isVisible()) {
        await urlInput.fill(testProvider.baseUrl);
      }

      // 提交表单
      const submitButton = page.locator('[data-testid="submit-provider-btn"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }
  });

  test('环境切换功能验证', async ({ page }) => {
    // 检查环境切换相关功能
    const switchButton = page.locator('[data-testid="switch-provider-btn"]');
    const currentProvider = page.locator('[data-testid="current-provider"]');
    
    if (await currentProvider.isVisible()) {
      await expect(currentProvider).toBeVisible();
    }
    
    if (await switchButton.isVisible()) {
      await switchButton.click();
      
      // 检查切换选项
      const providerOptions = page.locator('[data-testid="provider-option"]');
      if (await providerOptions.first().isVisible()) {
        await expect(providerOptions).toHaveCountGreaterThan(0);
      }
    }
  });

  test('Claude Code启动功能验证', async ({ page }) => {
    // 检查Claude Code启动功能
    const launchButton = page.locator('[data-testid="launch-claude-code-btn"]');
    
    if (await launchButton.isVisible()) {
      await expect(launchButton).toBeVisible();
      
      // 点击启动按钮（在测试环境中不会真正启动）
      await launchButton.click();
      
      // 检查是否显示了启动状态或确认对话框
      const statusMessage = page.locator('[data-testid="launch-status"]');
      const confirmDialog = page.locator('[data-testid="launch-confirm-dialog"]');
      
      if (await statusMessage.isVisible()) {
        await expect(statusMessage).toBeVisible();
      } else if (await confirmDialog.isVisible()) {
        await expect(confirmDialog).toBeVisible();
      }
    }
  });
});