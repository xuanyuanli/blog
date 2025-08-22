/**
 * End-to-End Tests - User Workflows
 * 端到端用户工作流程测试
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用程序
    await page.goto('http://localhost:1420'); // Tauri开发服务器默认端口
    
    // 等待应用程序加载
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    
    // 检查是否有欢迎向导或初始设置
    const welcomeModal = page.locator('[data-testid="welcome-modal"]');
    if (await welcomeModal.isVisible()) {
      await page.click('[data-testid="welcome-close"]');
    }
  });

  test('complete provider management workflow', async ({ page }) => {
    // 步骤1: 添加新的provider
    await page.click('[data-testid="add-provider-button"]');
    
    // 等待表单出现
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 填写provider信息
    await page.fill('[data-testid="provider-name-input"]', 'E2E Test Provider');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', 'sk-ant-test-token-12345');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    await page.fill('[data-testid="provider-description-textarea"]', 'E2E测试创建的Provider');
    
    // 提交表单
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证provider已添加到列表
    await page.waitForSelector('[data-testid="provider-card"]:has-text("E2E Test Provider")');
    
    const providerCard = page.locator('[data-testid="provider-card"]:has-text("E2E Test Provider")');
    await expect(providerCard).toBeVisible();
    await expect(providerCard.locator('[data-testid="provider-url"]')).toContainText('api.anthropic.com');
    
    // 步骤2: 验证provider连接
    await providerCard.locator('[data-testid="validate-button"]').click();
    
    // 等待验证完成（可能失败，但应该显示状态）
    await page.waitForTimeout(2000);
    
    const validationStatus = providerCard.locator('[data-testid="validation-status"]');
    await expect(validationStatus).toBeVisible();
    
    // 步骤3: 编辑provider
    await providerCard.locator('[data-testid="edit-button"]').click();
    
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 修改描述
    await page.fill('[data-testid="provider-description-textarea"]', 'E2E测试修改后的描述');
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证修改生效
    await page.waitForSelector('[data-testid="provider-card"]:has-text("E2E测试修改后的描述")');
    
    // 步骤4: 激活provider
    await providerCard.locator('[data-testid="activate-button"]').click();
    
    // 确认激活
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
    if (await confirmDialog.isVisible()) {
      await page.click('[data-testid="confirm-yes"]');
    }
    
    // 验证provider已激活
    await expect(providerCard.locator('[data-testid="active-badge"]')).toBeVisible();
    
    // 步骤5: 启动Claude Code（模拟）
    await page.click('[data-testid="launch-claude-code-button"]');
    
    // 等待启动状态更新
    await page.waitForTimeout(1000);
    
    const launchStatus = page.locator('[data-testid="launch-status"]');
    await expect(launchStatus).toBeVisible();
    
    // 步骤6: 删除provider
    await providerCard.locator('[data-testid="delete-button"]').click();
    
    // 确认删除
    const deleteDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await expect(deleteDialog).toBeVisible();
    await page.fill('[data-testid="delete-confirmation-input"]', 'E2E Test Provider');
    await page.click('[data-testid="delete-confirm-button"]');
    
    // 验证provider已删除
    await page.waitForSelector('[data-testid="provider-card"]:has-text("E2E Test Provider")', { 
      state: 'detached',
      timeout: 5000 
    });
  });

  test('configuration import/export workflow', async ({ page }) => {
    // 步骤1: 添加几个测试providers
    const testProviders = [
      {
        name: 'Export Test Provider 1',
        url: 'https://api.anthropic.com',
        model: 'claude-3-sonnet-20240229',
      },
      {
        name: 'Export Test Provider 2', 
        url: 'https://api.openai.com/v1',
        model: 'gpt-4',
      },
    ];
    
    for (const provider of testProviders) {
      await page.click('[data-testid="add-provider-button"]');
      await page.waitForSelector('[data-testid="provider-form"]');
      
      await page.fill('[data-testid="provider-name-input"]', provider.name);
      await page.fill('[data-testid="provider-url-input"]', provider.url);
      await page.fill('[data-testid="provider-token-input"]', 'test-token');
      await page.selectOption('[data-testid="provider-model-select"]', provider.model);
      
      await page.click('[data-testid="provider-form-submit"]');
      await page.waitForSelector(`[data-testid="provider-card"]:has-text("${provider.name}")`);
    }
    
    // 步骤2: 导出配置
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    
    await page.click('[data-testid="export-config-button"]');
    
    // 等待下载开始
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-confirm-button"]');
    const download = await downloadPromise;
    
    // 验证下载的文件名
    expect(download.suggestedFilename()).toMatch(/claude-providers-config-\d+\.json/);
    
    // 步骤3: 清除现有配置
    await page.click('[data-testid="clear-all-button"]');
    const clearDialog = page.locator('[data-testid="clear-confirm-dialog"]');
    await page.fill('[data-testid="clear-confirmation-input"]', 'CLEAR ALL');
    await page.click('[data-testid="clear-confirm-button"]');
    
    // 验证所有providers已清除
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="provider-card"]')).toHaveCount(0);
    
    // 步骤4: 导入配置
    await page.click('[data-testid="import-config-button"]');
    
    // 模拟文件上传
    const configData = {
      providers: testProviders.map((provider, i) => ({
        id: `imported-${i}`,
        name: provider.name,
        baseUrl: provider.url,
        authToken: 'imported-token',
        model: provider.model,
        isActive: false,
        createdAt: new Date().toISOString(),
      })),
      settings: {
        theme: 'dark',
        language: 'zh-CN',
      },
    };
    
    const configFile = JSON.stringify(configData, null, 2);
    
    // 上传配置文件
    const fileInput = page.locator('[data-testid="config-file-input"]');
    await fileInput.setInputFiles({
      name: 'test-config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(configFile),
    });
    
    await page.click('[data-testid="import-confirm-button"]');
    
    // 验证配置已导入
    await page.waitForSelector('[data-testid="import-success-message"]');
    
    // 关闭设置对话框
    await page.click('[data-testid="settings-close"]');
    
    // 验证providers已恢复
    for (const provider of testProviders) {
      await expect(page.locator(`[data-testid="provider-card"]:has-text("${provider.name}")`)).toBeVisible();
    }
  });

  test('settings and preferences workflow', async ({ page }) => {
    // 打开设置
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    
    // 步骤1: 修改主题设置
    const themeSelect = page.locator('[data-testid="theme-select"]');
    await themeSelect.selectOption('dark');
    
    // 验证主题变更生效
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    
    // 步骤2: 修改语言设置
    const languageSelect = page.locator('[data-testid="language-select"]');
    await languageSelect.selectOption('en-US');
    
    // 验证语言变更（检查某些文本）
    await expect(page.locator('[data-testid="settings-title"]')).toContainText(/Settings|设置/);
    
    // 步骤3: 配置启动参数
    await page.click('[data-testid="advanced-settings-tab"]');
    
    const startupArgsInput = page.locator('[data-testid="startup-args-input"]');
    await startupArgsInput.fill('--verbose --log-level=debug');
    
    // 步骤4: 环境变量配置
    await page.click('[data-testid="add-env-var-button"]');
    
    const envVarRows = page.locator('[data-testid="env-var-row"]');
    const lastRow = envVarRows.last();
    
    await lastRow.locator('[data-testid="env-var-name"]').fill('CLAUDE_DEBUG');
    await lastRow.locator('[data-testid="env-var-value"]').fill('true');
    
    // 步骤5: 保存设置
    await page.click('[data-testid="settings-save-button"]');
    
    // 验证保存成功
    await page.waitForSelector('[data-testid="settings-saved-toast"]');
    await page.click('[data-testid="settings-close"]');
    
    // 步骤6: 验证设置持久化
    // 重新打开设置验证设置已保存
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('dark');
    await expect(page.locator('[data-testid="language-select"]')).toHaveValue('en-US');
    
    await page.click('[data-testid="advanced-settings-tab"]');
    await expect(page.locator('[data-testid="startup-args-input"]')).toHaveValue('--verbose --log-level=debug');
    
    // 验证环境变量
    const envVarRow = page.locator('[data-testid="env-var-row"]:has([data-testid="env-var-name"][value="CLAUDE_DEBUG"])');
    await expect(envVarRow.locator('[data-testid="env-var-value"]')).toHaveValue('true');
  });

  test('error handling and recovery workflow', async ({ page }) => {
    // 步骤1: 测试无效provider添加
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 提交空表单
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证错误显示
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="url-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
    
    // 填写无效URL
    await page.fill('[data-testid="provider-name-input"]', 'Invalid Provider');
    await page.fill('[data-testid="provider-url-input"]', 'not-a-valid-url');
    await page.fill('[data-testid="provider-token-input"]', 'short');
    
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证URL和token错误
    await expect(page.locator('[data-testid="url-error"]')).toContainText(/invalid|format/i);
    await expect(page.locator('[data-testid="token-error"]')).toContainText(/length|invalid/i);
    
    // 关闭表单
    await page.click('[data-testid="provider-form-cancel"]');
    
    // 步骤2: 测试网络错误处理
    // 模拟网络离线
    await page.context().setOffline(true);
    
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', 'Offline Test');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', 'sk-ant-valid-token');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证网络错误处理
    await page.waitForSelector('[data-testid="network-error-toast"]');
    await expect(page.locator('[data-testid="network-error-toast"]')).toContainText(/network|offline|connection/i);
    
    // 恢复网络
    await page.context().setOffline(false);
    
    // 步骤3: 测试重试机制
    await page.click('[data-testid="retry-button"]');
    
    // 验证重试后成功
    await page.waitForSelector('[data-testid="provider-card"]:has-text("Offline Test")');
    
    // 步骤4: 测试应用程序崩溃恢复
    // 模拟应用程序重启
    await page.reload();
    await page.waitForSelector('[data-testid="app-container"]');
    
    // 验证数据恢复
    await expect(page.locator('[data-testid="provider-card"]:has-text("Offline Test")')).toBeVisible();
    
    // 步骤5: 测试自动保存功能
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', 'Auto Save Test');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.openai.com/v1');
    
    // 等待自动保存（如果有）
    await page.waitForTimeout(1000);
    
    // 刷新页面测试草稿保存
    await page.reload();
    await page.waitForSelector('[data-testid="app-container"]');
    
    // 检查是否有草稿恢复提示
    const draftRecovery = page.locator('[data-testid="draft-recovery-dialog"]');
    if (await draftRecovery.isVisible()) {
      await page.click('[data-testid="recover-draft-button"]');
      
      // 验证草稿内容恢复
      await page.waitForSelector('[data-testid="provider-form"]');
      await expect(page.locator('[data-testid="provider-name-input"]')).toHaveValue('Auto Save Test');
      await expect(page.locator('[data-testid="provider-url-input"]')).toHaveValue('https://api.openai.com/v1');
    }
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    // 步骤1: 测试键盘导航
    // 使用Tab键导航到添加按钮
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 验证焦点在添加按钮上
    const addButton = page.locator('[data-testid="add-provider-button"]');
    await expect(addButton).toBeFocused();
    
    // 使用Enter键打开表单
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 步骤2: 表单中的键盘导航
    const nameInput = page.locator('[data-testid="provider-name-input"]');
    await expect(nameInput).toBeFocused();
    
    await page.keyboard.type('Accessibility Test Provider');
    await page.keyboard.press('Tab');
    
    const urlInput = page.locator('[data-testid="provider-url-input"]');
    await expect(urlInput).toBeFocused();
    
    await page.keyboard.type('https://api.anthropic.com');
    await page.keyboard.press('Tab');
    
    // 继续Tab导航
    await page.keyboard.type('sk-ant-test-token');
    await page.keyboard.press('Tab');
    
    // 在select中使用键盘
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // 步骤3: 使用Escape关闭表单
    await page.keyboard.press('Escape');
    
    // 验证表单关闭
    await expect(page.locator('[data-testid="provider-form"]')).not.toBeVisible();
    
    // 步骤4: 测试ARIA属性
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 验证表单有正确的ARIA属性
    const form = page.locator('[data-testid="provider-form"]');
    await expect(form).toHaveAttribute('role', 'form');
    await expect(form).toHaveAttribute('aria-labelledby');
    
    // 验证输入框有正确的标签
    await expect(nameInput).toHaveAttribute('aria-required', 'true');
    await expect(nameInput).toHaveAttribute('aria-describedby');
    
    // 步骤5: 测试屏幕阅读器支持
    // 验证重要元素有适当的ARIA标签
    const providerCards = page.locator('[data-testid="provider-card"]');
    if (await providerCards.count() > 0) {
      const firstCard = providerCards.first();
      await expect(firstCard).toHaveAttribute('role', 'article');
      await expect(firstCard).toHaveAttribute('aria-labelledby');
    }
    
    // 验证按钮有适当的标签
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const innerText = await button.innerText();
      
      // 按钮应该有可访问的名称
      expect(ariaLabel || innerText).toBeTruthy();
    }
  });

  test('performance and responsiveness', async ({ page }) => {
    // 步骤1: 测试应用启动性能
    const startTime = Date.now();
    await page.goto('http://localhost:1420');
    await page.waitForSelector('[data-testid="app-container"]');
    const loadTime = Date.now() - startTime;
    
    console.log(`App load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5秒内加载完成
    
    // 步骤2: 测试大量数据渲染性能
    // 创建多个providers来测试性能
    const providerCount = 20;
    
    for (let i = 0; i < providerCount; i++) {
      await page.click('[data-testid="add-provider-button"]');
      await page.waitForSelector('[data-testid="provider-form"]');
      
      await page.fill('[data-testid="provider-name-input"]', `Performance Test ${i}`);
      await page.fill('[data-testid="provider-url-input"]', `https://api-${i}.example.com`);
      await page.fill('[data-testid="provider-token-input"]', `token-${i}`);
      await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
      
      const submitStart = Date.now();
      await page.click('[data-testid="provider-form-submit"]');
      await page.waitForSelector(`[data-testid="provider-card"]:has-text("Performance Test ${i}")`);
      const submitTime = Date.now() - submitStart;
      
      console.log(`Provider ${i} creation time: ${submitTime}ms`);
      expect(submitTime).toBeLessThan(1000); // 每个provider创建在1秒内
    }
    
    // 步骤3: 测试滚动性能
    const providerList = page.locator('[data-testid="provider-list"]');
    
    // 记录滚动性能
    const scrollStart = Date.now();
    await providerList.scrollIntoView();
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, -1000);
    const scrollTime = Date.now() - scrollStart;
    
    console.log(`Scroll performance: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(1000);
    
    // 步骤4: 测试搜索性能（如果有搜索功能）
    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.isVisible()) {
      const searchStart = Date.now();
      await searchInput.fill('Performance Test 5');
      await page.waitForTimeout(300); // 等待搜索去抖
      const searchTime = Date.now() - searchStart;
      
      console.log(`Search performance: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(500);
      
      // 验证搜索结果
      const visibleCards = page.locator('[data-testid="provider-card"]:visible');
      const cardCount = await visibleCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // 清除搜索
      await searchInput.clear();
      await page.waitForTimeout(100);
    }
    
    // 步骤5: 清理测试数据
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    await page.click('[data-testid="clear-all-button"]');
    
    const clearDialog = page.locator('[data-testid="clear-confirm-dialog"]');
    await page.fill('[data-testid="clear-confirmation-input"]', 'CLEAR ALL');
    await page.click('[data-testid="clear-confirm-button"]');
    
    await page.waitForSelector('[data-testid="empty-state"]');
  });
});

test.describe('Cross-Platform Compatibility', () => {
  test('should work consistently across different window sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // 桌面大屏
      { width: 1366, height: 768 },  // 桌面标准
      { width: 1024, height: 768 },  // 小屏桌面
      { width: 800, height: 600 },   // 最小支持分辨率
    ];
    
    for (const viewport of viewports) {
      console.log(`Testing viewport: ${viewport.width}x${viewport.height}`);
      
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:1420');
      await page.waitForSelector('[data-testid="app-container"]');
      
      // 验证基本布局
      const appContainer = page.locator('[data-testid="app-container"]');
      const containerBox = await appContainer.boundingBox();
      
      expect(containerBox?.width).toBeLessThanOrEqual(viewport.width);
      expect(containerBox?.height).toBeLessThanOrEqual(viewport.height);
      
      // 验证添加按钮可见
      await expect(page.locator('[data-testid="add-provider-button"]')).toBeVisible();
      
      // 在小屏幕上测试响应式菜单
      if (viewport.width < 1024) {
        const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        }
      }
    }
  });
});