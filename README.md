# To-Do List (React + Tailwind v4 + Go + PostgreSQL)

## 1. Database
Postgres lokal sudah berjalan di port 5432. Buat database:
```
createdb -U <user> todo
```
(atau `docker compose up -d` jika port 5432 kosong)

## 2. Backend (Go)
```
cd backend
DATABASE_URL="postgres://USER:PASSWORD@localhost:5432/todo?sslmode=disable" go run .
```
Tabel `todos` dibuat otomatis. API: `GET/POST /api/todos`, `PUT/DELETE /api/todos/{id}`.

## 3. Frontend
```
cd frontend
npm run dev
```
Buka http://localhost:5173 (request `/api` di-proxy ke :8080).
