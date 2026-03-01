import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'

const features = [
  {
    title: 'Resume Optimisation',
    desc: 'Rewrites weak bullet points with quantifiable achievements tailored to the job you\'re targeting.',
  },
  {
    title: 'ATS Scoring',
    desc: 'Checks keyword match, skills alignment, and formatting to give you a compatibility score.',
  },
  {
    title: 'Upload & Analyze',
    desc: 'Drop in a PDF or DOCX to get section-by-section feedback and keyword insights.',
  },
  {
    title: 'Job Matching',
    desc: 'Predicts which roles fit your experience best, with estimated salary ranges.',
  },
  {
    title: 'Actionable Suggestions',
    desc: 'Flags missing keywords, weak verbs, and formatting issues with clear fixes.',
  },
  {
    title: 'Multiple Templates',
    desc: 'Classic, Modern, Fresher, and Technical layouts — all ATS-compatible.',
  },
  {
    title: 'PDF Export',
    desc: 'Download a clean, ready-to-submit PDF in one click.',
  },
  {
    title: 'Before vs After',
    desc: 'Side-by-side diff so you can see exactly what changed and why.',
  },
]

export default function LandingPage() {
  usePageTitle('Home')

  return (
    <div className="overflow-hidden">
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-6">
            Resume Builder + ATS Checker
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Build a Resume That{' '}
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              Gets Past ATS
            </span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Fill in your details, optimise for the target role, check your ATS score, and export a clean PDF.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Building
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/analyzer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-semibold shadow-lg border border-primary-200 dark:border-primary-800 hover:shadow-xl transition-all duration-200"
            >
              Upload & Analyze
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          What you can do
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
