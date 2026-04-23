'use client';

import { motion } from 'framer-motion';
import { caseStudies } from '@/content/site';

/** 实践案例板块组件 - 展示用 AI 完成的项目案例 */
export default function CaseStudy() {
  return (
    <section id="case-study" className="py-24 px-6 bg-secondary/50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          实践案例
        </motion.h2>
        <motion.p
          className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          不只是思考，更在实践
        </motion.p>

        <div className="space-y-8">
          {caseStudies.map((cs, index) => (
            <motion.div
              key={cs.id}
              className="p-8 rounded-2xl border border-white/10 bg-[var(--card-bg)] backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              {/* 标题和描述 */}
              <h3 className="text-2xl font-semibold mb-3">{cs.title}</h3>
              <p className="text-[var(--text-secondary)] mb-6">{cs.description}</p>

              {/* 技术栈标签 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {cs.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs rounded-full border border-white/10 text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 亮点列表 */}
              <ul className="space-y-2">
                {cs.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-accent-start mt-1">+</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
