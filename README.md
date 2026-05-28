# Spec2Test - AI-Assisted QC Workflow Tool

Spec2Test is an internal tool for QC teams that uses AI in a human-in-the-loop model to transform specifications into test strategies, test cases, and bug reports in a controlled, traceable, and process-compliant manner.

## Features

- **4-Step Workflow**: Requirement Analysis → Test Strategy → Test Case Design → Bug Report
- **AI-Assisted**: AI generates drafts, humans approve
- **Step Locking**: Enforces sequential workflow
- **Full Traceability**: Audit trail for all actions
- **Prompt Management**: Version-controlled prompts

## Tech Stack

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- OpenAI GPT-4

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- TypeScript

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- OpenAI API Key

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
cd spec2test

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Add your OpenAI API key to backend/.env
# OPENAI_API_KEY=sk-...
```

### 2. Start with Docker Compose

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Initialize Database

```bash
# Run migrations and seed data
docker-compose exec backend python -m app.scripts.init_db
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Default Login
- Email: `admin@spec2test.com`
- Password: `admin123`

## Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

```
spec2test/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Core configs
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── scripts/     # Utility scripts
│   ├── tests/
│   └── requirements.txt
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js 14 app directory
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities
│   │   └── types/      # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## Workflow

1. **Create Project**: QC creates a new project with requirements
2. **Step 1 - Requirement Analysis**: AI analyzes and structures requirements
3. **Approve Step 1**: QC reviews, edits, and approves
4. **Step 2 - Test Strategy**: AI generates test strategy based on approved requirements
5. **Approve Step 2**: QC reviews and approves
6. **Step 3 - Test Case Design**: AI generates detailed test cases
7. **Approve Step 3**: QC reviews and approves
8. **Step 4 - Bug Report**: AI generates standardized bug report template

Each step must be approved before proceeding to the next step.

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://spec2test:spec2test123@db:5432/spec2test
SECRET_KEY=your-secret-key-change-in-production
OPENAI_API_KEY=sk-your-openai-api-key
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

Internal use only.
