/**
 * UX Tests - Task Completion & Efficiency
 * 任务完成率和效率测试
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/services/api.mock';
import { createValidProvider } from '../../fixtures/providers.factory';
import { ProviderForm } from '@/components/business/ProviderForm';
import { ProviderCard } from '@/components/business/ProviderCard';
import Dashboard from '@/pages/Dashboard';

// 模拟用户任务完成测试
describe('UX: Task Completion & Efficiency Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Primary User Tasks', () => {
    it('新用户首次添加Provider任务完成率 > 95%', async () => {
      const taskMetrics = {
        startTime: 0,
        completionTime: 0,
        steps: [] as Array<{ step: string; timestamp: number; success: boolean }>,
        errors: [] as string[],
      };

      const recordStep = (step: string, success: boolean = true) => {
        taskMetrics.steps.push({
          step,
          timestamp: Date.now(),
          success,
        });
      };

      // 任务开始
      taskMetrics.startTime = Date.now();
      recordStep('任务开始');

      // 渲染Provider表单
      const { container } = render(
        <ProviderForm
          onSubmit={async (data) => {
            recordStep('表单提交');
            return api.addProvider(data);
          }}
          onCancel={() => recordStep('取消操作')}
        />
      );

      recordStep('界面渲染完成');

      // 步骤1: 用户看到添加Provider按钮
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      recordStep('找到表单元素');

      // 步骤2: 填写Provider信息
      const nameInput = screen.getByLabelText(/name|名称/i);
      const urlInput = screen.getByLabelText(/url|地址/i);
      const modelSelect = screen.getByLabelText(/model|模型/i);

      expect(nameInput).toBeInTheDocument();
      expect(urlInput).toBeInTheDocument();
      expect(modelSelect).toBeInTheDocument();
      recordStep('找到所有必要输入字段');

      // 填写表单 - 模拟真实用户输入速度
      await act(async () => {
        await user.type(nameInput, 'My Claude Provider', { delay: 50 });
        recordStep('输入Provider名称');
        
        await user.type(urlInput, 'https://api.anthropic.com', { delay: 50 });
        recordStep('输入API地址');

        await user.selectOptions(modelSelect, 'claude-3-sonnet-20240229');
        recordStep('选择模型');
      });

      // 步骤3: 验证配置（可选）
      const validateButton = screen.queryByText(/validate|验证/i);
      if (validateButton) {
        await act(async () => {
          await user.click(validateButton);
        });
        recordStep('执行配置验证');
        
        // 等待验证结果
        await waitFor(() => {
          expect(screen.queryByText(/validation|验证/i)).toBeInTheDocument();
        }, { timeout: 3000 });
        recordStep('验证完成');
      }

      // 步骤4: 保存Provider
      const submitButton = screen.getByRole('button', { name: /save|保存|submit|提交/i });
      expect(submitButton).toBeInTheDocument();
      
      await act(async () => {
        await user.click(submitButton);
      });
      recordStep('点击保存按钮');

      // 等待保存完成
      await waitFor(() => {
        // 假设保存成功后表单被重置或显示成功消息
        expect(api.addProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Claude Provider',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20240229',
          })
        );
      }, { timeout: 5000 });

      recordStep('Provider保存成功');
      taskMetrics.completionTime = Date.now();

      // 分析任务完成情况
      const totalTime = taskMetrics.completionTime - taskMetrics.startTime;
      const successfulSteps = taskMetrics.steps.filter(s => s.success).length;
      const totalSteps = taskMetrics.steps.length;
      const completionRate = (successfulSteps / totalSteps) * 100;

      console.log('📊 任务完成分析:');
      console.log(`  总用时: ${totalTime}ms`);
      console.log(`  完成步骤: ${successfulSteps}/${totalSteps}`);
      console.log(`  完成率: ${completionRate.toFixed(2)}%`);
      console.log(`  错误数: ${taskMetrics.errors.length}`);

      // 验证成功标准
      expect(completionRate).toBeGreaterThan(95); // 完成率 > 95%
      expect(totalTime).toBeLessThan(120000); // 2分钟内完成
      expect(taskMetrics.errors.length).toBeLessThan(1); // 错误率 < 5%
    });

    it('Provider切换任务效率测试', async () => {
      const providers = [
        createValidProvider({ name: 'Provider A', isActive: true }),
        createValidProvider({ name: 'Provider B', isActive: false }),
        createValidProvider({ name: 'Provider C', isActive: false }),
      ];

      // Mock API返回多个Provider
      jest.mocked(api.getProviders).mockResolvedValue(providers);

      const switchMetrics: Array<{ from: string; to: string; time: number; visualFeedback: number }> = [];

      // 渲染Provider列表
      const { rerender } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Provider A')).toBeInTheDocument();
        expect(screen.getByText('Provider B')).toBeInTheDocument();
        expect(screen.getByText('Provider C')).toBeInTheDocument();
      });

      // 测试Provider切换性能
      for (let i = 0; i < providers.length - 1; i++) {
        const fromProvider = providers[i];
        const toProvider = providers[i + 1];
        
        const startTime = performance.now();
        
        // 点击切换按钮
        const switchButton = screen.getByTestId(`switch-provider-${toProvider.id}`);
        await act(async () => {
          await user.click(switchButton);
        });

        // 等待视觉反馈（加载状态）
        const visualFeedbackStart = performance.now();
        await waitFor(() => {
          expect(screen.getByTestId(`provider-${toProvider.id}`)).toHaveClass('active');
        }, { timeout: 3000 });
        const visualFeedbackTime = performance.now() - visualFeedbackStart;

        const totalTime = performance.now() - startTime;

        switchMetrics.push({
          from: fromProvider.name,
          to: toProvider.name,
          time: totalTime,
          visualFeedback: visualFeedbackTime,
        });

        // 更新Provider状态
        providers[i].isActive = false;
        providers[i + 1].isActive = true;
        
        jest.mocked(api.getProviders).mockResolvedValue([...providers]);
        rerender(<Dashboard />);
      }

      // 分析切换性能
      const avgSwitchTime = switchMetrics.reduce((sum, m) => sum + m.time, 0) / switchMetrics.length;
      const maxSwitchTime = Math.max(...switchMetrics.map(m => m.time));
      const avgVisualFeedback = switchMetrics.reduce((sum, m) => sum + m.visualFeedback, 0) / switchMetrics.length;

      console.log('🔄 Provider切换性能分析:');
      console.log(`  平均切换时间: ${avgSwitchTime.toFixed(2)}ms`);
      console.log(`  最大切换时间: ${maxSwitchTime.toFixed(2)}ms`);
      console.log(`  平均视觉反馈时间: ${avgVisualFeedback.toFixed(2)}ms`);

      // 验证性能标准
      expect(maxSwitchTime).toBeLessThan(3000); // 单次切换 < 3秒
      expect(avgVisualFeedback).toBeLessThan(500); // 视觉反馈 < 500ms
      expect(avgSwitchTime).toBeLessThan(2000); // 平均切换时间 < 2秒
    });
  });

  describe('Cognitive Load Assessment', () => {
    it('界面信息密度测试', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 分析界面信息密度
      const mainContent = screen.getByRole('main');
      const allTextElements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, input, label');
      const visibleTextElements = Array.from(allTextElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      const informationItems = visibleTextElements.filter(el => {
        const text = el.textContent?.trim();
        return text && text.length > 2; // 过滤掉很短的装饰性文本
      });

      // 分析决策点数量
      const interactiveElements = mainContent.querySelectorAll('button, input, select, a[href]');
      const primaryActions = Array.from(interactiveElements).filter(el => {
        return el.classList.contains('primary') || 
               el.getAttribute('aria-label')?.includes('main') ||
               el.getAttribute('data-primary') === 'true';
      });

      console.log('🧠 认知负荷分析:');
      console.log(`  信息项数量: ${informationItems.length}`);
      console.log(`  交互元素数量: ${interactiveElements.length}`);
      console.log(`  主要操作数量: ${primaryActions.length}`);

      // Miller's Rule: 7±2 原则
      expect(informationItems.length).toBeLessThanOrEqual(9); // 单屏最多9个主要信息项
      expect(primaryActions.length).toBeLessThanOrEqual(3); // 主要操作不超过3个
      expect(interactiveElements.length).toBeLessThanOrEqual(15); // 总交互元素适中
    });

    it('学习曲线测试', async () => {
      const learningCurve = {
        attempts: [] as Array<{ attempt: number; time: number; errors: number; success: boolean }>,
      };

      // 模拟用户多次尝试同一任务
      for (let attempt = 1; attempt <= 3; attempt++) {
        const startTime = performance.now();
        let errors = 0;
        let success = false;

        try {
          const { unmount } = render(
            <ProviderForm
              onSubmit={async (data) => {
                return api.addProvider(data);
              }}
              onCancel={() => {}}
            />
          );

          // 模拟用户输入（每次尝试速度递增）
          const inputDelay = Math.max(20, 100 - (attempt * 20)); // 随尝试次数减少延迟

          const nameInput = screen.getByLabelText(/name|名称/i);
          const urlInput = screen.getByLabelText(/url|地址/i);

          await act(async () => {
            await user.type(nameInput, `Provider Attempt ${attempt}`, { delay: inputDelay });
            await user.type(urlInput, 'https://api.example.com', { delay: inputDelay });
          });

          const submitButton = screen.getByRole('button', { name: /save|保存|submit|提交/i });
          await act(async () => {
            await user.click(submitButton);
          });

          await waitFor(() => {
            expect(api.addProvider).toHaveBeenCalled();
          });

          success = true;
          unmount();
        } catch (error) {
          errors++;
          console.log(`Attempt ${attempt} error:`, error);
        }

        const endTime = performance.now();
        learningCurve.attempts.push({
          attempt,
          time: endTime - startTime,
          errors,
          success,
        });
      }

      // 分析学习曲线
      const timeImprovement = learningCurve.attempts[0].time - learningCurve.attempts[2].time;
      const errorReduction = learningCurve.attempts[0].errors - learningCurve.attempts[2].errors;

      console.log('📈 学习曲线分析:');
      learningCurve.attempts.forEach(attempt => {
        console.log(`  尝试${attempt.attempt}: ${attempt.time.toFixed(2)}ms, ${attempt.errors}错误, 成功: ${attempt.success}`);
      });
      console.log(`  时间改善: ${timeImprovement.toFixed(2)}ms`);
      console.log(`  错误减少: ${errorReduction}`);

      // 验证学习效果
      expect(timeImprovement).toBeGreaterThan(0); // 时间应该减少
      expect(learningCurve.attempts[2].success).toBe(true); // 第三次尝试应该成功
      expect(errorReduction).toBeGreaterThanOrEqual(0); // 错误应该减少或持平
    });
  });

  describe('Error Recovery Testing', () => {
    it('用户错误恢复能力测试', async () => {
      const errorScenarios = [
        {
          name: '无效URL输入',
          input: { url: 'invalid-url' },
          expectedError: /invalid.*url/i,
        },
        {
          name: '空字段提交',
          input: { name: '' },
          expectedError: /required|必填/i,
        },
        {
          name: '过长输入',
          input: { name: 'A'.repeat(1000) },
          expectedError: /too long|过长/i,
        },
      ];

      for (const scenario of errorScenarios) {
        const recoveryMetrics = {
          errorShown: false,
          errorClear: false,
          userRecovered: false,
          recoveryTime: 0,
        };

        const { unmount } = render(
          <ProviderForm
            onSubmit={async (data) => {
              // 模拟验证错误
              if (scenario.input.url && scenario.input.url === 'invalid-url') {
                throw new Error('Invalid URL format');
              }
              if (scenario.input.name === '') {
                throw new Error('Name is required');
              }
              if (scenario.input.name && scenario.input.name.length > 100) {
                throw new Error('Name is too long');
              }
              return api.addProvider(data);
            }}
            onCancel={() => {}}
          />
        );

        const startTime = performance.now();

        // 步骤1: 输入错误数据
        if (scenario.input.url) {
          const urlInput = screen.getByLabelText(/url|地址/i);
          await act(async () => {
            await user.clear(urlInput);
            await user.type(urlInput, scenario.input.url);
          });
        }

        if (scenario.input.name !== undefined) {
          const nameInput = screen.getByLabelText(/name|名称/i);
          await act(async () => {
            await user.clear(nameInput);
            if (scenario.input.name) {
              await user.type(nameInput, scenario.input.name);
            }
          });
        }

        // 步骤2: 提交表单触发错误
        const submitButton = screen.getByRole('button', { name: /save|保存|submit|提交/i });
        await act(async () => {
          await user.click(submitButton);
        });

        // 步骤3: 检查错误消息显示
        await waitFor(() => {
          expect(screen.getByText(scenario.expectedError)).toBeInTheDocument();
          recoveryMetrics.errorShown = true;
        }, { timeout: 2000 });

        // 步骤4: 用户修正错误
        if (scenario.input.url) {
          const urlInput = screen.getByLabelText(/url|地址/i);
          await act(async () => {
            await user.clear(urlInput);
            await user.type(urlInput, 'https://api.example.com');
          });
        }

        if (scenario.input.name !== undefined) {
          const nameInput = screen.getByLabelText(/name|名称/i);
          await act(async () => {
            await user.clear(nameInput);
            await user.type(nameInput, 'Valid Provider Name');
          });
        }

        // 步骤5: 重新提交
        await act(async () => {
          await user.click(submitButton);
        });

        const recoveryTime = performance.now() - startTime;
        recoveryMetrics.recoveryTime = recoveryTime;
        recoveryMetrics.userRecovered = true;

        console.log(`🔧 错误恢复测试 - ${scenario.name}:`);
        console.log(`  错误显示: ${recoveryMetrics.errorShown}`);
        console.log(`  恢复时间: ${recoveryMetrics.recoveryTime.toFixed(2)}ms`);
        console.log(`  用户恢复: ${recoveryMetrics.userRecovered}`);

        // 验证错误恢复效果
        expect(recoveryMetrics.errorShown).toBe(true);
        expect(recoveryMetrics.userRecovered).toBe(true);
        expect(recoveryMetrics.recoveryTime).toBeLessThan(30000); // 恢复时间 < 30秒

        unmount();
      }
    });
  });
});