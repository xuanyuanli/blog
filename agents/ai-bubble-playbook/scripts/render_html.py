#!/usr/bin/env python3
"""Render ai-bubble-playbook.html — 结论先行，仅展示 verified 数据。"""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from labels import (
    GLOSSARY,
    TIER_ZH,
    exit_stock_reason,
    pick_exit_stocks,
    pick_trim_stocks,
    stock_label,
    trim_stock_reason,
    zh_confidence,
    zh_topic,
    zh_unit,
    zh_value,
    localize_text,
    metric_card_parts,
)
from typing import Any


def esc(s: Any) -> str:
    return html.escape(str(s)) if s is not None else ""


def conf_class(c: str | None) -> str:
    return {"confirmed": "evidence-confirmed", "indirect": "evidence-indirect"}.get(c or "", "evidence-indirect")


def fmt_val(v: Any) -> str:
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:.2g}"
    return str(v)


def localize_indicator_name(name: str | None) -> str:
    if not name:
        return "—"
    return name.replace(" proxy", "（代理指标）").replace("proxy", "代理指标")


def render_indicator_row(rec: dict[str, Any]) -> str:
    url = rec.get("source_url") or ""
    src = esc(rec.get("source", ""))
    if url:
        src = f'<a href="{esc(url)}" target="_blank" rel="noopener">{src}</a>'
    c = rec.get("confidence", "indirect")
    unit = rec.get("unit")
    foot = (
        f'<br><span class="text-xs text-slate-500">{esc(localize_text(rec.get("footnote")))}</span>'
        if rec.get("footnote")
        else ""
    )
    return f"""<tr>
  <td>{esc(localize_indicator_name(rec.get('name') or rec.get('id')))}</td>
  <td class="font-mono font-semibold">{esc(zh_value(rec.get('value')))}</td>
  <td>{esc(zh_unit(unit))}</td>
  <td>{esc(rec.get('as_of'))}</td>
  <td>{src}{foot}</td>
  <td><span class="evidence {conf_class(c)}">{esc(zh_confidence(c))}</span></td>
</tr>"""


def render_action_cards(stocks: list[dict[str, Any]], cape: float | None) -> str:
    exit_stocks = pick_exit_stocks(stocks)
    trim_stocks = pick_trim_stocks(stocks, cape)

    if exit_stocks:
        exit_items = "\n".join(
            f"""<li class="text-red-900">
  <strong>{esc(stock_label(s.get('symbol', ''), s.get('name') or ''))}</strong>
  <span class="text-red-800"> — {esc(exit_stock_reason(s))}</span>
  <span class="mt-0.5 block text-xs text-red-700">→ 尽快卖出清仓，不宜抄底或摊平</span>
</li>"""
            for s in exit_stocks
        )
    else:
        exit_items = '<li class="text-red-800">本期观察清单无符合「高危应用小票」条件的标的</li>'

    cape_hint = f"当前席勒 CAPE 约 {cape:g}（&gt;40 处历史高位）。" if cape is not None and cape > 40 else ""
    if trim_stocks:
        trim_items = "\n".join(
            f"""<li class="text-amber-900">
  <strong>{esc(stock_label(s.get('symbol', ''), s.get('name') or ''))}</strong>
  <span class="text-amber-800"> — {esc(trim_stock_reason(s))}</span>
  <span class="mt-0.5 block text-xs text-amber-700">→ 分批减至原仓位的 30–40%，逢反弹卖、不追涨</span>
</li>"""
            for s in trim_stocks
        )
    else:
        trim_items = '<li class="text-amber-800">本期无触发减仓的算力龙头（市销率 &gt;15 或近一年涨 &gt;200%）</li>'

    return f"""<div class="mt-6 grid gap-4 sm:grid-cols-2">
  <div class="rounded-xl bg-red-50 p-4 text-sm">
    <p class="font-bold text-red-900">建议立刻卖出</p>
    <p class="mt-1 text-xs leading-6 text-red-800/90">AI 概念应用小票：市销率偏高，且经营现金流为负、主业仍在烧钱。泡沫预警期风险大于收益。</p>
    <ul class="mt-3 list-none space-y-2">{exit_items}</ul>
  </div>
  <div class="rounded-xl bg-amber-50 p-4 text-sm">
    <p class="font-bold text-amber-900">建议分批减仓</p>
    <p class="mt-1 text-xs leading-6 text-amber-800/90">{cape_hint}算力龙头（芯片、服务器等）若估值偏贵，保留核心敞口即可，其余换成现金或防御资产。</p>
    <ul class="mt-3 list-none space-y-2">{trim_items}</ul>
  </div>
</div>"""


def render_glossary() -> str:
    rows = "\n".join(
        f"""<tr>
  <td class="font-mono font-semibold whitespace-nowrap">{esc(g['abbr'])}</td>
  <td class="whitespace-nowrap">{esc(g['name'])}</td>
  <td class="text-slate-700">{esc(g['desc'])}</td>
</tr>"""
        for g in GLOSSARY
    )
    return f"""<details class="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
  <summary class="text-sm font-bold text-slate-800">术语对照表（简写 · 中文名 · 说明）</summary>
  <div class="mt-3 overflow-x-auto">
    <table class="data w-full min-w-[520px]">
      <thead><tr><th>简写</th><th>中文名</th><th>说明</th></tr></thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
</details>"""


def render_stock_row(s: dict[str, Any]) -> str:
    flags = s.get("flags") or {}
    badges = []
    if flags.get("high_risk_app") or (flags.get("ps_gt_15") and flags.get("ocf_negative")):
        badges.append('<span class="badge-exit">清仓</span>')
    elif flags.get("ps_gt_15"):
        badges.append('<span class="badge-warn">市销率&gt;15</span>')
    if flags.get("return_gt_200pct"):
        badges.append('<span class="badge-warn">近一年&gt;200%</span>')
    if s.get("tier") == "platform_giant":
        badges.append('<span class="badge-keep">保留</span>')
    if not badges:
        badges.append('<span class="badge-ok">观察</span>')
    url = s.get("source_url") or ""
    symbol = s.get("symbol") or ""
    label = esc(stock_label(symbol, s.get("name") or ""))
    if url:
        label = f'<a href="{esc(url)}" target="_blank" rel="noopener">{label}</a>'
    tier = TIER_ZH.get(s.get("tier") or "", s.get("tier"))
    return f"""<tr>
  <td>{label}</td>
  <td>{esc(tier)}</td>
  <td>{esc(fmt_val(s.get('ps_ttm')))}</td>
  <td>{esc(fmt_val(s.get('return_1y_pct')))}%</td>
  <td>{' '.join(badges)}</td>
</tr>"""


def build_html(data: dict[str, Any]) -> str:
    conclusions = data.get("conclusions") or {}
    indicators = data.get("indicators") or []
    stocks = data.get("stocks") or []
    signals = data.get("signals") or []
    narratives = data.get("narratives") or []
    stats = data.get("stats") or {}
    as_of = data.get("as_of", "")

    headline = conclusions.get("headline", "AI 泡沫周期研判")
    phase = conclusions.get("phase", "warning")
    actions = conclusions.get("actions") or []
    thesis = conclusions.get("thesis") or []

    phase_label = {"warning": "预警期", "correction": "调整期", "crash": "下杀期", "neutral": "观望"}.get(phase, phase)
    phase_color = {"warning": "bg-amber-500", "crash": "bg-emerald-600", "correction": "bg-orange-500"}.get(phase, "bg-slate-500")

    actions_html = "".join(f"<li>{esc(a)}</li>" for a in actions)
    thesis_html = "".join(f"<li>{esc(t)}</li>" for t in thesis)

    signal_html = ""
    for sig in signals:
        sig_type = sig.get("signal", "")
        cls = "border-amber-200 bg-amber-50 text-amber-950"
        if sig_type.startswith("tranche"):
            cls = "border-emerald-200 bg-emerald-50 text-emerald-950"
        elif sig_type == "warning":
            cls = "border-red-200 bg-red-50 text-red-950"
        signal_html += f'<li class="rounded-lg border px-4 py-3 text-sm {cls}">{esc(sig.get("message"))}</li>'

    key_ids = ["shiller_cape", "nasdaq_drawdown_pct", "real_rate_10y", "credit_spread_bbb"]
    cards = []
    for kid in key_ids:
        rec = next((i for i in indicators if i.get("id") == kid), None)
        if rec:
            c = rec.get("confidence", "indirect")
            unit = rec.get("unit")
            main_val, unit_extra = metric_card_parts(rec.get("value"), unit)
            cards.append(
                f"""<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <p class="text-xs font-bold tracking-wide text-slate-500">{esc(localize_indicator_name(rec.get('name')))}</p>
  <p class="mt-2 text-3xl font-bold text-slate-900">{esc(main_val)}
    <span class="text-sm font-normal text-slate-500">{esc(unit_extra)}</span></p>
  <p class="mt-2 text-xs text-slate-500">{esc(rec.get('as_of'))} · <span class="evidence {conf_class(c)}">{esc(zh_confidence(c))}</span></p>
</div>"""
            )

    ind_rows = "\n".join(render_indicator_row(i) for i in indicators)
    stock_rows = "\n".join(render_stock_row(s) for s in stocks)

    narr_sections = ""
    for n in narratives:
        sources = n.get("sources") or []
        src_links = " · ".join(
            f'<a href="{esc(s.get("url"))}" target="_blank" rel="noopener">{esc(s.get("title"))}</a>'
            for s in sources
            if s.get("url")
        )
        narr_sections += f"""<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
  <p class="font-bold text-slate-800">{esc(zh_topic(n.get('topic')))}</p>
  <p class="mt-2 text-sm leading-7 text-slate-700">{esc(localize_text(n.get('summary')))}</p>
  <p class="mt-2 text-xs text-slate-500">{src_links}</p>
</div>"""

    cape_rec = next((i for i in indicators if i.get("id") == "shiller_cape"), None)
    cape_val = cape_rec.get("value") if cape_rec else None
    cape_num = float(cape_val) if cape_val is not None else None
    action_cards_html = render_action_cards(stocks, cape_num)
    glossary_html = render_glossary()

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI 泡沫预警实操 · {esc(headline)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .evidence {{ display: inline-block; border-radius: .45rem; padding: .05rem .4rem; font-size: .72rem; font-weight: 700; }}
    .evidence-confirmed {{ background: #dcfce7; color: #166534; }}
    .evidence-indirect {{ background: #ede9fe; color: #5b21b6; }}
    .badge-exit {{ background: #fee2e2; color: #b91c1c; border-radius: .35rem; padding: .05rem .4rem; font-size: .7rem; font-weight: 700; }}
    .badge-warn {{ background: #fef3c7; color: #92400e; border-radius: .35rem; padding: .05rem .4rem; font-size: .7rem; font-weight: 700; }}
    .badge-keep {{ background: #dcfce7; color: #166534; border-radius: .35rem; padding: .05rem .4rem; font-size: .7rem; font-weight: 700; }}
    .badge-ok {{ color: #94a3b8; font-size: .75rem; }}
    table.data th, table.data td {{ border: 1px solid #e2e8f0; padding: .5rem .65rem; text-align: left; vertical-align: top; font-size: .82rem; }}
    table.data th {{ background: #f8fafc; font-weight: 700; }}
    details > summary {{ cursor: pointer; list-style: none; font-weight: 700; }}
    details > summary::-webkit-details-marker {{ display: none; }}
    a {{ color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }}
  </style>
</head>
<body class="bg-slate-50 text-slate-900">
<main class="mx-auto max-w-7xl px-5 py-8">

  <!-- ═══ 结论 ═══ -->
  <section class="mb-8 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <span class="rounded-full {phase_color} px-3 py-1 text-sm font-bold">{esc(phase_label)}</span>
      <span class="rounded-full bg-white/10 px-3 py-1 text-sm">调研 {esc(as_of)}</span>
      <span class="rounded-full bg-red-500/30 px-3 py-1 text-sm">非投资建议</span>
    </div>
    <h1 class="text-3xl font-bold md:text-4xl">{esc(headline)}</h1>
    <p class="mt-4 max-w-4xl text-base leading-8 text-slate-200">
      基于 Cursor Agent 实时 WebSearch（FRED / Multpl / 公开财报源），已验证指标 {esc(stats.get('verified_count', len(indicators)))} 条。
      当前距纳指峰值回撤浅、CAPE 处历史高位——<strong class="text-amber-300">执行预警期纪律，而非抄底</strong>。
    </p>
  </section>

  <section class="mb-8 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-bold text-indigo-950">一、结论 · 现在该做什么</h2>
    <ol class="mt-4 list-decimal space-y-2 pl-6 text-sm leading-8 font-medium text-slate-800">
      {actions_html}
    </ol>
    {action_cards_html}
    {glossary_html}
  </section>

  <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-xl font-bold">二、论点 · 三位学者框架</h2>
    <ul class="mt-3 list-disc space-y-2 pl-6 text-sm leading-8 text-slate-700">{thesis_html}</ul>
  </section>

  <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-xl font-bold">三、触发信号</h2>
    <ul class="mt-4 space-y-2">{signal_html or '<li class="text-sm text-slate-500">无额外触发</li>'}</ul>
  </section>

  <!-- ═══ 论据 ═══ -->
  <section class="mb-8">
    <h2 class="mb-4 text-2xl font-bold text-slate-800">四、论据 · 关键指标快照</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{''.join(cards) if cards else '<p class="text-slate-500">请运行 orchestrate.sh 刷新 Agent 数据</p>'}</div>
  </section>

  <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
    <h2 class="text-xl font-bold">五、论据 · 指标明细（附来源链接）</h2>
    <table class="data mt-4 w-full">
      <thead><tr><th>指标</th><th>值</th><th>单位</th><th>日期</th><th>来源</th><th>置信度</th></tr></thead>
      <tbody>{ind_rows or '<tr><td colspan="6" class="text-slate-500">无已验证指标</td></tr>'}</tbody>
    </table>
  </section>

  <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
    <h2 class="text-xl font-bold">六、论据 · 分层观察清单</h2>
    <table class="data mt-4 w-full min-w-[640px]">
      <thead><tr><th>标的</th><th>分层</th><th>市销率（PS）</th><th>近一年（1Y）</th><th>动作</th></tr></thead>
      <tbody>{stock_rows or '<tr><td colspan="5" class="text-slate-500">无已验证个股</td></tr>'}</tbody>
    </table>
  </section>

  <section class="mb-8 space-y-4">
    <h2 class="text-xl font-bold">七、论据 · 叙事与交叉验证</h2>
    {narr_sections or '<p class="text-sm text-slate-500">无叙事条目</p>'}
  </section>

  <!-- ═══ 操作手册（附录） ═══ -->
  <section class="mb-8 rounded-2xl border border-slate-200 bg-slate-100 p-6">
    <h2 class="text-xl font-bold text-slate-700">附录 · 三阶段操作手册</h2>
    <details class="mt-4 rounded-xl bg-white p-4" open>
      <summary>第一部分 · 泡沫预警期</summary>
      <p class="mt-2 text-sm text-slate-600">清杠杆；科技≤30%；杠铃防御 60–70%；逢反弹减高估筹码。</p>
    </details>
    <details class="mt-3 rounded-xl bg-white p-4">
      <summary>第二部分 · 估值下杀（35/50/65% 分档）</summary>
      <p class="mt-2 text-sm text-slate-600">仅龙头；分三档动用现金；增配黄金/国债；基本面恶化则观望。</p>
    </details>
    <details class="mt-3 rounded-xl bg-white p-4">
      <summary>第三部分 · 底部五维筛选</summary>
      <p class="mt-2 text-sm text-slate-600">现金流 / 壁垒 / 财务质量 / 估值安全边际 / 供需格局，缺一不可。</p>
    </details>
  </section>

  <footer class="text-xs leading-6 text-slate-500">
    <p>数据来自 Cursor Agent CLI 实时 WebSearch，每条指标附来源链接；不展示未验证数据。</p>
    <p>刷新：<code>agents/ai-bubble-playbook/scripts/orchestrate.sh</code>（Git Bash） · 生成 {esc(as_of)}</p>
  </footer>
</main>
</body>
</html>"""


def update_public_html(repo_root: Path) -> None:
    path = repo_root / "stock" / ".vitepress" / "public-html.ts"
    entry = "  '/ai-bubble-playbook.html',"
    text = path.read_text(encoding="utf-8")
    if "ai-bubble-playbook.html" not in text:
        text = text.replace("  '/ai-compute-bottleneck-scorecard.html',", f"  '/ai-compute-bottleneck-scorecard.html',\n{entry}")
        path.write_text(text, encoding="utf-8")


def update_index(repo_root: Path) -> None:
    path = repo_root / "stock" / "index.md"
    text = path.read_text(encoding="utf-8")
    block = """  - title: AI 泡沫预警实操
    details: 结论先行 · 达利欧×席勒×林毅夫 · Agent 实时搜索验证数据。
    link: /ai-bubble-playbook.html
    target: _self
"""
    if "ai-bubble-playbook.html" not in text:
        text = text.replace("  - title: 大宗商品定价", block + "  - title: 大宗商品定价")
        path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", "-i", required=True)
    parser.add_argument("--output", "-o", required=True)
    parser.add_argument("--repo-root", default="")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_html(data), encoding="utf-8")
    print(f"Wrote {out_path}")

    if args.repo_root:
        root = Path(args.repo_root)
        update_public_html(root)
        update_index(root)


if __name__ == "__main__":
    main()
