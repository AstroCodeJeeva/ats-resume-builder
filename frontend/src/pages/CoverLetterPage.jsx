import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { generateCoverLetter } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

const TONES = [
  { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Formal & polished' },
  { value: 'enthusiastic', label: 'Enthusiastic', emoji: '🚀', desc: 'Energetic & passionate' },
  { value: 'concise', label: 'Concise', emoji: '⚡', desc: 'Brief & impactful' },
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ✉️ AI Cover Letter Generator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          Generate a tailored cover letter from your resume and job description — powered by AI.
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
                  <span className="text-xl">{t.emoji}</span>
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
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg disabled:opacity-50 transition-all"
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
              '✨ Generate Cover Letter'
            )}
          </button>

          {!getResumeData() && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              ⚠️ No resume data in session. Build or optimise a resume first for best results.
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{wordCount} words</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      {copied ? '✅ Copied' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      📥 Download .txt
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
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-10"
              >
                <span className="text-6xl mb-4">✉️</span>
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
