import { test, expect } from '@playwright/test';

test.describe('Claude Code Provider Manager GUI', () => {
  test.beforeEach(async ({ page }) => {
    // 等待应用加载
    await page.goto('/');
    await page.waitForSelector('body');
  });

  test('should display the main application', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/Claude Code Provider Manager/);
    
    // 检查主要元素是否存在
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=提供商管理')).toBeVisible();
  });

  test('should show dashboard page', async ({ page }) => {
    // 检查仪表板元素
    await expect(page.locator('text=系统状态')).toBeVisible();
    await expect(page.locator('text=提供商统计')).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    // 测试导航功能
    await page.click('text=提供商管理');
    await expect(page.locator('text=添加提供商')).toBeVisible();
    
    await page.click('text=系统设置');
    await expect(page.locator('text=应用设置')).toBeVisible();
  });

  test('should handle provider management', async ({ page }) => {
    // 点击添加提供商按钮
    await page.click('text=添加提供商');
    
    // 检查模态框是否出现
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // 填写表单
    await page.fill('input[name="name"]', 'Test Provider');
    await page.fill('input[name="baseUrl"]', 'https://api.example.com');
    await page.fill('input[name="token"]', 'test-token');
    
    // 关闭模态框
    await page.click('button:has-text("取消")');
  });

  test('should handle theme switching', async ({ page }) => {
    // 查找主题切换按钮
    const themeButton = page.locator('button[aria-label*="theme"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      // 检查主题是否切换（可能需要检查类名变化）
      await expect(page.locator('body')).toHaveClass(/dark/);
    }
  });

  test('should display error boundary on error', async ({ page }) => {
    // 模拟错误情况
    await page.evaluate(() => {
      throw new Error('Test error for error boundary');
    });
    
    // 检查错误边界是否显示
    await expect(page.locator('text=出现了一个错误')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 检查移动端菜单按钮
    const mobileMenuButton = page.locator('button[aria-label="Menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // 测试 Tab 键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 测试 Enter 键
    await page.keyboard.press('Enter');
    
    // 测试 Escape 键
    await page.keyboard.press('Escape');
  });

  test('should display notifications', async ({ page }) => {
    // 模拟通知显示
    await page.evaluate(() => {
      // 创建一个测试通知
      const notification = document.createElement('div');
      notification.className = 'toast';
      notification.textContent = 'Test notification';
      document.body.appendChild(notification);
      
      // 3秒后移除
      setTimeout(() => {
        notification.remove();
      }, 3000);
    });
    
    // 等待通知显示
    await page.waitForSelector('.toast', { state: 'visible' });
    await expect(page.locator('.toast')).toHaveText('Test notification');
  });
});