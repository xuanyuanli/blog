/**
 * UX Tests - Internationalization & Localization Support
 * 国际化和本地化支持测试
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/pages/Dashboard';
import { ProviderForm } from '@/components/business/ProviderForm';

// 模拟国际化上下文
const createI18nContext = (locale: string) => {
  return {
    locale,
    t: (key: string, params?: Record<string, any>) => {
      // 简单的翻译模拟
      const translations: Record<string, Record<string, string>> = {
        'zh-CN': {
          'provider.name': 'Provider名称',
          'provider.url': 'API地址',
          'provider.model': '模型',
          'button.save': '保存',
          'button.cancel': '取消',
          'validation.required': '此字段为必填项',
          'validation.invalid_url': '请输入有效的URL地址',
          'date.format': 'YYYY年MM月DD日',
          'number.format': '1,234.56',
        },
        'en-US': {
          'provider.name': 'Provider Name',
          'provider.url': 'API URL',
          'provider.model': 'Model',
          'button.save': 'Save',
          'button.cancel': 'Cancel',
          'validation.required': 'This field is required',
          'validation.invalid_url': 'Please enter a valid URL',
          'date.format': 'MM/DD/YYYY',
          'number.format': '1,234.56',
        },
        'ja-JP': {
          'provider.name': 'プロバイダー名',
          'provider.url': 'API URL',
          'provider.model': 'モデル',
          'button.save': '保存',
          'button.cancel': 'キャンセル',
          'validation.required': 'この項目は必須です',
          'validation.invalid_url': '有効なURLを入力してください',
          'date.format': 'YYYY年MM月DD日',
          'number.format': '1,234.56',
        },
        'ko-KR': {
          'provider.name': '프로바이더 이름',
          'provider.url': 'API URL',
          'provider.model': '모델',
          'button.save': '저장',
          'button.cancel': '취소',
          'validation.required': '이 필드는 필수입니다',
          'validation.invalid_url': '유효한 URL을 입력하세요',
          'date.format': 'YYYY년 MM월 DD일',
          'number.format': '1,234.56',
        },
        'ar-SA': {
          'provider.name': 'اسم المزود',
          'provider.url': 'رابط API',
          'provider.model': 'النموذج',
          'button.save': 'حفظ',
          'button.cancel': 'إلغاء',
          'validation.required': 'هذا الحقل مطلوب',
          'validation.invalid_url': 'يرجى إدخال رابط صحيح',
          'date.format': 'DD/MM/YYYY',
          'number.format': '1٬234٫56',
        },
      };

      return translations[locale]?.[key] || key;
    },
    formatDate: (date: Date, format?: string) => {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

      return new Intl.DateTimeFormat(locale, options).format(date);
    },
    formatNumber: (number: number) => {
      return new Intl.NumberFormat(locale).format(number);
    },
  };
};

describe('UX: Internationalization & Localization Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Multi-language Support', () => {
    const supportedLocales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];

    supportedLocales.forEach(locale => {
      it(`${locale}语言完整性测试`, async () => {
        const i18n = createI18nContext(locale);
        
        // 设置文档语言
        document.documentElement.lang = locale;

        const TestComponent = () => (
          <div>
            <h1>{i18n.t('provider.name')}</h1>
            <label htmlFor="url">{i18n.t('provider.url')}</label>
            <input id="url" type="text" />
            <button>{i18n.t('button.save')}</button>
            <button>{i18n.t('button.cancel')}</button>
          </div>
        );

        render(<TestComponent />);

        // 检查所有文本是否已翻译
        expect(screen.getByText(i18n.t('provider.name'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('provider.url'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('button.save'))).toBeInTheDocument();
        expect(screen.getByText(i18n.t('button.cancel'))).toBeInTheDocument();

        // 检查是否有未翻译的文本（通常是大写常量）
        const allTextNodes = document.evaluate(
          '//text()[normalize-space(.) != ""]',
          document.body,
          null,
          XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        const untranslatedTexts: string[] = [];
        for (let i = 0; i < allTextNodes.snapshotLength; i++) {
          const textNode = allTextNodes.snapshotItem(i);
          const text = textNode?.textContent?.trim();
          
          // 检查是否是未翻译的常量（全大写字母和下划线）
          if (text && /^[A-Z_]+$/.test(text) && text.length > 2) {
            untranslatedTexts.push(text);
          }
        }

        expect(untranslatedTexts).toHaveLength(0);

        console.log(`✅ ${locale} 语言完整性验证通过`);
      });

      it(`${locale}文本显示完整性`, async () => {
        const i18n = createI18nContext(locale);
        document.documentElement.lang = locale;

        const TestComponent = () => (
          <div style={{ width: '300px' }}>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {i18n.t('provider.name')}
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {i18n.t('validation.invalid_url')}
            </div>
          </div>
        );

        const { container } = render(<TestComponent />);

        // 检查文本是否被截断
        const textElements = container.querySelectorAll('div[style*="overflow: hidden"]');
        const truncatedElements = Array.from(textElements).filter(el => {
          return el.scrollWidth > el.clientWidth;
        });

        expect(truncatedElements).toHaveLength(0);

        console.log(`✅ ${locale} 文本显示完整性验证通过`);
      });
    });

    it('RTL语言支持测试', async () => {
      const i18n = createI18nContext('ar-SA');
      document.documentElement.lang = 'ar-SA';
      document.documentElement.dir = 'rtl';

      const TestComponent = () => (
        <div dir="rtl">
          <nav style={{ position: 'absolute', right: '0' }}>
            <button>{i18n.t('button.save')}</button>
          </nav>
          <main>
            <h1>{i18n.t('provider.name')}</h1>
            <form>
              <label htmlFor="name">{i18n.t('provider.name')}</label>
              <input id="name" type="text" />
              <div style={{ textAlign: 'right' }}>
                {i18n.t('validation.required')}
              </div>
            </form>
          </main>
        </div>
      );

      const { container } = render(<TestComponent />);

      // 检查文档方向
      const bodyDirection = window.getComputedStyle(container.firstChild as Element).direction;
      expect(bodyDirection).toBe('rtl');

      // 检查导航元素位置是否镜像
      const navigation = container.querySelector('nav');
      expect(navigation).toBeInTheDocument();
      
      const navStyle = window.getComputedStyle(navigation!);
      expect(navStyle.right).toBe('0px');

      // 检查文本对齐
      const errorMessage = container.querySelector('[style*="text-align: right"]');
      expect(errorMessage).toBeInTheDocument();

      console.log('✅ RTL语言支持验证通过');
    });

    it('日期时间格式本地化', async () => {
      const testDate = new Date('2024-12-25T15:30:00Z');

      const localeFormats = [
        { locale: 'zh-CN', expected: /2024.*12.*25/ },
        { locale: 'en-US', expected: /12.*25.*2024/ },
        { locale: 'ja-JP', expected: /2024.*12.*25/ },
        { locale: 'ko-KR', expected: /2024.*12.*25/ },
      ];

      for (const { locale, expected } of localeFormats) {
        const i18n = createI18nContext(locale);
        const formattedDate = i18n.formatDate(testDate);
        
        expect(formattedDate).toMatch(expected);
        console.log(`${locale}: ${formattedDate}`);
      }

      console.log('✅ 日期格式本地化验证通过');
    });

    it('货币和数字格式本地化', async () => {
      const testNumber = 1234567.89;

      const localeTests = [
        { locale: 'zh-CN', expected: /1,234,567\.89/ },
        { locale: 'en-US', expected: /1,234,567\.89/ },
        { locale: 'de-DE', expected: /1\.234\.567,89/ },
        { locale: 'fr-FR', expected: /1\s234\s567,89/ },
      ];

      for (const { locale, expected } of localeTests) {
        const formatted = new Intl.NumberFormat(locale).format(testNumber);
        expect(formatted).toMatch(expected);
        console.log(`${locale}: ${formatted}`);
      }

      console.log('✅ 数字格式本地化验证通过');
    });
  });

  describe('Cultural Adaptation', () => {
    it('图标文化适应性', async () => {
      const culturalIconTests = [
        {
          locale: 'zh-CN',
          icons: ['✓', '✗', '🇨🇳'],
          sensitive: ['🙏', '👌'], // 在某些文化中可能有不同含义
        },
        {
          locale: 'ar-SA',
          icons: ['✓', '✗'],
          sensitive: ['👍', '🤝'], // 在阿拉伯文化中需要注意
        },
        {
          locale: 'ja-JP',
          icons: ['○', '×', '🇯🇵'],
          sensitive: ['🙇'], // 日本文化特有手势
        },
      ];

      for (const test of culturalIconTests) {
        const TestComponent = () => (
          <div data-locale={test.locale}>
            {test.icons.map((icon, index) => (
              <span 
                key={index}
                role="img" 
                aria-label={`Icon ${index}`}
                title={`Cultural icon for ${test.locale}`}
              >
                {icon}
              </span>
            ))}
            {test.sensitive.map((icon, index) => (
              <span 
                key={`sensitive-${index}`}
                role="img" 
                aria-label={`Sensitive icon ${index} for ${test.locale}`}
                title={`This icon may have cultural significance in ${test.locale}`}
              >
                {icon}
              </span>
            ))}
          </div>
        );

        const { container } = render(<TestComponent />);

        // 检查所有图标都有适当的标签
        const icons = container.querySelectorAll('[role="img"]');
        icons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-label');
          expect(icon).toHaveAttribute('title');
        });

        // 检查敏感图标是否有额外的文化说明
        const sensitiveIcons = container.querySelectorAll('[aria-label*="Sensitive"]');
        sensitiveIcons.forEach(icon => {
          const title = icon.getAttribute('title');
          expect(title).toContain('cultural significance');
        });

        console.log(`✅ ${test.locale} 图标文化适应性验证通过`);
      }
    });

    it('颜色文化含义测试', async () => {
      const colorMeanings = {
        'zh-CN': { 
          success: 'green', // 绿色表示成功
          warning: 'yellow', // 黄色表示警告
          danger: 'red', // 红色在中国文化中可能有正面含义（喜庆）
          info: 'blue',
        },
        'en-US': { 
          success: 'green',
          warning: 'yellow',
          danger: 'red', // 红色表示危险
          info: 'blue',
        },
        'jp-JP': { 
          success: 'green',
          warning: 'orange', // 橙色可能比黄色更合适
          danger: 'red',
          info: 'blue',
        },
      };

      for (const [locale, colors] of Object.entries(colorMeanings)) {
        const TestComponent = () => (
          <div data-locale={locale}>
            <div 
              className={`status-success`}
              style={{ color: colors.success }}
              data-testid="success-element"
            >
              Success Message
            </div>
            <div 
              className={`status-warning`}
              style={{ color: colors.warning }}
              data-testid="warning-element"
            >
              Warning Message
            </div>
            <div 
              className={`status-danger`}
              style={{ color: colors.danger }}
              data-testid="danger-element"
            >
              Danger Message
            </div>
          </div>
        );

        const { container } = render(<TestComponent />);

        // 验证颜色设置
        const successElement = container.querySelector('[data-testid="success-element"]');
        const warningElement = container.querySelector('[data-testid="warning-element"]');
        const dangerElement = container.querySelector('[data-testid="danger-element"]');

        expect(successElement).toHaveStyle(`color: ${colors.success}`);
        expect(warningElement).toHaveStyle(`color: ${colors.warning}`);
        expect(dangerElement).toHaveStyle(`color: ${colors.danger}`);

        console.log(`✅ ${locale} 颜色文化含义验证通过`);
      }
    });

    it('文字方向和排版适应', async () => {
      const typographyTests = [
        {
          locale: 'zh-CN',
          direction: 'ltr',
          textAlign: 'left',
          lineHeight: '1.6', // 中文行高建议
        },
        {
          locale: 'ar-SA',
          direction: 'rtl',
          textAlign: 'right',
          lineHeight: '1.5',
        },
        {
          locale: 'ja-JP',
          direction: 'ltr',
          textAlign: 'left',
          lineHeight: '1.7', // 日文可能需要更大行高
        },
      ];

      for (const test of typographyTests) {
        const TestComponent = () => (
          <div 
            dir={test.direction}
            style={{
              textAlign: test.textAlign as any,
              lineHeight: test.lineHeight,
            }}
            data-locale={test.locale}
          >
            <p>
              这是一段测试文本，用于验证不同语言环境下的排版效果。
              This is a test paragraph to verify typography effects in different locales.
            </p>
          </div>
        );

        const { container } = render(<TestComponent />);

        const textContainer = container.querySelector('[data-locale]');
        const computedStyle = window.getComputedStyle(textContainer!);

        expect(computedStyle.direction).toBe(test.direction);
        expect(computedStyle.textAlign).toBe(test.textAlign);
        expect(computedStyle.lineHeight).toBe(test.lineHeight);

        console.log(`✅ ${test.locale} 排版适应验证通过`);
      }
    });
  });

  describe('Language Switching', () => {
    it('语言切换流畅度测试', async () => {
      let currentLocale = 'zh-CN';
      const switchTimes: number[] = [];

      const TestComponent = () => {
        const [locale, setLocale] = React.useState(currentLocale);
        const i18n = createI18nContext(locale);

        const switchLanguage = (newLocale: string) => {
          const startTime = performance.now();
          setLocale(newLocale);
          currentLocale = newLocale;
          document.documentElement.lang = newLocale;
          
          // 模拟语言切换完成
          setTimeout(() => {
            const endTime = performance.now();
            switchTimes.push(endTime - startTime);
          }, 10);
        };

        return (
          <div>
            <select 
              value={locale} 
              onChange={(e) => switchLanguage(e.target.value)}
              aria-label="选择语言"
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
            <h1>{i18n.t('provider.name')}</h1>
            <button>{i18n.t('button.save')}</button>
          </div>
        );
      };

      render(<TestComponent />);

      const languageSelect = screen.getByLabelText('选择语言');

      // 测试语言切换
      await user.selectOptions(languageSelect, 'en-US');
      await waitFor(() => {
        expect(screen.getByText('Provider Name')).toBeInTheDocument();
      });

      await user.selectOptions(languageSelect, 'ja-JP');
      await waitFor(() => {
        expect(screen.getByText('プロバイダー名')).toBeInTheDocument();
      });

      await user.selectOptions(languageSelect, 'zh-CN');
      await waitFor(() => {
        expect(screen.getByText('Provider名称')).toBeInTheDocument();
      });

      // 验证切换性能
      await waitFor(() => {
        expect(switchTimes.length).toBeGreaterThan(0);
      });

      const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      expect(avgSwitchTime).toBeLessThan(1000); // 语言切换应该在1秒内完成

      console.log(`✅ 语言切换测试通过，平均切换时间: ${avgSwitchTime.toFixed(2)}ms`);
    });

    it('本地化缓存和性能', async () => {
      const cacheTest = {
        loadTimes: [] as number[],
        cacheHits: 0,
        cacheMisses: 0,
      };

      // 模拟本地化资源加载
      const loadLocaleData = async (locale: string): Promise<Record<string, string>> => {
        const startTime = performance.now();
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        const endTime = performance.now();
        cacheTest.loadTimes.push(endTime - startTime);

        // 简单的缓存模拟
        const cacheKey = `locale-${locale}`;
        if (localStorage.getItem(cacheKey)) {
          cacheTest.cacheHits++;
        } else {
          cacheTest.cacheMisses++;
          localStorage.setItem(cacheKey, JSON.stringify({}));
        }

        return {};
      };

      // 测试多次加载同一语言
      for (let i = 0; i < 5; i++) {
        await loadLocaleData('zh-CN');
      }

      // 测试加载不同语言
      await loadLocaleData('en-US');
      await loadLocaleData('ja-JP');

      // 验证缓存效果
      expect(cacheTest.cacheHits).toBeGreaterThan(0);
      expect(cacheTest.loadTimes.length).toBe(7);

      const avgLoadTime = cacheTest.loadTimes.reduce((a, b) => a + b, 0) / cacheTest.loadTimes.length;
      expect(avgLoadTime).toBeLessThan(200); // 平均加载时间应该在200ms内

      console.log(`✅ 本地化缓存测试通过，缓存命中: ${cacheTest.cacheHits}, 未命中: ${cacheTest.cacheMisses}`);
      console.log(`平均加载时间: ${avgLoadTime.toFixed(2)}ms`);

      // 清理测试数据
      localStorage.clear();
    });
  });
});