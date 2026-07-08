export { TARGETS, LOOKBACK_WEEKS } from "./config";
export type { Target, RuntimeConfig } from "./config";
export { isTradingDay, lastTradingDayOfWeek } from "./trading-day";
export { basisClose, cumulativeReturn } from "./momentum";
export { decide, resolveAction, ACTION_LABELS } from "./decide";
export type { Candidate, Decision, RotationAction } from "./decide";
export { runRotation } from "./run-rotation";
export type { RotationResult } from "./run-rotation";
export { findNextRotation, shanghaiDateStr, rotationInstant } from "./scheduler";
export {
  alignWeeks,
  backtestCombo,
  combinations,
  allCombos,
} from "./backtest";
export type { AlignedWeeks, BacktestOptions, ComboResult, Trade } from "./backtest";
export { runBacktest } from "./run-backtest";
export { sendServerChan } from "./notify";
