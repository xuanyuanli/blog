import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Thought } from '@/lib/types';

/** Markdown 文件目录 */
const THOUGHTS_DIR = path.join(process.cwd(), 'src', 'content', 'thoughts');

/** 从文件名提取 slug（去掉数字前缀） */
function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/^\d+\./, '');
}

/**
 * 将 frontmatter 中的 date 统一格式化为 YYYY-MM-DD
 * gray-matter 会自动将日期字符串解析为 Date 对象，
 * 需要将其转换回简洁的日期格式。
 */
function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) {
    return raw.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // 尝试解析其他格式
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return str;
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
    date: normalizeDate(data.date),
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
  if (!fs.existsSync(THOUGHTS_DIR)) {
    return undefined;
  }

  const files = fs
    .readdirSync(THOUGHTS_DIR)
    .filter((f) => f.endsWith('.md'));

  // 查找 slug 匹配的文件
  const filename = files.find((f) => slugFromFilename(f) === slug);
  if (!filename) {
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
