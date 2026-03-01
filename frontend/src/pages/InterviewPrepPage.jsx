import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { generateInterviewQuestions } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

/* Focus options */
const FOCUSES = [
  { value: 'balanced',     label: 'Balanced',     desc: 'Mix of all types' },
  { value: 'behavioral',   label: 'Behavioral',   desc: 'STAR-method style' },
  { value: 'technical',    label: 'Technical',     desc: 'Skills & knowledge' },
  { value: 'situational',  label: 'Situational',  desc: 'Hypothetical scenarios' },
]

const DIFFICULTY_COLORS = {
  easy:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  medium:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  hard:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const CATEGORY_COLORS = {
  behavioral:    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  technical:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  situational:   'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'role-specific':'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
}


function Badge({ text, colorMap }) {
  const key = text?.toLowerCase() || ''
  const cls = colorMap[key] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${cls}`}>
      {text}
    </span>
  )
}


function QuestionCard({ q, index, expanded, onToggle }) {
  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      const text = `Q: ${q.question}\n\nSuggested Answer:\n${q.suggested_answer}\n\nTips: ${q.tips}`
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Copy failed.')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug pr-6">
            {q.question}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge text={q.category} colorMap={CATEGORY_COLORS} />
            <Badge text={q.difficulty} colorMap={DIFFICULTY_COLORS} />
          </div>
        </div>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              {/* Why asked */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Why this is asked
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.why_asked}</p>
              </div>

              {/* Suggested answer */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Suggested Answer
                </h4>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {q.suggested_answer}
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Tips
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">{q.tips}</p>
              </div>

              {/* Copy single */}
              <button
                onClick={handleCopy}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Copy Q&A
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* Main Page */
export default function InterviewPrepPage() {
  usePageTitle('Interview Prep')

  /* Form state */
  const [targetRole, setTargetRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [focus, setFocus] = useState('balanced')
  const [numQuestions, setNumQuestions] = useState(8)

  /* Result state */
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedSet, setExpandedSet] = useState(new Set())
  const [filterCategory, setFilterCategory] = useState('all')

  /* Helpers */
  const getResumeData = () => {
    try {
      const raw = sessionStorage.getItem('ats_result')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed.optimized_resume || parsed.original_resume || null
      }
      const formRaw = sessionStorage.getItem('ats_form_data')
      if (formRaw) return JSON.parse(formRaw)
    } catch { /* ignore */ }
    return null
  }

  const handleGenerate = async () => {
    const resumeData = getResumeData()
    if (!resumeData) {
      toast.error('No resume data found. Please build or optimise a resume first.')
      return
    }
    if (!jobDescription.trim() && !targetRole.trim()) {
      toast.error('Please provide a job description or target role.')
      return
    }

    setLoading(true)
    setQuestions([])
    setExpandedSet(new Set())
    setFilterCategory('all')

    try {
      const result = await generateInterviewQuestions({
        resume_data: resumeData,
        job_description: jobDescription,
        target_role: targetRole,
        company_name: companyName,
        num_questions: numQuestions,
        focus,
      })
      setQuestions(result.questions)
      toast.success(`${result.total} interview questions generated!`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate questions.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* Expand / collapse */
  const toggleExpanded = useCallback((idx) => {
    setExpandedSet((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }, [])

  const expandAll = () => setExpandedSet(new Set(questions.map((_, i) => i)))
  const collapseAll = () => setExpandedSet(new Set())

  /* Filtering */
  const categories = ['all', ...new Set(questions.map((q) => q.category?.toLowerCase()))]
  const filtered = filterCategory === 'all'
    ? questions
    : questions.filter((q) => q.category?.toLowerCase() === filterCategory)

  /* Copy all */
  const handleCopyAll = async () => {
    const text = questions
      .map(
        (q, i) =>
          `Q${i + 1}: ${q.question}\nCategory: ${q.category} | Difficulty: ${q.difficulty}\nWhy asked: ${q.why_asked}\nSuggested Answer:\n${q.suggested_answer}\nTips: ${q.tips}`
      )
      .join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('All questions copied!')
    } catch {
      toast.error('Copy failed.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Interview Prep
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
          Generate tailored interview questions with answers based on your resume and the job description.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Role *</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Spotify, Stripe..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description for highly targeted questions..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Focus selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Focus</label>
            <div className="grid grid-cols-2 gap-2">
              {FOCUSES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFocus(f.value)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    focus === f.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-sm">{f.label[0]}</span>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{f.label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Num questions slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Questions: <span className="text-primary-600 dark:text-primary-400 font-bold">{numQuestions}</span>
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>3 (quick)</span>
              <span>15 (thorough)</span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Questions...
              </span>
            ) : (
              'Generate Interview Questions'
            )}
          </button>

          {!getResumeData() && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              No resume data in session. Build or optimise a resume first for best results.
            </p>
          )}
        </motion.div>

        {/* Right: Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <AnimatePresence mode="wait">
            {questions.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                  {/* Category filter */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                          filterCategory === cat
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat === 'all' ? `All (${questions.length})` : cat}
                      </button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Expand all"
                    >Expand All</button>
                    <button
                      onClick={collapseAll}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Collapse all"
                    >Collapse All</button>
                    <button
                      onClick={handleCopyAll}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Copy all"
                    >Copy All</button>
                  </div>
                </div>

                {/* Questions list */}
                <div className="space-y-3">
                  {filtered.map((q, i) => {
                    const realIndex = questions.indexOf(q)
                    return (
                      <QuestionCard
                        key={realIndex}
                        q={q}
                        index={i}
                        expanded={expandedSet.has(realIndex)}
                        onToggle={() => toggleExpanded(realIndex)}
                      />
                    )
                  })}
                </div>

                {filtered.length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                    No questions match the selected filter.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-10"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Your interview questions will appear here
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                  Fill in the details on the left and click Generate to get practice questions with suggested answers.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-left max-w-sm w-full">
                  {[
                    { text: 'Behavioral questions with STAR method answers' },
                    { text: 'Technical deep-dives based on your skills' },
                    { text: 'Situational scenarios for the role' },
                    { text: 'Difficulty levels from easy to hard' },
                  ].map((item) => (
                    <div key={item.text} className="flex gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
