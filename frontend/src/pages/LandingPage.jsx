import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import usePageTitle from '../hooks/usePageTitle'

const features = [
  {
    title: 'Resume Optimisation',
    desc: 'Rewrites weak bullet points with quantifiable achievements tailored to the job you\'re targeting.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'ATS Scoring',
    desc: 'Checks keyword match, skills alignment, and formatting to give you a compatibility score.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'from-primary-500 to-violet-500',
  },
  {
    title: 'Upload & Analyze',
    desc: 'Drop in a PDF or DOCX to get section-by-section feedback and keyword insights.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Job Matching',
    desc: 'Predicts which roles fit your experience best, with estimated salary ranges.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Actionable Suggestions',
    desc: 'Flags missing keywords, weak verbs, and formatting issues with clear fixes.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Multiple Templates',
    desc: 'Classic, Modern, Fresher, and Technical layouts — all ATS-compatible.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'PDF Export',
    desc: 'Download a clean, ready-to-submit PDF in one click.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Before vs After',
    desc: 'Side-by-side diff so you can see exactly what changed and why.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'from-indigo-500 to-primary-500',
  },
]

const stats = [
  { value: '10K+', label: 'Resumes Built' },
  { value: '85%', label: 'Avg ATS Score' },
  { value: '4', label: 'Templates' },
  { value: 'Free', label: 'To Use' },
]

// Floating resume illustration SVG
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-3xl blur-2xl" />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl" aria-hidden="true">
          {/* Paper background */}
          <rect x="30" y="20" width="240" height="340" rx="12" className="fill-white dark:fill-gray-800" filter="url(#shadow)" />
          <rect x="30" y="20" width="240" height="340" rx="12" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />

          {/* Header bar */}
          <rect x="30" y="20" width="240" height="48" rx="12" className="fill-primary-600" />
          <rect x="30" y="56" width="240" height="12" className="fill-primary-600" />

          {/* Avatar circle */}
          <circle cx="72" cy="44" r="14" className="fill-white/20" />
          <rect x="96" y="34" width="90" height="8" rx="4" className="fill-white/60" />
          <rect x="96" y="48" width="60" height="6" rx="3" className="fill-white/40" />

          {/* Content lines */}
          <rect x="52" y="86" width="100" height="8" rx="4" className="fill-primary-200 dark:fill-primary-800/60" />
          <rect x="52" y="104" width="196" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="116" width="180" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="128" width="160" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />

          <rect x="52" y="152" width="80" height="8" rx="4" className="fill-primary-200 dark:fill-primary-800/60" />
          <rect x="52" y="170" width="196" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="182" width="190" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="194" width="170" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="206" width="140" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />

          <rect x="52" y="230" width="110" height="8" rx="4" className="fill-primary-200 dark:fill-primary-800/60" />
          <rect x="52" y="248" width="196" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="52" y="260" width="180" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />

          {/* Skill bars */}
          <rect x="52" y="284" width="60" height="8" rx="4" className="fill-primary-200 dark:fill-primary-800/60" />
          <rect x="52" y="300" width="140" height="6" rx="3" className="fill-gray-100 dark:fill-gray-700" />
          <rect x="52" y="300" width="120" height="6" rx="3" className="fill-primary-400" />
          <rect x="52" y="314" width="140" height="6" rx="3" className="fill-gray-100 dark:fill-gray-700" />
          <rect x="52" y="314" width="100" height="6" rx="3" className="fill-emerald-400" />
          <rect x="52" y="328" width="140" height="6" rx="3" className="fill-gray-100 dark:fill-gray-700" />
          <rect x="52" y="328" width="130" height="6" rx="3" className="fill-amber-400" />

          {/* Score badge */}
          <g>
            <circle cx="232" cy="96" r="24" className="fill-emerald-500" />
            <text x="232" y="93" textAnchor="middle" className="fill-white text-[11px] font-bold">92</text>
            <text x="232" y="105" textAnchor="middle" className="fill-white/70 text-[7px]">ATS</text>
          </g>

          <defs>
            <filter id="shadow" x="20" y="14" width="260" height="360" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.08" />
            </filter>
          </defs>
        </svg>
      </motion.div>

      {/* Floating checkmark badge */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-xl px-3 py-1.5 shadow-lg shadow-emerald-500/30 text-xs font-bold"
      >
        ATS Passed
      </motion.div>

      {/* Floating score badge */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-16 -left-4 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-elevated border border-gray-100 dark:border-gray-700"
      >
        <div className="text-xs text-gray-500">Score</div>
        <div className="text-lg font-bold text-primary-600">92%</div>
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  usePageTitle('Home')

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 lg:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/15 dark:bg-primary-600/10 blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent-400/10 dark:bg-accent-600/8 blur-3xl animate-pulse-soft" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-200/10 dark:bg-primary-800/5 blur-3xl" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                AI-Powered Resume Builder
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                Build a Resume That{' '}
                <span className="text-gradient">Gets Past ATS</span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mb-8">
                Fill in your details, optimise against the target role, check your ATS compatibility score, and export a polished PDF — all in one place.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <Link to="/builder" className="btn-primary px-8 py-3.5 text-base">
                  Start Building
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/analyzer" className="btn-secondary px-8 py-3.5 text-base">
                  Upload & Analyze
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-200/60 dark:border-gray-700/40 flex-wrap">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary-50/40 dark:via-primary-950/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="section-heading mb-3">Everything you need to land interviews</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              From building to optimizing, our tools cover your entire resume workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group card p-6 hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-10 sm:p-14 text-center"
          >
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to beat the bots?
              </h2>
              <p className="text-primary-200 max-w-xl mx-auto mb-8 leading-relaxed">
                Create your ATS-optimised resume in minutes. No signup required to start.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  to="/builder"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary-700 font-semibold shadow-lg hover:shadow-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                >
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
