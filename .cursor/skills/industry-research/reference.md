# 行业研究报告 HTML 参考

## 文件骨架

基于 `h200-industry-chain.html` 风格，复制以下 `<head>` 样式块并按需微调主题色：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{标题}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .tree ul { margin-left: 1.25rem; padding-left: 1rem; border-left: 1px solid #dbeafe; }
    .tree li { margin: .55rem 0; }
    .tree li::marker { color: #2563eb; }
    details > summary { cursor: pointer; list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    details > summary::before { content: "▸"; display: inline-block; margin-right: .4rem; color: #2563eb; transition: transform .15s ease; }
    details[open] > summary::before { transform: rotate(90deg); }
    .cost { display: inline-block; border-radius: 999px; background: #e0f2fe; color: #075985; padding: .12rem .55rem; font-size: .78rem; font-weight: 700; }
    .ashare { display: inline-block; border-radius: .45rem; background: #fee2e2; color: #b91c1c; padding: .05rem .4rem; font-size: .75rem; font-weight: 700; }
    .ashare-key { display: inline-block; border-radius: .45rem; background: #fef3c7; color: #92400e; padding: .05rem .4rem; font-size: .75rem; font-weight: 800; }
    .evidence { display: inline-block; border-radius: .45rem; padding: .05rem .4rem; font-size: .75rem; font-weight: 700; }
    .evidence-confirmed { background: #dcfce7; color: #166534; }
    .evidence-indirect { background: #ede9fe; color: #5b21b6; }
    .evidence-private { background: #f1f5f9; color: #334155; }
    .why { color: #475569; }
    table.data th, table.data td { border: 1px solid #e2e8f0; padding: .55rem .75rem; text-align: left; vertical-align: top; }
    table.data th { background: #f8fafc; font-weight: 700; }
    .prosperity-up { background: #dcfce7; color: #166534; }
    .prosperity-flat { background: #fef3c7; color: #92400e; }
    .prosperity-down { background: #fee2e2; color: #991b1b; }
    a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
  </style>
</head>
```

页末保留 h200 的 `<script>` 块，自动将产业链树 `<li>` 包装为 `<details>`。

## 推荐章节结构

```text
0. Header（四锚点摘要 + 数据规则）
1. 关键指标卡片（4 列 grid）
2. 阅读口径 / 方法论
3. 论文要点与产业映射
4. 热点与政策时间线
5. 成本总览（产业链树 · details 折叠）
6. 景气度研判（短/中/长期 + 1-5 年表）
7. 核心上市公司（国际 · 国内 · 分环节 listing）
8. 上市公司多维度对比表
9. 投资机会与跟踪优先级
10. 主要来源
11. 免责声明 footer
```

## 关键指标卡片（示例）

| 卡片 | 典型内容 |
|------|----------|
| 终端规模/价格 | 市场规模、典型 ASP、渗透率 |
| 最大成本池 | 哪一环节占 BOM/TCO 最高 |
| 当前瓶颈 | 产能、材料、认证、政策 |
| 景气方向 | 1-3 年一句话 + 标签色 |

## 论文映射专节模板

```html
<section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h2 class="text-2xl font-bold">论文要点与产业映射</h2>
  <p class="mt-2 text-sm text-slate-500">论文：{标题} · {作者/机构} · {发表年}</p>
  <ul class="mt-4 list-disc pl-6 leading-7">
    <li><strong>核心结论</strong>：…</li>
    <li><strong>成本/效率启示</strong>：…</li>
    <li><strong>产业验证状态</strong>：实验室 / 中试 / 量产 / 存疑</li>
    <li><strong>投资映射</strong>：利好 {环节}；利空 {环节}</li>
  </ul>
</section>
```

## 景气度表

| 时间尺度 | 方向 | 置信度 | 核心驱动 | 关键风险 |
|----------|------|--------|----------|----------|
| 短期 0-12M | 上行/震荡/下行 | 高/中/低 | … | … |
| 中期 1-3Y | … | … | … | … |
| 长期 3-5Y+ | … | … | … | … |
| **1-5 年综合** | … | … | 渗透率/Capex/政策 | … |

方向单元格用 `prosperity-up` / `prosperity-flat` / `prosperity-down` class。

## 上市公司对比表（必含列）

| 公司 | 市场 | 环节 | 护城河 | 技术壁垒 | 订单能见度 | 业绩拐点 | 戴维斯双击 | 估值语境 | 风险 |
|------|------|------|--------|----------|------------|----------|------------|----------|------|

填写说明：

- **业绩拐点**：具体触发器（如「2026H2 新产线投产」「毛利率由负转正」）
- **戴维斯双击**：分别写「EPS 驱动」与「PE 驱动」是否具备；缺一则写「单腿」
- **订单能见度**：区分 RPO/Backlog/框架合同/媒体传闻
- **估值语境**：若已跑 stock-analysis，填 PE/PB 分位；否则写「待抓数」

## 产业链树节点格式

```html
<li>
  <span class="font-semibold">{环节名}</span>
  <span class="cost">约 X-Y% / 约 A-B 单位</span>
  <ul class="list-disc">
    <li>
      <span class="font-semibold">{公司}</span>
      <span class="evidence evidence-confirmed">年报</span>
      <span class="why">卡位说明…</span>
    </li>
    <li>
      <span class="ashare">A股</span>
      <span class="ashare-key">重点</span>
      <span class="evidence evidence-indirect">产业链相关</span>
      <span class="font-semibold">{A 股公司}</span>
      <span class="why">…</span>
    </li>
  </ul>
</li>
```

## 投资机会专节

```html
<section class="mb-8">
  <h2 class="text-2xl font-bold">投资机会与跟踪优先级</h2>
  <ol class="mt-4 list-decimal pl-6 leading-7 space-y-3">
    <li><strong>第一优先级</strong>：{环节} — {逻辑} — {代表公司}</li>
    <li><strong>弹性标的</strong>：…（高波动风险）</li>
    <li><strong>预期差</strong>：市场定价 … vs 调研 …</li>
    <li><strong>谨慎/回避</strong>：…</li>
  </ol>
</section>
```

## 免责声明（footer，必填）

```html
<footer class="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
  <p class="font-semibold text-slate-900">免责声明</p>
  <ul class="mt-2 list-disc pl-6">
    <li>本文用于产业链与行业研究，不构成投资建议。</li>
    <li>成本比例为公开资料交叉估算，非官方 BOM。</li>
    <li>「A股重点」表示值得优先跟踪，不等同于确认订单或收入占比。</li>
    <li>论文观点不代表已被产业完全验证，须结合后续披露独立判断。</li>
  </ul>
</footer>
```

## public-html.ts 注册

```typescript
export const PUBLIC_HTML_PATHS = new Set([
  // ...existing
  '/{slug}.html',
])
```
