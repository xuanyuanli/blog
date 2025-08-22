/**
 * Performance Tests - Component Rendering Performance
 * 测试组件渲染性能和优化效果
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { performance, PerformanceObserver } from 'perf_hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ProviderCard } from '@/components/business/ProviderCard';
import { ProviderForm } from '@/components/business/ProviderForm';
import { AppProvider } from '@/contexts/AppContext';
import { createValidProvider } from '../fixtures/providers.factory';
import type { Provider } from '@/types';

describe('Performance: Component Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 清理性能标记
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  });

  describe('UI Component Performance', () => {
    it('should render Button component quickly', () => {
      const startTime = performance.now();
      
      // 渲染多个按钮变体
      const buttonVariants = ['default', 'primary', 'secondary', 'outline', 'ghost'] as const;
      
      buttonVariants.forEach(variant => {
        const { unmount } = render(
          <Button variant={variant}>Test Button {variant}</Button>
        );
        unmount();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染5个按钮应该在50ms内完成
      expect(renderTime).toBeLessThan(50);
      
      console.log(`Button rendering performance: ${renderTime.toFixed(2)}ms for ${buttonVariants.length} variants`);
    });

    it('should render Input component with good performance', () => {
      const startTime = performance.now();
      
      // 渲染多种Input类型
      const inputTypes = ['text', 'email', 'password', 'url', 'number'] as const;
      
      inputTypes.forEach(type => {
        const { unmount } = render(
          <Input
            type={type}
            placeholder={`Test ${type} input`}
            defaultValue="test value"
          />
        );
        unmount();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染多个Input应该快速完成
      expect(renderTime).toBeLessThan(30);
      
      console.log(`Input rendering performance: ${renderTime.toFixed(2)}ms for ${inputTypes.length} types`);
    });

    it('should handle large lists efficiently', () => {
      const startTime = performance.now();
      
      // 创建大量提供商数据
      const providers: Provider[] = Array.from({ length: 100 }, (_, i) => 
        createValidProvider({ 
          name: `Performance Test Provider ${i}`,
          id: `perf-test-${i}`,
        })
      );
      
      const { unmount } = render(
        <AppProvider>
          <div>
            {providers.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onEdit={() => {}}
                onDelete={() => {}}
                onValidate={() => {}}
                onActivate={() => {}}
              />
            ))}
          </div>
        </AppProvider>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染100个ProviderCard应该在合理时间内完成
      expect(renderTime).toBeLessThan(500); // 500ms限制
      
      console.log(`Large list rendering: ${renderTime.toFixed(2)}ms for ${providers.length} items`);
      
      unmount();
    });

    it('should demonstrate memoization benefits', () => {
      let renderCount = 0;
      
      // 创建带有计数器的组件
      const CountingButton = React.memo(({ label, onClick }: { label: string; onClick: () => void }) => {
        renderCount++;
        return <Button onClick={onClick}>{label}</Button>;
      });
      
      const TestComponent = ({ count }: { count: number }) => {
        const handleClick = React.useCallback(() => {}, []);
        
        return (
          <div>
            <div>Count: {count}</div>
            <CountingButton label="Memoized Button" onClick={handleClick} />
          </div>
        );
      };
      
      // 首次渲染
      const { rerender } = render(<TestComponent count={0} />);
      const firstRenderCount = renderCount;
      
      // 更新父组件但按钮props没变
      rerender(<TestComponent count={1} />);
      rerender(<TestComponent count={2} />);
      rerender(<TestComponent count={3} />);
      
      // 由于使用了memo和useCallback，按钮不应该重新渲染
      expect(renderCount).toBe(firstRenderCount);
      
      console.log(`Memoization working: Button rendered only ${renderCount} time(s) despite parent re-renders`);
    });
  });

  describe('Complex Component Performance', () => {
    it('should render ProviderForm with acceptable performance', async () => {
      const startTime = performance.now();
      
      const { unmount } = render(
        <AppProvider>
          <ProviderForm 
            onSubmit={() => Promise.resolve()}
            onCancel={() => {}}
          />
        </AppProvider>
      );
      
      // 等待异步渲染完成
      await screen.findByRole('form');
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 复杂表单渲染应该在100ms内完成
      expect(renderTime).toBeLessThan(100);
      
      console.log(`ProviderForm rendering performance: ${renderTime.toFixed(2)}ms`);
      
      unmount();
    });

    it('should handle form state updates efficiently', async () => {
      const { container } = render(
        <AppProvider>
          <ProviderForm 
            onSubmit={() => Promise.resolve()}
            onCancel={() => {}}
          />
        </AppProvider>
      );

      const nameInput = screen.getByLabelText(/provider name/i) as HTMLInputElement;
      const urlInput = screen.getByLabelText(/base url/i) as HTMLInputElement;
      
      const startTime = performance.now();
      
      // 模拟快速输入
      const testInputs = [
        'Test Provider 1',
        'Test Provider 2', 
        'Test Provider 3',
        'Final Provider Name',
      ];
      
      for (const input of testInputs) {
        nameInput.value = input;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        urlInput.value = `https://api.${input.replace(/\s/g, '').toLowerCase()}.com`;
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // 多次状态更新应该快速完成
      expect(updateTime).toBeLessThan(50);
      
      console.log(`Form state updates: ${updateTime.toFixed(2)}ms for ${testInputs.length} updates`);
    });

    it('should measure component mount/unmount performance', () => {
      const mountTimes: number[] = [];
      const unmountTimes: number[] = [];
      
      // 重复挂载和卸载组件
      for (let i = 0; i < 50; i++) {
        const mountStart = performance.now();
        
        const { unmount } = render(
          <AppProvider>
            <div>
              <Button variant="primary">Button {i}</Button>
              <Input placeholder={`Input ${i}`} />
              <Card>
                <CardHeader>Card Header {i}</CardHeader>
                <CardContent>Card Content {i}</CardContent>
              </Card>
            </div>
          </AppProvider>
        );
        
        const mountEnd = performance.now();
        mountTimes.push(mountEnd - mountStart);
        
        const unmountStart = performance.now();
        unmount();
        const unmountEnd = performance.now();
        unmountTimes.push(unmountEnd - unmountStart);
      }
      
      const avgMountTime = mountTimes.reduce((a, b) => a + b) / mountTimes.length;
      const avgUnmountTime = unmountTimes.reduce((a, b) => a + b) / unmountTimes.length;
      
      // 平均挂载时间应该合理
      expect(avgMountTime).toBeLessThan(20); // 20ms
      expect(avgUnmountTime).toBeLessThan(10); // 10ms
      
      console.log(`Average mount time: ${avgMountTime.toFixed(2)}ms`);
      console.log(`Average unmount time: ${avgUnmountTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated rendering', () => {
      const initialMemory = getMemoryUsage();
      
      // 重复渲染和卸载大量组件
      for (let i = 0; i < 100; i++) {
        const providers = Array.from({ length: 10 }, (_, j) => 
          createValidProvider({ name: `Memory Test ${i}-${j}` })
        );
        
        const { unmount } = render(
          <AppProvider>
            <div>
              {providers.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onValidate={() => {}}
                  onActivate={() => {}}
                />
              ))}
            </div>
          </AppProvider>
        );
        
        unmount();
      }
      
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长不应该过大
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB限制
      
      console.log(`Memory usage increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle deep component trees efficiently', () => {
      const createDeepTree = (depth: number): React.ReactElement => {
        if (depth <= 0) {
          return <Button>Deep Button</Button>;
        }
        
        return (
          <Card>
            <CardContent>
              <div>Depth: {depth}</div>
              {createDeepTree(depth - 1)}
            </CardContent>
          </Card>
        );
      };
      
      const startTime = performance.now();
      
      const { unmount } = render(
        <AppProvider>
          {createDeepTree(50)} {/* 50层深的组件树 */}
        </AppProvider>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 深层组件树渲染应该在合理时间内完成
      expect(renderTime).toBeLessThan(200); // 200ms限制
      
      console.log(`Deep tree (50 levels) rendering: ${renderTime.toFixed(2)}ms`);
      
      unmount();
    });

    it('should optimize re-renders with React.memo', () => {
      let renderCount = 0;
      
      const OptimizedComponent = React.memo(({ id, name }: { id: string; name: string }) => {
        renderCount++;
        return (
          <Card>
            <CardContent>
              <div>ID: {id}</div>
              <div>Name: {name}</div>
            </CardContent>
          </Card>
        );
      });
      
      const TestContainer = ({ items, highlight }: { items: Array<{ id: string; name: string }>; highlight: string }) => {
        return (
          <div>
            <div>Highlighted: {highlight}</div>
            {items.map(item => (
              <OptimizedComponent key={item.id} {...item} />
            ))}
          </div>
        );
      };
      
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
      }));
      
      const { rerender } = render(
        <TestContainer items={items} highlight="none" />
      );
      
      const initialRenderCount = renderCount;
      
      // 只改变highlight，items保持不变
      rerender(<TestContainer items={items} highlight="item-1" />);
      rerender(<TestContainer items={items} highlight="item-2" />);
      rerender(<TestContainer items={items} highlight="item-3" />);
      
      // 由于使用了memo且props没变，子组件不应该重新渲染
      expect(renderCount).toBe(initialRenderCount);
      
      console.log(`React.memo optimization: ${renderCount} renders for ${items.length} items despite parent updates`);
    });
  });

  describe('Event Handler Performance', () => {
    it('should handle rapid click events efficiently', async () => {
      let clickCount = 0;
      const handleClick = () => clickCount++;
      
      const { getByRole } = render(
        <Button onClick={handleClick}>Click Test</Button>
      );
      
      const button = getByRole('button');
      const startTime = performance.now();
      
      // 模拟快速点击
      for (let i = 0; i < 100; i++) {
        button.click();
      }
      
      const endTime = performance.now();
      const eventTime = endTime - startTime;
      
      expect(clickCount).toBe(100);
      expect(eventTime).toBeLessThan(50); // 100次点击在50ms内完成
      
      console.log(`Event handling performance: ${eventTime.toFixed(2)}ms for 100 clicks`);
    });

    it('should debounce expensive operations', async () => {
      jest.useFakeTimers();
      
      let expensiveOperationCount = 0;
      
      const ExpensiveComponent = () => {
        const [value, setValue] = React.useState('');
        
        const expensiveOperation = React.useCallback(() => {
          expensiveOperationCount++;
          // 模拟昂贵操作
          return value.length;
        }, [value]);
        
        const debouncedOperation = React.useMemo(() => {
          let timeoutId: NodeJS.Timeout;
          return () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(expensiveOperation, 300);
          };
        }, [expensiveOperation]);
        
        React.useEffect(() => {
          if (value) {
            debouncedOperation();
          }
        }, [value, debouncedOperation]);
        
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Debounced input"
          />
        );
      };
      
      const { getByRole } = render(<ExpensiveComponent />);
      const input = getByRole('textbox') as HTMLInputElement;
      
      // 模拟快速输入
      input.value = 'a';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      input.value = 'ab';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      input.value = 'abc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      input.value = 'abcd';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 在防抖期间，昂贵操作不应该执行
      expect(expensiveOperationCount).toBe(0);
      
      // 快进300ms触发防抖
      jest.advanceTimersByTime(300);
      
      // 现在昂贵操作应该只执行一次
      expect(expensiveOperationCount).toBe(1);
      
      jest.useRealTimers();
    });
  });
});

// 辅助函数
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  // 浏览器环境的内存使用估算
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
  
  return 0;
}