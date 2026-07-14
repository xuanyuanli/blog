import { alignWeeks, backtest } from "./backtest";
import type { BacktestResult } from "./backtest";
import { LOOKBACK_WEEKS, TARGETS } from "./config";
import type { Target } from "./config";
import { loadWeeklyBarsByCode } from "./run-backtest";

const fmtPct = (v: number): string => `${(v * 100).toFixed(1)}%`;

/** 枚举 items 的全部子集（大小 >= minSize），用位掩码 */
export function subsets<T>(items: T[], minSize = 2): T[][] {
  const res: T[][] = [];
  const n = items.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const s: T[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s.push(items[i]);
    if (s.length >= minSize) res.push(s);
  }
  return res;
}

/** 中日韩全角字符按宽度 2 计 */
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    w += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(
      ch
    )
      ? 2
      : 1;
  }
  return w;
}

function pad(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - displayWidth(s)));
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(displayWidth(h), ...rows.map((r) => displayWidth(r[i])))
  );
  const line = (cells: string[]) =>
    cells.map((c, i) => pad(c, widths[i])).join("  ");
  return [
    line(headers),
    line(widths.map((w) => "-".repeat(w))),
    ...rows.map(line),
  ].join("\n");
}

/** 标的短名：去掉末尾「ETF」，用 + 连接 */
function comboName(targets: Target[]): string {
  return targets.map((t) => t.name.replace(/ETF$/, "")).join("+");
}

type ComboResult = {
  targets: Target[];
  result: BacktestResult;
  /** 年化 / 最大回撤，衡量收益风险比（回撤为 0 时取年化本身） */
  calmar: number;
};

export type CombosCliOptions = {
  start?: string;
  end?: string;
  top?: number;
  minSize?: number;
};

export async function runCombos(opts: CombosCliOptions): Promise<string> {
  const top = opts.top ?? 20;
  const minSize = opts.minSize ?? 2;
  const barsByCode = await loadWeeklyBarsByCode(TARGETS);

  const combos = subsets(TARGETS, minSize);
  const results: ComboResult[] = [];
  let skipped = 0;
  for (const targets of combos) {
    const aligned = alignWeeks(
      barsByCode,
      targets.map((t) => t.code)
    );
    const result = backtest(aligned, targets, {
      lookback: LOOKBACK_WEEKS,
      start: opts.start,
      end: opts.end,
    });
    if (!result) {
      skipped++;
      continue;
    }
    const calmar =
      result.maxDrawdown > 0
        ? result.annualizedReturn / result.maxDrawdown
        : result.annualizedReturn;
    results.push({ targets, result, calmar });
  }

  if (results.length === 0) {
    throw new Error("指定区间内没有可回测的组合");
  }

  const out: string[] = [];
  const rangeNote = [
    opts.start ? `start=${opts.start}` : null,
    opts.end ? `end=${opts.end}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  out.push(
    `=== 全组合回测（共 ${combos.length} 个组合，成功 ${results.length}，跳过 ${skipped}${
      rangeNote ? `；${rangeNote}` : ""
    }）===`
  );

  const buildTable = (list: ComboResult[]): string =>
    renderTable(
      ["组合", "区间", "周数", "累计", "年化", "回撤", "卡玛", "换仓"],
      list.map((c) => [
        comboName(c.targets),
        `${c.result.startDate}~${c.result.endDate}`,
        String(c.result.weeks),
        fmtPct(c.result.cumulativeReturn),
        fmtPct(c.result.annualizedReturn),
        fmtPct(c.result.maxDrawdown),
        c.calmar.toFixed(2),
        String(c.result.switches),
      ])
    );

  const byReturn = [...results].sort(
    (a, b) => b.result.cumulativeReturn - a.result.cumulativeReturn
  );
  out.push("");
  out.push(`▶ 按累计收益 Top ${Math.min(top, byReturn.length)}：`);
  out.push(buildTable(byReturn.slice(0, top)));

  const byCalmar = [...results].sort((a, b) => b.calmar - a.calmar);
  out.push("");
  out.push(`▶ 按卡玛比率（年化/回撤）Top ${Math.min(top, byCalmar.length)}：`);
  out.push(buildTable(byCalmar.slice(0, top)));

  out.push("");
  out.push(
    "> 卡玛=年化/最大回撤，衡量收益风险比；跨组合窗口长度不同，累计收益偏向窗口短的近期强势组合，请结合区间与回撤判断。"
  );
  return out.join("\n");
}
