import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Step 2 — Work Experience (dynamic entries + bullet points)
 */
export default function ExperienceStep({ data, onChange }) {
  const addEntry = () => {
    onChange([...data, { role: '', company: '', duration: '', bullets: [''] }])
  }

  const removeEntry = (idx) => onChange(data.filter((_, i) => i !== idx))

  const updateField = (idx, field, value) => {
    const updated = [...data]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  const addBullet = (idx) => {
    const updated = [...data]
    updated[idx] = { ...updated[idx], bullets: [...updated[idx].bullets, ''] }
    onChange(updated)
  }

  const updateBullet = (expIdx, bulletIdx, value) => {
    const updated = [...data]
    const bullets = [...updated[expIdx].bullets]
    bullets[bulletIdx] = value
    updated[expIdx] = { ...updated[expIdx], bullets }
    onChange(updated)
  }

  const removeBullet = (expIdx, bulletIdx) => {
    const updated = [...data]
    updated[expIdx] = {
      ...updated[expIdx],
      bullets: updated[expIdx].bullets.filter((_, i) => i !== bulletIdx),
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Work Experience</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Add your professional experience.</p>

      <AnimatePresence>
        {data.map((exp, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Experience #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Role / Title"
                value={exp.role}
                onChange={(e) => updateField(idx, 'role', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
              />
              <input
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateField(idx, 'company', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
              />
              <input
                placeholder="Duration (e.g. Jan 2021 – Present)"
                value={exp.duration}
                onChange={(e) => updateField(idx, 'duration', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bullet Points</span>
              {exp.bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex gap-2">
                  <input
                    placeholder={`Bullet point ${bIdx + 1}`}
                    value={bullet}
                    onChange={(e) => updateBullet(idx, bIdx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(idx, bIdx)}
                    className="text-red-400 hover:text-red-600 text-sm transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addBullet(idx)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                + Add bullet
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addEntry}
        className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
      >
        + Add Experience
      </button>
    </div>
  )
}
