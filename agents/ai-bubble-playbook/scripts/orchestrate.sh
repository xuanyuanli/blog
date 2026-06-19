#!/usr/bin/env bash
# AI bubble playbook — Agent CLI 实时搜索为主（Git Bash 唯一入口）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DATA="$ROOT/data"
AGENT_DIR="$DATA/agent"
LOG_DIR="$DATA/logs"
SCRIPTS="$ROOT/scripts"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
  esac
done

mkdir -p "$AGENT_DIR" "$LOG_DIR"

# shellcheck source=lib/common.sh
source "$SCRIPTS/lib/common.sh"

PYTHON_CMD="$(resolve_python)"

if ! command -v agent >/dev/null 2>&1; then
  log "ERROR: cursor CLI 'agent' 不在 PATH。请安装 Cursor CLI 后重试。"
  log "  文档: https://cursor.com/docs/cli/headless"
  log "  若仅渲染已有 data/agent/*.json: $PYTHON_CMD $SCRIPTS/merge_research.py && render_html.py"
  exit 1
fi

log "Phase 1: 并行 Agent 实时搜索（01–05）"
run_parallel_agents \
  "01|01-macro-liquidity.md|$AGENT_DIR/01-macro.json" \
  "02|02-valuation-cape.md|$AGENT_DIR/02-valuation.json" \
  "03|03-sentiment-flows.md|$AGENT_DIR/03-sentiment.json" \
  "04|04-vc-ipo-primary.md|$AGENT_DIR/04-vc-ipo.json" \
  "05|05-bottom-screening.md|$AGENT_DIR/05-bottom.json"

log "Phase 2: 合并 + 缺口检测"
"$PYTHON_CMD" "$SCRIPTS/merge_research.py" --phase pre --output "$DATA/research_pre.json" --root "$ROOT"

GAPS_N=$(json_gaps_count "$DATA/gaps.json")
if [[ "$GAPS_N" -gt 0 ]]; then
  log "Phase 2b: Agent 06 补数 ($GAPS_N gaps)"
  run_parallel_agents "06|06-fallback-fill.md|$AGENT_DIR/06-fallback.json"
  "$PYTHON_CMD" "$SCRIPTS/merge_research.py" --phase final --output "$DATA/research_merged.json" --root "$ROOT"
else
  cp "$DATA/research_pre.json" "$DATA/research_merged.json"
  log "无缺口，跳过 Agent 06"
fi

log "Phase 3: 生成 HTML（结论先行，仅 verified 数据）"
"$PYTHON_CMD" "$SCRIPTS/render_html.py" \
  --input "$DATA/research_merged.json" \
  --output "$REPO_ROOT/stock/public/ai-bubble-playbook.html" \
  --repo-root "$REPO_ROOT"

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry-run complete."
fi

log "Done → $REPO_ROOT/stock/public/ai-bubble-playbook.html"
