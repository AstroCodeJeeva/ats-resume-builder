/**
 * ForgotPasswordModal — 3-step password reset via security question.
 *
 * Step 1: Enter email
 * Step 2: Answer security question
 * Step 3: Enter new password
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getSecurityQuestion, resetPasswordWithAnswer } from '../services/api'

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1=email, 2=answer, 3=new password
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const modalRef = useRef(null)

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setEmail('')
      setQuestion('')
      setAnswer('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen])

  // Focus trap + escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    const t = setTimeout(() => modalRef.current?.querySelector('input')?.focus(), 100)
    return () => { document.removeEventListener('keydown', handleKeyDown); clearTimeout(t) }
  }, [isOpen, handleKeyDown])

  const handleGetQuestion = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await getSecurityQuestion(email)
      setQuestion(res.question)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email not found or no security question set.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAnswer = async (e) => {
    e.preventDefault()
    setStep(3)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await resetPasswordWithAnswer(email, answer, newPassword)
      toast.success('Password reset successfully! You can now sign in.')
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Password reset failed.'
      toast.error(msg)
      if (msg.includes('Incorrect answer')) {
        setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Reset your password"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative"
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:rounded"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {step === 1 ? '🔑 Reset Password' : step === 2 ? '❓ Security Question' : '🔒 New Password'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {step === 1
                  ? 'Enter your email to get started'
                  : step === 2
                  ? 'Answer your security question'
                  : 'Choose a new password'}
              </p>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-1.5 rounded-full transition-colors ${
                      s <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleGetQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ Looking up...' : 'Continue →'}
                </button>
              </form>
            )}

            {/* Step 2: Answer question */}
            {step === 2 && (
              <form onSubmit={handleVerifyAnswer} className="space-y-4">
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium">
                  {question}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Answer</label>
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className={inputClass}
                    placeholder="Type your answer..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg transition-all"
                >
                  Continue →
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Back
                </button>
              </form>
            )}

            {/* Step 3: New password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Back
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
