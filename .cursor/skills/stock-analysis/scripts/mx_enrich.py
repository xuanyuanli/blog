#!/usr/bin/env python3
"""Supplement fetch_stock JSON with East Money MX skills (mx-data / mx-search / mx-xuangu)."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[4]
SKILLS_DIR = REPO_ROOT / ".cursor" / "skills"
MX_DATA_SCRIPT = SKILLS_DIR / "mx-data" / "mx_data.py"
MX_SEARCH_SCRIPT = SKILLS_DIR / "mx-search" / "mx_search.py"
MX_XUANGU_SCRIPT = SKILLS_DIR / "mx-xuangu" / "mx_xuangu.py"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "tmp" / "mx_output"
CN_TZ = timezone(timedelta(hours=8))


def now_cn() -> str:
    return datetime.now(CN_TZ).strftime("%Y-%m-%d %H:%M:%S %Z")


def ensure_mx_apikey() -> None:
    if os.getenv("MX_APIKEY"):
        return
    if sys.platform == "win32":
        try:
            import winreg  # type: ignore

            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
                value, _ = winreg.QueryValueEx(key, "MX_APIKEY")
                if value:
                    os.environ["MX_APIKEY"] = str(value)
                    return
        except OSError:
            pass
    raise SystemExit(
        "MX_APIKEY 未设置。请在环境变量中配置东财妙想 API Key，"
        "获取地址: https://dl.dfcfs.com/m/itc4"
    )


def safe_filename(text: str, max_len: int = 80) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*\[\]]', "_", text).strip().replace(" ", "_")
    return (cleaned[:max_len] or "query").strip("._")


def flatten_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def parse_mx_data_tables(raw: dict[str, Any]) -> list[dict[str, Any]]:
    inner = (raw.get("data") or {}).get("data") or {}
    dto_list = (inner.get("searchDataResultDTO") or {}).get("dataTableDTOList") or []
    tables: list[dict[str, Any]] = []
    for dto in dto_list:
        if not isinstance(dto, dict):
            continue
        name_map = dto.get("nameMap") or {}
        table = dto.get("table") or {}
        head_names = table.get("headName") or []
        row_count = len(head_names) if isinstance(head_names, list) else 0
        rows: list[dict[str, str]] = []
        for idx in range(row_count):
            row: dict[str, str] = {}
            date_label = flatten_value(head_names[idx]) if idx < len(head_names) else ""
            if date_label:
                row["date"] = date_label
            for key, values in table.items():
                if key == "headName" or not isinstance(values, list):
                    continue
                label = flatten_value(name_map.get(key, key))
                if idx < len(values):
                    row[label or str(key)] = flatten_value(values[idx])
            if row:
                rows.append(row)
        tables.append(
            {
                "title": dto.get("title") or dto.get("entityName") or "数据表",
                "entity": dto.get("entityName"),
                "rows": rows,
            }
        )
    return tables


def parse_mx_search_items(raw: dict[str, Any], *, limit: int = 12) -> list[dict[str, Any]]:
    inner = (raw.get("data") or {}).get("data") or {}
    items = (inner.get("llmSearchResponse") or {}).get("data") or []
    parsed: list[dict[str, Any]] = []
    for item in items[:limit]:
        if not isinstance(item, dict):
            continue
        content = (item.get("content") or "").strip()
        parsed.append(
            {
                "title": item.get("title"),
                "date": item.get("date"),
                "type": item.get("informationType"),
                "url": item.get("jumpUrl"),
                "source": "mx-search",
                "summary": content[:500] + ("..." if len(content) > 500 else ""),
            }
        )
    return parsed


def parse_mx_xuangu_csv(path: Path, *, limit: int = 50) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for idx, row in enumerate(reader) if idx < limit]


def run_mx_script(script: Path, args: list[str], output_dir: Path) -> tuple[int, str]:
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    proc = subprocess.run(
        [sys.executable, str(script), *args, str(output_dir)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
        cwd=str(script.parent),
    )
    output = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, output.strip()


def load_json(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "utf-16"):
        try:
            return json.loads(raw.decode(encoding))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    raise ValueError(f"无法解析 JSON 文件: {path}")


def stock_display_name(stock: dict[str, Any]) -> str:
    quote = stock.get("quote") or {}
    candidates = [
        quote.get("name"),
        stock.get("resolved_name"),
        stock.get("input"),
        stock.get("code"),
    ]
    for name in candidates:
        if not name:
            continue
        text = str(name).strip()
        if text and not set(text) <= {"?"}:
            return text
    return "未知标的"


def detect_data_triggers(stock: dict[str, Any]) -> list[str]:
    triggers: list[str] = []
    dq = stock.get("data_quality") or {}
    fields = dq.get("fields") or {}
    quote = stock.get("quote") or {}
    nb = stock.get("northbound") or {}
    profile = stock.get("profile") or {}

    if stock.get("market") not in ("SH", "SZ", "BJ"):
        return triggers

    if nb.get("freshness") in ("stale", "missing") or fields.get("northbound") in ("stale", "missing"):
        triggers.append("northbound")
    if fields.get("pe_pb") == "missing" or quote.get("valuation_source") == "computed_from_financials":
        triggers.append("valuation")
    if profile.get("error") or fields.get("profile") == "missing":
        triggers.append("profile")
    triggers.append("fund_flow")
    return triggers


def build_data_queries(name: str, triggers: list[str]) -> list[tuple[str, str]]:
    mapping = {
        "northbound": f"{name} 北向资金 持股变动",
        "valuation": f"{name} 市盈率 市净率 TTM",
        "profile": f"{name} 主营业务 所属行业 总股本",
        "fund_flow": f"{name} 主力资金流向",
    }
    return [(trigger, mapping[trigger]) for trigger in triggers if trigger in mapping]


def enrich_stock(
    stock: dict[str, Any],
    *,
    output_dir: Path,
    skip_search: bool = False,
    skip_data: bool = False,
    force_data: bool = False,
    search_query: str | None = None,
) -> dict[str, Any]:
    name = stock_display_name(stock)
    triggers = detect_data_triggers(stock) if stock.get("market") in ("SH", "SZ", "BJ") else []
    if force_data and stock.get("market") in ("SH", "SZ", "BJ"):
        triggers = ["northbound", "valuation", "profile", "fund_flow"]

    supplement: dict[str, Any] = {
        "data_tables": [],
        "events": [],
        "queries_run": [],
        "errors": [],
    }

    if not skip_data and triggers:
        for trigger, query in build_data_queries(name, triggers):
            code, output = run_mx_script(MX_DATA_SCRIPT, [query], output_dir)
            raw_path = output_dir / f"mx_data_{safe_filename(query)}_raw.json"
            entry: dict[str, Any] = {
                "skill": "mx-data",
                "trigger": trigger,
                "query": query,
                "exit_code": code,
                "raw_json": str(raw_path),
            }
            if raw_path.exists():
                try:
                    tables = parse_mx_data_tables(load_json(raw_path))
                    entry["tables"] = tables
                    supplement["data_tables"].extend(tables)
                except (ValueError, json.JSONDecodeError, KeyError) as exc:
                    supplement["errors"].append(
                        {"skill": "mx-data", "query": query, "message": f"解析失败: {exc}"}
                    )
            elif code != 0:
                supplement["errors"].append(
                    {"skill": "mx-data", "query": query, "message": output[-500:] if output else "unknown error"}
                )
            supplement["queries_run"].append(entry)

    if not skip_search:
        query = search_query or f"{name} 最新公告 业绩预告 研报"
        code, output = run_mx_script(MX_SEARCH_SCRIPT, [query], output_dir)
        raw_path = output_dir / f"mx_search_{safe_filename(query)}.json"
        entry = {
            "skill": "mx-search",
            "query": query,
            "exit_code": code,
            "raw_json": str(raw_path),
        }
        if raw_path.exists():
            try:
                events = parse_mx_search_items(load_json(raw_path))
                entry["count"] = len(events)
                supplement["events"] = events
            except (ValueError, json.JSONDecodeError, KeyError) as exc:
                supplement["errors"].append(
                    {"skill": "mx-search", "query": query, "message": f"解析失败: {exc}"}
                )
        elif code != 0:
            supplement["errors"].append(
                {"skill": "mx-search", "query": query, "message": output[-500:] if output else "unknown error"}
            )
        supplement["queries_run"].append(entry)

    stock["mx_enrich"] = {
        "enriched_at": now_cn(),
        "output_dir": str(output_dir),
        "triggers": triggers,
        "supplement": supplement,
    }
    return stock


def enrich_industry(
    *,
    output_dir: Path,
    search_query: str | None = None,
    xuangu_query: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "enriched_at": now_cn(),
        "output_dir": str(output_dir),
        "queries_run": [],
        "supplement": {"events": [], "screening": [], "errors": []},
    }

    if search_query:
        code, output = run_mx_script(MX_SEARCH_SCRIPT, [search_query], output_dir)
        raw_path = output_dir / f"mx_search_{safe_filename(search_query)}.json"
        entry = {"skill": "mx-search", "query": search_query, "exit_code": code, "raw_json": str(raw_path)}
        if code == 0 and raw_path.exists():
            events = parse_mx_search_items(load_json(raw_path), limit=20)
            entry["count"] = len(events)
            result["supplement"]["events"] = events
        else:
            result["supplement"]["errors"].append(
                {"skill": "mx-search", "query": search_query, "message": output[-500:] if output else "unknown error"}
            )
        result["queries_run"].append(entry)

    if xuangu_query:
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        proc = subprocess.run(
            [
                sys.executable,
                str(MX_XUANGU_SCRIPT),
                xuangu_query,
                "--output-dir",
                str(output_dir),
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
            cwd=str(MX_XUANGU_SCRIPT.parent),
        )
        csv_path = output_dir / f"mx_xuangu_{safe_filename(xuangu_query)}.csv"
        entry = {
            "skill": "mx-xuangu",
            "query": xuangu_query,
            "exit_code": proc.returncode,
            "csv": str(csv_path),
        }
        if proc.returncode == 0 and csv_path.exists():
            rows = parse_mx_xuangu_csv(csv_path)
            entry["count"] = len(rows)
            result["supplement"]["screening"] = rows
        else:
            msg = ((proc.stdout or "") + (proc.stderr or "")).strip()
            result["supplement"]["errors"].append(
                {"skill": "mx-xuangu", "query": xuangu_query, "message": msg[-500:] if msg else "unknown error"}
            )
        result["queries_run"].append(entry)

    return result


def write_payload(payload: dict[str, Any], *, output: Path | None, pretty: bool) -> None:
    indent = 2 if pretty else None
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=indent)
            handle.write("\n")
    else:
        json.dump(payload, sys.stdout, ensure_ascii=False, indent=indent)
        sys.stdout.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich stock/industry research data via MX skills")
    parser.add_argument("--stdin", action="store_true", help="Read fetch_stock JSON from stdin")
    parser.add_argument("--fetch-json", type=Path, help="Path to fetch_stock JSON output")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="MX skill output directory")
    parser.add_argument("--skip-search", action="store_true", help="Skip mx-search")
    parser.add_argument("--skip-data", action="store_true", help="Skip mx-data gap filling")
    parser.add_argument("--force-data", action="store_true", help="Run all A-share mx-data queries regardless of warnings")
    parser.add_argument("--search-query", help="Override mx-search query")
    parser.add_argument("--industry", action="store_true", help="Industry research mode (no fetch_stock input required)")
    parser.add_argument("--xuangu-query", help="mx-xuangu query for industry mode")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    parser.add_argument("--output", type=Path, help="Write merged JSON to file (recommended on Windows)")
    args = parser.parse_args()

    ensure_mx_apikey()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    if args.industry:
        payload = enrich_industry(
            output_dir=args.output_dir,
            search_query=args.search_query,
            xuangu_query=args.xuangu_query,
        )
        write_payload(payload, output=args.output, pretty=args.pretty)
        return

    if args.stdin:
        payload = json.loads(sys.stdin.buffer.read().decode("utf-8-sig"))
    elif args.fetch_json:
        payload = load_json(args.fetch_json)
    else:
        parser.error("需要 --stdin、--fetch-json 或 --industry")

    stocks = payload.get("stocks")
    if isinstance(stocks, list):
        for idx, stock in enumerate(stocks):
            if isinstance(stock, dict):
                stocks[idx] = enrich_stock(
                    stock,
                    output_dir=args.output_dir,
                    skip_search=args.skip_search,
                    skip_data=args.skip_data,
                    force_data=args.force_data,
                    search_query=args.search_query,
                )
    elif isinstance(payload, dict) and payload.get("market"):
        payload = enrich_stock(
            payload,
            output_dir=args.output_dir,
            skip_search=args.skip_search,
            skip_data=args.skip_data,
            force_data=args.force_data,
            search_query=args.search_query,
        )

    write_payload(payload, output=args.output, pretty=args.pretty)


if __name__ == "__main__":
    main()
