/** 站点核心类型定义 */

/** AI 编程观观点 */
export interface Philosophy {
  /** 唯一标识 */
  id: string;
  /** 图标名称 (lucide-react icon name) */
  icon: string;
  /** 观点标题 */
  title: string;
  /** 观点描述 */
  description: string;
}

/** 实践案例 */
export interface CaseStudy {
  /** 唯一标识 */
  id: string;
  /** 案例标题 */
  title: string;
  /** 案例描述 */
  description: string;
  /** 技术栈标签 */
  tags: string[];
  /** 案例详情/亮点 */
  highlights: string[];
}

/** 思考碎片 */
export interface Thought {
  /** URL slug */
  slug: string;
  /** 标题 */
  title: string;
  /** 发布日期 (ISO 格式) */
  date: string;
  /** 摘要 */
  excerpt: string;
  /** 正文内容 (Markdown) */
  content: string;
}

/** 个人信息 */
export interface Profile {
  /** 显示名称 */
  name: string;
  /** 一句话定位 */
  tagline: string;
  /** 副标题 */
  subtitle: string;
  /** GitHub 链接 */
  github: string;
  /** 邮箱 */
  email: string;
  /** 旧博客存档路径 */
  archiveUrl: string;
}

/** 导航项 */
export interface NavItem {
  /** 显示文本 */
  label: string;
  /** 锚点或路径 */
  href: string;
}
