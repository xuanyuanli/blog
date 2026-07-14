import { alignWeeks, backtest } from "./backtest";
import { renderReport } from "./backtest-report";
import type { NamedResult } from "./backtest-report";
import { LOOKBACK_WEEKS, TARGETS } from "./config";
import type { Target } from "./config";
import { completedBars, fetchWeeklyBars, fetchWithRetry } from "./data";
import type { WeeklyBar } from "./data";
import { shanghaiDateStr } from "./scheduler";

const WEEKLY_COUNT = 800;

/** 2025 年上市、拉低对齐窗口的新品 */
const NEW_2025 = ["SH588170", "SZ159206"];
/** 2023 年上市的品种（连同 2025 新品一起剔除得到长历史池） */
const NEW_2023 = ["SZ159652"];

/**
 * 回测对比多个标的池，按成立时间分档以兼顾窗口长度：
 * 全部 → 去 2025 新品 → 再去 2023 新品（长历史）。
 */
const POOLS: { label: string; targets: Target[] }[] = [
  { label: `${TARGETS.length}标的池（全部）`, targets: TARGETS },
  {
    label: `${TARGETS.length - NEW_2025.length}标的池（不含2025年新品）`,
    targets: TARGETS.filter((t) => !NEW_2025.includes(t.code)),
  },
  {
    label: `${TARGETS.length - NEW_2025.length - NEW_2023.length}标的池（长历史）`,
    targets: TARGETS.filter(
      (t) => !NEW_2025.includes(t.code) && !NEW_2023.includes(t.code)
    ),
  },
];

export type BacktestCliOptions = {
  start?: string;
  end?: string;
};

/**
 * 按标的串行拉取周K并重试（避免并发触发数据源限流），返回 code -> 已完结周序列。
 * 打印各标的数据范围。
 */
export async function loadWeeklyBarsByCode(
  targets: Target[]
): Promise<Map<string, WeeklyBar[]>> {
  const todayStr = shanghaiDateStr(Date.now());
  const barsByCode = new Map<string, WeeklyBar[]>();
  for (const t of targets) {
    const weekly = await fetchWithRetry(
      () => fetchWeeklyBars(t.code, WEEKLY_COUNT),
      (bars) => bars.length >= LOOKBACK_WEEKS + 2
    );
    barsByCode.set(t.code, completedBars(weekly, todayStr));
  }

  for (const t of targets) {
    const bars = barsByCode.get(t.code)!;
    if (bars.length < LOOKBACK_WEEKS + 2) {
      throw new Error(`${t.name}(${t.code}) 周K数据不足，无法回测`);
    }
    console.log(
      `${t.name}(${t.code}): ${bars.length} 周，${bars[0].date} ~ ${bars[bars.length - 1].date}`
    );
  }
  console.log("");
  return barsByCode;
}

export async function runBacktest(opts: BacktestCliOptions): Promise<string> {
  const barsByCode = await loadWeeklyBarsByCode(TARGETS);

  const strategies: NamedResult[] = [];
  for (const pool of POOLS) {
    const aligned = alignWeeks(
      barsByCode,
      pool.targets.map((t) => t.code)
    );
    const result = backtest(aligned, pool.targets, {
      lookback: LOOKBACK_WEEKS,
      start: opts.start,
      end: opts.end,
    });
    if (result) {
      strategies.push({ label: pool.label, targets: pool.targets, result });
    } else {
      console.log(`跳过【${pool.label}】：区间内数据不足`);
    }
  }

  if (strategies.length === 0) {
    throw new Error("指定区间内数据不足，无法回测");
  }
  return renderReport(strategies);
}
