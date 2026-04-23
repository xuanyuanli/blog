'use client';

import { motion } from 'framer-motion';
import { Crosshair, Gauge, Shuffle, Scale, Users } from 'lucide-react';
import { philosophies } from '@/content/site';

/** 图标映射表 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crosshair,
  Gauge,
  Shuffle,
  Scale,
  Users,
};

/** AI 编程观板块组件 - 展示 5 个核心观点 */
export default function AiPhilosophy() {
  return (
    <section id="philosophy" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          AI 编程观
        </motion.h2>
        <motion.p
          className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          关于 AI 与编程，我坚信的几件事
        </motion.p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {philosophies.map((item, index) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.div
                key={item.id}
                className="group p-8 rounded-2xl border border-white/10 bg-[var(--card-bg)] backdrop-blur-sm hover:border-accent-start/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                {/* 图标 */}
                <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center mb-6">
                  {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>

                {/* 标题 */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-gradient transition-all">
                  {item.title}
                </h3>

                {/* 描述 */}
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
