import * as fs from "fs";
import * as path from "path";
import type { RotationAction } from "./decide";

export type HistoryEntry = {
  date: string;
  action: RotationAction;
  from: string | null;
  to: string | null;
  /** code -> 近 N 周累计涨幅 */
  momentums: Record<string, number>;
};

export type State = {
  /** 当前持仓代码；空仓为 null */
  holding: string | null;
  holdingName: string | null;
  updatedAt: string | null;
  history: HistoryEntry[];
};

const MAX_HISTORY = 200;

export function emptyState(): State {
  return { holding: null, holdingName: null, updatedAt: null, history: [] };
}

export function stateFile(dataDir: string): string {
  return path.join(dataDir, "state.json");
}

export function loadState(dataDir: string): State {
  const file = stateFile(dataDir);
  if (!fs.existsSync(file)) return emptyState();
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<State>;
    return {
      holding: raw.holding ?? null,
      holdingName: raw.holdingName ?? null,
      updatedAt: raw.updatedAt ?? null,
      history: Array.isArray(raw.history) ? raw.history : [],
    };
  } catch {
    console.error(`警告: 无法解析 ${file}，按空仓状态处理`);
    return emptyState();
  }
}

export function saveState(dataDir: string, state: State): void {
  const trimmed: State = {
    ...state,
    history: state.history.slice(-MAX_HISTORY),
  };
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    stateFile(dataDir),
    JSON.stringify(trimmed, null, 2) + "\n",
    "utf8"
  );
}
