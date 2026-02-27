/**
 * AdminPage — Admin dashboard with stats, user management, and platform oversight.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import ConfirmModal from '../components/ConfirmModal'
import {
  getAdminStats,
  getAdminUsers,
  getAdminResumes,
  getAdminUploads,
  deleteAdminUser,
  updateAdminUser,
} from '../services/api'

export default function AdminPage() {
  usePageTitle('Admin Panel')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [resumes, setResumes] = useState([])
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null) // { userId, username }

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/')
      toast.error('Admin access required')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, resumesData, uploadsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminResumes(),
        getAdminUploads(),
      ])
      setStats(statsData)
      setUsers(usersData)
      setResumes(resumesData)
      setUploads(uploadsData)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId, username) => {
    setConfirmDelete(null)
    try {
      await deleteAdminUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    }
  }

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      await updateAdminUser(userId, { is_admin: !currentStatus })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentStatus } : u))
      )
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    }
  }

  if (!user?.is_admin) return null

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'resumes', label: '📄 Resumes', icon: '📄' },
    { id: 'uploads', label: '📤 Uploads', icon: '📤' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Platform management and analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading admin data...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === 'overview' && stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'blue' },
                  { label: 'Total Resumes', value: stats.total_resumes, icon: '📄', color: 'green' },
                  { label: 'Optimized', value: stats.optimized_resumes, icon: '✨', color: 'purple' },
                  { label: 'Uploads', value: stats.total_uploads, icon: '📤', color: 'orange' },
                  { label: 'Avg ATS Score', value: `${stats.avg_ats_score}%`, icon: '📊', color: 'teal' },
                  { label: 'New This Week', value: stats.recent_signups, icon: '🆕', color: 'pink' },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                  >
                    <span className="text-2xl">{card.icon}</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Score Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ATS Score Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Excellent (80-100)', value: stats.score_distribution?.excellent || 0, color: 'bg-green-500' },
                    { label: 'Good (60-79)', value: stats.score_distribution?.good || 0, color: 'bg-blue-500' },
                    { label: 'Fair (40-59)', value: stats.score_distribution?.fair || 0, color: 'bg-yellow-500' },
                    { label: 'Poor (<40)', value: stats.score_distribution?.poor || 0, color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mx-auto mb-2`}>
                        <span className="text-white font-bold text-lg">{item.value}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Resumes</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Uploads</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Role</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Joined</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {u.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {u.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-500">{u.resume_count}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-500">{u.upload_count}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.is_admin
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {u.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 transition-colors"
                                title={u.is_admin ? 'Revoke admin' : 'Make admin'}
                              >
                                {u.is_admin ? '👤' : '🛡️'}
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ userId: u.id, username: u.username })}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Resumes Tab */}
          {tab === 'resumes' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.length === 0 ? (
                  <p className="col-span-full text-center py-10 text-gray-500">No resumes yet</p>
                ) : (
                  resumes.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {r.title}
                        </h3>
                        {r.is_optimized && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Optimised
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">👤 {r.username}</p>
                      {r.target_role && <p className="text-xs text-gray-500">🎯 {r.target_role}</p>}
                      {r.ats_score != null && (
                        <p className="text-xs mt-1">
                          📊 ATS:{' '}
                          <span
                            className={`font-bold ${
                              r.ats_score >= 80 ? 'text-green-600' : r.ats_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                          >
                            {r.ats_score}%
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Uploads Tab */}
          {tab === 'uploads' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">File</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">ATS Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Top Jobs</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {uploads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                            No uploads yet
                          </td>
                        </tr>
                      ) : (
                        uploads.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{u.filename}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{u.username}</td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`font-bold text-sm ${
                                  u.ats_score >= 80
                                    ? 'text-green-600'
                                    : u.ats_score >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {u.ats_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {u.predicted_jobs?.slice(0, 2).map((j) => j.title || j).join(', ') || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-gray-500">
                              {u.uploaded_at ? new Date(u.uploaded_at).toLocaleDateString() : ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmDelete !== null}
        title="Delete User"
        message={`Are you sure you want to delete ${confirmDelete?.username || 'this user'}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDeleteUser(confirmDelete.userId, confirmDelete.username)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
