# Task 04 — 一级市场 VC / IPO（泡沫预警验证）

## 任务

1. AI 赛道 VC 融资是否持续下滑（NVCA、Crunchbase 公开摘要、TechCrunch）
2. IPO 推迟/撤单案例（Renaissance IPO ETF、SEC S-1 统计思路）
3. 对成长股仓位的操作含义：融资下滑 + IPO delay → 进一步减仓

## 输出

`data/agent/04-vc-ipo.json`，indicators: `vc_funding_trend`, `ipo_pipeline_delay`（多为 narrative + indirect）

PitchBook 付费数据不可用则明确标注，改用 NVCA + 新闻。
