import { useEffect } from 'react'

/**
 * Keeps document.title in sync with the current route. The static <title> in
 * index.html is what crawlers and the first paint see; this keeps the browser
 * tab accurate as you navigate the SPA (and when the language changes).
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
