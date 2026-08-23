import { LOOKBACK_WEEKS, TARGETS, getServerChanSendKey } from "./config";
import {
  completedBars,
  fetchQuotes,
  fetchWeeklyBars,
  fetchWithRetry,
} from "./data";
import { ACTION_LABELS, decide, resolveAction } from "./decide";
import type { Candidate, RotationAction } from "./decide";
import { basisClose, cumulativeReturn } from "./momentum";
import { sendServerChan } from "./notify";
import { loadState, saveState } from "./state";

export type RotationResult = {
  date: string;
  action: RotationAction;
  from: { code: string; name: string } | null;
  to: { code: string; name: string } | null;
  ranked: Candidate[];
};

const fmtPct = (v: number): string => `${(v * 100).toFixed(2)}%`;

/** 拉实时价 + 周K，计算各标的近 N 周累计涨幅 */
async function computeCandidates(todayStr: string): Promise<Candidate[]> {
  const codes = TARGETS.map((t) => t.code);
  const quotes = await fetchWithRetry(
    () => fetchQuotes(codes),
    (qs) => qs.length === codes.length
  );
  // 周K按标的串行拉取并重试，避免并发触发数据源限流
  const barsList: Awaited<ReturnType<typeof fetchWeeklyBars>>[] = [];
  for (const code of codes) {
    barsList.push(
      await fetchWithRetry(
        () => fetchWeeklyBars(code, LOOKBACK_WEEKS + 20),
        (bars) => completedBars(bars, todayStr).length >= LOOKBACK_WEEKS
      )
    );
  }

  return TARGETS.map((t, i) => {
    const quote = quotes.find((q) => q.code === t.code) ?? quotes[i];
    if (!quote || !Number.isFinite(quote.now) || quote.now <= 0) {
      throw new Error(`${t.name}(${t.code}) 实时行情无效`);
    }
    const completed = completedBars(barsList[i], todayStr);
    const basis = basisClose(
      completed.map((b) => b.close),
      LOOKBACK_WEEKS
    );
    if (basis === null) {
      throw new Error(
        `${t.name}(${t.code}) 周K不足 ${LOOKBACK_WEEKS} 个已完结周`
      );
    }
    return {
      code: t.code,
      name: t.name,
      momentum: cumulativeReturn(quote.now, basis),
    };
  });
}

function describeHolding(
  code: string | null,
  fallbackName?: string | null
): { code: string; name: string } | null {
  if (!code) return null;
  const known = TARGETS.find((t) => t.code === code);
  return { code, name: known?.name ?? fallbackName ?? code };
}

function buildNotification(result: RotationResult): {
  title: string;
  desp: string;
} {
  const label = ACTION_LABELS[result.action];
  const fromName = result.from?.name ?? "空仓";
  const toName = result.to?.name ?? "空仓";
  let headline: string;
  switch (result.action) {
    case "switch":
      headline = `${label} ${fromName} → ${toName}`;
      break;
    case "open":
      headline = `${label} ${toName}`;
      break;
    case "hold":
      headline = `${label} ${toName}`;
      break;
    case "clear":
      headline = `${label}（卖出 ${fromName}）`;
      break;
    case "stay_empty":
      headline = label;
      break;
  }

  const lines: string[] = [
    `## ${result.date} 周线轮动`,
    "",
    `**本次动作：${headline}**`,
    "",
    `**当前持仓：${result.to ? `${result.to.name}（${result.to.code}）` : "空仓"}**`,
    "",
    `近 ${LOOKBACK_WEEKS} 周累计涨幅排名：`,
    "",
    "| 排名 | 标的 | 代码 | 涨幅 |",
    "| --- | --- | --- | --- |",
    ...result.ranked.map(
      (c, i) => `| ${i + 1} | ${c.name} | ${c.code} | ${fmtPct(c.momentum)} |`
    ),
    "",
    "> 规则：取涨幅最高者，为正则持有，为负则空仓至下次轮动。",
  ];

  return { title: `周线轮动 | ${headline}`, desp: lines.join("\n") };
}

export type RunOptions = {
  dataDir: string;
  /** 只计算并打印，不发通知、不写状态 */
  dryRun: boolean;
  todayStr: string;
};

export async function runRotation(opts: RunOptions): Promise<RotationResult> {
  const state = loadState(opts.dataDir);
  const candidates = await computeCandidates(opts.todayStr);
  const { ranked, target } = decide(candidates);

  const prevCode = state.holding;
  const nextCode = target?.code ?? null;
  const action = resolveAction(prevCode, nextCode);

  const result: RotationResult = {
    date: opts.todayStr,
    action,
    from: describeHolding(prevCode, state.holdingName),
    to: target ? { code: target.code, name: target.name } : null,
    ranked,
  };

  const { title, desp } = buildNotification(result);
  console.log(`[${new Date().toISOString()}] ${title}`);
  for (const c of ranked) {
    console.log(`  ${c.name}(${c.code}): ${fmtPct(c.momentum)}`);
  }

  if (opts.dryRun) {
    console.log("(dry-run：不发通知、不写状态)");
    return result;
  }

  saveState(opts.dataDir, {
    holding: nextCode,
    holdingName: target?.name ?? null,
    updatedAt: new Date().toISOString(),
    history: [
      ...state.history,
      {
        date: opts.todayStr,
        action,
        from: prevCode,
        to: nextCode,
        momentums: Object.fromEntries(ranked.map((c) => [c.code, c.momentum])),
      },
    ],
  });

  const serverChanSendKey = getServerChanSendKey();
  if (serverChanSendKey) {
    await sendServerChan(serverChanSendKey, title, desp);
    console.log("Server酱通知已发送");
  } else {
    console.log("警告: 未配置环境变量 SERVERCHAN_SENDKEY，跳过通知");
  }

  return result;
}

/** 执行失败时的告警通知（daemon 用） */
export async function notifyError(err: unknown): Promise<void> {
  const serverChanSendKey = getServerChanSendKey();
  if (!serverChanSendKey) return;
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  try {
    await sendServerChan(
      serverChanSendKey,
      "周线轮动执行失败",
      `\`\`\`\n${message}\n\`\`\``
    );
  } catch (notifyErr) {
    console.error("发送失败告警也失败了:", notifyErr);
  }
}
