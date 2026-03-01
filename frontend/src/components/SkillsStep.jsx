import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Step 1 — Skills (dynamic add/remove)
 */
export default function SkillsStep({ data, onChange }) {
  const [input, setInput] = useState('')

  const addSkill = () => {
    const trimmed = input.trim()
    if (trimmed && !data.includes(trimmed)) {
      onChange([...data, trimmed])
      setInput('')
    }
  }

  const removeSkill = (idx) => {
    onChange(data.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Skills</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Add your technical and soft skills.</p>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Python, React, AWS..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm text-sm"
        />
        <button
          type="button"
          onClick={addSkill}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <AnimatePresence>
          {data.map((skill, idx) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(idx)}
                className="ml-1 text-primary-400 hover:text-red-500 transition-colors focus-visible:ring-1 focus-visible:ring-red-400 rounded-full"
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {data.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">No skills added yet.</p>
      )}
    </div>
  )
}
