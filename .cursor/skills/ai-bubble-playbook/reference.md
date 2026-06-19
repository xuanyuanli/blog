# HTML 参考 — 结论先行

## 章节顺序（强制）

1. **结论** — headline、phase、actions、清仓/减仓清单
2. **论点** — 达利欧 / 席勒 / 林毅夫各一句
3. **触发信号** — 来自 merge `signals`
4. **论据 · 指标快照** — 4 卡片
5. **论据 · 指标明细** — 带 source 链接
6. **论据 · Watchlist**
7. **论据 · 叙事**
8. **附录 · 三阶段手册**

## 禁止

- 展示 `confidence: unverified` 行
- 使用 Python FRED/yfinance 作为主数据源
- 无 source_url 的数值标为 confirmed

## 生成

```bash
python agents/ai-bubble-playbook/scripts/render_html.py \
  -i agents/ai-bubble-playbook/data/research_merged.json \
  -o stock/public/ai-bubble-playbook.html \
  --repo-root .
```
