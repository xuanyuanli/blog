import type { DailyBar } from "./kline-eastmoney";

export type TrailingStopResult = {
  stageHighClose: number;
  stopLossLine: number;
  appliedThresholdPct: number;
  triggered: boolean;
  distanceToStopPct: number;
};

export function computeTrailingStop(
  bars: DailyBar[],
  now: number,
  appliedThresholdPct: number
): TrailingStopResult {
  let stageHighClose = 0;

  for (const bar of bars) {
    if (bar.close > stageHighClose) stageHighClose = bar.close;
  }

  if (now > stageHighClose) stageHighClose = now;

  if (stageHighClose <= 0) {
    stageHighClose = now > 0 ? now : 1;
  }

  const threshold = appliedThresholdPct / 100;
  const stopLossLine = stageHighClose * (1 - threshold);
  const triggered = now > 0 && now <= stopLossLine;
  const distanceToStopPct =
    stopLossLine > 0 ? ((now - stopLossLine) / stopLossLine) * 100 : 0;

  return {
    stageHighClose,
    stopLossLine,
    appliedThresholdPct,
    triggered,
    distanceToStopPct,
  };
}
