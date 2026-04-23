import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAllThoughtSlugs, getThoughtBySlug } from '@/lib/thoughts-loader';
import Navbar from '@/components/Navbar';

/** 静态路由参数生成 */
export function generateStaticParams(): { slug: string }[] {
  return getAllThoughtSlugs().map((slug) => ({ slug }));
}

/** 思考碎片详情页 */
export default function ThoughtDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const thought = getThoughtBySlug(params.slug);

  if (!thought) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">未找到该思考</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <article className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* 返回 */}
          <Link
            href="/thoughts"
            scroll={false}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </Link>

          {/* 标题 */}
          <h1 className="text-4xl font-bold mb-4">{thought.title}</h1>
          <time className="text-sm text-[var(--text-secondary)] mb-8 block">
            {thought.date}
          </time>

          {/* 正文 - react-markdown 渲染 */}
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {thought.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    </main>
  );
}
