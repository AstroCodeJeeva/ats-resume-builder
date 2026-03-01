import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { generateCoverLetter } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal & polished' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic & passionate' },
  { value: 'concise', label: 'Concise', desc: 'Brief & impactful' },
]

export default function CoverLetterPage() {
  usePageTitle('Cover Letter Generator')

  const [jobDescription, setJobDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [tone, setTone] = useState('professional')
  const [coverLetter, setCoverLetter] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Try to load resume from session storage (from builder)
  const getResumeData = () => {
    try {
      const raw = sessionStorage.getItem('ats_result')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed.optimized_resume || parsed.original_resume || null
      }
      // Also try from the builder form directly
      const formRaw = sessionStorage.getItem('ats_form_data')
      if (formRaw) return JSON.parse(formRaw)
    } catch { /* ignore */ }
    return null
  }

  const handleGenerate = async () => {
    const resumeData = getResumeData()
    if (!resumeData) {
      toast.error('No resume data found. Please build a resume first, then come back.')
      return
    }
    if (!jobDescription.trim() && !targetRole.trim()) {
      toast.error('Please provide a job description or target role.')
      return
    }

    setLoading(true)
    setCoverLetter('')
    try {
      const result = await generateCoverLetter({
        resume_data: resumeData,
        job_description: jobDescription,
        target_role: targetRole,
        company_name: companyName,
        tone,
      })
      setCoverLetter(result.cover_letter)
      setWordCount(result.word_count)
      toast.success('Cover letter generated!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate cover letter.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — try selecting text manually.')
    }
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Cover_Letter_${companyName || 'Company'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded as .txt')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
          AI-Powered
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Cover Letter Generator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          Generate a tailored cover letter from your resume and the job description.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
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

          {/* Company Name */}
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
              placeholder="Paste the full job description here for a more tailored letter..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Tone selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tone</label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    tone === t.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{t.label[0]}</span>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{t.label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Cover Letter'
            )}
          </button>

          {!getResumeData() && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              No resume data in session. Build or optimise a resume first for best results.
            </p>
          )}
        </motion.div>

        {/* Right: Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <AnimatePresence mode="wait">
            {coverLetter ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card overflow-hidden"
              >
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{wordCount} words</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Download .txt
                    </button>
                  </div>
                </div>

                {/* Letter content */}
                <div className="p-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-serif">
                  {coverLetter}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center card p-10"
              >
                {/* Illustration */}
                <svg className="w-40 h-40 mb-6 text-primary-200 dark:text-primary-800" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Envelope body */}
                  <rect x="30" y="60" width="140" height="100" rx="8" fill="currentColor" opacity="0.3" />
                  {/* Envelope flap */}
                  <path d="M30 68 L100 115 L170 68" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Letter sliding out */}
                  <rect x="50" y="30" width="100" height="70" rx="4" fill="currentColor" opacity="0.5" />
                  {/* Letter lines */}
                  <line x1="65" y1="48" x2="135" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="65" y1="58" x2="125" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="65" y1="68" x2="115" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="65" y1="78" x2="105" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                  {/* Sparkle top-right */}
                  <path d="M155 25 L158 35 L168 38 L158 41 L155 51 L152 41 L142 38 L152 35 Z" fill="currentColor" opacity="0.6" />
                  {/* Sparkle bottom-left */}
                  <path d="M42 140 L44 146 L50 148 L44 150 L42 156 L40 150 L34 148 L40 146 Z" fill="currentColor" opacity="0.6" />
                  {/* AI wand */}
                  <line x1="148" y1="130" x2="170" y2="152" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                  <circle cx="148" cy="130" r="4" fill="currentColor" opacity="0.6" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your cover letter will appear here</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                  Fill in the details on the left and click Generate to create a tailored cover letter.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
