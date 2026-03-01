/**
 * ConfirmModal — Styled replacement for native window.confirm().
 *
 * Usage:
 *   <ConfirmModal
 *     isOpen={showConfirm}
 *     title="Delete Resume"
 *     message="Are you sure? This action cannot be undone."
 *     confirmLabel="Delete"
 *     danger
 *     onConfirm={() => { doDelete(); setShowConfirm(false) }}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  // Focus the confirm button when modal opens & trap focus
  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus()
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="card shadow-elevated w-full max-w-sm mx-4 p-6"
          >
            {/* Icon */}
            <div className="text-center mb-4">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${danger ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'}`}>{danger ? '!' : '?'}</div>
            </div>

            {/* Title */}
            <h3
              id="confirm-title"
              className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2"
            >
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
                  danger
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25'
                    : 'bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
