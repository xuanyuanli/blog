import type { DailyBar } from "./kline-eastmoney";

export type VolatilityStats = {
  maxDailyDrawdown: number;
  maxWeeklyDrawdown: number;
  maxBiweeklyDrawdown: number;
  barCount: number;
};

export function computeVolatility(bars: DailyBar[]): VolatilityStats {
  if (bars.length < 2) {
    return {
      maxDailyDrawdown: 0,
      maxWeeklyDrawdown: 0,
      maxBiweeklyDrawdown: 0,
      barCount: bars.length,
    };
  }

  let maxDaily = 0;
  for (let i = 1; i < bars.length; i++) {
    const prevClose = bars[i - 1].close;
    const low = bars[i].low;
    if (prevClose > 0) {
      const dd = (prevClose - low) / prevClose;
      if (dd > maxDaily) maxDaily = dd;
    }
  }

  const maxWeekly = maxWindowDrawdown(bars, 5);
  const maxBiweekly = maxWindowDrawdown(bars, 10);

  return {
    maxDailyDrawdown: maxDaily,
    maxWeeklyDrawdown: maxWeekly,
    maxBiweeklyDrawdown: maxBiweekly,
    barCount: bars.length,
  };
}

function maxWindowDrawdown(bars: DailyBar[], windowSize: number): number {
  let maxDd = 0;

  for (let i = 0; i <= bars.length - windowSize; i++) {
    const window = bars.slice(i, i + windowSize);
    const peak = Math.max(...window.map((b) => b.high));
    const trough = Math.min(...window.map((b) => b.low));
    if (peak > 0) {
      const dd = (peak - trough) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }

  return maxDd;
}

export function formatPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
