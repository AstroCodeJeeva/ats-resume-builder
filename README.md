# ATS Resume Builder — AI-Powered

A full-stack, AI-powered ATS Resume Builder with intelligent optimisation, resume upload & analysis, job prediction, admin dashboard, and PDF export.

---

## Tech Stack

| Layer     | Technology                                                 |
| --------- | ---------------------------------------------------------- |
| Backend   | Python 3.11, FastAPI, Uvicorn                              |
| Frontend  | React 18 (Vite), Tailwind CSS 3.4, Framer Motion          |
| Database  | MongoDB 8.x (PyMongo + Motor)                              |
| AI        | Groq API — Llama 3.3 70B Versatile                         |
| Auth      | JWT (PyJWT) + bcrypt                                       |
| PDF       | xhtml2pdf + Jinja2 HTML templates                          |
| File Parse| pdfplumber (PDF) + python-docx (DOCX)                      |

---

## Features

- **AI Resume Optimisation** — Rewrites bullet points, adds achievements, tailors to target role
- **ATS Scoring Engine** — Keyword match, skills alignment, formatting compliance scores
- **Resume Upload & Analysis** — Upload PDF/DOCX for instant AI-powered analysis
- **AI Job Predictions** — Predicts best-matching job roles with salary ranges
- **4 ATS-Safe Templates** — Classic, Modern, Fresher, Technical
- **PDF Export** — Download polished, ATS-compatible PDF
- **Before vs After** — Side-by-side comparison of original and optimised resume
- **User Dashboard** — Analytics chart, stats cards, search/filter/sort resumes
- **Admin Panel** — Platform stats, user management, resume & upload oversight
- **User Profile** — Edit name/email, change password, view personal stats
- **Resume Analyzer** — Drag-and-drop upload with quick score or full AI analysis
- **Dark Mode** — Persisted to localStorage
- **Mobile Responsive** — Hamburger menu, responsive layouts
- **Error Boundary** — Friendly crash recovery
- **Lazy Loading** — Code-split routes for fast initial load
- **JWT Auto-Logout** — Expired sessions handled gracefully
- **Unsaved Changes Warning** — Prevents accidental data loss in the builder

---

## Folder Structure

```
ats-resume-builder/
├── backend/
│   ├── main.py                    # FastAPI entry point + admin seed
│   ├── database.py                # MongoDB connection + indexes
│   ├── db_models.py               # Document helpers (user_doc, user_response)
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables
│   ├── routers/
│   │   ├── resume_router.py       # /api/resume/* (optimize, score)
│   │   ├── pdf_router.py          # /api/pdf/* (generate, preview, ats-check)
│   │   ├── saved_router.py        # /api/saved/* (CRUD for saved resumes)
│   │   ├── auth_router.py         # /api/auth/* (register, login, profile)
│   │   ├── admin_router.py        # /api/admin/* (stats, users, management)
│   │   └── upload_router.py       # /api/upload/* (analyze, quick-score, history)
│   ├── services/
│   │   ├── ai_service.py          # Groq API integration
│   │   ├── auth_service.py        # JWT + bcrypt helpers
│   │   ├── resume_analyzer.py     # AI resume analysis + job prediction
│   │   └── resume_parser.py       # PDF/DOCX text extraction
│   └── templates/                 # Jinja2 HTML templates for PDF generation
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component (lazy routes, error boundary)
│   │   ├── main.jsx               # Entry point
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Auth state management
│   │   ├── hooks/
│   │   │   └── usePageTitle.js    # Dynamic document.title hook
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive nav with hamburger menu
│   │   │   ├── Footer.jsx         # Site-wide footer
│   │   │   ├── AuthModal.jsx      # Login/Register modal
│   │   │   ├── ErrorBoundary.jsx  # React error boundary
│   │   │   ├── ScrollToTop.jsx    # Auto scroll on route change
│   │   │   ├── LoadingSpinner.jsx # Loading overlay
│   │   │   └── ...                # Step components, cards, panels
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Hero + features
│   │   │   ├── BuilderPage.jsx    # Multi-step resume builder
│   │   │   ├── ResultsPage.jsx    # ATS score, preview, PDF download
│   │   │   ├── DashboardPage.jsx  # Resume management + analytics
│   │   │   ├── AnalyzerPage.jsx   # Resume upload & analysis
│   │   │   ├── AdminPage.jsx      # Admin dashboard
│   │   │   ├── ProfilePage.jsx    # User profile settings
│   │   │   └── NotFoundPage.jsx   # 404 page
│   │   ├── services/
│   │   │   └── api.js             # Axios API layer + JWT interceptor
│   │   └── utils/
│   │       └── sampleData.js      # Sample resume data
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **MongoDB** 8.x (running locally on port 27017)
- **Groq API Key** — get one free at [console.groq.com](https://console.groq.com)

---

## Setup & Run

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ats-resume-builder
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\activate
# Activate (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env and set your GROQ_API_KEY
```

**.env file:**

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ats_resume_builder
JWT_SECRET=ats-builder-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

```bash
# Start backend server
uvicorn main:app --reload --port 8000
```

Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)

### 4. Default admin account

On first startup, the backend automatically seeds an admin user:

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | admin@atsbuilder.com   |
| Password | Admin@123              |

---

## API Endpoints

### Auth
| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| POST   | `/api/auth/register`        | Register new user          |
| POST   | `/api/auth/login`           | Login, returns JWT         |
| GET    | `/api/auth/me`              | Get current user profile   |
| PUT    | `/api/auth/profile`         | Update name/email          |
| PUT    | `/api/auth/change-password` | Change password            |

### Resume Builder
| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| POST   | `/api/resume/optimize`| AI optimise resume             |
| POST   | `/api/resume/score`   | ATS score without rewrite      |

### PDF
| Method | Endpoint             | Description                     |
| ------ | -------------------- | ------------------------------- |
| POST   | `/api/pdf/generate`  | Generate PDF download           |
| POST   | `/api/pdf/preview`   | HTML preview                    |
| POST   | `/api/pdf/ats-check` | ATS compliance check            |

### Saved Resumes
| Method | Endpoint           | Description                      |
| ------ | ------------------ | -------------------------------- |
| POST   | `/api/saved/save`  | Save resume                      |
| GET    | `/api/saved/list`  | List user's resumes              |
| GET    | `/api/saved/:id`   | Get single resume                |
| PUT    | `/api/saved/:id`   | Update resume                    |
| DELETE | `/api/saved/:id`   | Delete resume                    |

### Upload & Analysis
| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| POST   | `/api/upload/analyze`   | AI analysis + job prediction   |
| POST   | `/api/upload/quick-score`| Quick heuristic score         |
| GET    | `/api/upload/history`   | Upload history                 |
| DELETE | `/api/upload/:id`       | Delete upload                  |

### Admin (requires admin role)
| Method | Endpoint             | Description                     |
| ------ | -------------------- | ------------------------------- |
| GET    | `/api/admin/stats`   | Platform statistics             |
| GET    | `/api/admin/users`   | All users                       |
| PUT    | `/api/admin/users/:id`| Update user                    |
| DELETE | `/api/admin/users/:id`| Delete user                    |
| GET    | `/api/admin/resumes` | All resumes                     |
| GET    | `/api/admin/uploads` | All uploads                     |

---

## Production Build

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## License

MIT
