import { performanceProfiler, responsiveOptimizer, memoryCache } from './performance';

// 用户体验指标
export interface UXMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
}

// 用户体验分析器
export class UXAnalyzer {
  private metrics: UXMetrics = {
    loadTime: 0,
    firstContentfulPaint: 0,
    timeToInteractive: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    interactionToNextPaint: 0,
  };
  
  private interactionTimings: Map<string, number[]> = new Map();
  private layoutShifts: number[] = [];
  private firstInputTime: number | null = null;

  constructor() {
    this.setupObservers();
    this.setupEventListeners();
  }

  private setupObservers(): void {
    // Performance Observer for FCP and TTI
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry);
          }
        });
        
        observer.observe({ entryTypes: ['paint', 'navigation', 'layout-shift', 'first-input'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported:', e);
      }
    }
  }

  private setupEventListeners(): void {
    // 监听用户交互
    document.addEventListener('click', this.handleUserInteraction.bind(this), { passive: true });
    document.addEventListener('keydown', this.handleUserInteraction.bind(this), { passive: true });
    document.addEventListener('scroll', this.handleUserInteraction.bind(this), { passive: true });
    
    // 监听页面加载完成
    window.addEventListener('load', this.handlePageLoad.bind(this));
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
        break;
        
      case 'navigation':
        this.metrics.loadTime = entry.duration;
        break;
        
      case 'layout-shift':
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          this.layoutShifts.push(layoutShift.value);
          this.metrics.cumulativeLayoutShift = this.layoutShifts.reduce((a, b) => a + b, 0);
        }
        break;
        
      case 'first-input':
        const firstInput = entry as any;
        this.metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
        this.firstInputTime = firstInput.startTime;
        break;
    }
  }

  private handleUserInteraction(event: Event): void {
    const interactionType = event.type;
    const timestamp = performance.now();
    
    if (!this.interactionTimings.has(interactionType)) {
      this.interactionTimings.set(interactionType, []);
    }
    
    this.interactionTimings.get(interactionType)!.push(timestamp);
    
    // 计算交互到下一次绘制的延迟
    if (this.firstInputTime) {
      const inp = timestamp - this.firstInputTime;
      this.metrics.interactionToNextPaint = inp;
    }
  }

  private handlePageLoad(): void {
    // 页面加载完成后计算时间到交互
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
    }
  }

  // 获取 UX 指标
  getMetrics(): UXMetrics {
    return { ...this.metrics };
  }

  // 获取性能评级
  getPerformanceGrade(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    details: Record<string, { value: number; grade: 'excellent' | 'good' | 'fair' | 'poor' }>;
  } {
    const grades = {
      excellent: { min: 0, max: 1000 },
      good: { min: 1000, max: 2500 },
      fair: { min: 2500, max: 4000 },
      poor: { min: 4000, max: Infinity },
    };

    const getGrade = (value: number): 'excellent' | 'good' | 'fair' | 'poor' => {
      for (const [grade, range] of Object.entries(grades)) {
        if (value >= range.min && value < range.max) {
          return grade as 'excellent' | 'good' | 'fair' | 'poor';
        }
      }
      return 'poor';
    };

    const details: Record<string, { value: number; grade: 'excellent' | 'good' | 'fair' | 'poor' }> = {
      loadTime: { value: this.metrics.loadTime, grade: getGrade(this.metrics.loadTime) },
      fcp: { value: this.metrics.firstContentfulPaint, grade: getGrade(this.metrics.firstContentfulPaint) },
      tti: { value: this.metrics.timeToInteractive, grade: getGrade(this.metrics.timeToInteractive) },
      cls: { value: this.metrics.cumulativeLayoutShift, grade: this.metrics.cumulativeLayoutShift < 0.1 ? 'excellent' : this.metrics.cumulativeLayoutShift < 0.25 ? 'good' : 'poor' },
      fid: { value: this.metrics.firstInputDelay, grade: this.metrics.firstInputDelay < 100 ? 'excellent' : this.metrics.firstInputDelay < 300 ? 'good' : 'poor' },
      inp: { value: this.metrics.interactionToNextPaint, grade: this.metrics.interactionToNextPaint < 100 ? 'excellent' : this.metrics.interactionToNextPaint < 200 ? 'good' : 'poor' },
    };

    // 计算总体等级
    const gradeCounts = { excellent: 0, good: 0, fair: 0, poor: 0 };
    Object.values(details).forEach(detail => {
      gradeCounts[detail.grade]++;
    });

    let overall: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (gradeCounts.poor > 0) overall = 'poor';
    else if (gradeCounts.fair > 1) overall = 'fair';
    else if (gradeCounts.good > 2) overall = 'good';

    return { overall, details };
  }

  // 获取用户体验建议
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    if (metrics.loadTime > 3000) {
      recommendations.push('页面加载时间过长，建议优化资源加载和代码分割');
    }

    if (metrics.firstContentfulPaint > 2000) {
      recommendations.push('首次内容绘制时间过长，建议优化关键渲染路径');
    }

    if (metrics.timeToInteractive > 4000) {
      recommendations.push('页面交互时间过长，建议减少主线程阻塞');
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('布局偏移过大，建议为图片和广告设置固定尺寸');
    }

    if (metrics.firstInputDelay > 100) {
      recommendations.push('首次输入延迟过长，建议减少长任务和优化 JavaScript 执行');
    }

    if (metrics.interactionToNextPaint > 200) {
      recommendations.push('交互响应时间过长，建议优化事件处理和动画性能');
    }

    return recommendations;
  }
}

// 动画和过渡优化器
export class AnimationOptimizer {
  private rafCallbacks: Map<number, FrameRequestCallback> = new Map();
  private scrollListeners: Map<string, EventListener> = new Map();
  private resizeListeners: Map<string, EventListener> = new Map();

  // 优化的 requestAnimationFrame
  optimizedRAF(callback: FrameRequestCallback): number {
    const wrappedCallback = (timestamp: number) => {
      performanceProfiler.startTimer('animation-frame');
      callback(timestamp);
      performanceProfiler.endTimer('animation-frame');
    };

    const id = requestAnimationFrame(wrappedCallback);
    this.rafCallbacks.set(id, wrappedCallback);
    return id;
  }

  // 取消动画帧
  cancelOptimizedRAF(id: number): void {
    cancelAnimationFrame(id);
    this.rafCallbacks.delete(id);
  }

  // 优化的滚动监听
  addOptimizedScrollListener(
    element: Element | Window,
    eventName: string,
    callback: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const optimizedCallback = responsiveOptimizer.throttle(
      `scroll-${eventName}`,
      (event: Event) => {
        performanceProfiler.startTimer('scroll-event');
        callback(event);
        performanceProfiler.endTimer('scroll-event');
      },
      16 // 60fps
    ) as EventListener;

    element.addEventListener(eventName, optimizedCallback, options);
    this.scrollListeners.set(`${eventName}-${element.toString()}`, optimizedCallback);
  }

  // 移除滚动监听
  removeOptimizedScrollListener(
    element: Element | Window,
    eventName: string,
    callback: EventListener,
    options?: EventEventListenerOptions
  ): void {
    const key = `${eventName}-${element.toString()}`;
    const optimizedCallback = this.scrollListeners.get(key);
    if (optimizedCallback) {
      element.removeEventListener(eventName, optimizedCallback, options);
      this.scrollListeners.delete(key);
    }
  }

  // 优化的调整大小监听
  addOptimizedResizeListener(
    element: Element | Window,
    eventName: string,
    callback: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const optimizedCallback = responsiveOptimizer.debounce(
      `resize-${eventName}`,
      (event: Event) => {
        performanceProfiler.startTimer('resize-event');
        callback(event);
        performanceProfiler.endTimer('resize-event');
      },
      100
    ) as EventListener;

    element.addEventListener(eventName, optimizedCallback, options);
    this.resizeListeners.set(`${eventName}-${element.toString()}`, optimizedCallback);
  }

  // 清理所有监听器
  cleanup(): void {
    this.rafCallbacks.forEach((_, id) => cancelAnimationFrame(id));
    this.rafCallbacks.clear();
    this.scrollListeners.clear();
    this.resizeListeners.clear();
  }
}

// 懒加载管理器
export class LazyLoader {
  private observer: IntersectionObserver;
  private loadedElements: Set<Element> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
        this.loadElement(entry.target);
        this.loadedElements.add(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  private loadElement(element: Element): void {
    // 处理图片懒加载
    if (element instanceof HTMLImageElement) {
      const src = element.dataset.src;
      if (src) {
        element.src = src;
        element.onload = () => {
          element.classList.add('loaded');
        };
      }
    }

    // 处理背景图片懒加载
    const bgImage = element.dataset.bgImage;
    if (bgImage) {
      element.style.backgroundImage = `url(${bgImage})`;
      element.classList.add('loaded');
    }

    // 处理组件懒加载
    const component = element.dataset.component;
    if (component) {
      this.loadComponent(element, component);
    }

    // 触发自定义事件
    element.dispatchEvent(new CustomEvent('lazyload', {
      detail: { element },
      bubbles: true,
    }));
  }

  private async loadComponent(element: Element, componentName: string): void {
    try {
      // 动态导入组件
      const module = await import(`@/components/${componentName}`);
      const Component = module.default;
      
      // 创建组件实例
      const componentElement = document.createElement(componentName);
      element.appendChild(componentElement);
      
      element.classList.add('loaded');
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
      element.classList.add('error');
    }
  }

  // 观察元素
  observe(element: Element): void {
    this.observer.observe(element);
  }

  // 停止观察元素
  unobserve(element: Element): void {
    this.observer.unobserve(element);
  }

  // 清理
  cleanup(): void {
    this.observer.disconnect();
    this.loadedElements.clear();
  }
}

// 用户体验工具集
export const uxTools = {
  analyzer: new UXAnalyzer(),
  animationOptimizer: new AnimationOptimizer(),
  lazyLoader: new LazyLoader(),
  
  // 创建平滑滚动
  smoothScroll: (target: Element | string, options: ScrollIntoViewOptions = {}) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        ...options,
      });
    }
  },

  // 创建防抖搜索
  createDebouncedSearch: <T>(
    searchFn: (query: string) => Promise<T[]>,
    delay: number = 300
  ) => {
    return responsiveOptimizer.debounce('search', async (query: string, callback: (results: T[]) => void) => {
      try {
        const results = await searchFn(query);
        callback(results);
      } catch (error) {
        console.error('Search error:', error);
        callback([]);
      }
    }, delay);
  },

  // 创建无限滚动
  createInfiniteScroll: <T>(
    loadMoreFn: () => Promise<T[]>,
    options: {
      threshold?: number;
      root?: Element;
      rootMargin?: string;
    } = {}
  ) => {
    const { threshold = 100, root, rootMargin = '0px' } = options;
    let isLoading = false;
    let hasMore = true;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          isLoading = true;
          
          try {
            const results = await loadMoreFn();
            hasMore = results.length > 0;
          } catch (error) {
            console.error('Infinite scroll error:', error);
            hasMore = false;
          } finally {
            isLoading = false;
          }
        }
      },
      { root, rootMargin: `0px 0px ${threshold}px 0px` }
    );

    return observer;
  },

  // 创建键盘导航
  createKeyboardNavigation: (
    items: HTMLElement[],
    options: {
      loop?: boolean;
      onSelect?: (item: HTMLElement) => void;
    } = {}
  ) => {
    const { loop = true, onSelect } = options;
    let currentIndex = -1;

    const navigate = (direction: 'next' | 'previous') => {
      if (currentIndex >= 0) {
        items[currentIndex].classList.remove('focused');
      }

      if (direction === 'next') {
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex);
      } else {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? items.length - 1 : currentIndex);
      }

      if (currentIndex >= 0) {
        items[currentIndex].classList.add('focused');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          navigate('next');
          break;
        case 'ArrowUp':
          event.preventDefault();
          navigate('previous');
          break;
        case 'Enter':
          if (currentIndex >= 0 && onSelect) {
            onSelect(items[currentIndex]);
          }
          break;
        case 'Escape':
          if (currentIndex >= 0) {
            items[currentIndex].classList.remove('focused');
            currentIndex = -1;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  },
};