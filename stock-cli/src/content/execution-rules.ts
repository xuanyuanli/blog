export type PsychologyItem = {
  id: number;
  impulse: string;
  explanation: string;
};

export type ExecutionRule = {
  id: number;
  title: string;
  body: string;
  constraint?: string;
};

export const PSYCHOLOGY_ITEMS: PsychologyItem[] = [
  {
    id: 1,
    impulse: "「再等一根 K 线」",
    explanation: "处置效应——不愿认赔，总想多等一天",
  },
  {
    id: 2,
    impulse: "「我再看看基本面」",
    explanation: "寻找认知支撑，确认偏误会让你只看见利好",
  },
  {
    id: 3,
    impulse: "「我问问群里怎么说」",
    explanation: "寻求社会认同，集体犯错时群友往往也在扛单",
  },
  {
    id: 4,
    impulse: "「我和规则商量一下」",
    explanation: "从规则制定者变成谈判者——承诺升级",
  },
  {
    id: 5,
    impulse: "「等反弹一点再卖」",
    explanation: "反弹心态——往往错过卖点，小反弹变成深套",
  },
];

export const EXECUTION_RULES: ExecutionRule[] = [
  {
    id: 1,
    title: "触发即卖",
    body: "一旦触及止损线，立刻执行。不看分时找反弹、不翻研报找理由、不征求他人意见。",
  },
  {
    id: 2,
    title: "可分两次卖（可选）",
    body: "如先卖 50% 再卖 50%，减轻「卖在低点」的心理负担。",
    constraint: "两次间隔不得超过 1 个交易日，否则就是拖延而非策略。",
  },
  {
    id: 3,
    title: "卖出后冷却两周",
    body: "至少 2 周内不重建该标的仓位，给市场与情绪降温，避免被死猫跳骗回。",
  },
];

export const DISCIPLINE_CLOSING =
  "规则要简单到粗暴。简单，才没有给情绪留漏洞。";

export const DISCIPLINE_BRIEF =
  "触发即卖 · 分两次卖须同一交易日内完成 · 卖出后冷却两周";

export const ADVICE_HINT = "使用 -a/--advice 可查看完整心理过程拆解";
