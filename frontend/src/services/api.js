/**
 * API service layer — all HTTP calls to the FastAPI backend.
 */
import axios from 'axios'
import toast from 'react-hot-toast'

// In dev, Vite proxy forwards /api → localhost:8000.
// In production, VITE_API_URL points to the deployed backend (e.g. Render).
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT token to every request if available ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ats_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auto-logout on 401 (expired / invalid token) ───────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('ats_token')
      if (token) {
        // Token exists but server rejected it → expired
        localStorage.removeItem('ats_token')
        localStorage.removeItem('ats_user')
        toast.error('Session expired. Redirecting to sign in...', { duration: 2000, icon: '⏳' })
        setTimeout(() => window.location.replace('/'), 1500)
      }
    }
    if (error.response?.status === 429) {
      toast.error('Too many requests — please slow down.', { icon: '🚦' })
    }
    return Promise.reject(error)
  }
)

// ── Auth ────────────────────────────────────────────────────────────

export async function registerUser(username, email, password) {
  const { data } = await api.post('/auth/register', { username, email, password })
  return data
}

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function getProfile() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function updateProfile(username, email) {
  const { data } = await api.put('/auth/profile', { username, email })
  return data
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return data
}

export async function setSecurityQuestion(question, answer) {
  const { data } = await api.put('/auth/security-question', { question, answer })
  return data
}

export async function getSecurityQuestion(email) {
  const { data } = await api.post('/auth/forgot-password/question', { email })
  return data
}

export async function resetPasswordWithAnswer(email, answer, newPassword) {
  const { data } = await api.post('/auth/forgot-password', {
    email,
    answer,
    new_password: newPassword,
  })
  return data
}

// ── Saved Resumes ───────────────────────────────────────────────────

export async function saveResume(payload) {
  const { data } = await api.post('/saved/save', payload)
  return data
}

export async function listResumes() {
  const { data } = await api.get('/saved/list')
  return data
}

export async function getResume(id) {
  const { data } = await api.get(`/saved/${id}`)
  return data
}

export async function updateResume(id, payload) {
  const { data } = await api.put(`/saved/${id}`, payload)
  return data
}

export async function deleteResume(id) {
  const { data } = await api.delete(`/saved/${id}`)
  return data
}

export async function shareResume(id) {
  const { data } = await api.post(`/saved/${id}/share`)
  return data
}

export async function unshareResume(id) {
  const { data } = await api.delete(`/saved/${id}/share`)
  return data
}

export async function getSharedResume(token) {
  const { data } = await api.get(`/saved/public/${token}`)
  return data
}

/**
 * POST /api/resume/optimize
 * Sends resume data for AI optimisation + ATS scoring.
 */
export async function optimizeResume(resumeData) {
  const { data } = await api.post('/resume/optimize', resumeData)
  return data
}

/**
 * POST /api/resume/score
 * Returns ATS score without AI rewrite.
 */
export async function scoreResume(resumeData) {
  const { data } = await api.post('/resume/score', resumeData)
  return data
}

/**
 * POST /api/pdf/generate
 * Returns PDF blob for download.
 */
export async function generatePDF(pdfPayload) {
  const { data } = await api.post('/pdf/generate', pdfPayload, {
    responseType: 'blob',
  })
  return data
}

/**
 * POST /api/pdf/generate-docx
 * Returns DOCX blob for download.
 */
export async function generateDOCX(pdfPayload) {
  const { data } = await api.post('/pdf/generate-docx', pdfPayload, {
    responseType: 'blob',
  })
  return data
}

/**
 * POST /api/pdf/preview
 * Returns HTML string for live preview.
 */
export async function previewHTML(pdfPayload) {
  const { data } = await api.post('/pdf/preview', pdfPayload)
  return data
}

/**
 * POST /api/pdf/ats-check
 * Returns ATS compliance report for the generated PDF/HTML.
 */
export async function checkPDFATS(pdfPayload) {
  const { data } = await api.post('/pdf/ats-check', pdfPayload)
  return data
}

// ── Resume Upload & Analysis ────────────────────────────────────────

/**
 * POST /api/upload/analyze
 * Upload a PDF/DOCX resume for AI analysis + job prediction.
 */
export async function uploadAndAnalyze(file, jobDescription = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (jobDescription) formData.append('job_description', jobDescription)
  const { data } = await api.post('/upload/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data
}

/**
 * POST /api/upload/quick-score
 * Quick heuristic score without AI.
 */
export async function quickScoreResume(file, jobDescription = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (jobDescription) formData.append('job_description', jobDescription)
  const { data } = await api.post('/upload/quick-score', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * GET /api/upload/history
 * User's resume upload history.
 */
export async function getUploadHistory() {
  const { data } = await api.get('/upload/history')
  return data
}

/**
 * DELETE /api/upload/:id
 */
export async function deleteUpload(id) {
  const { data } = await api.delete(`/upload/${id}`)
  return data
}

// ── Cover Letter ────────────────────────────────────────────────────

export async function generateCoverLetter(payload) {
  const { data } = await api.post('/cover-letter/generate', payload)
  return data
}

// ── Interview Prep ──────────────────────────────────────────────────

export async function generateInterviewQuestions(payload) {
  const { data } = await api.post('/interview/generate', payload)
  return data
}

// ── Admin ───────────────────────────────────────────────────────────

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats')
  return data
}

export async function getAdminUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

export async function updateAdminUser(userId, updates) {
  const { data } = await api.put(`/admin/users/${userId}`, updates)
  return data
}

export async function deleteAdminUser(userId) {
  const { data } = await api.delete(`/admin/users/${userId}`)
  return data
}

export async function getAdminResumes() {
  const { data } = await api.get('/admin/resumes')
  return data
}

export async function getAdminUploads() {
  const { data } = await api.get('/admin/uploads')
  return data
}

export default api
