import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllThoughtSlugs, getThoughtBySlug } from '@/content/thoughts';
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

          {/* 正文 - 简单的 Markdown 渲染 */}
          <div className="prose prose-invert max-w-none">
            {thought.content.split('\n').map((line, i) => {
              // 标题
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-semibold mt-8 mb-4">{line.slice(4)}</h3>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-semibold mt-8 mb-4">{line.slice(3)}</h2>;
              }
              // 列表项
              if (line.startsWith('- ')) {
                return <li key={i} className="text-[var(--text-secondary)] ml-4">{renderInlineMarkdown(line.slice(2))}</li>;
              }
              // 有序列表
              if (/^\d+\.\s/.test(line)) {
                const text = line.replace(/^\d+\.\s/, '');
                return <li key={i} className="text-[var(--text-secondary)] ml-4 list-decimal">{renderInlineMarkdown(text)}</li>;
              }
              // 加粗
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-semibold mt-4">{line.slice(2, -2)}</p>;
              }
              // 空行
              if (line.trim() === '') {
                return <br key={i} />;
              }
              // 普通段落
              return <p key={i} className="text-[var(--text-secondary)] leading-relaxed">{renderInlineMarkdown(line)}</p>;
            })}
          </div>
        </div>
      </article>
    </main>
  );
}

/** 简单的内联 Markdown 渲染（加粗） */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
