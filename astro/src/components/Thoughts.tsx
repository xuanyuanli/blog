import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Thought } from '@/lib/types';

interface Props {
  thoughts: Thought[];
}

/** 首页思考碎片板块组件 - 展示最新思考 */
export default function Thoughts({ thoughts }: Props) {
  return (
    <section id="thoughts" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          思考碎片
        </motion.h2>
        <motion.p
          className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          不系统的、碎片化的、但真实的想法
        </motion.p>

        <div className="space-y-6">
          {thoughts.map((thought, index) => (
            <motion.div
              key={thought.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <a
                href={`/thoughts/${thought.slug}`}
                className="block p-6 rounded-xl border border-white/10 bg-[var(--card-bg)] hover:border-accent-start/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {thought.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-gradient transition-all">
                      {thought.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                      {thought.excerpt}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-accent-start transition-colors mt-6 flex-shrink-0" />
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* 查看全部 */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <a
            href="/thoughts"
            className="inline-flex items-center gap-2 text-accent-start hover:text-accent-end transition-colors"
          >
            <span>查看全部</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
