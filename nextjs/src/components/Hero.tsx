'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { profile } from '@/content/site';

/** 代码流动动画的代码行 */
const codeLines: string[] = [
  'const ai = new AIPartner();',
  'const idea = "我想要...";',
  'const code = ai.generate(idea);',
  'const review = human.judge(code);',
  'const product = ai.iterate(review);',
  '// 对话式编程，新时代',
];

/** Hero 区域组件 - 全屏首屏，打字机动画 + 代码流动背景 */
export default function Hero() {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [codeOpacity, setCodeOpacity] = useState<number>(0);

  useEffect(() => {
    // 打字机效果
    const fullText: string = profile.tagline;
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 代码背景淡入
    const timer = setTimeout(() => setCodeOpacity(1), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 代码流动背景 */}
      <div
        className="absolute inset-0 flex flex-col justify-center items-start px-12 md:px-24 opacity-[0.06] font-mono text-sm leading-8 pointer-events-none select-none"
        style={{ opacity: codeOpacity * 0.06 }}
      >
        {codeLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.5, duration: 1 }}
          >
            {line}
          </motion.div>
        ))}
        {/* 重复填充更多行 */}
        {codeLines.map((line, i) => (
          <motion.div
            key={`repeat-${i}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: (i + codeLines.length) * 0.5, duration: 1 }}
          >
            {line}
          </motion.div>
        ))}
      </div>

      {/* 渐变光晕装饰 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-start/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-end/20 rounded-full blur-[128px] pointer-events-none" />

      {/* 主内容 */}
      <div className="relative z-10 text-center px-6">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gradient">{displayedText}</span>
          <span className="animate-pulse text-accent-start">|</span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {profile.subtitle}
        </motion.p>
      </div>

      {/* 滚动提示 */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <a
          href="#philosophy"
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
          aria-label="向下滚动"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
