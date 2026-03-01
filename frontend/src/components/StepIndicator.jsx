import { motion } from 'framer-motion'

/**
 * Multi-step form progress indicator.
 * Highlights the active step and shows completed/upcoming states.
 */
const STEPS = [
  'Personal Info',
  'Skills',
  'Experience',
  'Projects',
  'Education',
  'Certifications',
  'Target Role',
]

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
      {STEPS.map((label, i) => {
        const isActive = i === current
        const isDone = i < current
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.15 : 1,
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                isDone
                  ? 'bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/30'
                  : isActive
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 ring-4 ring-primary-100 dark:ring-primary-900/30'
                  : 'bg-gray-100 dark:bg-surface-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              {isDone ? '✓' : i + 1}
            </motion.div>
            <span
              className={`hidden sm:inline text-xs font-medium ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 ${
                  isDone ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { STEPS }
