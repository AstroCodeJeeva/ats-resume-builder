/**
 * Spinner overlay shown during API calls.
 */
import { motion } from 'framer-motion'

export default function LoadingSpinner({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-8 flex flex-col items-center gap-4 shadow-elevated"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"
        />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>
      </motion.div>
    </div>
  )
}
