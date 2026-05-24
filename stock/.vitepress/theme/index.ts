import DefaultTheme from 'vitepress/theme'
import { isPublicHtmlPath } from '../public-html'

export default {
  ...DefaultTheme,
  enhanceApp({ router }) {
    router.onBeforeRouteChange = (href: string) => {
      if (typeof window === 'undefined' || !isPublicHtmlPath(href)) return
      window.location.assign(href)
      return false
    }
  },
}
