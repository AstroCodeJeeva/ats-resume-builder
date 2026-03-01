import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'

/* Lazy-loaded pages */
const LandingPage = lazy(() => import('./pages/LandingPage'))
const BuilderPage = lazy(() => import('./pages/BuilderPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AnalyzerPage = lazy(() => import('./pages/AnalyzerPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const CoverLetterPage = lazy(() => import('./pages/CoverLetterPage'))
const InterviewPrepPage = lazy(() => import('./pages/InterviewPrepPage'))
const SharedResumePage = lazy(() => import('./pages/SharedResumePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/**
 * Root application component.
 * Manages dark-mode state (persisted to localStorage) and top-level routing.
 */
export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('ats_dark_mode') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem('ats_dark_mode', dark)
  }, [dark])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className={dark ? 'dark' : ''}>
          <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
            {/* Skip-to-main-content link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-600 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
            >
              Skip to main content
            </a>
            <Navbar dark={dark} setDark={setDark} />
            <ScrollToTop />
            <main id="main-content" className="flex-1" role="main">
              <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/builder" element={<BuilderPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/analyzer" element={<AnalyzerPage />} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/cover-letter" element={<CoverLetterPage />} />
                  <Route path="/interview-prep" element={<InterviewPrepPage />} />
                  <Route path="/shared/:token" element={<SharedResumePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: '!bg-white dark:!bg-surface-800 !text-gray-900 dark:!text-gray-100 !shadow-card !border !border-gray-100 dark:!border-gray-700/60 !rounded-xl',
                duration: 4000,
              }}
            />
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}
