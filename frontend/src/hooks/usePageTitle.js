/**
 * usePageTitle — sets document.title for each page.
 * Usage: usePageTitle('Dashboard')  → "Dashboard — ATSBuilder"
 */
import { useEffect } from 'react'

const SUFFIX = 'ATSBuilder'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SUFFIX}` : SUFFIX
    return () => {
      document.title = SUFFIX
    }
  }, [title])
}
