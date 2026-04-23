import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllThoughts } from '@/lib/thoughts-loader';
import Navbar from '@/components/Navbar';

/** 思考碎片列表页 */
export default function ThoughtsPage() {
  const thoughts = getAllThoughts();

  return (
    <main>
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* 返回首页 */}
          <Link
            href="/"
            scroll={false}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首页</span>
          </Link>

          <h1 className="text-4xl font-bold mb-4">思考碎片</h1>
          <p className="text-[var(--text-secondary)] mb-12">
            不系统的、碎片化的、但真实的想法
          </p>

          {/* 思考列表 */}
          <div className="space-y-8">
            {thoughts.map((thought) => (
              <Link
                key={thought.slug}
                href={`/thoughts/${thought.slug}`}
                className="block p-6 rounded-xl border border-white/10 bg-[var(--card-bg)] hover:border-accent-start/50 transition-all duration-300 group"
              >
                <span className="text-xs text-[var(--text-secondary)] mb-2 block">
                  {thought.date}
                </span>
                <h2 className="text-xl font-medium mb-2 group-hover:text-gradient transition-all">
                  {thought.title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                  {thought.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
