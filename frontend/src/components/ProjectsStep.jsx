import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Step 3 — Projects (dynamic entries)
 */
export default function ProjectsStep({ data, onChange }) {
  const addProject = () => {
    onChange([...data, { title: '', description: '', technologies: [] }])
  }

  const removeProject = (idx) => onChange(data.filter((_, i) => i !== idx))

  const updateField = (idx, field, value) => {
    const updated = [...data]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  const updateTech = (idx, value) => {
    const techs = value.split(',').map((t) => t.trim()).filter(Boolean)
    updateField(idx, 'technologies', techs)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Projects</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Showcase your notable projects.</p>

      <AnimatePresence>
        {data.map((proj, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Project #{idx + 1}
              </span>
              <button type="button" onClick={() => removeProject(idx)} className="text-xs text-red-500 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded">
                Remove
              </button>
            </div>

            <input
              placeholder="Project Title"
              value={proj.title}
              onChange={(e) => updateField(idx, 'title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
            <textarea
              placeholder="Description"
              value={proj.description}
              onChange={(e) => updateField(idx, 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 resize-none"
            />
            <input
              placeholder="Technologies (comma-separated, e.g. React, Node.js)"
              value={proj.technologies?.join(', ') || ''}
              onChange={(e) => updateTech(idx, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addProject}
        className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
      >
        + Add Project
      </button>
    </div>
  )
}
