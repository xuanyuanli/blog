#!/usr/bin/env bash
# Shared helpers for ai-bubble-playbook orchestration (Git Bash)

set -euo pipefail

log() { echo "[$(date '+%H:%M:%S')] $*"; }

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: required command not found: $cmd"
    exit 1
  fi
}

resolve_python() {
  for cmd in "${PYTHON:-}" python python3 py; do
    [[ -z "$cmd" ]] && continue
    if command -v "$cmd" >/dev/null 2>&1; then
      echo "$cmd"
      return 0
    fi
  done
  log "ERROR: python not found (set PYTHON=/path/to/python)"
  exit 1
}

json_gaps_count() {
  local file="$1"
  if [[ ! -s "$file" ]]; then
    echo 0
    return
  fi
  if command -v jq >/dev/null 2>&1; then
    jq '.gaps | length' "$file" 2>/dev/null || echo 0
  else
    local py
    py="$(resolve_python)"
    "$py" -c "import json; d=json.load(open('$file')); print(len(d.get('gaps',[])))" 2>/dev/null || echo 0
  fi
}

# Run up to MAX_PARALLEL background agent jobs
# Usage: run_parallel_agents "id|task_file|out_file" ...
run_parallel_agents() {
  local max="${MAX_PARALLEL:-5}"
  local -a pids=()

  for spec in "$@"; do
    IFS='|' read -r id task out <<< "$spec"
    while [[ ${#pids[@]} -ge $max ]]; do
      if wait -n 2>/dev/null; then
        :
      else
        local pid="${pids[0]}"
        wait "$pid" || log "WARN: agent $pid exited non-zero"
        pids=("${pids[@]:1}")
      fi
      local new_pids=()
      for p in "${pids[@]}"; do
        if kill -0 "$p" 2>/dev/null; then
          new_pids+=("$p")
        fi
      done
      pids=("${new_pids[@]}")
    done

    local logfile="$LOG_DIR/${id}.log"
    log "Starting agent $id ($task) -> $out"
    (
      agent -p --force --output-format text \
        "严格只读调研任务。读取 ${ROOT}/tasks/${task} 与 ${ROOT}/data 下 JSON；使用 WebSearch；A股可用 mx-search（MX_APIKEY）。将完整 JSON 写入 ${out}；每条指标必须含 id,value,source,source_url,as_of,confidence,fetch_layer；禁止编造；找不到则 confidence=unverified,value=null。仅允许写入 ${out}。"
    ) > "$logfile" 2>&1 &
    pids+=($!)
  done

  for pid in "${pids[@]}"; do
    wait "$pid" || log "WARN: agent pid $pid exited non-zero"
  done
  log "All parallel agents finished."
}
