/**
 * TemplateSwitcher — Visual card-based template picker with mini-previews.
 */
import { motion } from 'framer-motion'

const templates = [
  {
    key: 'classic',
    label: 'Classic Professional',
    desc: 'Single column, clean headings, corporate style',
    color: 'from-gray-700 to-gray-900',
    preview: ['—— Name ——', '● Experience', '● Skills', '● Education'],
    font: 'serif',
  },
  {
    key: 'modern',
    label: 'Modern Minimal',
    desc: 'Clean spacing, bold headers, tech-friendly',
    color: 'from-indigo-500 to-violet-600',
    preview: ['NAME', '▸ Experience', '▸ Skills', '▸ Projects'],
    font: 'sans',
  },
  {
    key: 'fresher',
    label: 'Fresher / Graduate',
    desc: 'Projects-focused, strong skills emphasis',
    color: 'from-teal-500 to-emerald-600',
    preview: ['Name', '◆ Skills', '◆ Projects', '◆ Education'],
    font: 'sans',
  },
  {
    key: 'technical',
    label: 'Technical Expert',
    desc: 'Expanded skills section, tools categorized',
    color: 'from-blue-600 to-blue-800',
    preview: ['NAME', '▪ Tech Stack', '▪ Experience', '▪ Projects'],
    font: 'mono',
  },
]

export default function TemplateSwitcher({ selected, onChange }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Choose Template
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => {
          const active = selected === t.key
          return (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(t.key)}
              className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                active
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg shadow-primary-500/15'
                  : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600 hover:shadow-md'
              }`}
            >
              {/* Mini preview card */}
              <div
                className={`h-20 rounded-lg bg-gradient-to-br ${t.color} mb-2 p-2 flex flex-col justify-between overflow-hidden`}
              >
                {t.preview.map((line, i) => (
                  <div
                    key={i}
                    className={`text-white truncate ${
                      i === 0
                        ? `text-[9px] font-bold ${t.font === 'mono' ? 'font-mono' : t.font === 'serif' ? 'font-serif' : ''}`
                        : 'text-[7px] opacity-70'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>

              {/* Label */}
              <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {t.label}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {t.desc}
              </div>

              {/* Active checkmark */}
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
