import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import ATSScoreCard from '../components/ATSScoreCard'
import SuggestionsPanel from '../components/SuggestionsPanel'
import BeforeAfterView from '../components/BeforeAfterView'
import TemplateSwitcher from '../components/TemplateSwitcher'
import LoadingSpinner from '../components/LoadingSpinner'

import { generatePDF, generateDOCX, previewHTML, checkPDFATS, saveResume } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import usePageTitle from '../hooks/usePageTitle'

/**
 * Results page — ATS score, suggestions, before/after, preview, PDF download.
 */
export default function ResultsPage() {
  usePageTitle('Results')
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [template, setTemplate] = useState('classic')
  const [previewSrc, setPreviewSrc] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const [tab, setTab] = useState('preview') // preview | compare | atscheck
  const [atsCheckResult, setAtsCheckResult] = useState(null)
  const [checkingATS, setCheckingATS] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  // Load result from session storage
  useEffect(() => {
    const raw = sessionStorage.getItem('ats_result')
    if (!raw) {
      navigate('/builder')
      return
    }
    try {
      setResult(JSON.parse(raw))
    } catch {
      navigate('/builder')
    }
  }, [navigate])

  // Fetch HTML preview whenever result or template changes
  useEffect(() => {
    if (!result) return
    const fetchPreview = async () => {
      try {
        const html = await previewHTML({
          resume: result.optimized_resume,
          professional_summary: result.professional_summary,
          template,
        })
        setPreviewSrc(html)
      } catch {
        setPreviewSrc('<p style="padding:20px;color:#999;">Preview unavailable — backend may be offline.</p>')
      }
    }
    fetchPreview()
  }, [result, template])

  const handleDownload = async () => {
    if (!result) return
    setDownloading(true)
    try {
      const blob = await generatePDF({
        resume: result.optimized_resume,
        professional_summary: result.professional_summary,
        template,
      })
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.optimized_resume.personal_info.name.replace(/\s/g, '_')}_Resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF download failed.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadDocx = async () => {
    if (!result) return
    setDownloadingDocx(true)
    try {
      const blob = await generateDOCX({
        resume: result.optimized_resume,
        professional_summary: result.professional_summary,
        template,
      })
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.optimized_resume.personal_info.name.replace(/\s/g, '_')}_Resume.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('DOCX downloaded!')
    } catch {
      toast.error('DOCX download failed.')
    } finally {
      setDownloadingDocx(false)
    }
  }

  const handleATSCheck = async () => {
    if (!result) return
    setCheckingATS(true)
    setAtsCheckResult(null)
    setTab('atscheck')
    try {
      const report = await checkPDFATS({
        resume: result.optimized_resume,
        professional_summary: result.professional_summary,
        template,
      })
      setAtsCheckResult(report)
      toast.success('ATS check complete!')
    } catch {
      toast.error('ATS check failed.')
    } finally {
      setCheckingATS(false)
    }
  }

  const handleSave = async () => {
    if (!result || !user) return
    setSaving(true)
    try {
      const name = result.optimized_resume.personal_info?.name || 'Untitled'
      const role = result.optimized_resume.target_role || ''
      await saveResume({
        title: `${name} - ${role || 'Resume'}`,
        resume_data: result.original_resume,
        optimized_data: result.optimized_resume,
        professional_summary: result.professional_summary || '',
        ats_score: result.ats_score?.overall || 0,
        template,
        target_role: role,
        is_optimized: true,
      })
      toast.success('Resume saved to your account!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Save failed. Are you logged in?'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!result) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {downloading && <LoadingSpinner message="Generating PDF..." />}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Optimised Resume</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review your ATS score, suggestions, and download the final PDF.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/builder')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← Edit Resume
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={handleDownloadDocx}
            disabled={downloadingDocx}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {downloadingDocx ? '...' : 'Download DOCX'}
          </button>
          <button
            onClick={handleATSCheck}
            disabled={checkingATS}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {checkingATS ? 'Checking...' : 'Check PDF ATS'}
          </button>
          {user && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Resume'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar — score + suggestions */}
        <div className="lg:col-span-4 space-y-6">
          <ATSScoreCard score={result.ats_score} />
          <SuggestionsPanel suggestions={result.suggestions} />
          <TemplateSwitcher selected={template} onChange={setTemplate} />
        </div>

        {/* Right panel — preview / compare tabs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-2">
            {['preview', 'compare', 'atscheck'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t === 'preview' ? 'Resume Preview' : t === 'compare' ? 'Before vs After' : 'ATS Check'}
              </button>
            ))}
          </div>

          {tab === 'preview' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <iframe
                srcDoc={previewSrc}
                title="Resume Preview"
                className="w-full border-0"
                style={{ minHeight: '800px' }}
              />
            </motion.div>
          ) : tab === 'compare' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BeforeAfterView
                original={result.original_resume}
                optimized={result.optimized_resume}
                summary={result.professional_summary}
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {checkingATS ? (
                <div className="flex items-center justify-center py-20">
                  <LoadingSpinner message="Running ATS compliance checks..." />
                </div>
              ) : atsCheckResult ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                  {/* Overall score badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">PDF ATS Compliance Report</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Template: <span className="font-medium capitalize">{template}</span></p>
                    </div>
                    <div className={`text-4xl font-extrabold ${atsCheckResult.score >= 80 ? 'text-green-500' : atsCheckResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {atsCheckResult.score}%
                    </div>
                  </div>

                  {/* Summary */}
                  <div className={`p-4 rounded-xl text-sm font-medium ${atsCheckResult.overall_pass ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                    {atsCheckResult.summary}
                  </div>

                  {/* Individual checks */}
                  <div className="space-y-3">
                    {atsCheckResult.checks.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-4 rounded-xl border ${
                          item.passed
                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                            : item.severity === 'critical'
                            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                        }`}
                      >
                        <span className={`text-sm font-bold mt-0.5 ${item.passed ? 'text-green-500' : item.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {item.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {item.check}
                            {!item.passed && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                item.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              }`}>
                                {item.severity}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Re-check button */}
                  <div className="text-center pt-2">
                    <button
                      onClick={handleATSCheck}
                      className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                      Re-run ATS Check
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-500">
                  <p className="text-lg font-medium">No ATS check run yet</p>
                  <p className="text-sm mt-1">Click the "Check PDF ATS" button above to analyse your resume.</p>
                  <button
                    onClick={handleATSCheck}
                    className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Run ATS Check Now
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
