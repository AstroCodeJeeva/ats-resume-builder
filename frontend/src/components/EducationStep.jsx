import { motion, AnimatePresence } from 'framer-motion'

/**
 * Step 4 — Education (dynamic entries)
 */
export default function EducationStep({ data, onChange }) {
  const addEntry = () => {
    onChange([...data, { degree: '', institution: '', year: '' }])
  }
  const removeEntry = (idx) => onChange(data.filter((_, i) => i !== idx))
  const updateField = (idx, field, value) => {
    const updated = [...data]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Education</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Add your educational background.</p>

      <AnimatePresence>
        {data.map((edu, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Education #{idx + 1}</span>
              <button type="button" onClick={() => removeEntry(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateField(idx, 'degree', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100" />
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateField(idx, 'institution', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100" />
              <input placeholder="Year" value={edu.year} onChange={(e) => updateField(idx, 'year', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button type="button" onClick={addEntry} className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors">
        + Add Education
      </button>
    </div>
  )
}
