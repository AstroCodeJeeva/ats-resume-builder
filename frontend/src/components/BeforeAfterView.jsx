/**
 * Before vs After comparison — side-by-side split screen.
 * Highlights improvements in the "After" column with green.
 */
export default function BeforeAfterView({ original, optimized, summary }) {
  if (!original || !optimized) return null

  const renderBullets = (exp, isImproved) =>
    exp.bullets?.map((b, i) => (
      <li key={i} className={isImproved ? 'bg-green-50 dark:bg-green-900/20 rounded px-1' : ''}>
        {b}
      </li>
    ))

  const Section = ({ title, resume, improved, prof }) => (
    <div className="flex-1 min-w-0">
      <h3 className={`text-lg font-bold mb-3 ${improved ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {title}
      </h3>

      {improved && prof && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Professional Summary</p>
          <p className="text-sm text-green-800 dark:text-green-300">{prof}</p>
        </div>
      )}

      {/* Skills */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Skills</p>
        <div className="flex flex-wrap gap-1">
          {resume.skills?.map((s, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${
                improved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      {resume.work_experience?.map((exp, i) => (
        <div key={i} className="mb-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{exp.role} — {exp.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{exp.duration}</p>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
            {renderBullets(exp, improved)}
          </ul>
        </div>
      ))}
    </div>
  )

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Before vs After</h2>
      <div className="flex flex-col lg:flex-row gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
        <Section title="Original" resume={original} improved={false} />
        <div className="lg:pl-6 pt-6 lg:pt-0">
          <Section title="Optimized" resume={optimized} improved={true} prof={summary} />
        </div>
      </div>
    </div>
  )
}
