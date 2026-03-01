import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSharedResume, previewHTML } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

/**
 * Public page for viewing a shared resume via token.
 * Route: /shared/:token
 */
export default function SharedResumePage() {
  usePageTitle('Shared Resume')
  const { token } = useParams()
  const [resume, setResume] = useState(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const data = await getSharedResume(token)
        setResume(data)
        // Also get HTML preview
        const html = await previewHTML({
          resume: data.resume_data,
          professional_summary: data.professional_summary || '',
          template: data.template || 'classic',
        })
        setPreviewSrc(html)
      } catch (err) {
        setError(err.response?.data?.detail || 'Resume not found or link has expired.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading shared resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link Unavailable</h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{resume.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {resume.target_role && <span>{resume.target_role}</span>}
              {resume.ats_score != null && (
                <span className={`font-semibold ${resume.ats_score >= 80 ? 'text-green-500' : resume.ats_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  ATS: {resume.ats_score}%
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
            Shared Resume
          </div>
        </div>
      </motion.div>

      {/* Resume preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        {previewSrc ? (
          <iframe
            srcDoc={previewSrc}
            title="Shared Resume Preview"
            className="w-full border-0"
            style={{ minHeight: '900px' }}
          />
        ) : (
          <div className="p-10 text-center text-gray-400 dark:text-gray-500">
            Preview unavailable
          </div>
        )}
      </motion.div>

      {/* Footer attribution */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
        Built with ATS Resume Builder
      </p>
    </div>
  )
}
