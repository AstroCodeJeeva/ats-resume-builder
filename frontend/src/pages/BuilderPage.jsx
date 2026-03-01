import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import StepIndicator from '../components/StepIndicator'
import PersonalInfoStep from '../components/PersonalInfoStep'
import SkillsStep from '../components/SkillsStep'
import ExperienceStep from '../components/ExperienceStep'
import ProjectsStep from '../components/ProjectsStep'
import EducationStep from '../components/EducationStep'
import CertificationsStep from '../components/CertificationsStep'
import TargetRoleStep from '../components/TargetRoleStep'
import LoadingSpinner from '../components/LoadingSpinner'

import { optimizeResume } from '../services/api'
import { SAMPLE_RESUME, EMPTY_RESUME } from '../utils/sampleData'
import usePageTitle from '../hooks/usePageTitle'

/**
 * Builder page — multi-step form → sends data to the AI backend → navigates to results.
 */
export default function BuilderPage() {
  usePageTitle('Resume Builder')
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resume, setResume] = useState(structuredClone(EMPTY_RESUME))

  // Track unsaved changes — warn before leaving
  const isDirty = useRef(false)
  const markDirty = useCallback(() => { isDirty.current = true }, [])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Convenience updaters
  const set = (key) => (value) => {
    markDirty()
    setResume((r) => ({ ...r, [key]: value }))
  }

  const fillSample = () => {
    setResume(structuredClone(SAMPLE_RESUME))
    toast.success('Sample data loaded!')
  }

  const next = () => setStep((s) => Math.min(s + 1, 6))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    if (!resume.personal_info.name || !resume.personal_info.email) {
      toast.error('Name and email are required.')
      return
    }
    setLoading(true)
    try {
      const result = await optimizeResume(resume)
      // Store result in sessionStorage so the Results page can read it
      sessionStorage.setItem('ats_result', JSON.stringify(result))
      isDirty.current = false // Clear dirty flag before navigating
      navigate('/results')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.detail || 'Something went wrong. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  // Render the current step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoStep
            data={resume.personal_info}
            onChange={set('personal_info')}
          />
        )
      case 1:
        return <SkillsStep data={resume.skills} onChange={set('skills')} />
      case 2:
        return <ExperienceStep data={resume.work_experience} onChange={set('work_experience')} />
      case 3:
        return <ProjectsStep data={resume.projects} onChange={set('projects')} />
      case 4:
        return <EducationStep data={resume.education} onChange={set('education')} />
      case 5:
        return <CertificationsStep data={resume.certifications} onChange={set('certifications')} />
      case 6:
        return (
          <TargetRoleStep
            targetRole={resume.target_role}
            jobDescription={resume.job_description}
            onChangeRole={(v) => setResume((r) => ({ ...r, target_role: v }))}
            onChangeJD={(v) => setResume((r) => ({ ...r, job_description: v }))}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {loading && <LoadingSpinner message="AI is optimising your resume..." />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Resume Builder</h1>
        <button
          onClick={fillSample}
          className="text-xs px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        >
          Load Sample Data
        </button>
      </div>

      {/* Progress */}
      <StepIndicator current={step} />

      {/* Step content with animation */}
      <div className="card p-6 mb-6 min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>

        {step < 6 ? (
          <button
            onClick={next}
            className="btn-primary px-6 py-2 text-sm"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary px-6 py-2 text-sm disabled:opacity-60"
          >
            Optimise with AI
          </button>
        )}
      </div>
    </div>
  )
}
