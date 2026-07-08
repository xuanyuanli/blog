/** 轮动决策纯函数：top1 为正则持有，否则空仓 */

export type Candidate = {
  code: string;
  name: string;
  /** 近 N 周累计涨幅，0.01 = 1% */
  momentum: number;
};

export type RotationAction =
  | "open" // 空仓 → 开仓
  | "switch" // 换仓 A → B
  | "hold" // 继续持有
  | "clear" // 持仓 → 清仓
  | "stay_empty"; // 保持空仓

export type Decision = {
  /** 按涨幅从高到低排序 */
  ranked: Candidate[];
  /** 应持有标的；空仓为 null */
  target: Candidate | null;
};

export function decide(candidates: Candidate[]): Decision {
  const ranked = [...candidates].sort((a, b) => b.momentum - a.momentum);
  const top = ranked[0];
  const target = top && top.momentum > 0 ? top : null;
  return { ranked, target };
}

export function resolveAction(
  prevCode: string | null,
  nextCode: string | null
): RotationAction {
  if (prevCode === null && nextCode === null) return "stay_empty";
  if (prevCode === null) return "open";
  if (nextCode === null) return "clear";
  return prevCode === nextCode ? "hold" : "switch";
}

export const ACTION_LABELS: Record<RotationAction, string> = {
  open: "开仓",
  switch: "换仓",
  hold: "继续持有",
  clear: "清仓",
  stay_empty: "保持空仓",
};
