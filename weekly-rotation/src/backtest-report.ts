import type { ComboResult } from "./backtest";
import type { Target } from "./config";
import { ACTION_LABELS } from "./decide";

const fmtPct = (v: number): string => `${(v * 100).toFixed(2)}%`;

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

export type NamedResult = {
  targets: Target[];
  result: ComboResult;
};

function comboLabel(targets: Target[]): string {
  return targets.map((t) => t.name).join(" + ");
}

export function renderReport(results: NamedResult[]): string {
  const sorted = [...results].sort(
    (a, b) => b.result.cumulativeReturn - a.result.cumulativeReturn
  );

  const out: string[] = [];
  out.push("=== 周线轮动回测：组合排名（按累计收益） ===");
  out.push("");
  out.push(
    renderTable(
      ["#", "组合", "区间", "周数", "累计收益", "年化", "最大回撤", "换仓", "空仓周"],
      sorted.map((r, i) => [
        String(i + 1),
        comboLabel(r.targets),
        `${r.result.startDate} ~ ${r.result.endDate}`,
        String(r.result.weeks),
        fmtPct(r.result.cumulativeReturn),
        fmtPct(r.result.annualizedReturn),
        fmtPct(r.result.maxDrawdown),
        String(r.result.switches),
        String(r.result.emptyWeeks),
      ])
    )
  );

  const best = sorted[0];
  out.push("");
  out.push(`=== 最优组合：${comboLabel(best.targets)} ===`);
  out.push("");
  out.push("同期买入持有基准：");
  out.push(
    renderTable(
      ["标的", "代码", "买入持有收益"],
      best.targets.map((t) => [
        t.name,
        t.code,
        fmtPct(best.result.buyHold[t.code] ?? 0),
      ])
    )
  );
  out.push("");
  out.push(`换仓明细（共 ${best.result.trades.length} 次）：`);
  const nameOf = (code: string | null): string => {
    if (code === null) return "空仓";
    return best.targets.find((t) => t.code === code)?.name ?? code;
  };
  out.push(
    renderTable(
      ["日期", "动作", "从", "到"],
      best.result.trades.map((tr) => [
        tr.date,
        ACTION_LABELS[tr.action],
        nameOf(tr.from),
        nameOf(tr.to),
      ])
    )
  );
  out.push("");
  out.push(
    "> 口径：周收盘价近似周五 14:30 执行价，逐周复利，不计费率与滑点。"
  );
  return out.join("\n");
}
