"""中文展示名与术语对照 — ai-bubble-playbook HTML 渲染用。"""

from __future__ import annotations

from typing import Any

# 美股代码 → 中文常用名
SYMBOL_ZH: dict[str, str] = {
    "NVDA": "英伟达",
    "AMD": "超微半导体",
    "MSFT": "微软",
    "GOOGL": "谷歌",
    "META": "Meta（脸书）",
    "AMZN": "亚马逊",
    "AAPL": "苹果",
    "SOUN": "声扬科技",
    "SMCI": "超微电脑",
    "AVGO": "博通",
    "MU": "美光科技",
    "DELL": "戴尔",
    "XLP": "必选消费 ETF",
    "XLU": "公用事业 ETF",
    "XLE": "能源 ETF",
    "GLD": "黄金 ETF",
    "SHV": "短期国债 ETF",
}

TIER_ZH: dict[str, str] = {
    "platform_giant": "平台巨头",
    "capex_heavy": "重资本算力",
    "high_risk_app": "高危应用小票",
}

UNIT_ZH: dict[str, str] = {
    "percent": "%",
    "billions_usd": "十亿美元",
    "ratio": "倍",
    "narrative": "定性描述",
}

CONFIDENCE_ZH: dict[str, str] = {
    "confirmed": "已确认",
    "indirect": "间接验证",
    "unverified": "未验证",
}

VALUE_ZH: dict[str, str] = {
    "strong_inflow": "资金强劲流入",
    "elevated_bullish": "情绪偏高、偏乐观",
    "selective_slowdown": "融资选择性降温",
    "cautious": "偏谨慎",
}

TOPIC_ZH: dict[str, str] = {
    "liquidity_regime": "流动性环境",
    "global_export_shock": "全球外需冲击",
    "dotcom_cape_reference": "互联网泡沫 CAPE 对标",
    "valuation_safety": "估值安全边际",
    "retail_ai_chase": "散户追涨 AI 叙事",
    "primary_market_signal": "一级市场信号",
    "tier_actions": "分层操作建议",
}


def zh_unit(unit: str | None) -> str:
    if not unit:
        return "—"
    return UNIT_ZH.get(unit, unit)


def zh_confidence(c: str | None) -> str:
    if not c:
        return "—"
    return CONFIDENCE_ZH.get(c, c)


def zh_topic(topic: str | None) -> str:
    if not topic:
        return "—"
    return TOPIC_ZH.get(topic, topic.replace("_", " "))


def localize_text(text: str | None) -> str:
    if not text:
        return ""
    out = text
    for key in sorted(TIER_ZH, key=len, reverse=True):
        out = out.replace(key, TIER_ZH[key])
    for key in sorted(SYMBOL_ZH, key=len, reverse=True):
        out = out.replace(key, SYMBOL_ZH[key])
    for old, new in TEXT_REPLACEMENTS:
        out = out.replace(old, new)
    return out


def zh_value(v: Any) -> str:
    if v is None:
        return "—"
    if isinstance(v, float):
        if abs(v) >= 1:
            return f"{v:,.2f}".rstrip("0").rstrip(".")
        return f"{v:.2g}"
    key = str(v)
    return VALUE_ZH.get(key, key)


def metric_card_parts(v: Any, unit: str | None) -> tuple[str, str]:
    """快照卡片：返回 (主数值, 单位补充)；百分比合并进主数值。"""
    if v is None:
        return "—", ""
    if isinstance(v, float):
        s = f"{v:.2g}"
        if unit == "percent":
            return f"{s}%", ""
        return s, zh_unit(unit)
    return zh_value(v), zh_unit(unit)

GLOSSARY: list[dict[str, str]] = [
    {
        "abbr": "CAPE",
        "name": "席勒周期性调整市盈率",
        "desc": "标普500 股价 ÷ 过去10年通胀调整后平均盈利；罗伯特·席勒提出，>40 通常视为历史高位，长期回报预期偏低。",
    },
    {
        "abbr": "PS",
        "name": "市销率",
        "desc": "市值 ÷ 营业收入（每股股价 ÷ 每股营收）；对尚未稳定盈利的成长股常用，>15 往往偏贵。",
    },
    {
        "abbr": "OCF",
        "name": "经营现金流",
        "desc": "主营业务产生的净现金流入；持续为负意味着公司在「烧钱」，需依赖融资或借债。",
    },
    {
        "abbr": "1Y",
        "name": "近一年涨跌幅",
        "desc": "过去 12 个月股价变动百分比；>200% 往往伴随情绪过热，宜分批减仓。",
    },
    {
        "abbr": "XLP",
        "name": "必选消费 ETF",
        "desc": "追踪标普500 必选消费板块（日用品、食品饮料等），波动通常低于科技股，偏防御。",
    },
    {
        "abbr": "XLU",
        "name": "公用事业 ETF",
        "desc": "追踪标普500 公用事业板块（电力、燃气等），现金流稳定，利率敏感但防御性强。",
    },
    {
        "abbr": "XLE",
        "name": "能源 ETF",
        "desc": "追踪标普500 能源板块（油气开采、炼化等），与通胀及大宗商品周期相关。",
    },
    {
        "abbr": "GLD",
        "name": "黄金 ETF",
        "desc": "SPDR 黄金信托，追踪现货黄金价格；常作避险与通胀对冲配置。",
    },
    {
        "abbr": "SHV",
        "name": "短期国债 ETF",
        "desc": "iShares 0–1 年期美国国债 ETF，近似现金管理工具，流动性好、波动极低。",
    },
    {
        "abbr": "平台巨头",
        "name": "个股分层",
        "desc": "微软、谷歌等拥有云与 AI 生态分发壁垒的平台公司；泡沫预警期通常保留底仓、不全清。",
    },
    {
        "abbr": "重资本算力",
        "name": "个股分层",
        "desc": "英伟达、超微半导体等芯片与算力基础设施龙头；资本开支大，估值对席勒 CAPE 更敏感。",
    },
    {
        "abbr": "高危应用小票",
        "name": "个股分层",
        "desc": "市值较小、市销率偏高且经营现金流为负的 AI 应用概念股；预警期优先清仓。",
    },
]

# 叙事/脚注中的英文片段 → 中文（按匹配长度从长到短）
TEXT_REPLACEMENTS: list[tuple[str, str]] = [
    ("PS 高+OCF 负", "市销率偏高且经营现金流为负"),
    ("PS 个位数", "市销率为个位数"),
    ("PS 20+", "市销率 20+"),
    ("PS>", "市销率>"),
    ("PS ", "市销率"),
    ("+OCF 负", "、经营现金流为负"),
    ("OCF 负", "经营现金流为负"),
    ("CAPE>", "席勒 CAPE>"),
    ("YTD ", "年初至今 "),
    ("FOMC ", "美联储 "),
    ("TIPS ", "通胀保值国债 "),
    ("10Y ", "10年期 "),
    ("20Y ", "20年期 "),
    ("capex 周期", "资本开支周期"),
    ("与 capex", "与资本开支"),
    ("mega-round", "巨额融资轮"),
    ("IPO ", "首次公开发行 "),
]

WARNING_ACTIONS: list[str] = [
    "总仓位：科技（AI+硬件）≤30%；现金 + 高等级短债 20–30%",
    "立刻清三类高危标的：市销率（PS）>15 且无经营现金流（OCF）的应用小票、高负债烧钱扩算力、纯蹭概念",
    "算力龙头（英伟达、超微半导体等）若近一年（1Y）涨幅 >200% 或席勒 CAPE >40：分批减至原仓位 30–40%",
    "保留微软、谷歌等平台巨头，不全清；彻底清除融资杠杆与期权重仓",
    "杠铃：60–70% 防御（必选消费 XLP、公用事业 XLU、能源 XLE、黄金 GLD、短期国债 SHV）+ ≤30% 壁垒最深的基础设施龙头",
]


def zh_name(symbol: str, fallback: str = "") -> str:
    return SYMBOL_ZH.get(symbol.upper(), fallback or symbol)


def stock_label(symbol: str, fallback: str = "") -> str:
    sym = (symbol or "").upper()
    zh = SYMBOL_ZH.get(sym)
    if zh:
        return f"{zh}（{sym}）"
    name = fallback or sym
    return f"{name}（{sym}）" if sym else name


def stock_labels(symbols: list[str], stocks: list[dict[str, Any]] | None = None) -> list[str]:
    by_sym = {s.get("symbol", "").upper(): s for s in (stocks or [])}
    out: list[str] = []
    for sym in symbols:
        rec = by_sym.get(sym.upper(), {})
        out.append(stock_label(sym, rec.get("name") or ""))
    return out


def pick_exit_stocks(stocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [s for s in stocks if (s.get("flags") or {}).get("high_risk_app")]


def pick_trim_stocks(stocks: list[dict[str, Any]], cape: float | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for s in stocks:
        flags = s.get("flags") or {}
        if flags.get("high_risk_app"):
            continue
        if flags.get("return_gt_200pct"):
            out.append(s)
            continue
        if cape is not None and cape > 40 and flags.get("ps_gt_15") and s.get("tier") == "capex_heavy":
            out.append(s)
    return out


def exit_stock_reason(s: dict[str, Any]) -> str:
    parts: list[str] = []
    ps = s.get("ps_ttm")
    if ps is not None:
        parts.append(f"市销率约 {ps:g}")
    flags = s.get("flags") or {}
    if flags.get("ocf_negative"):
        parts.append("经营现金流为负（仍在烧钱）")
    return "；".join(parts) if parts else "符合高危应用小票筛选条件"


def trim_stock_reason(s: dict[str, Any]) -> str:
    parts: list[str] = []
    flags = s.get("flags") or {}
    ps = s.get("ps_ttm")
    ret = s.get("return_1y_pct")
    if flags.get("ps_gt_15") and ps is not None:
        parts.append(f"市销率约 {ps:g}（>15 偏贵）")
    if flags.get("return_gt_200pct") and ret is not None:
        parts.append(f"近一年涨约 {ret:g}%（情绪过热）")
    return "；".join(parts) if parts else "估值或涨幅触发减仓条件"
