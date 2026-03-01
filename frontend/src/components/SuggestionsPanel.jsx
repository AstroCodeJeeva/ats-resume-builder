import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Collapsible suggestions sidebar / panel.
 */
export default function SuggestionsPanel({ suggestions }) {
  const [open, setOpen] = useState(true)

  if (!suggestions || suggestions.length === 0) return null

  const severityColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  }

  const severityIcons = {
    critical: '●',
    warning: '●',
    info: '●',
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Suggestions ({suggestions.length})
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-2 overflow-hidden"
          >
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 text-xs ${severityColors[s.severity] || severityColors.info}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{severityIcons[s.severity] || '●'}</span>
                  <span className="font-semibold">{s.category}</span>
                </div>
                <p>{s.message}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
