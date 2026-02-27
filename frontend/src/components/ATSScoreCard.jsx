import { motion } from 'framer-motion'

/**
 * Animated circular-style ATS score card +  sub-score bars.
 */
export default function ATSScoreCard({ score }) {
  if (!score) return null

  const items = [
    { label: 'Keyword Match', value: score.keyword_match, color: 'bg-blue-500' },
    { label: 'Skills Alignment', value: score.skills_alignment, color: 'bg-green-500' },
    { label: 'Experience Relevance', value: score.experience_relevance, color: 'bg-yellow-500' },
    { label: 'Formatting', value: score.formatting_compliance, color: 'bg-purple-500' },
  ]

  const overallColor =
    score.overall >= 80 ? 'text-green-500' : score.overall >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-5">
      {/* Overall score */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overall ATS Score</p>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`text-6xl font-extrabold ${overallColor}`}
        >
          {score.overall}
        </motion.span>
        <span className="text-2xl text-gray-400">/100</span>
      </div>

      {/* Sub-scores */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
