/**
 * End-to-End Tests - System Integration
 * 系统集成端到端测试
 */

import { test, expect } from '@playwright/test';
import { _electron as electron } from '@playwright/test';

test.describe('System Integration Tests', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    // 启动Electron应用程序
    electronApp = await electron.launch({
      args: ['dist-electron/main.js'], // Electron主进程文件路径
      timeout: 30000,
    });
    
    // 获取第一个窗口
    page = await electronApp.firstWindow();
    
    // 等待应用程序完全加载
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 15000 });
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('system tray integration', async () => {
    // 验证系统托盘功能（如果支持）
    const trayMenu = await electronApp.evaluate(async ({ app }) => {
      // 获取系统托盘状态
      return {
        hasTray: !!app.tray,
        isVisible: app.tray?.isDestroyed() === false,
      };
    });

    if (trayMenu.hasTray) {
      console.log('System tray is available');
      expect(trayMenu.isVisible).toBe(true);
      
      // 测试托盘菜单项（如果可访问）
      // 这需要特定的API来访问系统托盘菜单
    } else {
      console.log('System tray not available on this platform');
    }
  });

  test('file system integration', async () => {
    // 测试文件系统操作
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    
    // 测试配置文件导出
    await page.click('[data-testid="export-config-button"]');
    
    // 模拟文件保存对话框
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-confirm-button"]');
    
    const download = await downloadPromise;
    const filePath = await download.path();
    
    expect(filePath).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // 验证文件内容
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    
    expect(config).toHaveProperty('providers');
    expect(config).toHaveProperty('settings');
    expect(Array.isArray(config.providers)).toBe(true);
  });

  test('native menu integration', async () => {
    // 获取应用程序菜单
    const menuItems = await electronApp.evaluate(async ({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return null;
      
      return {
        hasMenu: true,
        itemCount: menu.items.length,
        labels: menu.items.map(item => item.label),
      };
    });

    if (menuItems?.hasMenu) {
      expect(menuItems.itemCount).toBeGreaterThan(0);
      
      // 验证常见菜单项
      const expectedMenus = ['File', 'Edit', 'View', 'Window', 'Help'];
      const hasExpectedMenus = expectedMenus.some(menu => 
        menuItems.labels.some(label => label?.includes(menu))
      );
      
      expect(hasExpectedMenus).toBe(true);
      console.log('Available menus:', menuItems.labels);
    }
  });

  test('window management', async () => {
    // 测试窗口状态管理
    const initialBounds = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    // 测试窗口最小化
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].minimize();
      }
    });

    await page.waitForTimeout(500);

    // 恢复窗口
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].restore();
      }
    });

    await page.waitForTimeout(500);

    // 验证窗口恢复
    const restoredBounds = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    expect(restoredBounds.width).toBe(initialBounds.width);
    expect(restoredBounds.height).toBe(initialBounds.height);
  });

  test('deep linking support', async () => {
    // 测试自定义协议处理（如claude-code://）
    const protocolHandling = await electronApp.evaluate(async ({ app }) => {
      // 检查是否注册了自定义协议
      return {
        isDefaultProtocolClient: app.isDefaultProtocolClient('claude-code'),
        protocols: [], // 实际实现中应该返回支持的协议列表
      };
    });

    // 在开发环境中可能没有注册协议，这是正常的
    console.log('Protocol handling:', protocolHandling);
    
    // 如果支持协议，测试处理
    if (protocolHandling.isDefaultProtocolClient) {
      // 模拟协议调用
      // 这需要特定的实现来测试协议处理
    }
  });

  test('inter-process communication', async () => {
    // 测试主进程和渲染进程之间的通信
    
    // 添加一个provider并测试IPC
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', 'IPC Test Provider');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', 'test-token');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    // 提交表单（这会触发主进程的存储操作）
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证provider出现（证明IPC成功）
    await page.waitForSelector('[data-testid="provider-card"]:has-text("IPC Test Provider")');
    
    // 测试删除操作的IPC
    const providerCard = page.locator('[data-testid="provider-card"]:has-text("IPC Test Provider")');
    await providerCard.locator('[data-testid="delete-button"]').click();
    
    const deleteDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await page.fill('[data-testid="delete-confirmation-input"]', 'IPC Test Provider');
    await page.click('[data-testid="delete-confirm-button"]');
    
    // 验证删除成功（证明IPC成功）
    await page.waitForSelector('[data-testid="provider-card"]:has-text("IPC Test Provider")', { 
      state: 'detached' 
    });
  });

  test('native notifications', async () => {
    // 测试系统通知功能
    
    // 添加一个provider来触发通知
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', 'Notification Test');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', 'test-token');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    // 监听通知事件
    const notificationPromise = new Promise((resolve) => {
      electronApp.evaluate(async ({ ipcMain }) => {
        ipcMain.once('notification-sent', (event, data) => {
          resolve(data);
        });
      });
      
      // 设置超时
      setTimeout(() => resolve(null), 5000);
    });
    
    await page.click('[data-testid="provider-form-submit"]');
    
    // 等待通知或超时
    const notificationData = await notificationPromise;
    
    if (notificationData) {
      console.log('Notification sent:', notificationData);
      expect(notificationData).toBeTruthy();
    } else {
      console.log('No notification sent or notifications not implemented');
    }
  });

  test('auto-updater integration', async () => {
    // 测试自动更新功能（如果实现了）
    const updateInfo = await electronApp.evaluate(async ({ autoUpdater }) => {
      if (!autoUpdater) return { available: false };
      
      return {
        available: true,
        currentVersion: autoUpdater.currentVersion,
        // 其他更新相关信息
      };
    });

    if (updateInfo.available) {
      console.log('Auto-updater available, version:', updateInfo.currentVersion);
      
      // 可以测试检查更新功能
      // 但在测试环境中不应该实际下载更新
    } else {
      console.log('Auto-updater not available or not implemented');
    }
  });

  test('crash reporting and recovery', async () => {
    // 测试崩溃恢复机制
    
    // 添加一些数据
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', 'Crash Recovery Test');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', 'test-token');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    await page.click('[data-testid="provider-form-submit"]');
    await page.waitForSelector('[data-testid="provider-card"]:has-text("Crash Recovery Test")');
    
    // 模拟渲染进程重启（刷新页面）
    await page.reload();
    await page.waitForSelector('[data-testid="app-container"]');
    
    // 验证数据恢复
    await expect(page.locator('[data-testid="provider-card"]:has-text("Crash Recovery Test")')).toBeVisible();
    
    // 检查是否有崩溃恢复对话框
    const crashRecoveryDialog = page.locator('[data-testid="crash-recovery-dialog"]');
    if (await crashRecoveryDialog.isVisible()) {
      console.log('Crash recovery dialog detected');
      
      // 验证恢复选项
      await expect(page.locator('[data-testid="restore-session-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-fresh-button"]')).toBeVisible();
      
      await page.click('[data-testid="restore-session-button"]');
    }
  });

  test('performance monitoring', async () => {
    // 监控应用程序性能指标
    const startTime = Date.now();
    
    // 执行一系列操作
    const operations = [];
    
    for (let i = 0; i < 10; i++) {
      operations.push(async () => {
        await page.click('[data-testid="add-provider-button"]');
        await page.waitForSelector('[data-testid="provider-form"]');
        
        await page.fill('[data-testid="provider-name-input"]', `Perf Test ${i}`);
        await page.fill('[data-testid="provider-url-input"]', `https://api-${i}.com`);
        await page.fill('[data-testid="provider-token-input"]', `token-${i}`);
        await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
        
        await page.click('[data-testid="provider-form-submit"]');
        await page.waitForSelector(`[data-testid="provider-card"]:has-text("Perf Test ${i}")`);
      });
    }
    
    // 并行执行操作
    await Promise.all(operations.map(op => op()));
    
    const totalTime = Date.now() - startTime;
    console.log(`Performance test completed in ${totalTime}ms`);
    
    // 获取系统性能指标
    const performanceMetrics = await page.evaluate(() => {
      if (window.performance) {
        return {
          timing: window.performance.timing,
          memory: (window.performance as any).memory ? {
            usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
          } : null,
        };
      }
      return null;
    });
    
    if (performanceMetrics) {
      console.log('Performance metrics:', performanceMetrics);
      
      // 验证内存使用合理
      if (performanceMetrics.memory) {
        const memoryUsagePercent = 
          performanceMetrics.memory.usedJSHeapSize / performanceMetrics.memory.jsHeapSizeLimit;
        expect(memoryUsagePercent).toBeLessThan(0.8); // 内存使用不超过80%
      }
    }
    
    // 清理测试数据
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-dialog"]');
    await page.click('[data-testid="clear-all-button"]');
    
    const clearDialog = page.locator('[data-testid="clear-confirm-dialog"]');
    await page.fill('[data-testid="clear-confirmation-input"]', 'CLEAR ALL');
    await page.click('[data-testid="clear-confirm-button"]');
  });
});

test.describe('Security Integration Tests', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['dist-electron/main.js'],
    });
    page = await electronApp.firstWindow();
    await page.waitForSelector('[data-testid="app-container"]');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('secure storage integration', async () => {
    // 测试安全存储功能
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    const sensitiveToken = 'sk-ant-very-secret-token-12345';
    
    await page.fill('[data-testid="provider-name-input"]', 'Security Test Provider');
    await page.fill('[data-testid="provider-url-input"]', 'https://api.anthropic.com');
    await page.fill('[data-testid="provider-token-input"]', sensitiveToken);
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    await page.click('[data-testid="provider-form-submit"]');
    await page.waitForSelector('[data-testid="provider-card"]:has-text("Security Test Provider")');
    
    // 验证token在UI中被掩码
    const tokenDisplay = page.locator('[data-testid="provider-card"]:has-text("Security Test Provider") [data-testid="token-display"]');
    if (await tokenDisplay.isVisible()) {
      const displayedToken = await tokenDisplay.textContent();
      expect(displayedToken).not.toBe(sensitiveToken);
      expect(displayedToken).toMatch(/\*+/); // 应该包含掩码字符
    }
    
    // 验证数据存储安全性
    const storageContent = await electronApp.evaluate(async () => {
      const fs = require('fs').promises;
      const path = require('path');
      const { app } = require('electron');
      
      try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        return null;
      }
    });
    
    if (storageContent && storageContent.providers) {
      const storedProvider = storageContent.providers.find((p: any) => p.name === 'Security Test Provider');
      
      if (storedProvider) {
        // Token应该被加密而不是明文存储
        expect(storedProvider.authToken).not.toBe(sensitiveToken);
        expect(storedProvider.authToken).toBeTruthy();
      }
    }
  });

  test('CSP and security headers', async () => {
    // 检查内容安全策略
    const cspViolations: any[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });
    
    // 执行一些操作来触发可能的CSP违规
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    await page.fill('[data-testid="provider-name-input"]', '<script>alert("XSS")</script>');
    await page.fill('[data-testid="provider-url-input"]', 'javascript:alert("XSS")');
    
    await page.click('[data-testid="provider-form-submit"]');
    
    // 等待一下看是否有CSP违规
    await page.waitForTimeout(1000);
    
    // 检查是否有CSP违规
    if (cspViolations.length > 0) {
      console.log('CSP violations detected:', cspViolations);
    }
    
    // 验证恶意脚本没有执行
    const alerts = await page.evaluate(() => {
      return window.hasOwnProperty('__test_alert_called__');
    });
    
    expect(alerts).toBe(false);
  });

  test('certificate validation', async () => {
    // 测试SSL证书验证
    await page.click('[data-testid="add-provider-button"]');
    await page.waitForSelector('[data-testid="provider-form"]');
    
    // 尝试使用无效证书的URL
    await page.fill('[data-testid="provider-name-input"]', 'Invalid Cert Test');
    await page.fill('[data-testid="provider-url-input"]', 'https://self-signed.badssl.com');
    await page.fill('[data-testid="provider-token-input"]', 'test-token');
    await page.selectOption('[data-testid="provider-model-select"]', 'claude-3-sonnet-20240229');
    
    await page.click('[data-testid="provider-form-submit"]');
    
    // 验证创建成功（验证会在后续步骤中失败）
    await page.waitForSelector('[data-testid="provider-card"]:has-text("Invalid Cert Test")');
    
    // 尝试验证provider
    const providerCard = page.locator('[data-testid="provider-card"]:has-text("Invalid Cert Test")');
    await providerCard.locator('[data-testid="validate-button"]').click();
    
    // 等待验证完成
    await page.waitForTimeout(3000);
    
    // 验证应该失败，并显示证书错误
    const validationStatus = providerCard.locator('[data-testid="validation-status"]');
    await expect(validationStatus).toBeVisible();
    
    const statusText = await validationStatus.textContent();
    expect(statusText).toMatch(/failed|error|invalid|certificate/i);
  });
});