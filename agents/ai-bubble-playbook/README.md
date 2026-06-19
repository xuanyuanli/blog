# AI 泡沫预警实操 — Agent CLI 实时搜索

基于达利欧 / 席勒 / 林毅夫框架。**所有数值由 Cursor CLI Agent WebSearch 获取**，附 `source_url`；不展示 unverified 数据。

## 环境

- Git Bash
- Cursor CLI（`agent` 在 PATH）
- Python 3.10+（仅 merge + render）

```bash
cd agents/ai-bubble-playbook
pip install -r requirements.txt
```

## 一键重跑

```bash
./scripts/orchestrate.sh
```

流程：

1. 并行 Agent 01–05（WebSearch 宏观 / CAPE / 情绪 / VC / Watchlist）
2. merge → 若有缺口 → Agent 06 补数
3. render_html.py → `stock/public/ai-bubble-playbook.html`

**无 Agent CLI 时**：可手动维护 `data/agent/*.json` 后执行：

```bash
python scripts/merge_research.py --phase pre -o data/research_merged.json --root .
python scripts/render_html.py -i data/research_merged.json -o ../../stock/public/ai-bubble-playbook.html --repo-root ../..
```

## 报告结构

1. **结论** — 当前阶段 +  actionable 清单
2. **论点** — 三学者框架
3. **论据** — 带来源的指标与 Watchlist
4. **附录** — 三阶段手册

## 数据规则

- `confirmed`：官方源（FRED / Multpl / SEC）或 ≥2 源交叉
- `indirect`：单一权威媒体/数据库
- `unverified`：**不进入 HTML**

Skill：`.cursor/skills/ai-bubble-playbook/SKILL.md`
