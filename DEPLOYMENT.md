# Deployment Guide

Production stack hiện tại: **Vercel (frontend) + Render (backend) + Supabase (database)**.

Xem bảng URL, env vars, và checklist: **[PRODUCTION_SERVICES.md](./PRODUCTION_SERVICES.md)**

## Quick links

- Frontend deploy: Vercel, root `frontend/`, env `NEXT_PUBLIC_API_URL`
- Backend deploy: Render, root `backend/`, env xem `backend/.env.example`
- DB init: chạy `python -m app.scripts.init_db` từ local (Render Free không có Shell)

## Render backend

- Set `PYTHON_VERSION=3.11.9` (Render không đọc `runtime.txt`)
- `DATABASE_URL`: Supabase pooler, `postgresql+psycopg2://...`, encode `@` trong password
- `CORS_ORIGINS`: domain Vercel + `http://localhost:3000`

## Vercel frontend

- Root Directory: `frontend`
- `NEXT_PUBLIC_API_URL=https://<render-backend-domain>` (no trailing slash)

## Local development

See [QUICKSTART.md](./QUICKSTART.md) and `docker-compose.yml`.
