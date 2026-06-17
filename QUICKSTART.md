# Spec2Test Quick Start Guide

This guide will help you get Spec2Test up and running in less than 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

## Setup Steps

### 1. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

### 2. Add Your OpenAI API Key

Edit `backend/.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Backend API (port 8000)
- Frontend app (port 3000)

### 4. Initialize Database

```bash
docker-compose exec backend python -m app.scripts.init_db
```

This will:
- Create all database tables
- Create default users
- Create prompt templates for all 4 workflow steps
- Create a sample project

### 5. Access the Application

Open your browser and go to: **http://localhost:3000**

**Login with:**
- Email: `son.vd@hsc.com.vn`
- Password: `admin123`

## What's Next?

### Try the Sample Project

1. Click on "Sample Login Feature" project
2. Click "Step 1: Requirement Analysis"
3. Click "✨ Generate AI Draft" to see AI generate the analysis
4. Review and edit if needed
5. Click "✓ Approve & Lock" to move to the next step
6. Repeat for all 4 steps

### Create Your Own Project

1. Go to Dashboard
2. Click "+ New Project"
3. Fill in:
   - Project name
   - Requirement text
   - Context (optional)
4. Click "Create Project"
5. Follow the 4-step workflow

### Manage Prompt Templates (Admin Only)

1. Go to **http://localhost:3000/admin**
2. View and edit prompt templates
3. Create new versions (old versions are kept for audit)

## Troubleshooting

### Backend won't start

Check if OpenAI API key is set correctly:
```bash
docker-compose exec backend env | grep OPENAI_API_KEY
```

### Database connection error

Restart the database:
```bash
docker-compose restart db
```

### Frontend shows "Connection refused"

Make sure backend is running:
```bash
docker-compose logs backend
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python -m app.scripts.init_db
```

## API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development Mode

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Default Users

| Email | Password | Role | Admin |
|-------|----------|------|-------|
| son.vd@hsc.com.vn | admin123 | Admin | Yes |
| qc@spec2test.com | qc123 | QC Engineer | No |

## Workflow Steps

1. **Requirement Analysis**: AI analyzes requirements and extracts structured information
2. **Test Strategy**: AI defines test scope, types, and approach
3. **Test Case Design**: AI generates detailed test cases (positive, negative, edge)
4. **Bug Report**: AI creates standardized bug report template

Each step must be approved before proceeding to the next step.

## Key Features

- **Step Locking**: Enforces sequential workflow
- **AI-Assisted**: AI generates drafts, humans approve
- **Audit Trail**: All AI calls are logged
- **Immutable Artifacts**: Approved content cannot be changed
- **Version Control**: Prompt templates are versioned

## Need Help?

- Check the logs: `docker-compose logs -f`
- Read the full README: [README.md](README.md)
- API docs: http://localhost:8000/docs

---

**Happy Testing!** 🚀
