import {
  ETF_CODE_PREFIXES,
  HOT_SECTOR_KEYWORDS,
  LOW_VOL_NAME_KEYWORDS,
} from "../config/hot-keywords";
import type { VolatilityStats } from "./volatility";

export type VolatilityTier = "low" | "medium" | "high";

export type ThresholdRange = {
  min: number;
  max: number;
  label: string;
};

export type RecommendResult = {
  tier: VolatilityTier;
  tierLabel: string;
  range: ThresholdRange;
  suggestedPct: number;
  fallback: boolean;
  reasons: string[];
};

const TIER_RANGES: Record<VolatilityTier, ThresholdRange> = {
  low: { min: 8, max: 12, label: "低波动（蓝筹/ETF）" },
  medium: { min: 12, max: 18, label: "中波动（成长）" },
  high: { min: 18, max: 25, label: "高波动（主线热门）" },
};

/** 周/两周回撤超过此比例时倾向高波动 */
const HIGH_VOL_WEEKLY = 0.15;
const HIGH_VOL_BIWEEKLY = 0.2;
const LOW_VOL_WEEKLY = 0.08;

export function isEtfOrFundCode(code: string): boolean {
  const market = code.startsWith("SH") ? "SH" : "SZ";
  const num = code.slice(2);
  const prefixes = ETF_CODE_PREFIXES[market];
  return prefixes.some((p) => num.startsWith(p));
}

export function isLowVolName(name: string): boolean {
  return LOW_VOL_NAME_KEYWORDS.some((k) => name.includes(k));
}

export function isHotSectorName(name: string): boolean {
  return HOT_SECTOR_KEYWORDS.some((k) => name.includes(k));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function classifyTier(
  code: string,
  name: string,
  stats: VolatilityStats
): { tier: VolatilityTier; reasons: string[] } {
  const reasons: string[] = [];

  if (isHotSectorName(name)) {
    reasons.push("名称命中主线热门板块关键词");
    return { tier: "high", reasons };
  }

  const etfLike = isEtfOrFundCode(code) || isLowVolName(name);
  if (
    etfLike &&
    stats.maxWeeklyDrawdown < HIGH_VOL_WEEKLY &&
    stats.maxBiweeklyDrawdown < HIGH_VOL_BIWEEKLY
  ) {
    reasons.push("ETF/基金/指数类且历史波动偏低");
    return { tier: "low", reasons };
  }

  if (
    stats.maxWeeklyDrawdown >= HIGH_VOL_WEEKLY ||
    stats.maxBiweeklyDrawdown >= HIGH_VOL_BIWEEKLY
  ) {
    reasons.push("近阶段最大周/两周回撤偏大");
    return { tier: "high", reasons };
  }

  if (
    stats.maxWeeklyDrawdown <= LOW_VOL_WEEKLY &&
    stats.maxBiweeklyDrawdown <= LOW_VOL_WEEKLY * 1.5
  ) {
    reasons.push("历史波动处于偏低区间");
    return { tier: "low", reasons };
  }

  reasons.push("默认成长/中性波动档");
  return { tier: "medium", reasons };
}

export function recommendThreshold(
  code: string,
  name: string,
  stats: VolatilityStats,
  options?: { fallback?: boolean }
): RecommendResult {
  const fallback = options?.fallback ?? stats.barCount < 20;

  if (fallback) {
    return {
      tier: "high",
      tierLabel: TIER_RANGES.high.label,
      range: TIER_RANGES.high,
      suggestedPct: 18,
      fallback: true,
      reasons: ["K 线数据不足，回退默认建议 18%"],
    };
  }

  const { tier, reasons } = classifyTier(code, name, stats);
  const range = TIER_RANGES[tier];

  const raw =
    Math.max(
      stats.maxDailyDrawdown,
      stats.maxWeeklyDrawdown * 0.95,
      stats.maxBiweeklyDrawdown * 0.9
    ) * 1.1;

  const suggestedPct = clamp(Math.round(raw * 100), range.min, range.max);

  return {
    tier,
    tierLabel: range.label,
    range,
    suggestedPct,
    fallback: false,
    reasons,
  };
}
