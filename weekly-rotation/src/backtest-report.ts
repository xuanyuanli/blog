import type { BacktestResult } from "./backtest";
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
  label: string;
  targets: Target[];
  result: BacktestResult;
};

export function renderReport(strategies: NamedResult[]): string {
  const out: string[] = [];
  out.push("=== 周线轮动回测：标的池对比 ===");
  out.push("");
  out.push(
    renderTable(
      ["策略", "区间", "周数", "累计收益", "年化", "最大回撤", "换仓", "空仓周"],
      strategies.map((s) => [
        s.label,
        `${s.result.startDate} ~ ${s.result.endDate}`,
        String(s.result.weeks),
        fmtPct(s.result.cumulativeReturn),
        fmtPct(s.result.annualizedReturn),
        fmtPct(s.result.maxDrawdown),
        String(s.result.switches),
        String(s.result.emptyWeeks),
      ])
    )
  );

  for (const s of strategies) {
    out.push("");
    out.push(`【${s.label}】同期买入持有基准：`);
    out.push(
      renderTable(
        ["标的", "代码", "买入持有收益"],
        s.targets.map((t) => [
          t.name,
          t.code,
          fmtPct(s.result.buyHold[t.code] ?? 0),
        ])
      )
    );
  }

  for (const s of strategies) {
    const nameOf = (code: string | null): string => {
      if (code === null) return "空仓";
      return s.targets.find((t) => t.code === code)?.name ?? code;
    };
    out.push("");
    out.push(`【${s.label}】换仓明细（共 ${s.result.trades.length} 次）：`);
    out.push(
      renderTable(
        ["日期", "动作", "从", "到"],
        s.result.trades.map((tr) => [
          tr.date,
          ACTION_LABELS[tr.action],
          nameOf(tr.from),
          nameOf(tr.to),
        ])
      )
    );
  }

  out.push("");
  out.push(
    "> 口径：周收盘价近似周五 14:30 执行价，逐周复利，不计费率与滑点。年化受区间长短影响，跨区间对比以累计收益与回撤为主。"
  );
  return out.join("\n");
}
