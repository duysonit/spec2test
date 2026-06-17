# Spec2Test — Production Services

Tài liệu tóm tắt hạ tầng production sau khi setup xong (GitHub + Supabase + Render + Vercel).

## Tóm tắt kiến trúc

```
[Browser]
    ↓
[Vercel]  Next.js frontend  →  spec2test.vercel.app
    ↓  HTTPS API (NEXT_PUBLIC_API_URL)
[Render]  FastAPI backend   →  spec2test-pu49.onrender.com
    ↓  DATABASE_URL (SSL)
[Supabase] PostgreSQL       →  Session pooler (ap-northeast-1)
```

| Thành phần | Nhà cung cấp | Gói | URL / Endpoint |
|------------|--------------|-----|----------------|
| **Source code** | GitHub | Public repo | https://github.com/duysonit/spec2test |
| **Frontend** | Vercel | Free (Hobby) | https://spec2test.vercel.app |
| **Backend API** | Render | Free | https://spec2test-pu49.onrender.com |
| **Database** | Supabase | Free (Nano) | Pooler: `aws-1-ap-northeast-1.pooler.supabase.com:5432` |

---

## 1. Frontend — Vercel

| Mục | Giá trị |
|-----|---------|
| Framework | Next.js 14, React 18, TypeScript, Tailwind |
| Thư mục deploy | `frontend/` |
| Production URL | https://spec2test.vercel.app |
| Auto deploy | `git push` → branch `main` → Vercel build tự động |

### Environment variables (Vercel)

| Biến | Giá trị production |
|------|-------------------|
| `NEXT_PUBLIC_API_URL` | `https://spec2test-pu49.onrender.com` |

- Không có dấu `/` ở cuối URL.
- Sau khi đổi env trên Vercel → **Redeploy** frontend.

### Kiểm tra

- Mở https://spec2test.vercel.app → trang login.
- DevTools → Network: request API trỏ tới Render, không còn `localhost:8000`.

---

## 2. Backend — Render

| Mục | Giá trị |
|-----|---------|
| Runtime | Python **3.11.9** (bắt buộc set `PYTHON_VERSION=3.11.9`) |
| Framework | FastAPI + Uvicorn |
| Thư mục deploy | `backend/` |
| Production URL | https://spec2test-pu49.onrender.com |
| Health check | https://spec2test-pu49.onrender.com/health |
| API docs | https://spec2test-pu49.onrender.com/docs |
| Auto deploy | `git push` → Render build tự động (nếu bật Auto-Deploy) |

### Render Web Service settings

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

### Environment variables (Render)

| Biến | Mô tả |
|------|--------|
| `PYTHON_VERSION` | `3.11.9` |
| `DATABASE_URL` | Supabase pooler, format `postgresql+psycopg2://...` (password có `@` → encode `%40`) |
| `SECRET_KEY` | Chuỗi random (JWT) |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` (tùy chọn) |
| `DEBUG` | `False` |
| `CORS_ORIGINS` | `https://spec2test.vercel.app,http://localhost:3000` |

- `DATABASE_URL` trên Render phải **trùng** chuỗi đã dùng khi chạy `init_db` thành công.
- Sau khi đổi env → **Manual Deploy** backend.

### Giới hạn gói Free

- Service có thể **sleep** sau ~15 phút không dùng; lần đầu gọi API có thể chờ 30–60 giây.
- **Không có Shell** trên Free → init DB chạy từ máy local (xem bên dưới).

### Kiểm tra login API

```bash
curl -X POST "https://spec2test-pu49.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"son.vd@hsc.com.vn","password":"admin123"}'
```

Kết quả mong đợi: HTTP **200** + `access_token`.

---

## 3. Database — Supabase

| Mục | Giá trị |
|-----|---------|
| Engine | PostgreSQL 15 |
| Project ref | `nnihuaybfjgmuuwqppke` |
| Connection | **Session pooler** (không dùng Direct IPv6 trên Render) |
| Host | `aws-1-ap-northeast-1.pooler.supabase.com` |
| Port | `5432` |
| Database | `postgres` |
| User (pooler) | `postgres.nnihuaybfjgmuuwqppke` |

### `DATABASE_URL` format (SQLAlchemy)

```text
postgresql+psycopg2://postgres.nnihuaybfjgmuuwqppke:<PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

- Password có ký tự `@` → thay bằng `%40` trong URL.
- Backend tự bật `sslmode=require` khi host chứa `supabase` (xem `backend/app/database.py`).

### Khởi tạo database (một lần)

Chạy từ máy local (Render Free không có Shell):

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL='postgresql+psycopg2://...'   # URL pooler Supabase
export SECRET_KEY='local-init-only'
export OPENAI_API_KEY='sk-...'
python -m app.scripts.init_db
```

Tạo: bảng, user mặc định, prompt templates, project mẫu.

### Tài khoản mặc định (sau init_db)

| Email | Password | Role |
|-------|----------|------|
| son.vd@hsc.com.vn | admin123 | Admin |
| qc@spec2test.com | qc123 | QC Engineer |

> Nên đổi mật khẩu admin sau khi go-live. Trang login production **không** hiển thị demo credentials.

---

## 4. GitHub

| Mục | Giá trị |
|-----|---------|
| Repository | https://github.com/duysonit/spec2test |
| Branch chính | `main` |
| Cấu trúc | `frontend/`, `backend/`, `docker-compose.yml` (local dev) |

Vercel và Render đều deploy từ repo này.

---

## 5. Khi nào cần deploy lại?

| Thay đổi | Vercel | Render |
|----------|--------|--------|
| Sửa code `frontend/` + `git push` | Tự deploy | Không |
| Sửa code `backend/` + `git push` | Không | Tự deploy |
| Đổi env trên dashboard | Redeploy | Redeploy |
| Chỉ `init_db` từ Mac | Không | Không |

---

## 6. Local development (tham khảo)

```bash
docker-compose up -d
docker-compose exec backend python -m app.scripts.init_db
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

Chi tiết: [QUICKSTART.md](./QUICKSTART.md)

---

## 7. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| Login failed (500) | `DATABASE_URL` sai trên Render | Copy đúng URL pooler + password encode, redeploy |
| CORS error | Thiếu domain Vercel trong `CORS_ORIGINS` | Thêm `https://spec2test.vercel.app`, redeploy Render |
| API gọi `localhost` | `NEXT_PUBLIC_API_URL` chưa set | Set trên Vercel, redeploy frontend |
| Render build fail `pydantic-core` | Python 3.14 | Set `PYTHON_VERSION=3.11.9` |
| API chậm lần đầu | Render Free sleep | Đợi ~1 phút, thử lại |

Hướng dẫn deploy chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 8. Dịch vụ không dùng production

| Dịch vụ | Ghi chú |
|---------|---------|
| **Netlify** | Đã thử; site có thể bị pause do quota. Production dùng **Vercel**. |
| **PostgreSQL local** (Docker) | Chỉ dùng khi dev local, không phải DB production. |

---

*Cập nhật: production stack Vercel + Render + Supabase.*
