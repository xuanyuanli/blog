'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getKey(path: string): string {
  return `scroll-pos-${path}`;
}

/** 滚动位置恢复组件 - 按路径独立保存/恢复 */
export default function ScrollRestoration() {
  const pathname = usePathname();

  // 页面加载时恢复该路径的滚动位置
  useEffect(() => {
    const key = getKey(pathname);
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        const position = parseInt(saved, 10);
        if (!isNaN(position) && position > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: position, behavior: 'instant' as ScrollBehavior });
          });
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem(key);
    }
  }, [pathname]);

  // F5 刷新时保存
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      sessionStorage.setItem(getKey(pathname), String(window.scrollY));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);

  // 点击内部导航链接时保存当前位置
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const el = (e.target as HTMLElement).closest('a');
      if (!el) return;
      const href = el.getAttribute('href');
      if (!href) return;
      // 内部链接且不是锚点
      if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('#')) {
        sessionStorage.setItem(getKey(pathname), String(window.scrollY));
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [pathname]);

  return null;
}
