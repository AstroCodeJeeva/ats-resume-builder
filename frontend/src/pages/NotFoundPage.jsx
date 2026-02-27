/**
 * NotFoundPage — Styled 404 page for invalid routes.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page Not Found')
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* Big 404 */}
        <div className="relative mb-6">
          <span className="text-[10rem] font-black leading-none bg-gradient-to-br from-primary-400 to-indigo-600 bg-clip-text text-transparent select-none">
            404
          </span>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
          >
            📄
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg transition-all"
          >
            🏠 Go Home
          </Link>
          <Link
            to="/builder"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 transition-all"
          >
            🔨 Build Resume
          </Link>
          <Link
            to="/analyzer"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
          >
            📤 Analyze Resume
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
