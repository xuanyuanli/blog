---
name: ai-bubble-playbook
description: AI 泡沫预警实操 — 结论先行报告；Cursor CLI Agent WebSearch 实时取数（非 Python 爬虫）；输出 stock/public/ai-bubble-playbook.html。触发词：AI泡沫、泡沫预警、CAPE、底部选股。
---

# AI 泡沫预警实操 Skill

## 核心原则

1. **结论先行**：HTML 先给「现在该做什么」，再给论据与来源
2. **Agent CLI 取数**：禁止 Python 爬虫替代；用 `agent -p` + WebSearch 查 FRED/Multpl/Yahoo/公告
3. **不展示 unverified**：无 source_url 或未交叉验证的数据不进报告

## 工作流

```bash
cd agents/ai-bubble-playbook
./scripts/orchestrate.sh
cd ../../stock && npm run build
```

Checklist：

- [ ] `agent` 在 PATH
- [ ] 并行跑 tasks 01–05 → `data/agent/*.json`
- [ ] merge → gaps → 可选 Agent 06
- [ ] render_html.py
- [ ] 检查 HTML 第一节「结论」是否完整

## Agent 任务

| Task | 内容 |
|------|------|
| 01-macro-liquidity | DFII10、BBB 利差、融资余额、全球冲击 |
| 02-valuation-cape | CAPE、纳指回撤、2000 对标 |
| 03-sentiment-flows | AI ETF、媒体情绪 |
| 04-vc-ipo-primary | VC/IPO 管道 |
| 05-bottom-screening | Watchlist 分层 + PS/涨幅 |
| 06-fallback-fill | gaps.json 补数 |

## 输出 JSON 字段（强制）

每条 indicator：`id`, `value`, `source`, `source_url`, `as_of`, `confidence`, `fetch_layer: agent_search`

## 参考

- `agents/ai-bubble-playbook/tasks/`
- `.cursor/skills/ai-bubble-playbook/reference.md`
