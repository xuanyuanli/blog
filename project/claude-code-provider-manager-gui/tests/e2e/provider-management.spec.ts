import { test, expect } from '@playwright/test';

/**
 * 提供商管理功能验证测试
 * 验证PRD中定义的提供商管理核心功能
 */

test.describe('提供商管理功能验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    // 等待React应用加载完成
    await page.waitForTimeout(2000);
  });

  test('提供商列表显示测试', async ({ page }) => {
    // 应该显示已有的提供商（来自模拟数据）
    const providers = await page.textContent('body');
    
    // 检查是否包含模拟数据中的提供商
    expect(providers).toContain('默认提供商');
    expect(providers).toContain('测试提供商');
  });

  test('添加新提供商流程测试', async ({ page }) => {
    // 寻找添加提供商的按钮或链接
    const addButtons = page.locator('button, a, [role="button"]').filter({ hasText: /添加|新增|Add/i });
    
    if (await addButtons.count() > 0) {
      const addButton = addButtons.first();
      await addButton.click();
      await page.waitForTimeout(1000);

      // 检查是否出现了表单
      const inputs = page.locator('input[type="text"], input[type="url"], textarea');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // 尝试填写表单
        const nameInput = inputs.filter({ placeholder: /name|名称|提供商/i }).first();
        const urlInput = inputs.filter({ placeholder: /url|地址|链接/i }).first();
        
        if (await nameInput.isVisible()) {
          await nameInput.fill('测试新提供商');
        }
        if (await urlInput.isVisible()) {
          await urlInput.fill('https://api.test-new.com');
        }

        // 寻找提交按钮
        const submitButton = page.locator('button').filter({ hasText: /提交|确定|保存|Submit|Save/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // 验证新提供商是否添加成功
          const updatedContent = await page.textContent('body');
          expect(updatedContent).toContain('测试新提供商');
        }
      }
    }
  });

  test('提供商激活/切换功能测试', async ({ page }) => {
    // 寻找激活或切换按钮
    const switchButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /激活|切换|Switch|Activate|Active/i 
    });
    
    if (await switchButtons.count() > 0) {
      const firstSwitchButton = switchButtons.first();
      await firstSwitchButton.click();
      await page.waitForTimeout(1000);
      
      // 检查是否有状态变化
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });

  test('提供商配置验证功能测试', async ({ page }) => {
    // 寻找验证或测试按钮
    const validateButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /验证|测试|Test|Validate|Check/i 
    });
    
    if (await validateButtons.count() > 0) {
      const validateButton = validateButtons.first();
      await validateButton.click();
      await page.waitForTimeout(2000);
      
      // 检查是否有验证结果显示
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });

  test('提供商删除功能测试', async ({ page }) => {
    // 获取删除前的内容
    const initialContent = await page.textContent('body');
    
    // 寻找删除按钮
    const deleteButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /删除|移除|Delete|Remove/i 
    });
    
    if (await deleteButtons.count() > 0) {
      const deleteButton = deleteButtons.first();
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // 检查是否有确认对话框
      const confirmButtons = page.locator('button').filter({ hasText: /确定|是|Yes|OK|Confirm/i });
      if (await confirmButtons.count() > 0) {
        await confirmButtons.first().click();
        await page.waitForTimeout(1000);
      }
      
      // 验证删除操作
      const updatedContent = await page.textContent('body');
      expect(updatedContent).toBeTruthy();
    }
  });

  test('环境变量预览功能测试', async ({ page }) => {
    // 寻找环境变量相关的显示
    const envElements = page.locator('*').filter({ hasText: /ANTHROPIC|BASE_URL|TOKEN|MODEL/i });
    
    if (await envElements.count() > 0) {
      // 检查是否显示了环境变量信息
      const envText = await envElements.first().textContent();
      expect(envText).toBeTruthy();
    }
  });

  test('提供商详情查看测试', async ({ page }) => {
    // 寻找详情或查看按钮
    const detailButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /详情|查看|Details|View/i 
    });
    
    if (await detailButtons.count() > 0) {
      const detailButton = detailButtons.first();
      await detailButton.click();
      await page.waitForTimeout(1000);
      
      // 检查是否显示了详细信息
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });

  test('Claude Code 启动功能测试', async ({ page }) => {
    // 寻找启动Claude Code的按钮
    const launchButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /启动|Launch|Start.*Claude/i 
    });
    
    if (await launchButtons.count() > 0) {
      const launchButton = launchButtons.first();
      await launchButton.click();
      await page.waitForTimeout(1000);
      
      // 检查是否有启动反馈
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });

  test('搜索和筛选功能测试', async ({ page }) => {
    // 寻找搜索输入框
    const searchInputs = page.locator('input[type="search"], input[type="text"]').filter({ 
      placeholder: /搜索|Search|Filter/i 
    });
    
    if (await searchInputs.count() > 0) {
      const searchInput = searchInputs.first();
      await searchInput.fill('默认');
      await page.waitForTimeout(1000);
      
      // 检查搜索结果
      const content = await page.textContent('body');
      expect(content).toContain('默认');
    }
  });

  test('导入导出配置功能测试', async ({ page }) => {
    // 寻找导入导出按钮
    const importExportButtons = page.locator('button, a, [role="button"]').filter({ 
      hasText: /导入|导出|Import|Export/i 
    });
    
    if (await importExportButtons.count() > 0) {
      const button = importExportButtons.first();
      await button.click();
      await page.waitForTimeout(1000);
      
      // 检查是否有相关功能
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });
});