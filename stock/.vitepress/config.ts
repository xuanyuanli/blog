import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function dataSidebar() {
  const dataDir = path.resolve(__dirname, '../data')
  if (!fs.existsSync(dataDir)) return []

  return fs
    .readdirSync(dataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map((dir) => {
      const stockDir = path.join(dataDir, dir.name)
      const reports = fs
        .readdirSync(stockDir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
        .sort((a, b) => b.localeCompare(a))

      const items = [
        { text: '概览', link: `/data/${dir.name}/` },
        ...reports.map((f, i) => ({
          text: i === 0 ? `${f.replace('.md', '')}（最新）` : f.replace('.md', ''),
          link: `/data/${dir.name}/${f.replace('.md', '')}`,
        })),
      ]

      return { text: dir.name, collapsed: false, items }
    })
}

export default defineConfig({
  base: '/',
  lang: 'zh-CN',
  title: '股票定价研究',
  description: '基于 stock-pricing-patterns 框架的个股定价分析与研究报告',
  cleanUrls: false,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '报告', link: '/data/' },
      { text: '定价框架', link: '/stock-pricing-patterns.html', target: '_self' },
      { text: 'H200 产业链', link: '/h200-industry-chain.html', target: '_self' },
      { text: '大宗商品', link: '/commodity-pricing-framework.html', target: '_self' },
    ],
    sidebar: {
      '/data/': [
        { text: '报告总览', link: '/data/' },
        ...dataSidebar(),
      ],
    },
    outline: { level: [2, 3] },
    footer: {
      message: '框架研究结论，非个性化投顾服务；据此操作风险自担。',
    },
  },
})
