# Spec2Test — AI-Assisted QC Workflow Tool

Spec2Test is an internal tool for HSC QC teams that uses AI in a human-in-the-loop model to turn specifications into test strategies, test cases, and bug reports in a controlled, traceable, and process-compliant way. The UI follows the **HSC Design System** (dark-first, brand blue `#2681FF`, 8px grid).

## Features

- **Two project types**
  - **Standard QC** — 4-step workflow: Requirement Analysis → Test Strategy → Test Case Design → Bug Report
  - **API Testing** — generate test cases per API endpoint
- **AI-assisted, human-approved** — AI generates drafts, QC reviews and approves
- **Step locking** — enforces sequential workflow; approved steps are immutable
- **Visual mind map** — requirement steps rendered as an interactive bubble infographic (zoom/pan)
- **Requirement import** — paste text or import from PDF / DOCX / TXT / images (in-browser OCR)
- **Full traceability** — audit trail for all AI calls
- **Prompt management** — version-controlled prompt templates (admin)

## Production

| Layer | Service | URL |
|-------|---------|-----|
| Frontend | Vercel | https://spec2test.vercel.app |
| Backend | Render | https://spec2test-pu49.onrender.com |
| Database | Supabase (PostgreSQL) | Session pooler `ap-northeast-1` |

Env, deploy, and troubleshooting details: **[PRODUCTION_SERVICES.md](./PRODUCTION_SERVICES.md)** · **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## Tech Stack

### Backend
- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy
- JWT authentication (python-jose, passlib/argon2)
- OpenAI (`gpt-4o-mini` by default)
- Document parsing: pypdf, python-docx

### Frontend
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (HSC Design System tokens)
- Motion + Magic UI components (MagicCard, NumberTicker, BlurFade, ShimmerButton)
- Phosphor icons
- Client-side file extraction: pdfjs-dist, tesseract.js (OCR), jszip

### Design System
The UI implements the **HSC Design System** (see `HSC-Design-System 1.md`): dark-first theme, brand blue `#2681FF`, cool neutral chrome, semantic price/status colors, 4px/8px radii, tabular numerals, no in-product gradients.

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (or Docker)
- OpenAI API Key

## Quick Start (Docker)

```bash
cd spec2test

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Add your OpenAI API key to backend/.env
# OPENAI_API_KEY=sk-...

# Start all services (database, backend, frontend)
docker-compose up -d

# Initialize database (tables + seed users & prompts)
docker-compose exec backend python -m app.scripts.init_db
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Default Login
- Email: `son.vd@hsc.com.vn`
- Password: `admin123`

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize the database (run once)
python -m app.scripts.init_db

# Run the dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

> Note: do not run `npm run build` while `npm run dev` is using the same `.next` folder — stop the dev server first to avoid a corrupted build cache.

## Project Structure

```
spec2test/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/                  # API routes (auth, projects, apis, bugs, ...)
│   │   ├── core/                 # Config, security, prompts
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # AI + workflow business logic
│   │   └── scripts/              # init_db and utilities
│   └── requirements.txt
├── frontend/                     # Next.js frontend
│   ├── public/                   # logo-hsc.png and static assets
│   └── src/
│       ├── app/                  # App Router pages
│       │   ├── page.tsx          # Login
│       │   ├── dashboard/        # Vercel-style projects dashboard
│       │   ├── projects/new/     # Create-project page
│       │   ├── projects/[id]/    # Project workflow + API testing view
│       │   └── admin/            # Prompt template management
│       ├── components/
│       │   ├── ui.tsx            # AppShell (sidebar), Modal, EmptyState, ...
│       │   ├── magicui/          # Magic UI components
│       │   └── RequirementMindMap.tsx
│       ├── lib/                  # api client, auth, file extraction, utils
│       └── types/
├── HSC-Design-System 1.md        # Company design system reference
├── SKILL.md                      # taste-skill design rules
└── docker-compose.yml
```

## Standard QC Workflow

1. **Create project** with a requirement spec (typed or imported from a file)
2. **Requirement Analysis** — AI structures the requirement; view it as a visual mind map
3. **Test Strategy** — AI defines scope, types, and approach
4. **Test Case Design** — AI generates positive / negative / edge cases
5. **Bug Report** — log bugs; AI formats them to a standard template

Each step must be approved before the next unlocks. Approved content is locked (immutable).

## API Testing Workflow

1. Create an **API Testing** project
2. Add API endpoints (name, URL, method, auth, specification)
3. Generate test cases per endpoint; review, edit, and regenerate as needed

## API Documentation

With the backend running, visit http://localhost:8000/docs for interactive Swagger docs (or `/redoc`).

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql://spec2test:spec2test123@localhost:5432/spec2test
SECRET_KEY=change-me-to-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=http://localhost:3000
```

For Docker Compose, set `DATABASE_URL` host to `db` instead of `localhost`.

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

Internal use only.
