import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { profile } from '@/content/site';

/** 历史作品板块组件 - 链接到旧博客存档 */
export default function Archive() {
  return (
    <section id="archive" className="py-24 px-6 bg-secondary/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">历史作品</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            2018-2024 年的技术博客存档。那时还是手工编程的时代，记录了 Java、Spring、前端等技术的探索历程。
          </p>

          <a
            href={profile.archiveUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-[var(--card-bg)] hover:border-accent-start/50 transition-all duration-300 text-[var(--text-secondary)] hover:text-white"
          >
            <span>访问存档</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
