import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile, changePassword, setSecurityQuestion } from '../services/api'
import usePageTitle from '../hooks/usePageTitle'

export default function ProfilePage() {
  usePageTitle('Profile')
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit form
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  // Security question form
  const [secQuestion, setSecQuestion] = useState('')
  const [secAnswer, setSecAnswer] = useState('')
  const [savingSec, setSavingSec] = useState(false)

  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user, navigate])

  const loadProfile = async () => {
    try {
      const data = await getProfile()
      setProfile(data)
      setUsername(data.username)
      setEmail(data.email)
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfile(username, email)
      toast.success(res.message)
      if (res.user) {
        // Update local auth state
        const token = localStorage.getItem('ats_token')
        login(token, { ...user, username: res.user.username, email: res.user.email })
        setProfile((p) => ({ ...p, ...res.user }))
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match')
      return
    }
    if (newPw.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setChangingPw(true)
    try {
      const res = await changePassword(currentPw, newPw)
      toast.success(res.message)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Password change failed')
    } finally {
      setChangingPw(false)
    }
  }

  const handleSetSecurityQuestion = async (e) => {
    e.preventDefault()
    setSavingSec(true)
    try {
      const res = await setSecurityQuestion(secQuestion, secAnswer)
      toast.success(res.message || 'Security question saved!')
      setSecAnswer('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save security question')
    } finally {
      setSavingSec(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/25 ring-4 ring-white dark:ring-surface-900">
            <span className="text-3xl text-white font-bold">
              {(user.username || '?')[0].toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          {user.is_admin && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Admin
            </span>
          )}
        </div>

        {/* Stats */}
        {profile && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Resumes', value: profile.resume_count || 0 },
              { label: 'Uploads', value: profile.upload_count || 0 },
              {
                label: 'Member Since',
                value: profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '-',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="card p-4 text-center"
              >
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Edit Profile Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              disabled={changingPw}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Security Question Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Security Question</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Set a security question to recover your account if you forget your password.
          </p>
          <form onSubmit={handleSetSecurityQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Security Question
              </label>
              <select
                required
                value={secQuestion}
                onChange={(e) => setSecQuestion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="">Select a question...</option>
                <option value="What is your pet's name?">What is your pet&apos;s name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
                <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="What is your favorite book?">What is your favorite book?</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Answer
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={secAnswer}
                onChange={(e) => setSecAnswer(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Type your answer..."
              />
            </div>
            <button
              type="submit"
              disabled={savingSec}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {savingSec ? 'Saving...' : 'Save Security Question'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Logging out will clear your session. You can log back in anytime.
          </p>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  )
}
