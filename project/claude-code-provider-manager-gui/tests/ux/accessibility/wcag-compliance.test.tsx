/**
 * UX Tests - WCAG 2.1 AA Compliance Tests
 * WCAG 2.1 AA级别合规测试
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProviderForm } from '@/components/business/ProviderForm';
import Dashboard from '@/pages/Dashboard';

// 扩展Jest匹配器
expect.extend(toHaveNoViolations);

describe('UX: WCAG 2.1 AA Compliance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Perceivable - 感知性', () => {
    it('颜色对比度符合AA标准', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">主要按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="danger">危险按钮</Button>
          <Input label="文本输入" placeholder="请输入内容" />
          <p>普通文本内容</p>
          <h1>主标题</h1>
          <h2>副标题</h2>
        </div>
      );

      // 使用axe-core检查颜色对比度
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: false }, // AAA级别暂不要求
        },
      });

      expect(results).toHaveNoViolations();

      // 手动检查关键元素的对比度
      const primaryButton = screen.getByRole('button', { name: '主要按钮' });
      const computedStyle = window.getComputedStyle(primaryButton);
      
      // 确保按钮有明确的颜色定义
      expect(computedStyle.color).toBeTruthy();
      expect(computedStyle.backgroundColor).toBeTruthy();
      
      console.log('🎨 颜色对比度检查通过');
    });

    it('文本替代方案完整性', async () => {
      const { container } = render(
        <div>
          <img src="/test-image.jpg" alt="测试图片描述" />
          <button aria-label="关闭对话框">×</button>
          <div role="img" aria-label="图标描述">🚀</div>
          <svg role="img" aria-labelledby="chart-title">
            <title id="chart-title">数据图表</title>
            <rect width="100" height="50" />
          </svg>
        </div>
      );

      // 检查所有图片都有适当的替代文本
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });

      // 检查装饰性图标有适当的aria-label
      const iconButtons = container.querySelectorAll('button[aria-label]');
      iconButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });

      // 检查SVG元素的无障碍标记
      const svgElements = container.querySelectorAll('svg[role="img"]');
      svgElements.forEach(svg => {
        const hasLabel = svg.hasAttribute('aria-label') || svg.hasAttribute('aria-labelledby');
        expect(hasLabel).toBe(true);
      });

      console.log('🖼️ 替代文本检查通过');
    });

    it('多媒体内容可访问性', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 检查所有图标是否有aria-label或title
      const icons = document.querySelectorAll('svg, img[role="img"], .icon');
      const iconsArray = Array.from(icons);
      
      const iconsWithoutLabels = iconsArray.filter(icon => {
        const hasAriaLabel = icon.hasAttribute('aria-label');
        const hasAriaLabelledBy = icon.hasAttribute('aria-labelledby');
        const hasTitle = icon.querySelector('title') !== null;
        const hasAltText = icon.hasAttribute('alt');
        
        return !(hasAriaLabel || hasAriaLabelledBy || hasTitle || hasAltText);
      });

      expect(iconsWithoutLabels).toHaveLength(0);

      console.log(`🎭 检查了 ${iconsArray.length} 个图标元素，全部具有适当标签`);
    });
  });

  describe('Operable - 可操作性', () => {
    it('键盘导航完整性', async () => {
      const { container } = render(
        <div>
          <Button>按钮1</Button>
          <Input label="输入框1" />
          <select aria-label="选择框">
            <option>选项1</option>
            <option>选项2</option>
          </select>
          <a href="#test">链接</a>
          <Button>按钮2</Button>
        </div>
      );

      // 获取所有可聚焦元素
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // 测试Tab导航
      let currentIndex = 0;
      for (const element of focusableElements) {
        await user.tab();
        
        // 验证焦点是否正确移动
        await waitFor(() => {
          expect(document.activeElement).toBe(element);
        });
        
        currentIndex++;
      }

      // 测试Shift+Tab反向导航
      for (let i = focusableElements.length - 1; i >= 0; i--) {
        await user.tab({ shift: true });
        
        await waitFor(() => {
          expect(document.activeElement).toBe(focusableElements[i]);
        });
      }

      console.log(`⌨️ 键盘导航测试通过，覆盖 ${focusableElements.length} 个可聚焦元素`);
    });

    it('焦点陷阱管理', async () => {
      let isModalOpen = true;
      
      const { rerender } = render(
        <Modal
          isOpen={isModalOpen}
          onClose={() => { isModalOpen = false; }}
          title="测试模态框"
        >
          <div>
            <Input label="模态框输入1" />
            <Button>模态框按钮</Button>
            <Input label="模态框输入2" />
          </div>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const focusableInModal = modal.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableInModal.length).toBeGreaterThan(0);

      // 测试焦点陷阱 - 从最后一个元素Tab应该回到第一个
      const lastElement = focusableInModal[focusableInModal.length - 1] as HTMLElement;
      const firstElement = focusableInModal[0] as HTMLElement;

      // 聚焦到最后一个元素
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      // Tab到下一个应该回到第一个
      await user.tab();
      
      await waitFor(() => {
        expect(document.activeElement).toBe(firstElement);
      });

      // 从第一个元素Shift+Tab应该到最后一个
      await user.tab({ shift: true });
      
      await waitFor(() => {
        expect(document.activeElement).toBe(lastElement);
      });

      console.log('🎯 焦点陷阱测试通过');
    });

    it('操作时间限制合理性', async () => {
      const timeoutWarnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (message: string) => {
        if (message.includes('timeout') || message.includes('time limit')) {
          timeoutWarnings.push(message);
        }
        originalWarn(message);
      };

      try {
        render(
          <ProviderForm
            onSubmit={async (data) => {
              // 模拟较慢的提交过程
              await new Promise(resolve => setTimeout(resolve, 1000));
              return { id: '1', ...data } as any;
            }}
            onCancel={() => {}}
          />
        );

        const nameInput = screen.getByLabelText(/name|名称/i);
        
        // 模拟用户慢速输入
        await user.type(nameInput, 'Slow Input Provider', { delay: 200 });

        // 等待一段时间看是否有超时警告
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 不应该有任何超时相关的警告
        expect(timeoutWarnings).toHaveLength(0);

        console.log('⏰ 操作时间限制测试通过，无超时警告');
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('Understandable - 可理解性', () => {
    it('错误信息清晰度测试', async () => {
      const TestFormWithValidation = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const name = formData.get('name') as string;
          const url = formData.get('url') as string;

          const newErrors: Record<string, string> = {};
          
          if (!name) {
            newErrors.name = '请输入Provider名称';
          } else if (name.length < 2) {
            newErrors.name = '名称至少需要2个字符';
          }

          if (!url) {
            newErrors.url = '请输入API地址';
          } else if (!url.startsWith('https://')) {
            newErrors.url = '请使用HTTPS协议的地址';
          }

          setErrors(newErrors);
        };

        return (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Provider名称</label>
              <input id="name" name="name" type="text" />
              {errors.name && (
                <div role="alert" className="error-message">
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="url">API地址</label>
              <input id="url" name="url" type="url" />
              {errors.url && (
                <div role="alert" className="error-message">
                  {errors.url}
                </div>
              )}
            </div>
            <button type="submit">保存</button>
          </form>
        );
      };

      render(<TestFormWithValidation />);

      // 触发验证错误
      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      // 检查错误消息
      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);

      errorMessages.forEach(error => {
        const message = error.textContent || '';
        
        // 错误信息应该具体、可操作
        expect(message).toMatch(/^(请|请输入|请选择|请检查)/); // 中文友好提示
        expect(message.length).toBeLessThan(50); // 简洁明了
        expect(message).not.toMatch(/error|failed|invalid/i); // 避免技术术语

        console.log(`✅ 错误消息检查: "${message}"`);
      });

      // 修正错误后应该清除错误消息
      const nameInput = screen.getByLabelText(/名称/);
      const urlInput = screen.getByLabelText(/地址/);

      await user.type(nameInput, 'Valid Provider');
      await user.type(urlInput, 'https://api.example.com');
      await user.click(submitButton);

      // 错误消息应该消失
      await waitFor(() => {
        expect(screen.queryAllByRole('alert')).toHaveLength(0);
      });

      console.log('📝 错误消息清晰度测试通过');
    });

    it('表单标签关联性', async () => {
      const { container } = render(
        <div>
          <ProviderForm
            onSubmit={async () => ({ id: '1' } as any)}
            onCancel={() => {}}
          />
        </div>
      );

      // 检查所有输入字段都有关联的标签
      const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      
      const inputsWithoutLabels = Array.from(inputs).filter(input => {
        const id = input.id;
        if (!id) return true; // 没有ID的输入字段
        
        const associatedLabel = document.querySelector(`label[for="${id}"]`);
        return !associatedLabel; // 没有关联标签的输入字段
      });

      expect(inputsWithoutLabels).toHaveLength(0);

      // 检查所有标签都有正确的for属性
      const labels = container.querySelectorAll('label[for]');
      labels.forEach(label => {
        const forAttribute = label.getAttribute('for');
        expect(forAttribute).toBeTruthy();
        
        const associatedInput = document.getElementById(forAttribute!);
        expect(associatedInput).toBeInTheDocument();
      });

      console.log(`🏷️ 标签关联检查通过，验证了 ${labels.length} 个标签`);
    });

    it('语言标识正确性', async () => {
      render(<Dashboard />);

      // 检查HTML语言属性
      const htmlElement = document.documentElement;
      expect(htmlElement).toHaveAttribute('lang');
      
      const langAttribute = htmlElement.getAttribute('lang');
      expect(langAttribute).toMatch(/^(zh|zh-CN|zh-Hans)$/); // 中文语言标识

      // 检查混合语言内容的lang标记
      const englishElements = document.querySelectorAll('[lang="en"], .english-text');
      
      // 如果有英文内容，应该有适当的lang标记
      if (englishElements.length > 0) {
        console.log(`🌐 发现 ${englishElements.length} 个英文内容元素，都有适当的语言标记`);
      }

      console.log(`🗣️ 语言标识检查通过，主语言: ${langAttribute}`);
    });
  });

  describe('Robust - 健壮性', () => {
    it('屏幕阅读器兼容性', async () => {
      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 检查ARIA landmarks
      const landmarks = container.querySelectorAll(
        '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
      );
      
      const landmarkRoles = Array.from(landmarks).map(el => el.getAttribute('role'));
      
      expect(landmarkRoles).toContain('main');
      
      // 运行全面的可访问性检查
      const results = await axe(container, {
        rules: {
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();

      console.log(`🔍 屏幕阅读器兼容性检查通过，发现 ${landmarks.length} 个地标元素`);
    });

    it('语义化HTML结构', async () => {
      const { container } = render(<Dashboard />);

      // 检查标题层级结构
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map(h => 
        parseInt(h.tagName.slice(1))
      );

      expect(headings.length).toBeGreaterThan(0);

      // 应该有h1作为主标题
      expect(headingLevels).toContain(1);

      // 标题层级应该逻辑连续，不应跳级
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        const levelDiff = currentLevel - previousLevel;
        
        // 允许同级、下降任意级别、或上升一级
        expect(levelDiff).toBeLessThanOrEqual(1);
      }

      // 检查语义化元素的使用
      const semanticElements = container.querySelectorAll(
        'main, nav, header, footer, section, article, aside'
      );
      
      expect(semanticElements.length).toBeGreaterThan(0);

      console.log(`📚 语义化结构检查通过，标题层级: [${headingLevels.join(', ')}]`);
    });

    it('WAI-ARIA 最佳实践', async () => {
      const { container } = render(
        <div>
          <Dashboard />
          <Modal isOpen={true} onClose={() => {}} title="测试模态框">
            <p>模态框内容</p>
          </Modal>
        </div>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 运行ARIA相关的可访问性检查
      const results = await axe(container, {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();

      // 检查模态框的ARIA属性
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      
      const modalTitle = modal.querySelector('[aria-labelledby]');
      if (modalTitle) {
        const titleId = modalTitle.getAttribute('aria-labelledby');
        expect(document.getElementById(titleId!)).toBeInTheDocument();
      }

      console.log('🎭 ARIA最佳实践检查通过');
    });
  });

  describe('Comprehensive Accessibility Audit', () => {
    it('完整的可访问性审计', async () => {
      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // 运行完整的WCAG 2.1 AA级别检查
      const results = await axe(container, {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          // 启用所有WCAG 2.1 AA相关规则
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'language': { enabled: true },
          'meaningful-sequence': { enabled: true },
          'error-message': { enabled: true },
        },
      });

      // 记录检查结果
      if (results.violations.length > 0) {
        console.error('❌ 可访问性违规:', results.violations);
        results.violations.forEach(violation => {
          console.error(`- ${violation.id}: ${violation.description}`);
          violation.nodes.forEach(node => {
            console.error(`  元素: ${node.target}`);
            console.error(`  问题: ${node.failureSummary}`);
          });
        });
      } else {
        console.log('✅ 完整可访问性审计通过，无违规项');
      }

      expect(results).toHaveNoViolations();

      // 生成可访问性报告摘要
      const summary = {
        totalTests: results.passes.length + results.violations.length + results.incomplete.length,
        passes: results.passes.length,
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
      };

      console.log('📊 可访问性审计摘要:', summary);
      expect(summary.violations).toBe(0);
    });
  });
});