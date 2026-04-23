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

/** AI 编程观 - 5 个核心观点 */
export const philosophies: Philosophy[] = [
  {
    id: 'intent-precision',
    icon: 'Crosshair',
    title: '意图精度是新的类型系统',
    description:
      '传统编程靠类型约束代码，AI 编程靠意图约束输出。意图模糊 = 输出必定跑偏，和类型缺失 = 运行时报错是同一件事。精确表达意图，是 AI 时代的类型安全。',
  },
  {
    id: 'review-bottleneck',
    icon: 'Gauge',
    title: '速度翻倍，审核是瓶颈',
    description:
      'AI 让代码产出翻倍，但审核压力也翻倍。越快，越需要慢下来审查。你的阅读理解力和判断力才是真正的吞吐量瓶颈——投资审码能力，比研究 Prompt 技巧回报更高。',
  },
  {
    id: 'probabilistic',
    icon: 'Shuffle',
    title: '确定性退化为概率性',
    description:
      '传统代码：相同输入确定输出。AI 辅助代码：相同意图可能产出不同实现。这改变了正确性的定义——你不能只测一次，你需要持续验证。',
  },
  {
    id: 'commander',
    icon: 'Scale',
    title: '从编码者到指挥者',
    description:
      '工作重心从生产代码行转向策展、审核、决策。不要和 AI 比编码，要比谁能更好地指挥 AI——command、skill、agent、工作流、质量管理、规则管理。',
  },
  {
    id: 'intern',
    icon: 'Users',
    title: 'AI 是高能实习生',
    description:
      '能力强、速度快、没判断力、偶尔一本正经胡说八道。用它完成 80% 的执行工作，你把控最后 20%——这 20% 就是你的价值所在。',
  },
];

/** 实践案例 */
export const caseStudies: CaseStudy[] = [
  {
    id: 'this-site',
    title: '本站：用 AI 重构个人品牌站点',
    description:
      '从 VuePress + vdoing 主题的传统博客，到 Next.js + Tailwind CSS 的现代展示站。AI 参与了 80% 的代码生成。',
    tags: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    highlights: [
      'VuePress → Next.js，技术栈全面升级',
      'AI 参与架构设计、组件实现、样式编写',
      '静态导出，零运维成本',
      '从"知识仓库"到"个人品牌"的定位转型',
    ],
  },
];
