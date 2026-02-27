import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import usePageTitle from '../hooks/usePageTitle'

/**
 * Landing page — hero section, features, CTA.
 */
const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Optimisation',
    desc: 'GPT rewrites weak bullet points, adds quantifiable achievements, and tailors your resume to the target role.',
  },
  {
    icon: '📊',
    title: 'ATS Scoring Engine',
    desc: 'Get a detailed ATS compatibility score with keyword match, skills alignment, and formatting checks.',
  },
  {
    icon: '�',
    title: 'Resume Upload & Analysis',
    desc: 'Upload your PDF/DOCX resume to get instant ATS score, section analysis, and keyword insights.',
  },
  {
    icon: '🎯',
    title: 'AI Job Predictions',
    desc: 'Our AI analyzes your resume and predicts the best matching job roles with salary ranges.',
  },
  {
    icon: '�💡',
    title: 'Intelligent Suggestions',
    desc: 'Receive actionable tips on missing keywords, weak verbs, and formatting improvements.',
  },
  {
    icon: '📄',
    title: '4 ATS-Safe Templates',
    desc: 'Choose from Classic, Modern, Fresher, and Technical templates — all guaranteed ATS-friendly.',
  },
  {
    icon: '📥',
    title: 'PDF Export',
    desc: 'Download your polished resume as a clean, ATS-compatible PDF in one click.',
  },
  {
    icon: '🔄',
    title: 'Before vs After',
    desc: 'Side-by-side comparison so you can see every improvement highlighted in green.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
}

export default function LandingPage() {
  usePageTitle('Home')

  return (
    <div className="overflow-hidden">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-6">
              AI-Powered Resume Builder
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6"
          >
            Build an{' '}
            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              ATS-Optimised
            </span>{' '}
            Resume in Minutes
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Paste your details, let AI rewrite and optimise them, check your ATS score, and download a
            polished PDF — all from one beautiful interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Start Building
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/analyzer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-semibold shadow-lg border border-primary-200 dark:border-primary-800 hover:shadow-xl hover:scale-105 transition-all duration-200 ml-4"
            >
              📤 Upload & Analyze
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything you need to land interviews
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
