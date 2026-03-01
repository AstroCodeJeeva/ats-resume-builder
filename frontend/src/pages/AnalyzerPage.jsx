import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { uploadAndAnalyze, quickScoreResume } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

export default function AnalyzerPage() {
  usePageTitle('Resume Analyzer')
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('score')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) validateAndSetFile(f)
  }

  const validateAndSetFile = (f) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const ext = f.name.split('.').pop().toLowerCase()
    if (!validTypes.includes(f.type) && !['pdf', 'docx'].includes(ext)) {
      toast.error('Please upload a PDF or DOCX file')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB.')
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) validateAndSetFile(f)
  }

  const handleFullAnalysis = async () => {
    if (!file) return toast.error('Please upload a resume first')
    setLoading(true)
    try {
      const data = await uploadAndAnalyze(file, jobDescription)
      setResult(data)
      setActiveTab('score')
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickScore = async () => {
    if (!file) return toast.error('Please upload a resume first')
    setQuickLoading(true)
    try {
      const data = await quickScoreResume(file, jobDescription)
      setResult({ ...data, strengths: [], weaknesses: [], suggestions: [], predicted_jobs: [] })
      setActiveTab('score')
      toast.success('Quick score ready!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scoring failed.')
    } finally {
      setQuickLoading(false)
    }
  }

  const resetAll = () => {
    setFile(null)
    setResult(null)
    setJobDescription('')
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-amber-600'
    if (score >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-700'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Resume Analyzer
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Upload your resume to get an ATS score, analysis, and job predictions
        </p>
      </div>

      {!result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : file
                ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary-400'
            }`}
            onClick={() => document.getElementById('resume-upload').click()}
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); resetAll() }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove & upload different file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Drop your resume here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse • PDF, DOCX supported • Max 10MB
                </p>
              </div>
            )}
          </div>

          {/* Job Description (Optional) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description <span className="text-gray-400">(optional, for better scoring)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
              placeholder="Paste the job description here to get keyword match analysis..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleFullAnalysis}
              disabled={!file || loading}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                'Full Analysis + Job Predictions'
              )}
            </button>
            <button
              onClick={handleQuickScore}
              disabled={!file || quickLoading}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 transition-all disabled:opacity-50"
            >
              {quickLoading ? 'Scoring...' : 'Quick Score'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Back Button */}
          <button
            onClick={resetAll}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
          >
            ← Analyze another resume
          </button>

          {/* Score Hero */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreBg(result.ats_score)} shadow-lg`}>
              <div className="bg-white dark:bg-gray-900 w-24 h-24 rounded-full flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${getScoreColor(result.ats_score)}`}>
                  {result.ats_score}
                </span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>
            <p className={`text-lg font-bold mt-3 ${getScoreColor(result.ats_score)}`}>
              {getScoreLabel(result.ats_score)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {result.word_count || 0} words analyzed
              {result.filename && ` • ${result.filename}`}
            </p>
          </div>

          {/* Result Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 justify-center">
            {[
              { id: 'score', label: 'Score Details' },
              { id: 'analysis', label: 'Analysis' },
              { id: 'suggestions', label: 'Suggestions' },
              { id: 'jobs', label: 'Job Predictions' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Score Details Tab */}
            {activeTab === 'score' && (
              <motion.div key="score" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.section_scores && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(result.section_scores).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-lg font-bold ${getScoreColor(value)}`}>{value}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full bg-gradient-to-r ${getScoreBg(value)} transition-all duration-500`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Keyword Analysis */}
                {result.keyword_analysis && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Keyword Analysis</h3>
                    {result.keyword_analysis.top_keywords_found && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-green-600 mb-2">Keywords Found</p>
                        <div className="flex flex-wrap gap-2">
                          {result.keyword_analysis.top_keywords_found.slice(0, 15).map((kw) => (
                            <span key={kw} className="px-2 py-1 rounded-lg text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.keyword_analysis.missing_important_keywords && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2">Missing Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {result.keyword_analysis.missing_important_keywords.slice(0, 15).map((kw) => (
                            <span key={kw} className="px-2 py-1 rounded-lg text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* JD Match (from quick score) */}
                {result.jd_match?.match_percentage != null && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description Match</h3>
                    <p className={`text-2xl font-bold ${getScoreColor(result.jd_match.match_percentage)}`}>
                      {result.jd_match.match_percentage}% match
                    </p>
                    {result.jd_match.matched_keywords?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-green-600 mb-1">Matched:</p>
                        <p className="text-xs text-gray-500">{result.jd_match.matched_keywords.join(', ')}</p>
                      </div>
                    )}
                    {result.jd_match.missing_keywords?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-600 mb-1">Missing:</p>
                        <p className="text-xs text-gray-500">{result.jd_match.missing_keywords.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-green-600 mb-4">Strengths</h3>
                    {result.strengths?.length > 0 ? (
                      <ul className="space-y-3">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-green-500 shrink-0">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Run full AI analysis to see strengths</p>
                    )}
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-red-500 mb-4">Weaknesses</h3>
                    {result.weaknesses?.length > 0 ? (
                      <ul className="space-y-3">
                        {result.weaknesses.map((w, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-red-500 shrink-0">✗</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Run full AI analysis to see weaknesses</p>
                    )}
                  </div>
                </div>

                {/* Resume Preview */}
                {result.resume_preview && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Extracted Text Preview</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {result.resume_preview}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.suggestions?.length > 0 ? (
                  <div className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl p-5 border ${
                          s.severity === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                            : s.severity === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">
                            {s.severity === 'critical' ? '●' : s.severity === 'warning' ? '●' : '●'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {s.category}
                              </span>
                              {s.impact && (
                                <span className={`text-xs font-medium ${
                                  s.impact === 'high' ? 'text-red-600' : s.impact === 'medium' ? 'text-yellow-600' : 'text-gray-500'
                                }`}>
                                  {s.impact} impact
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{s.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-500">Run full analysis to get personalized suggestions</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Job Predictions Tab */}
            {activeTab === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.predicted_jobs?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.predicted_jobs.map((job, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              {job.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">{job.salary_range || ''}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreColor(job.match_score)}`}>
                              {job.match_score}%
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                job.demand_level === 'High'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : job.demand_level === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {job.demand_level} Demand
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{job.reason}</p>

                        {job.skills_matched?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-green-600 mb-1">Skills Matched:</p>
                            <div className="flex flex-wrap gap-1">
                              {job.skills_matched.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {job.skills_to_develop?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-orange-600 mb-1">Skills to Develop:</p>
                            <div className="flex flex-wrap gap-1">
                              {job.skills_to_develop.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-500">Run full analysis to get job predictions</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
