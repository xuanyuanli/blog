import type { Profile, Philosophy, CaseStudy, NavItem } from '@/lib/types';

/** 个人信息配置 */
export const profile: Profile = {
  name: '轩辕李',
  tagline: '和 AI 一起编程',
  subtitle: '实践者 / 思考者',
  github: 'https://github.com/xuanyuanli',
  email: 'xuanyuanli999@gmail.com',
  archiveUrl: '/archive/',
};

/** 导航配置 */
export const navItems: NavItem[] = [
  { label: '编程观', href: '#philosophy' },
  { label: '案例', href: '#case-study' },
  { label: '思考', href: '#thoughts' },
  { label: '存档', href: '#archive' },
  { label: '联系', href: '#contact' },
];

/** AI 编程观 - 3 个核心观点 */
export const philosophies: Philosophy[] = [
  {
    id: 'partner',
    icon: 'Users',
    title: 'AI 是搭档，不是工具',
    description:
      '工具是被动的，你用它做事；搭档是主动的，它和你一起思考。当 AI 能理解上下文、提出建议、甚至质疑你的决策时，编程就变成了对话。',
  },
  {
    id: 'prompt-engineering',
    icon: 'Terminal',
    title: '提示工程是新的编程范式',
    description:
      '从前我们用语法告诉机器做什么，现在我们用意图告诉 AI 想要什么。表达清晰、逻辑完整、边界明确——这不就是编程的本质吗？',
  },
  {
    id: 'judgment',
    icon: 'Scale',
    title: '人的价值在判断力，不在编码力',
    description:
      'AI 可以写出你想到的任何代码，但它无法替你判断：该不该写？为谁写？写了值不值得？未来的核心竞争力是品味、判断和决策。',
  },
];

/** 实践案例 */
export const caseStudies: CaseStudy[] = [
  {
    id: 'this-site',
    title: '本站：用 AI 重构个人品牌站点',
    description:
      '从 VuePress + vdoing 主题的传统博客，到 Next.js + Tailwind CSS 的现代展示站。AI 参与了 80% 的代码生成。',
    tags: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    highlights: [
      'VuePress → Next.js，技术栈全面升级',
      'AI 参与架构设计、组件实现、样式编写',
      '静态导出，零运维成本',
      '从"知识仓库"到"个人品牌"的定位转型',
    ],
  },
];
