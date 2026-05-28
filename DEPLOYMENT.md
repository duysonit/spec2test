# Deployment Guide (Netlify + Supabase + Backend)

This project has a separate frontend (`Next.js`) and backend (`FastAPI`), so production deploy should be split:

- Frontend -> Netlify
- Backend API -> Render/Railway/Fly.io (or any Python host)
- Database -> Supabase Postgres

## 1) Supabase setup

1. In Supabase, create a new project.
2. Open **Project Settings -> Database** and copy the connection string.
3. Use the **session pooler** host/port for production stability.
4. Convert URL to SQLAlchemy format for this backend:

`postgresql+psycopg2://...`

## 2) Deploy backend API

1. Deploy folder `backend` to your Python host.
2. Add environment variables (see `backend/.env.example`):
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `OPENAI_API_KEY`
   - `CORS_ORIGINS` (include your Netlify URL)
3. Start command:

`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. After deploy, run DB init once:

`python -m app.scripts.init_db`

5. Verify backend:
- `GET /health` returns `{"status":"healthy"}`
- `GET /docs` loads Swagger

## 3) Deploy frontend on Netlify

1. Connect GitHub repo in Netlify.
2. Use this repo root (already has `netlify.toml`):
   - base: `frontend`
   - build command: `npm run build`
3. In Netlify env vars, set:
   - `NEXT_PUBLIC_API_URL=https://<your-backend-domain>`
4. Trigger deploy.

## 4) Common production issues

- `Site not available / paused`: Netlify account/site usage limit reached. Upgrade or wait for quota reset.
- CORS error in browser: backend `CORS_ORIGINS` missing Netlify domain.
- Login/API failing from Netlify UI: `NEXT_PUBLIC_API_URL` still points to localhost.
