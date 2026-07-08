/** Server酱 推送。兼容 Server酱Turbo（SCT 开头）与 Server酱3（sctp 开头） */

function endpointFor(sendKey: string): string {
  const sctp = /^sctp(\d+)t/i.exec(sendKey);
  if (sctp) {
    return `https://${sctp[1]}.push.ft07.com/send/${sendKey}.send`;
  }
  return `https://sctapi.ftqq.com/${sendKey}.send`;
}

export async function sendServerChan(
  sendKey: string,
  title: string,
  desp: string
): Promise<void> {
  const res = await fetch(endpointFor(sendKey), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ title, desp }).toString(),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Server酱推送失败: HTTP ${res.status} ${body}`);
  }
  try {
    const json = JSON.parse(body) as { code?: number; message?: string };
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`Server酱推送失败: ${json.message ?? body}`);
    }
  } catch (err) {
    if (err instanceof SyntaxError) return; // 非 JSON 响应但 HTTP 成功，视为已送达
    throw err;
  }
}
