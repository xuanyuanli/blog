#!/usr/bin/env bash
# 仅 merge + render（已有 data/agent/*.json 时使用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source "$ROOT/scripts/lib/common.sh"
PYTHON_CMD="$(resolve_python)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"

"$PYTHON_CMD" "$ROOT/scripts/merge_research.py" --phase pre --output "$ROOT/data/research_merged.json" --root "$ROOT"
"$PYTHON_CMD" "$ROOT/scripts/render_html.py" \
  --input "$ROOT/data/research_merged.json" \
  --output "$REPO_ROOT/stock/public/ai-bubble-playbook.html" \
  --repo-root "$REPO_ROOT"
log "Rendered → $REPO_ROOT/stock/public/ai-bubble-playbook.html"
