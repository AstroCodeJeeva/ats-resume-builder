import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { listResumes, deleteResume, getResume, getUploadHistory, shareResume, unshareResume } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import usePageTitle from '../hooks/usePageTitle'
import ConfirmModal from '../components/ConfirmModal'
function ScoreChart({ data }) {
  if (!data.length) return null
  const maxScore = 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        ATS Score Progress
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        Your resume scores over time
      </p>

      <div className="flex items-end gap-2 h-40">
        {data.map((item, i) => {
          const h = Math.max(4, (item.score / maxScore) * 100)
          const color =
            item.score >= 80
              ? 'from-green-400 to-emerald-500'
              : item.score >= 60
              ? 'from-yellow-400 to-amber-500'
              : item.score >= 40
              ? 'from-orange-400 to-orange-500'
              : 'from-red-400 to-red-500'

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {item.score}%
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                className={`w-full rounded-t-lg bg-gradient-to-t ${color} min-h-[4px]`}
                title={`${item.label}: ${item.score}%`}
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-full text-center leading-tight">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Score legend */}
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        {[
          { label: '80-100 Excellent', color: 'bg-green-500' },
          { label: '60-79 Good', color: 'bg-yellow-500' },
          { label: '40-59 Fair', color: 'bg-orange-500' },
          { label: '<40 Needs Work', color: 'bg-red-500' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsRow({ resumes, uploads }) {
  const optimized = resumes.filter((r) => r.is_optimized).length
  const avgScore =
    resumes.filter((r) => r.ats_score != null).length > 0
      ? Math.round(
          resumes.filter((r) => r.ats_score != null).reduce((a, r) => a + r.ats_score, 0) /
            resumes.filter((r) => r.ats_score != null).length
        )
      : 0
  const bestScore = resumes.reduce((m, r) => Math.max(m, r.ats_score || 0), 0)

  const stats = [
    { label: 'Resumes', value: resumes.length },
    { label: 'Optimized', value: optimized },
    { label: 'Uploads', value: uploads.length },
    { label: 'Avg Score', value: avgScore ? `${avgScore}%` : '-' },
    { label: 'Best Score', value: bestScore ? `${bestScore}%` : '-' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700"
        >
          <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // resume id to confirm delete
  const [sharing, setSharing] = useState(null) // resume id currently being shared/unshared

  // Search & filter state
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest | oldest | score-high | score-low
  const [scoreFilter, setScoreFilter] = useState('all') // all | 80+ | 60-79 | <60

  useEffect(() => {
    if (!user) {
      navigate('/builder')
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resumeList, uploadList] = await Promise.all([
        listResumes(),
        getUploadHistory().catch(() => []),
      ])
      setResumes(resumeList)
      setUploads(uploadList)
    } catch {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setConfirmDelete(null)
    setDeleting(id)
    try {
      await deleteResume(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
      toast.success('Resume deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleShare = async (id) => {
    setSharing(id)
    try {
      const { share_token } = await shareResume(id)
      const shareUrl = `${window.location.origin}/shared/${share_token}`
      await navigator.clipboard.writeText(shareUrl)
      setResumes((prev) => prev.map((r) => r.id === id ? { ...r, share_token } : r))
      toast.success('Share link copied to clipboard!')
    } catch {
      toast.error('Failed to create share link')
    } finally {
      setSharing(null)
    }
  }

  const handleUnshare = async (id) => {
    setSharing(id)
    try {
      await unshareResume(id)
      setResumes((prev) => prev.map((r) => r.id === id ? { ...r, share_token: null } : r))
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke share link')
    } finally {
      setSharing(null)
    }
  }

  const handleLoad = async (id) => {
    try {
      const full = await getResume(id)
      // If optimized, go straight to results
      if (full.is_optimized && full.optimized_data) {
        const resultPayload = {
          optimized_resume: full.optimized_data,
          original_resume: full.resume_data,
          ats_score: {
            overall: full.ats_score || 0,
            keyword_match: 0,
            skills_alignment: 0,
            experience_relevance: 0,
            formatting_compliance: 0,
          },
          suggestions: [],
          professional_summary: full.professional_summary || '',
        }
        sessionStorage.setItem('ats_result', JSON.stringify(resultPayload))
        navigate('/results')
      } else {
        // Load into builder
        sessionStorage.setItem('ats_draft', JSON.stringify(full.resume_data))
        sessionStorage.setItem('ats_draft_id', full.id.toString())
        navigate('/builder')
        toast.success('Resume loaded into builder')
      }
    } catch {
      toast.error('Failed to load resume')
    }
  }

  if (!user) return null

  // Build chart data from resumes + uploads that have ATS scores
  const chartData = useMemo(() => {
    const items = []
    // Add saved resumes with scores
    resumes.forEach((r) => {
      if (r.ats_score != null) {
        items.push({
          score: r.ats_score,
          label: r.title?.slice(0, 12) || 'Resume',
          date: r.updated_at || r.created_at || '',
        })
      }
    })
    // Add uploads with scores
    uploads.forEach((u) => {
      if (u.ats_score != null) {
        items.push({
          score: u.ats_score,
          label: u.filename?.slice(0, 12) || 'Upload',
          date: u.uploaded_at || '',
        })
      }
    })
    // Sort by date ascending
    items.sort((a, b) => new Date(a.date) - new Date(b.date))
    return items.slice(-12) // Show last 12
  }, [resumes, uploads])

  // Filtered and sorted resumes
  const filteredResumes = useMemo(() => {
    let list = [...resumes]

    // Search by title or target role
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.target_role?.toLowerCase().includes(q) ||
          r.template?.toLowerCase().includes(q)
      )
    }

    // Score filter
    if (scoreFilter === '80+') list = list.filter((r) => (r.ats_score || 0) >= 80)
    else if (scoreFilter === '60-79')
      list = list.filter((r) => (r.ats_score || 0) >= 60 && (r.ats_score || 0) < 80)
    else if (scoreFilter === '<60') list = list.filter((r) => (r.ats_score || 0) < 60)

    // Sort
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
    else if (sortBy === 'score-high') list.sort((a, b) => (b.ats_score || 0) - (a.ats_score || 0))
    else if (sortBy === 'score-low') list.sort((a, b) => (a.ats_score || 0) - (b.ats_score || 0))

    return list
  }, [resumes, search, sortBy, scoreFilter])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Resumes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, <span className="font-medium">{user.username}</span>!
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/analyzer')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 transition-all"
          >
            Upload & Analyze
          </button>
          <button
            onClick={() => navigate('/builder')}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            + New Resume
          </button>
        </div>
      </div>

      {loading ? (
        /* Skeleton loading */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-1" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-8 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <StatsRow resumes={resumes} uploads={uploads} />

          {/* Score Chart */}
          {chartData.length > 0 && <ScoreChart data={chartData} />}

          {/* Search & Filter Bar */}
          {resumes.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, role, or template..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score-high">Score: High → Low</option>
                <option value="score-low">Score: Low → High</option>
              </select>

              {/* Score Filter */}
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="all">All Scores</option>
                <option value="80+">80+ Excellent</option>
                <option value="60-79">60-79 Good</option>
                <option value="<60">Below 60</option>
              </select>
            </div>
          )}

          {/* Resumes Grid */}
          {resumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <span className="text-5xl text-gray-300 dark:text-gray-600">—</span>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-4">
            No saved resumes yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Create your first ATS-optimised resume to get started.
          </p>
          <button
            onClick={() => navigate('/builder')}
            className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Build Resume
          </button>
        </motion.div>
      ) : (
        <div>
          {filteredResumes.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-lg text-gray-400">No matches</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                No resumes match your search or filter.
              </p>
              <button
                onClick={() => { setSearch(''); setScoreFilter('all') }}
                className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredResumes.map((resume, idx) => (
                  <motion.div
                    key={resume.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 flex flex-col"
                  >
              {/* Title & badge */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate pr-2">
                  {resume.title}
                </h3>
                {resume.is_optimized && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Optimised
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1">
                {resume.target_role && (
                  <p>
                    Role: <span className="font-medium">{resume.target_role}</span>
                  </p>
                )}
                <p>Template: <span className="capitalize">{resume.template}</span></p>
                {resume.ats_score != null && (
                  <p>
                    ATS Score:{' '}
                    <span
                      className={`font-bold ${
                        resume.ats_score >= 80
                          ? 'text-green-600'
                          : resume.ats_score >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {resume.ats_score}%
                    </span>
                  </p>
                )}
                <p>{new Date(resume.updated_at).toLocaleDateString()}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleLoad(resume.id)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => resume.share_token ? handleUnshare(resume.id) : handleShare(resume.id)}
                  disabled={sharing === resume.id}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    resume.share_token
                      ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                      : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                  }`}
                  title={resume.share_token ? 'Click to revoke share link' : 'Create share link'}
                >
                  {sharing === resume.id ? '...' : resume.share_token ? 'Shared' : 'Share'}
                </button>
                <button
                  onClick={() => setConfirmDelete(resume.id)}
                  disabled={deleting === resume.id}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                  {deleting === resume.id ? '...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmDelete !== null}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
