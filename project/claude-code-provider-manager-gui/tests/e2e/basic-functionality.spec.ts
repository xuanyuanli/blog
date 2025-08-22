import { test, expect } from '@playwright/test';

/**
 * 基本功能验证测试
 * 只测试核心页面加载和主要功能
 */

test.describe('基本功能验证', () => {
  test.beforeEach(async ({ page }) => {
    // 连接到本地开发服务器
    await page.goto('http://localhost:1420');
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
  });

  test('应用基本加载测试', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/Claude|Provider|Manager/i);
    
    // 检查页面是否包含基本内容
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // 检查是否有React应用根元素
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('基本UI元素存在性测试', async ({ page }) => {
    // 等待React应用加载
    await page.waitForTimeout(2000);
    
    // 检查是否有基本的UI元素（按钮、输入框等）
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // 应该至少有一些按钮
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('检查控制台错误', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 监听控制台错误
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 重新加载页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 过滤掉已知的开发环境错误
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('keytar') && 
      !error.includes('WebSocket') &&
      !error.includes('Failed to fetch') &&
      !error.includes('@tauri-apps/api') &&
      error.toLowerCase().includes('error')
    );
    
    console.log('控制台错误:', criticalErrors);
    
    // 允许少量非关键错误
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('响应式设计基本测试', async ({ page }) => {
    // 测试桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // 测试移动端尺寸
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(rootElement).toBeVisible();
  });

  test('页面导航基本测试', async ({ page }) => {
    // 寻找导航元素
    const navElements = page.locator('nav, [role="navigation"], a, button');
    const navCount = await navElements.count();
    
    if (navCount > 0) {
      // 尝试点击第一个导航元素
      const firstNav = navElements.first();
      if (await firstNav.isVisible()) {
        await firstNav.click();
        await page.waitForTimeout(1000);
        
        // 检查页面是否仍然可访问
        const rootElement = page.locator('#root');
        await expect(rootElement).toBeVisible();
      }
    }
  });

  test('表单元素基本测试', async ({ page }) => {
    // 寻找输入框
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      if (await firstInput.isVisible()) {
        // 尝试在第一个输入框中输入文本
        await firstInput.fill('测试文本');
        
        // 检查值是否被设置
        const value = await firstInput.inputValue();
        expect(value).toBe('测试文本');
      }
    }
  });

  test('模态框或弹窗测试', async ({ page }) => {
    // 寻找可能触发模态框的按钮
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // 尝试点击按钮看是否有模态框
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(500);
          
          // 检查是否出现了模态框
          const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
          if (await modal.isVisible()) {
            // 如果有模态框，尝试关闭它
            const closeButton = modal.locator('button').first();
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    }
  });

  test('基本数据加载测试', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 检查页面是否显示了一些数据或内容
    const textContent = await page.textContent('body');
    
    // 页面应该包含一些有意义的文本
    expect(textContent?.length || 0).toBeGreaterThan(100);
    
    // 检查是否有加载状态或错误状态的指示
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');

    // 加载元素应该不可见（加载完成）
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).not.toBeVisible();
    }
  });
});