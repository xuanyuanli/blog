/** public/ 下的独立 HTML，不走 VitePress 客户端路由 */
export const PUBLIC_HTML_PATHS = new Set([
  '/stock-pricing-patterns.html',
  '/h200-industry-chain.html',
  '/rubin-industry-chain.html',
  '/commodity-pricing-framework.html',
  '/huawei-tau-scaling-industry-chain.html',
  '/ai-storage-industry-chain.html',
  '/ai-compute-nonferrous-metals-industry-chain.html',
])

export function isPublicHtmlPath(href: string): boolean {
  try {
    const pathname = new URL(href, 'http://local').pathname
    return PUBLIC_HTML_PATHS.has(pathname)
  } catch {
    return false
  }
}
