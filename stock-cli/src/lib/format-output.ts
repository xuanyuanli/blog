import {
  ADVICE_HINT,
  DISCIPLINE_BRIEF,
  DISCIPLINE_CLOSING,
  EXECUTION_RULES,
  PSYCHOLOGY_ITEMS,
} from "../content/execution-rules";
import type { AnalyzeResult } from "./analyze";
import { formatPct } from "./volatility";

export type FormatOptions = {
  json: boolean;
  advice: boolean;
  months?: number;
};

function shouldShowFullAdvice(result: AnalyzeResult, advice: boolean): boolean {
  return advice || result.trailing.triggered;
}

function buildExecutionPayload(showFull: boolean) {
  if (!showFull) {
    return {
      showFullAdvice: false,
      brief: DISCIPLINE_BRIEF,
      hint: ADVICE_HINT,
    };
  }

  return {
    showFullAdvice: true,
    psychology: PSYCHOLOGY_ITEMS.map(
      (p) => `${p.impulse} — ${p.explanation}`
    ),
    rules: EXECUTION_RULES.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      constraint: r.constraint,
    })),
    closing: DISCIPLINE_CLOSING,
  };
}

export function formatJson(result: AnalyzeResult, options: FormatOptions): string {
  const showFull = shouldShowFullAdvice(result, options.advice);
  const { trailing, recommend, volatility } = result;

  const payload = {
    code: result.code,
    name: result.name,
    now: result.now,
    yesterday: result.yesterday,
    percent: result.percent,
    source: result.source,
    volatility: {
      maxDailyDrawdownPct: +(volatility.maxDailyDrawdown * 100).toFixed(2),
      maxWeeklyDrawdownPct: +(volatility.maxWeeklyDrawdown * 100).toFixed(2),
      maxBiweeklyDrawdownPct: +(volatility.maxBiweeklyDrawdown * 100).toFixed(2),
      barCount: volatility.barCount,
    },
    recommend: {
      tier: recommend.tier,
      tierLabel: recommend.tierLabel,
      rangeMinPct: recommend.range.min,
      rangeMaxPct: recommend.range.max,
      suggestedPct: recommend.suggestedPct,
      fallback: recommend.fallback,
      reasons: recommend.reasons,
    },
    trailing: {
      stageHighClose: +trailing.stageHighClose.toFixed(3),
      appliedThresholdPct: trailing.appliedThresholdPct,
      stopLossLine: +trailing.stopLossLine.toFixed(3),
      triggered: trailing.triggered,
      distanceToStopPct: +trailing.distanceToStopPct.toFixed(2),
    },
    execution: buildExecutionPayload(showFull),
    klineWarning: result.klineWarning,
  };

  return JSON.stringify(payload, null, 2);
}

function printFullAdvice(): string[] {
  const lines: string[] = [];
  lines.push("─".repeat(40));
  lines.push("【心理过程拆解】触及止损线后，你大概率会经历：");
  for (const p of PSYCHOLOGY_ITEMS) {
    lines.push(`  ${p.id}. ${p.impulse} — ${p.explanation}`);
  }
  lines.push("");
  lines.push("【触发后执行规则】");
  for (const r of EXECUTION_RULES) {
    lines.push(`  规则 ${r.id} · ${r.title}：${r.body}`);
    if (r.constraint) {
      lines.push(`         ${r.constraint}`);
    }
  }
  lines.push("");
  lines.push(DISCIPLINE_CLOSING);
  lines.push("─".repeat(40));
  return lines;
}

export function formatHuman(result: AnalyzeResult, options: FormatOptions): string {
  const lines: string[] = [];
  const { trailing, recommend, volatility } = result;
  const showFull = shouldShowFullAdvice(result, options.advice);

  lines.push(`股票: ${result.name} (${result.code})`);
  lines.push(
    `现价: ${result.now.toFixed(2)}  昨收: ${result.yesterday.toFixed(2)}  涨跌幅: ${formatPct(result.percent)}`
  );

  if (trailing.triggered) {
    const below = Math.abs(trailing.distanceToStopPct).toFixed(1);
    lines.push(
      `状态: >>> 已触发止损 <<<  （现价低于止损线 ${below}%）`
    );
  } else {
    const above = trailing.distanceToStopPct.toFixed(1);
    lines.push(`状态: 未触发（距止损线 +${above}%）`);
  }

  lines.push("");
  const monthLabel = options.months ?? 6;
  lines.push(`近${monthLabel}月波动 (共 ${volatility.barCount} 个交易日):`);
  lines.push(`  最大单日回撤: ${formatPct(volatility.maxDailyDrawdown)}`);
  lines.push(`  最大周回撤:   ${formatPct(volatility.maxWeeklyDrawdown)}`);
  lines.push(`  最大两周回撤: ${formatPct(volatility.maxBiweeklyDrawdown)}`);
  lines.push(`波动分级: ${recommend.tierLabel}`);
  if (recommend.reasons.length) {
    lines.push(`  依据: ${recommend.reasons.join("；")}`);
  }
  if (recommend.fallback) {
    lines.push(`  (数据不足，建议值已回退)`);
  }
  lines.push(
    `建议回撤阈值: ${recommend.suggestedPct}%（区间 ${recommend.range.min}%-${recommend.range.max}%）`
  );

  lines.push("");
  lines.push(`阶段最高收盘价: ${trailing.stageHighClose.toFixed(2)}`);
  lines.push(
    `采用回撤阈值: ${trailing.appliedThresholdPct}%（可用 -t 修改，默认采用建议阈值）`
  );
  lines.push(
    `当前止损线: ${trailing.stopLossLine.toFixed(2)}  (= ${trailing.stageHighClose.toFixed(2)} × (1 - ${trailing.appliedThresholdPct}%))`
  );
  lines.push("");
  lines.push("说明: 止损线只上移不下移；收盘价跌破止损线则按规则卖出。");

  if (result.klineWarning) {
    lines.push(`警告: ${result.klineWarning}`);
  }

  lines.push("");
  if (showFull) {
    lines.push(...printFullAdvice());
  } else {
    lines.push(`纪律摘要: ${DISCIPLINE_BRIEF}`);
    lines.push(`提示: ${ADVICE_HINT}`);
  }

  return lines.join("\n");
}
