/** 与 fetch_stock.py 一致：禁用可能干扰东财/腾讯接口的系统代理 */
export function disableSystemProxy(): void {
  for (const key of [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
  ]) {
    delete process.env[key];
  }
}

export const BROWSER_HEADERS = {
  Accept: "application/json,text/plain,*/*",
  Referer: "https://quote.eastmoney.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
} as const;
