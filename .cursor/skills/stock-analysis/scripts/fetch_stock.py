#!/usr/bin/env python3
"""Fetch real-time stock data for analysis. Outputs JSON to stdout."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from typing import Any

# Disable broken system proxy before any HTTP imports
for _key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
    os.environ.pop(_key, None)

import requests

NO_PROXY = {"http": None, "https": None}
_orig_get = requests.get
requests.get = lambda *args, **kwargs: _orig_get(*args, **{**kwargs, "proxies": NO_PROXY})  # type: ignore

import akshare as ak  # noqa: E402

CN_TZ = timezone(timedelta(hours=8))
EM_UT = "fa5fd1943c7b386f172d6893dbfba10b"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://quote.eastmoney.com/",
}


def http_get(
    url: str,
    *,
    params: dict | None = None,
    timeout: int = 15,
    retries: int = 3,
    extra_headers: dict[str, str] | None = None,
) -> requests.Response:
    headers = {**HEADERS, **(extra_headers or {})}
    last_err: Exception | None = None
    for _ in range(retries):
        try:
            r = _orig_get(url, params=params, timeout=timeout, proxies=NO_PROXY, headers=headers)
            r.raise_for_status()
            return r
        except Exception as e:
            last_err = e
    raise last_err  # type: ignore[misc]


def now_cn() -> str:
    return datetime.now(CN_TZ).strftime("%Y-%m-%d %H:%M:%S %Z")


def parse_symbol(raw: str) -> dict[str, str]:
    """Parse explicit stock code/ticker into market + code."""
    s = raw.strip().upper().replace(" ", "")
    if re.fullmatch(r"\d{6}", s):
        market = "SH" if s.startswith(("5", "6", "9")) else "SZ"
        return {"market": market, "code": s, "input": raw.strip()}
    m = re.fullmatch(r"(SH|SZ|BJ)(\d{6})", s)
    if m:
        return {"market": m.group(1), "code": m.group(2), "input": raw.strip()}
    if s.endswith(".HK") or (s.isdigit() and len(s) <= 5):
        code = s.replace(".HK", "").zfill(5)
        return {"market": "HK", "code": code, "input": raw.strip()}
    if re.fullmatch(r"[A-Z][A-Z0-9.\-]{0,9}", s):
        return {"market": "US", "code": s, "input": raw.strip()}
    raise ValueError(f"无法识别股票代码: {raw}")


def market_from_astock_code(code: str) -> str:
    if code.startswith(("4", "8")):
        return "BJ"
    return "SH" if code.startswith(("5", "6", "9")) else "SZ"


def parse_em_candidate(item: dict[str, Any]) -> dict[str, Any]:
    classify = item.get("Classify", "")
    code = str(item.get("Code", "")).strip()
    name = str(item.get("Name", "")).strip()
    if classify == "AStock" and re.fullmatch(r"\d{6}", code):
        return {
            "market": market_from_astock_code(code),
            "code": code,
            "name": name,
            "classify": classify,
            "security_type": item.get("SecurityTypeName"),
        }
    if classify == "HK" or "港" in str(item.get("SecurityTypeName", "")):
        hk_code = code.zfill(5) if code.isdigit() else code
        return {"market": "HK", "code": hk_code, "name": name, "classify": classify, "security_type": item.get("SecurityTypeName")}
    if classify == "UsStock" or "美" in str(item.get("SecurityTypeName", "")):
        return {"market": "US", "code": code.upper(), "name": name, "classify": classify, "security_type": item.get("SecurityTypeName")}
    if re.fullmatch(r"\d{6}", code):
        return {
            "market": market_from_astock_code(code),
            "code": code,
            "name": name,
            "classify": classify or "Unknown",
            "security_type": item.get("SecurityTypeName"),
        }
    return {"market": "US", "code": code.upper(), "name": name, "classify": classify or "Unknown", "security_type": item.get("SecurityTypeName")}


def search_securities(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """Search A/H/US securities by company name, alias, or pinyin."""
    url = "https://searchapi.eastmoney.com/api/suggest/get"
    params = {
        "input": query.strip(),
        "type": "14",
        "token": "D43BF722C8E33BDC906FB84D85E32698",
        "count": str(limit),
    }
    r = http_get(url, params=params)
    data = (r.json().get("QuotationCodeTable") or {}).get("Data") or []
    seen: set[str] = set()
    results: list[dict[str, Any]] = []
    for item in data:
        parsed = parse_em_candidate(item)
        key = f"{parsed['market']}:{parsed['code']}"
        if key in seen:
            continue
        seen.add(key)
        results.append(parsed)
    return results


def resolve_input(raw: str, *, best_match: bool = False) -> dict[str, Any]:
    """Resolve stock code or company name to market + code."""
    text = raw.strip()
    if not text:
        raise ValueError("输入不能为空")

    try:
        parsed = parse_symbol(text)
        return {**parsed, "resolved_from": "code", "query": text}
    except ValueError:
        pass

    candidates = search_securities(text)
    if not candidates:
        raise ValueError(f"未找到与「{text}」匹配的股票，请改用代码或更精确的名称")

    exact = [c for c in candidates if c.get("name") == text]
    if len(exact) == 1:
        c = exact[0]
        return {**c, "input": text, "resolved_from": "name_exact", "query": text}

    # A 股主板优先：简称搜索常返回银行/保险/指数等多条
    def score(c: dict[str, Any]) -> tuple[int, str]:
        name = c.get("name") or ""
        s = 0
        if text in name:
            s += 10
        if name.startswith(text):
            s += 5
        if c.get("classify") == "AStock" and c.get("market") in ("SH", "SZ"):
            s += 3
        if c.get("classify") == "HK":
            s += 2
        if c.get("classify") == "UsStock":
            s += 1
        return (-s, name)

    ranked = sorted(candidates, key=score)
    if best_match or len(candidates) == 1:
        c = ranked[0]
        return {
            **c,
            "input": text,
            "resolved_from": "name_best" if len(candidates) > 1 else "name_single",
            "query": text,
            "alternatives": [x for x in candidates if x != c][:5],
        }

    if len({f"{c['market']}:{c['code']}" for c in ranked[:3]}) > 1 and ranked[0]["name"] != ranked[1]["name"]:
        alt = [{"market": c["market"], "code": c["code"], "name": c.get("name"), "classify": c.get("classify")} for c in ranked[:8]]
        raise ValueError(f"「{text}」匹配到多个标的，请指定代码或更精确的名称: {alt}")

    c = ranked[0]
    return {**c, "input": text, "resolved_from": "name_best", "query": text, "alternatives": [x for x in candidates if x != c][:5]}


def parse_date(s: str) -> datetime | None:
    s = str(s).strip()[:10]
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=CN_TZ)
        except ValueError:
            continue
    return None


def days_since(date_str: str) -> int | None:
    dt = parse_date(date_str)
    if not dt:
        return None
    return (datetime.now(CN_TZ).date() - dt.date()).days


def freshness_label(days: int | None, *, fresh: int = 7, stale: int = 30) -> str:
    if days is None:
        return "unknown"
    if days <= fresh:
        return "fresh"
    if days <= stale:
        return "aging"
    return "stale"


def fetch_tencent_quote(market: str, code: str) -> dict[str, Any]:
    sym = tencent_symbol(market, code)
    url = f"https://qt.gtimg.cn/q={sym}"
    r = http_get(url, extra_headers={"Referer": "https://gu.qq.com/"})
    text = r.content.decode("gbk", errors="replace")
    m = re.search(r'="([^"]+)"', text)
    if not m:
        raise RuntimeError("Tencent 行情解析失败")
    parts = m.group(1).split("~")
    if len(parts) < 47 or not parts[3]:
        raise RuntimeError("Tencent 行情字段不足")
    return {
        "source": "tencent_realtime",
        "pe_ttm": _num(parts[39]) if len(parts) > 39 else None,
        "pb": _num(parts[46]) if len(parts) > 46 else None,
        "turnover_rate": _num(parts[38]) if len(parts) > 38 else None,
        "high_52w": _num(parts[67]) if len(parts) > 67 else None,
        "low_52w": _num(parts[68]) if len(parts) > 68 else None,
        "quote_time": parts[30] if len(parts) > 30 else None,
    }


def fetch_profile_f10(market: str, code: str) -> dict[str, Any]:
    code_param = {"SH": f"SH{code}", "SZ": f"SZ{code}", "BJ": f"BJ{code}"}.get(market)
    if not code_param:
        raise ValueError(f"F10 不支持市场: {market}")
    url = "https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/PageAjax"
    r = http_get(url, params={"code": code_param}, extra_headers={"Referer": "https://emweb.securities.eastmoney.com/"})
    payload = r.json()
    jbzl = (payload.get("jbzl") or [{}])[0]
    return {
        "source": "eastmoney_f10",
        "industry": jbzl.get("INDUSTRYCSRC1") or jbzl.get("EM2016"),
        "listing_date": jbzl.get("LISTING_DATE") or jbzl.get("FOUND_DATE"),
        "total_shares": jbzl.get("TOTAL_SHARES") or jbzl.get("REG_CAPITAL"),
        "org_name": jbzl.get("ORG_NAME"),
    }


def fetch_sh_index_sina() -> dict[str, Any]:
    r = http_get("https://hq.sinajs.cn/list=s_sh000001", extra_headers={"Referer": "https://finance.sina.com.cn"})
    text = r.content.decode("gbk", errors="replace")
    m = re.search(r'="([^"]+)"', text)
    if not m:
        raise RuntimeError("Sina 指数解析失败")
    parts = m.group(1).split(",")
    return {
        "source": "sina_index",
        "name": parts[0],
        "price": float(parts[1]),
        "change": float(parts[2]),
        "change_pct": float(parts[3]),
        "volume": int(float(parts[4])) if parts[4] else None,
        "amount": float(parts[5]) if len(parts) > 5 and parts[5] else None,
    }


def compute_valuation_from_financials(price: float | None, financials: dict[str, Any] | None) -> dict[str, Any]:
    if not price or not financials:
        return {}
    records = financials.get("records") or []
    if not records:
        return {}
    eps_ttm = sum(r.get("eps") or 0 for r in records[-4:])
    latest = financials.get("latest") or {}
    bps = latest.get("bps")
    out: dict[str, Any] = {"valuation_source": "computed_from_financials"}
    if eps_ttm and eps_ttm > 0:
        out["pe_ttm"] = round(price / eps_ttm, 2)
        out["eps_ttm"] = round(eps_ttm, 4)
    annual = financials.get("latest_annual") or {}
    if annual.get("eps") and annual.get("eps") > 0:
        out["pe_annual"] = round(price / annual["eps"], 2)
    if bps and bps > 0:
        out["pb"] = round(price / bps, 2)
    return out


def enrich_quote_valuation(quote: dict[str, Any], market: str, code: str, financials: dict[str, Any] | None = None) -> dict[str, Any]:
    if quote.get("pe_ttm") and quote.get("pb"):
        quote["valuation_source"] = quote.get("valuation_source") or "primary"
        return quote
    try:
        tq = fetch_tencent_quote(market, code)
        for k in ("pe_ttm", "pb", "turnover_rate", "high_52w", "low_52w"):
            if quote.get(k) is None and tq.get(k) is not None:
                quote[k] = tq[k]
        quote["valuation_source"] = "tencent"
        if tq.get("quote_time"):
            quote["quote_time"] = tq["quote_time"]
    except Exception as e:
        quote.setdefault("valuation_fallback_errors", []).append(f"tencent: {e}")
    if (quote.get("pe_ttm") is None or quote.get("pb") is None) and financials:
        computed = compute_valuation_from_financials(quote.get("price"), financials)
        for k, v in computed.items():
            if k == "valuation_source":
                quote["valuation_source"] = v if quote.get("pe_ttm") is None else quote.get("valuation_source", v)
            elif quote.get(k) is None:
                quote[k] = v
    if quote.get("pe_ttm") is None and quote.get("pb") is None:
        quote["valuation_source"] = quote.get("valuation_source") or "unavailable"
    return quote


def em_secid(market: str, code: str) -> str:
    if market == "SH":
        return f"1.{code}"
    if market == "SZ":
        return f"0.{code}"
    if market == "BJ":
        return f"0.{code}"
    if market == "HK":
        return f"116.{code}"
    raise ValueError(f"East Money secid 不支持市场: {market}")
    if market == "SH":
        return f"1.{code}"
    if market == "SZ":
        return f"0.{code}"
    if market == "BJ":
        return f"0.{code}"
    if market == "HK":
        return f"116.{code}"
    raise ValueError(f"East Money secid 不支持市场: {market}")


def em_price(v: Any) -> float | None:
    if v is None or v == "-":
        return None
    try:
        return round(float(v) / 100, 4)
    except (TypeError, ValueError):
        return None


def sina_symbol(market: str, code: str) -> str:
    prefix = {"SH": "sh", "SZ": "sz", "BJ": "bj"}.get(market)
    if not prefix:
        raise ValueError(f"Sina 不支持市场: {market}")
    return f"{prefix}{code}"


def tencent_symbol(market: str, code: str) -> str:
    prefix = {"SH": "sh", "SZ": "sz", "BJ": "bj", "HK": "hk"}.get(market)
    if not prefix:
        raise ValueError(f"Tencent 不支持市场: {market}")
    return f"{prefix}{code}"


def fetch_sina_quote(market: str, code: str) -> dict[str, Any]:
    sym = sina_symbol(market, code)
    url = f"https://hq.sinajs.cn/list={sym}"
    r = http_get(url, params=None, extra_headers={"Referer": "https://finance.sina.com.cn"})
    text = r.content.decode("gbk", errors="replace")
    m = re.search(r'="([^"]+)"', text)
    if not m:
        raise RuntimeError("Sina 行情解析失败")
    parts = m.group(1).split(",")
    if len(parts) < 10 or not parts[3]:
        raise RuntimeError("Sina 行情数据不完整")
    prev_close = float(parts[2])
    price = float(parts[3])
    change_pct = round((price / prev_close - 1) * 100, 2) if prev_close else None
    return {
        "source": "sina_realtime",
        "name": parts[0],
        "code": code,
        "price": price,
        "open": float(parts[1]),
        "high": float(parts[4]),
        "low": float(parts[5]),
        "prev_close": prev_close,
        "change": round(price - prev_close, 4),
        "change_pct": change_pct,
        "volume": int(float(parts[8])),
        "amount": float(parts[9]),
    }


def fetch_em_quote(market: str, code: str) -> dict[str, Any]:
    if market == "US":
        return fetch_us_quote_yfinance(code)
    if market in ("SH", "SZ", "BJ"):
        quote = fetch_sina_quote(market, code)
        try:
            secid = em_secid(market, code)
            fields = "f162,f167,f168,f116,f117"
            url = "https://push2.eastmoney.com/api/qt/stock/get"
            r = http_get(url, params={"secid": secid, "fields": fields, "ut": EM_UT})
            payload = r.json().get("data") or {}
            quote["pe_ttm"] = round(float(payload.get("f162", 0)) / 100, 2) if payload.get("f162") not in (None, "-") else None
            quote["pb"] = round(float(payload.get("f167", 0)) / 100, 2) if payload.get("f167") not in (None, "-") else None
            quote["turnover_rate"] = round(float(payload.get("f168", 0)) / 100, 2) if payload.get("f168") not in (None, "-") else None
            quote["total_mv"] = payload.get("f116")
            quote["circ_mv"] = payload.get("f117")
            quote["valuation_source"] = "eastmoney"
        except Exception as e:
            quote["valuation_fallback_errors"] = [f"eastmoney: {e}"]
        return quote
    secid = em_secid(market, code)
    fields = "f43,f44,f45,f46,f47,f48,f57,f58,f60,f116,f117,f162,f167,f168,f169,f170"
    url = "https://push2.eastmoney.com/api/qt/stock/get"
    r = http_get(url, params={"secid": secid, "fields": fields, "ut": EM_UT})
    payload = r.json().get("data") or {}
    return {
        "source": "eastmoney_realtime",
        "name": payload.get("f58"),
        "code": payload.get("f57") or code,
        "price": em_price(payload.get("f43")),
        "open": em_price(payload.get("f46")),
        "high": em_price(payload.get("f44")),
        "low": em_price(payload.get("f45")),
        "prev_close": em_price(payload.get("f60")),
        "change": em_price(payload.get("f169")),
        "change_pct": round(float(payload.get("f170", 0)) / 100, 2) if payload.get("f170") not in (None, "-") else None,
        "volume": payload.get("f47"),
        "amount": payload.get("f48"),
        "turnover_rate": round(float(payload.get("f168", 0)) / 100, 2) if payload.get("f168") not in (None, "-") else None,
        "pe_ttm": round(float(payload.get("f162", 0)) / 100, 2) if payload.get("f162") not in (None, "-") else None,
        "pb": round(float(payload.get("f167", 0)) / 100, 2) if payload.get("f167") not in (None, "-") else None,
        "total_mv": payload.get("f116"),
        "circ_mv": payload.get("f117"),
    }


def fetch_us_quote_yfinance(code: str) -> dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as e:
        raise RuntimeError("美股数据需要 yfinance，请运行 pip install -r requirements.txt") from e
    t = yf.Ticker(code)
    info = t.info or {}
    hist = t.history(period="5d")
    last = hist.iloc[-1] if len(hist) else None
    prev = hist.iloc[-2] if len(hist) > 1 else None
    price = info.get("currentPrice") or info.get("regularMarketPrice") or (float(last["Close"]) if last is not None else None)
    prev_close = info.get("previousClose") or (float(prev["Close"]) if prev is not None else None)
    change_pct = None
    if price and prev_close:
        change_pct = round((price - prev_close) / prev_close * 100, 2)
    return {
        "source": "yfinance",
        "name": info.get("shortName") or info.get("longName") or code,
        "code": code,
        "price": price,
        "open": info.get("open") or (float(last["Open"]) if last is not None else None),
        "high": info.get("dayHigh") or (float(last["High"]) if last is not None else None),
        "low": info.get("dayLow") or (float(last["Low"]) if last is not None else None),
        "prev_close": prev_close,
        "change_pct": change_pct,
        "volume": info.get("volume") or (int(last["Volume"]) if last is not None else None),
        "pe_ttm": info.get("trailingPE"),
        "pb": info.get("priceToBook"),
        "market_cap": info.get("marketCap"),
    }


def _kline_stats(rows: list[dict[str, Any]]) -> dict[str, Any]:
    closes = [x["close"] for x in rows]
    last = rows[-1]["close"]

    def ret(n: int) -> float | None:
        if len(closes) <= n:
            return None
        return round((last / closes[-1 - n] - 1) * 100, 2)

    window = rows[-min(252, len(rows)) :]
    return {
        "rows_count": len(rows),
        "latest": rows[-1],
        "stats": {
            "high_52w": max(x["high"] for x in window),
            "low_52w": min(x["low"] for x in window),
            "return_1w_pct": ret(5),
            "return_1m_pct": ret(20),
            "return_3m_pct": ret(60),
            "return_6m_pct": ret(120),
            "return_1y_pct": ret(252) if len(closes) > 252 else ret(len(closes) - 1),
            "avg_turnover_rate_20d": (
                round(sum(x.get("turnover_rate") or 0 for x in rows[-20:]) / min(20, len(rows)), 2)
                if any(x.get("turnover_rate") for x in rows[-20:])
                else None
            ),
        },
    }


def fetch_kline_tencent(code: str, market: str, days: int = 320) -> dict[str, Any]:
    sym = tencent_symbol(market, code)
    url = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
    r = http_get(url, params={"param": f"{sym},day,,,{days},qfq"}, timeout=20)
    data = (r.json().get("data") or {}).get(sym) or {}
    raw = data.get("qfqday") or data.get("day") or []
    rows = []
    for item in raw:
        if len(item) < 6:
            continue
        rows.append(
            {
                "date": item[0],
                "open": float(item[1]),
                "close": float(item[2]),
                "high": float(item[3]),
                "low": float(item[4]),
                "volume": int(float(item[5])),
            }
        )
    if not rows:
        return {"source": "tencent_kline", "rows": []}
    out = _kline_stats(rows)
    out["source"] = "tencent_kline"
    return out


def fetch_kline_cn(code: str, market: str, days: int = 260) -> dict[str, Any]:
    try:
        secid = em_secid(market, code)
        url = "https://push2his.eastmoney.com/api/qt/stock/kline/get"
        params = {
            "secid": secid,
            "fields1": "f1,f2,f3,f4,f5,f6",
            "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
            "klt": "101",
            "fqt": "1",
            "beg": "20200101",
            "end": "20500101",
        }
        r = http_get(url, params=params, timeout=20)
        klines = (r.json().get("data") or {}).get("klines") or []
        rows = []
        for line in klines[-days:]:
            parts = line.split(",")
            if len(parts) < 11:
                continue
            rows.append(
                {
                    "date": parts[0],
                    "open": float(parts[1]),
                    "close": float(parts[2]),
                    "high": float(parts[3]),
                    "low": float(parts[4]),
                    "volume": int(float(parts[5])),
                    "amount": float(parts[6]),
                    "amplitude_pct": float(parts[7]),
                    "change_pct": float(parts[8]),
                    "turnover_rate": float(parts[10]) if parts[10] else None,
                }
            )
        if rows:
            out = _kline_stats(rows)
            out["source"] = "eastmoney_kline"
            return out
    except Exception:
        pass
    return fetch_kline_tencent(code, market, days=max(days, 320))


def fetch_financials_cn(code: str) -> dict[str, Any]:
    year = str(datetime.now(CN_TZ).year - 3)
    df = ak.stock_financial_analysis_indicator(symbol=code, start_year=year)
    if df is None or df.empty:
        return {"source": "sina_financial", "records": []}
    records = []
    for _, row in df.tail(8).iterrows():
        records.append(
            {
                "date": str(row.get("日期", "")),
                "eps": _num(row.get("加权每股收益(元)")),
                "bps": _num(row.get("每股净资产_调整后(元)")),
                "roe_pct": _num(row.get("净资产收益率(%)")),
                "gross_margin_pct": _num(row.get("销售毛利率(%)")),
                "net_margin_pct": _num(row.get("销售净利率(%)")),
                "debt_to_asset_pct": _num(row.get("资产负债率(%)")),
                "current_ratio": _num(row.get("流动比率")),
                "ocf_to_revenue_pct": _num(row.get("销售现金比率(%)")),
            }
        )
    latest = records[-1] if records else {}
    prev_year = next((r for r in reversed(records) if r["date"].endswith("12-31")), None)
    return {"source": "sina_financial", "records": records, "latest": latest, "latest_annual": prev_year}


def fetch_profile_cn(code: str, market: str = "SH") -> dict[str, Any]:
    try:
        df = ak.stock_individual_info_em(symbol=code)
        info = {str(row.iloc[0]).strip(): str(row.iloc[1]).strip() for _, row in df.iterrows()}
        return {
            "source": "eastmoney_profile",
            "industry": info.get("行业") or info.get("所属行业"),
            "listing_date": info.get("上市时间"),
            "total_shares": info.get("总股本"),
            "float_shares": info.get("流通股"),
        }
    except Exception:
        return fetch_profile_f10(market, code)


def fetch_northbound_cn(code: str) -> dict[str, Any]:
    df = ak.stock_hsgt_individual_em(symbol=code)
    if df is None or df.empty:
        return {"source": "eastmoney_northbound", "latest": None, "freshness": "missing"}
    tail = df.tail(5)
    latest = tail.iloc[-1]
    as_of = str(latest.iloc[0])
    age_days = days_since(as_of)
    freshness = freshness_label(age_days, fresh=5, stale=30)
    result: dict[str, Any] = {
        "source": "eastmoney_northbound",
        "as_of": as_of,
        "age_days": age_days,
        "freshness": freshness,
        "latest": {
            "date": as_of,
            "holding_shares": _num(latest.iloc[3]),
            "holding_mv": _num(latest.iloc[4]),
            "holding_pct": _num(latest.iloc[5]),
            "daily_change_shares": _num(latest.iloc[6]),
            "daily_change_amount": _num(latest.iloc[7]),
        },
    }
    if freshness == "stale":
        result["warning"] = f"北向持股数据截至 {as_of}，已过期 {age_days} 天，AKShare 源可能未更新，勿用于短期资金判断"
    return result


def fetch_market_context_cn() -> dict[str, Any]:
    """A-share market liquidity + CN 10Y bond yield snapshot."""
    ctx: dict[str, Any] = {"source": "eastmoney_market"}
    try:
        df = ak.stock_zh_index_spot_em()
        sh = df[df["代码"] == "000001"]
        if not sh.empty:
            row = sh.iloc[0]
            ctx["sh_index"] = {
                "name": row["名称"],
                "price": float(row["最新价"]),
                "change_pct": float(row["涨跌幅"]),
            }
    except Exception as e:
        ctx["sh_index_error"] = str(e)
        try:
            ctx["sh_index"] = fetch_sh_index_sina()
        except Exception as e2:
            ctx["sh_index_sina_error"] = str(e2)
    try:
        spot = ak.bond_zh_us_rate()
        if spot is not None and not spot.empty:
            cn = spot.tail(1).iloc[0]
            ctx["cn_10y_yield"] = _num(cn.get("中国国债收益率10年"))
            ctx["us_10y_yield"] = _num(cn.get("美国国债收益率10年"))
            ctx["macro_date"] = str(cn.get("日期"))
    except Exception as e:
        ctx["bond_error"] = str(e)
    try:
        flow = ak.stock_market_fund_flow()
        if flow is not None and not flow.iloc[-1:].empty:
            last = flow.iloc[-1]
            ctx["market_turnover"] = {
                "date": str(last.get("日期")),
                "total_amount": _num(last.get("成交额")),
            }
    except Exception as e:
        ctx["flow_error"] = str(e)
    return ctx


def _num(v: Any) -> float | None:
    if v is None or v == "" or v == "-":
        return None
    try:
        f = float(v)
        if f != f:  # NaN
            return None
        return round(f, 4)
    except (TypeError, ValueError):
        return None


def build_data_quality(result: dict[str, Any]) -> dict[str, Any]:
    warnings: list[str] = []
    fields: dict[str, str] = {}
    quote = result.get("quote") or {}
    kline = result.get("kline") or {}
    nb = result.get("northbound") or {}

    if quote.get("source") == "sina_realtime":
        fields["price"] = "fresh"
    if quote.get("valuation_source") == "computed_from_financials":
        warnings.append("P/E、P/B 由财报 EPS/BPS 推算，非行情 TTM 口径")
    elif quote.get("valuation_source") == "tencent":
        fields["pe_pb"] = "fresh"
    elif not quote.get("pe_ttm"):
        warnings.append("P/E 不可用")
        fields["pe_pb"] = "missing"

    kline_date = (kline.get("latest") or {}).get("date")
    if kline_date:
        kd = days_since(kline_date)
        fields["kline"] = freshness_label(kd, fresh=3, stale=10)
        if kd and kd > 3:
            warnings.append(f"K 线最新交易日为 {kline_date}（{kd} 天前），非交易时段属正常")

    fin_latest = (result.get("financials") or {}).get("latest") or {}
    if fin_latest.get("date"):
        fd = days_since(str(fin_latest["date"]))
        fields["financials"] = freshness_label(fd, fresh=120, stale=365)
        if fd and fd > 120:
            warnings.append(f"财务数据最新报告期 {fin_latest['date']}，分析盈利需结合最新公告")

    if nb.get("freshness") == "stale":
        warnings.append(nb.get("warning") or "北向持股数据过期")
        fields["northbound"] = "stale"
    elif nb.get("freshness") == "missing":
        fields["northbound"] = "missing"
    elif nb.get("freshness"):
        fields["northbound"] = nb["freshness"]

    if result.get("profile", {}).get("error"):
        warnings.append("公司概况抓取失败，行业信息可能缺失")
        fields["profile"] = "missing"

    return {"fields": fields, "warnings": warnings}


def fetch_one(raw: str, *, best_match: bool = False) -> dict[str, Any]:
    parsed = resolve_input(raw, best_match=best_match)
    market, code = parsed["market"], parsed["code"]
    result: dict[str, Any] = {
        "input": parsed.get("input") or raw.strip(),
        "query": parsed.get("query") or raw.strip(),
        "resolved_from": parsed.get("resolved_from"),
        "market": market,
        "code": code,
        "fetched_at": now_cn(),
    }
    if parsed.get("name"):
        result["resolved_name"] = parsed["name"]
    if parsed.get("alternatives"):
        result["alternatives"] = [
            {"market": a["market"], "code": a["code"], "name": a.get("name"), "classify": a.get("classify")}
            for a in parsed["alternatives"]
        ]
    result["quote"] = fetch_em_quote(market, code)
    if market in ("SH", "SZ", "BJ"):
        for key, fn in (
            ("kline", lambda: fetch_kline_cn(code, market)),
            ("financials", lambda: fetch_financials_cn(code)),
            ("profile", lambda: fetch_profile_cn(code, market)),
            ("northbound", lambda: fetch_northbound_cn(code)),
        ):
            try:
                result[key] = fn()
            except Exception as e:
                result[key] = {"error": str(e)}
        result["quote"] = enrich_quote_valuation(result["quote"], market, code, result.get("financials"))
    elif market == "HK":
        try:
            result["kline"] = fetch_kline_cn(code, "HK")
        except Exception as e:
            result["kline"] = {"error": str(e)}
    result["data_quality"] = build_data_quality(result)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch stock data as JSON")
    parser.add_argument("symbols", nargs="+", help="Stock codes or company names, e.g. 600519 贵州茅台 AAPL")
    parser.add_argument("--market-context", action="store_true", help="Include A-share macro context")
    parser.add_argument("--best-match", action="store_true", help="When name is ambiguous, pick the best-ranked candidate")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    args = parser.parse_args()

    out: dict[str, Any] = {"fetched_at": now_cn(), "stocks": []}
    if args.market_context:
        try:
            out["market_context"] = fetch_market_context_cn()
        except Exception as e:
            out["market_context"] = {"error": str(e)}

    errors = []
    for sym in args.symbols:
        try:
            out["stocks"].append(fetch_one(sym, best_match=args.best_match))
        except Exception as e:
            errors.append({"symbol": sym, "error": str(e)})

    if errors:
        out["errors"] = errors

    indent = 2 if args.pretty else None
    json.dump(out, sys.stdout, ensure_ascii=False, indent=indent)
    sys.stdout.write("\n")
    if errors and not out["stocks"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
