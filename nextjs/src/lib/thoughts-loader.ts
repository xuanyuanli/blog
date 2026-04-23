import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Thought } from '@/lib/types';

/** Markdown 文件目录 */
const THOUGHTS_DIR = path.join(process.cwd(), 'src', 'content', 'thoughts');

/** 从文件名提取 slug */
function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '');
}

/** 读取并解析单个 Markdown 文件 */
function parseThoughtFile(filename: string): Thought {
  const slug = slugFromFilename(filename);
  const filePath = path.join(THOUGHTS_DIR, filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: String(data.title),
    date: String(data.date),
    excerpt: String(data.excerpt),
    content: content.trim(),
  };
}

/** 获取所有思考碎片（按日期倒序） */
export function getAllThoughts(): Thought[] {
  if (!fs.existsSync(THOUGHTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(THOUGHTS_DIR)
    .filter((f) => f.endsWith('.md'));

  const thoughts = files.map(parseThoughtFile);

  // 按日期倒序排列
  return thoughts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** 获取最新 N 条思考碎片 */
export function getLatestThoughts(count: number = 3): Thought[] {
  return getAllThoughts().slice(0, count);
}

/** 根据 slug 获取思考碎片 */
export function getThoughtBySlug(slug: string): Thought | undefined {
  const filename = `${slug}.md`;
  const filePath = path.join(THOUGHTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return parseThoughtFile(filename);
}

/** 获取所有思考碎片的 slug 列表（用于静态生成） */
export function getAllThoughtSlugs(): string[] {
  if (!fs.existsSync(THOUGHTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(THOUGHTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(slugFromFilename);
}
