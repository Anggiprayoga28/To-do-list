# Panduan Lengkap Deploy Proyek ke Vercel & Cloud

Proyek ini terdiri dari 3 bagian:
1. **Frontend (React + Vite)**: Dideploy ke **Vercel**
2. **Backend (Go REST API)**: Dideploy ke **Railway** atau **Render**
3. **Database (PostgreSQL)**: Dihosting gratis di **Neon.tech** atau **Supabase**

---

## Langkah 1: Buat Database PostgreSQL Gratis (1 Menit)
Pilih salah satu penyedia PostgreSQL cloud gratis:
* **[Neon.tech](https://neon.tech/)** (Sangat direkomendasikan, gratis & cepat):
  1. Daftar dan buat project baru.
  2. Salin **Connection String** (format: `postgres://user:password@host/dbname?sslmode=require`).

---

## Langkah 2: Deploy Backend Go (Railway atau Render)

### Opsi A: Railway (Paling Mudah)
1. Buka [railway.com](https://railway.com/) dan login dengan GitHub.
2. Klik **New Project** -> **Deploy from GitHub repo**.
3. Pilih repository ini.
4. Di bagian pengaturan (*Settings*):
   * **Root Directory**: Isi dengan `/backend`
5. Di bagian **Variables** (*Environment Variables*), tambahkan:
   * `DATABASE_URL` = (Connection string dari Neon / Supabase pada Langkah 1)
   * `PORT` = `8080`
   * `CORS_ORIGIN` = `*`
6. Di tab **Networking**, klik **Generate Domain** (contoh hasil: `https://backend-production-xxxx.up.railway.app`).
   * Simpan URL ini untuk Langkah 3.

---

## Langkah 3: Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com/) dan login dengan akun GitHub Anda.
2. Klik **Add New...** -> **Project**.
3. Pilih repository proyek ini, lalu klik **Import**.
4. Di halaman konfigurasi proyek:
   * **Root Directory**: Klik *Edit*, pilih folder `frontend`.
   * **Framework Preset**: Pilih `Vite` (biasanya otomatis terdeteksi).
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Di bagian **Environment Variables**:
   * Nama: `VITE_API_URL`
   * Nilai: URL backend Anda dari Langkah 2 (contoh: `https://backend-production-xxxx.up.railway.app`)
6. Klik **Deploy**!

Selesai! Website Todo List Anda sekarang online dan memiliki URL Vercel resmi (contoh: `https://todolist-xxx.vercel.app`).
