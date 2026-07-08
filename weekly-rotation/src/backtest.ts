import type { Target } from "./config";
import type { WeeklyBar } from "./data";
import { decide, resolveAction } from "./decide";
import type { RotationAction } from "./decide";

/** 多标的按周对齐后的收盘矩阵 */
export type AlignedWeeks = {
  /** 升序周键（周一日期） */
  weekKeys: string[];
  /** 每周代表日期（该周最后交易日，取各标的中最晚者） */
  dates: string[];
  /** code -> 与 weekKeys 对齐的收盘序列 */
  closes: Map<string, number[]>;
};

/** 取各标的周键交集对齐（交集起点即组合内最晚成立的 ETF 上市周） */
export function alignWeeks(
  barsByCode: Map<string, WeeklyBar[]>,
  codes: string[]
): AlignedWeeks {
  const maps = codes.map((code) => {
    const m = new Map<string, WeeklyBar>();
    for (const bar of barsByCode.get(code) ?? []) m.set(bar.weekKey, bar);
    return m;
  });

  const first = maps[0];
  const weekKeys = [...first.keys()]
    .filter((k) => maps.every((m) => m.has(k)))
    .sort();

  const closes = new Map<string, number[]>();
  codes.forEach((code, i) => {
    closes.set(
      code,
      weekKeys.map((k) => maps[i].get(k)!.close)
    );
  });
  const dates = weekKeys.map((k) =>
    maps.reduce((acc, m) => {
      const d = m.get(k)!.date;
      return d > acc ? d : acc;
    }, "")
  );

  return { weekKeys, dates, closes };
}

export type Trade = {
  date: string;
  action: RotationAction;
  from: string | null;
  to: string | null;
};

export type BacktestOptions = {
  lookback: number;
  /** 起始日期（含），默认组合数据交集起点（最晚成立 ETF） */
  start?: string;
  /** 结束日期（含），默认最新一周 */
  end?: string;
};

export type ComboResult = {
  codes: string[];
  startDate: string;
  endDate: string;
  /** 参与模拟的周数（每周一个收益） */
  weeks: number;
  cumulativeReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  switches: number;
  emptyWeeks: number;
  trades: Trade[];
  equityCurve: { date: string; equity: number }[];
  /** 同期各标的买入持有收益 */
  buyHold: Record<string, number>;
};

/**
 * 单组合回测：第 i 周收盘计算近 lookback 周累计涨幅
 * （close[i]/close[i-lookback]-1），top1 为正则第 i+1 周持有它，否则空仓。
 * 以周收盘价近似周五 14:30 执行价，不计费率。
 */
export function backtestCombo(
  aligned: AlignedWeeks,
  targets: Target[],
  opts: BacktestOptions
): ComboResult | null {
  const { dates, closes } = aligned;
  const n0 = dates.length;

  let endIdx = n0 - 1;
  if (opts.end) {
    while (endIdx >= 0 && dates[endIdx] > opts.end) endIdx--;
  }
  let startIdx = opts.lookback;
  if (opts.start) {
    let i = 0;
    while (i <= endIdx && dates[i] < opts.start) i++;
    startIdx = Math.max(startIdx, i);
  }
  // 至少要能做一次「决策 + 持有一周」
  if (endIdx - startIdx < 1) return null;

  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  let switches = 0;
  let emptyWeeks = 0;
  let holding: string | null = null;
  const trades: Trade[] = [];
  const equityCurve = [{ date: dates[startIdx], equity: 1 }];

  for (let i = startIdx; i < endIdx; i++) {
    const candidates = targets.map((t) => {
      const series = closes.get(t.code)!;
      return {
        code: t.code,
        name: t.name,
        momentum: series[i] / series[i - opts.lookback] - 1,
      };
    });
    const { target } = decide(candidates);
    const nextCode = target?.code ?? null;
    const action = resolveAction(holding, nextCode);
    if (action === "open" || action === "switch" || action === "clear") {
      switches++;
      trades.push({ date: dates[i], action, from: holding, to: nextCode });
    }
    holding = nextCode;

    let weekReturn = 0;
    if (holding) {
      const series = closes.get(holding)!;
      weekReturn = series[i + 1] / series[i] - 1;
    } else {
      emptyWeeks++;
    }
    equity *= 1 + weekReturn;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, 1 - equity / peak);
    equityCurve.push({ date: dates[i + 1], equity });
  }

  const weeks = endIdx - startIdx;
  const years = weeks / 52;
  const buyHold: Record<string, number> = {};
  for (const t of targets) {
    const series = closes.get(t.code)!;
    buyHold[t.code] = series[endIdx] / series[startIdx] - 1;
  }

  return {
    codes: targets.map((t) => t.code),
    startDate: dates[startIdx],
    endDate: dates[endIdx],
    weeks,
    cumulativeReturn: equity - 1,
    annualizedReturn: years > 0 ? Math.pow(equity, 1 / years) - 1 : 0,
    maxDrawdown,
    switches,
    emptyWeeks,
    trades,
    equityCurve,
    buyHold,
  };
}

/** 全部 size 元组合（保持原顺序） */
export function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...rest] = items;
  return [
    ...combinations(rest, size - 1).map((c) => [head, ...c]),
    ...combinations(rest, size),
  ];
}

/** 2 个至全部标的的所有组合 */
export function allCombos(targets: Target[]): Target[][] {
  const combos: Target[][] = [];
  for (let size = targets.length; size >= 2; size--) {
    combos.push(...combinations(targets, size));
  }
  return combos;
}
