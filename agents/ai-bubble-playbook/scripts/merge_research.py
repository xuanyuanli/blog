#!/usr/bin/env python3
"""Merge Agent CLI search JSON → research_merged.json + conclusions (no Python scrape)."""

from __future__ import annotations

from labels import WARNING_ACTIONS, pick_trim_stocks

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

CONFIDENCE_OK = {"confirmed", "indirect"}


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_indicators_registry(root: Path) -> dict[str, dict[str, Any]]:
    reg: dict[str, dict[str, Any]] = {}
    path = root / "indicators.yaml"
    if not path.is_file() or yaml is None:
        return reg
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    for item in data.get("indicators") or []:
        if item.get("id"):
            reg[item["id"]] = item
    return reg


def normalize_indicator(rec: dict[str, Any]) -> dict[str, Any]:
    out = dict(rec)
    if out.get("value") is None:
        out["confidence"] = "unverified"
        out["freshness"] = "missing"
    if out.get("confidence") == "confirmed" and not (out.get("source") and out.get("source_url")):
        out["confidence"] = "indirect" if out.get("source") else "unverified"
    if out.get("fetch_layer") is None:
        out["fetch_layer"] = "agent_search"
    return out


def collect_agent_files(agent_dir: Path) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    if not agent_dir.is_dir():
        return tasks
    for p in sorted(agent_dir.glob("*.json")):
        if p.name.endswith(".sample.json"):
            continue
        data = load_json(p)
        if data:
            data["_file"] = p.name
            tasks.append(data)
    return tasks


def merge_indicators(tasks: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for task in tasks:
        for rec in task.get("indicators") or []:
            iid = rec.get("id")
            if not iid:
                continue
            rec = normalize_indicator(rec)
            existing = by_id.get(iid)
            if existing is None or (existing.get("value") is None and rec.get("value") is not None):
                by_id[iid] = rec
            elif existing.get("value") is not None and rec.get("value") is not None:
                try:
                    ev, nv = float(existing["value"]), float(rec["value"])
                    if ev != 0 and abs(nv - ev) / abs(ev) > 0.05:
                        existing.setdefault(
                            "footnote",
                            f"交叉验证: {rec.get('source')} 报 {nv}，主值 {ev}",
                        )
                except (TypeError, ValueError):
                    pass
    return by_id


def verified_only(by_id: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {k: v for k, v in by_id.items() if v.get("confidence") in CONFIDENCE_OK and v.get("value") is not None}


def build_gaps(by_id: dict[str, dict[str, Any]], registry: dict[str, dict]) -> list[dict[str, Any]]:
    gaps: list[dict[str, Any]] = []
    for iid, reg in registry.items():
        rec = by_id.get(iid)
        if rec is None or rec.get("value") is None or rec.get("confidence") not in CONFIDENCE_OK:
            tier = reg.get("agent_search") or next(
                (t for t in (reg.get("fetch_tiers") or []) if t.get("layer") == "agent_search"),
                {},
            )
            gaps.append(
                {
                    "id": iid,
                    "name": reg.get("name", iid),
                    "reason": "missing_or_unverified",
                    "prompt_hint": tier.get("prompt_hint")
                    or " ".join(tier.get("queries") or [])
                    or f"WebSearch 最新 {reg.get('name', iid)} 附官方 URL",
                    "task": tier.get("task", "06-fallback-fill"),
                }
            )
    return gaps


def compute_signals(by_id: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    cape = by_id.get("shiller_cape")
    if cape and cape.get("value") is not None:
        val = float(cape["value"])
        if val > 40:
            signals.append(
                {
                    "id": "shiller_cape",
                    "signal": "warning",
                    "message": f"席勒 CAPE {val:.1f} > 40：估值处历史高位，席勒框架下宜降风险敞口、勿追涨",
                    "confidence": cape.get("confidence"),
                }
            )
    dd = by_id.get("nasdaq_drawdown_pct")
    if dd and dd.get("value") is not None:
        val = float(dd["value"])
        if val > -15:
            signals.append(
                {
                    "id": "market_phase",
                    "signal": "phase_warning",
                    "message": f"纳指100自峰值回撤约 {val:.1f}%，仍处泡沫预警/发酵阶段（未达 35% 分档抄底线）",
                    "confidence": dd.get("confidence"),
                }
            )
        for tier, label in [(35, "tranche_1"), (50, "tranche_2"), (65, "tranche_3")]:
            if val <= -tier:
                signals.append(
                    {
                        "id": "nasdaq_drawdown_pct",
                        "signal": label,
                        "message": f"回撤 {val:.1f}% 触及 {tier}% 档：可按预案动用 1/3 预留现金分批建龙头",
                        "confidence": dd.get("confidence"),
                    }
                )
    spread = by_id.get("credit_spread_bbb")
    if spread and spread.get("value") is not None:
        try:
            if float(spread["value"]) > 1.5:
                signals.append(
                    {
                        "id": "credit_spread_bbb",
                        "signal": "warning",
                        "message": "BBB 信用利差走阔：兑现高估值筹码、增配短债/黄金",
                        "confidence": spread.get("confidence"),
                    }
                )
        except (TypeError, ValueError):
            pass
    return signals


def detect_phase(by_id: dict[str, dict[str, Any]], signals: list[dict[str, Any]]) -> str:
    dd = by_id.get("nasdaq_drawdown_pct")
    if dd and dd.get("value") is not None:
        v = float(dd["value"])
        if v <= -35:
            return "crash"
        if v <= -15:
            return "correction"
    if any(s.get("signal") == "warning" for s in signals):
        return "warning"
    return "neutral"


def build_conclusions(
    by_id: dict[str, dict[str, Any]],
    signals: list[dict[str, Any]],
    stocks: list[dict[str, Any]],
) -> dict[str, Any]:
    phase = detect_phase(by_id, signals)
    cape = by_id.get("shiller_cape", {})
    dd = by_id.get("nasdaq_drawdown_pct", {})

    actions: list[str] = []
    if phase == "warning":
        actions = list(WARNING_ACTIONS)
    elif phase == "crash":
        actions = [
            "分三档建仓（35%/50%/65–75% 回撤各动用 1/3 现金），只买龙头",
            "同步小幅增配黄金/国债对冲全球风险偏好下行",
            "禁止加杠杆、禁止摊平无现金流小票",
        ]
    else:
        actions = [
            "维持杠铃配置，逢反弹减高估筹码",
            "跟踪 VC/IPO 与信用利差，确认泡沫拐点",
        ]

    high_risk = [s for s in stocks if (s.get("flags") or {}).get("high_risk_app")]
    cape_val = cape.get("value")
    cape_num = float(cape_val) if cape_val is not None else None
    trim_list = [s.get("symbol") for s in pick_trim_stocks(stocks, cape_num) if s.get("symbol")]

    headline = "泡沫预警期：控杠杆、降敞口、攒现金"
    if phase == "crash":
        headline = "估值下杀期：分档分批捡龙头，不满仓"
    elif phase == "correction":
        headline = "调整期：减弹性、守杠铃，等待更深回撤或基本面确认"

    thesis = [
        f"达利欧：CAPE {cape.get('value', '—')}、实际利率与信用环境约束杠杆；先控风险敞口再谈收益",
        f"席勒：CAPE 突破 40 表明长期回报预期被透支；狂热期以卖为主、不买叙事",
        f"林毅夫：美股 AI 波动通过全球风险偏好冲击外需与新兴市场，需对冲非美敞口",
    ]

    return {
        "headline": headline,
        "phase": phase,
        "actions": actions,
        "thesis": thesis,
        "exit_candidates": [s.get("symbol") for s in high_risk if s.get("symbol")],
        "trim_candidates": trim_list,
    }


def collect_stocks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    stocks: list[dict[str, Any]] = []
    for task in tasks:
        for s in task.get("stocks") or []:
            if s.get("confidence") not in CONFIDENCE_OK:
                continue
            if s.get("ps_ttm") is None and s.get("pe_ttm") is None:
                continue
            flags = s.get("flags") or {}
            ps = s.get("ps_ttm")
            ocf = s.get("operating_cashflow")
            ret = s.get("return_1y_pct")
            s["flags"] = {
                "ps_gt_15": ps is not None and ps > 15,
                "ocf_negative": ocf is not None and ocf <= 0,
                "return_gt_200pct": ret is not None and ret > 200,
                "high_risk_app": (ps is not None and ps > 15) and (ocf is not None and ocf <= 0),
            }
            stocks.append(s)
    return stocks


def run(root: Path, phase: str, output: Path, agent_dir: Path) -> dict[str, Any]:
    registry = load_indicators_registry(root)
    agent_tasks = collect_agent_files(agent_dir)
    by_id = merge_indicators(agent_tasks)
    verified = verified_only(by_id)
    stocks = collect_stocks(agent_tasks)
    signals = compute_signals(verified)
    conclusions = build_conclusions(verified, signals, stocks)

    gaps = build_gaps(by_id, registry)

    narratives: list[dict[str, Any]] = []
    for task in agent_tasks:
        narratives.extend(task.get("narratives") or [])

    result: dict[str, Any] = {
        "as_of": _today(),
        "phase": phase,
        "data_source": "agent_cli_search",
        "conclusions": conclusions,
        "indicators": list(verified.values()),
        "stocks": stocks,
        "signals": signals,
        "narratives": narratives,
        "agent_tasks_loaded": [t.get("task_id") or t.get("_file") for t in agent_tasks],
        "stats": {
            "verified_count": len(verified),
            "gap_count": len(gaps),
            "stock_count": len(stocks),
        },
        "gaps_unresolved": gaps,
    }

    gaps_path = root / "data" / "gaps.json"
    os.makedirs(gaps_path.parent, exist_ok=True)
    with open(gaps_path, "w", encoding="utf-8") as f:
        json.dump({"as_of": _today(), "gaps": gaps}, f, ensure_ascii=False, indent=2)

    os.makedirs(output.parent, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    if len(verified) < 4:
        print(f"WARN: 仅 {len(verified)} 条 verified 指标，请运行 Agent 06 或重跑 orchestrate.sh", file=sys.stderr)

    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["pre", "final"], default="pre")
    parser.add_argument("--output", "-o", required=True)
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--agent-dir", default="")
    args = parser.parse_args()

    root = Path(args.root)
    agent_dir = Path(args.agent_dir) if args.agent_dir else root / "data" / "agent"
    run(root, args.phase, Path(args.output), agent_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
