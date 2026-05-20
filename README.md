# Enerlyze — Smart Energy Analysis & AHP Decision Engine

Aplikasi web untuk **Lippo Mall Puri** yang menentukan **prioritas area** yang
paling perlu dioptimalkan penggunaan energinya, menggunakan metode
**Analytical Hierarchy Process (AHP)**.

Area dengan skor prioritas tinggi = area yang konsumsi energinya **belum optimal /
masih boros** dan perlu ditindaklanjuti.

---

## ✨ Overview

- **Frontend only** — React + Vite, berkomunikasi langsung dengan Firebase Firestore
  (tanpa backend terpisah).
- **AHP Decision Engine** — menghitung bobot kriteria, Consistency Ratio (CR),
  dan skor prioritas tiap area.
- **2 role** — `admin` & `staff`, dengan menu dan hak akses berbeda.
- **Tema** — minimalist monochrome (hitam/putih/abu), font Inter.

---

## 🧱 Tech Stack

| Layer        | Teknologi                                   |
| ------------ | ------------------------------------------- |
| Framework    | React 19 + Vite                             |
| Styling      | Tailwind CSS v4                             |
| Routing      | React Router v7                             |
| State        | Zustand (+ persist)                         |
| Database     | Firebase Firestore (client SDK)             |
| Charts       | Recharts                                    |
| Encryption   | crypto-js (AES-256 + PBKDF2)                |
| Session      | js-cookie                                   |
| PDF Export   | jsPDF + html2canvas                         |
| Icons        | lucide-react                                |

---

## 🔐 Konfigurasi Environment

Aplikasi **hanya** memakai **satu** environment variable: `SECRET`.

`SECRET` berisi **JSON config Firebase yang dienkripsi (AES-256)**. Saat runtime,
aplikasi men-decrypt `SECRET` untuk menginisialisasi Firebase.

Generate nilainya dengan:

```bash
npm run encrypt-env -- firebase-config.json
```

Detail lengkap ada di **[SETUP.md](./SETUP.md)**.

---

## 👥 Fitur per Role

### Admin

| Menu                | Kemampuan                                                                 |
| ------------------- | ------------------------------------------------------------------------- |
| Dashboard           | KPI cards + grafik skor AHP per area antar bulan (filter 3–20 bulan).     |
| Data                | Lihat data semua area per bulan, **Run / Re-run AHP**, **View Detail**.    |
| Master ▸ AHP        | Lihat 4 kriteria (fixed), **edit rank** kriteria (1–4, unik).             |
| Master ▸ Area       | CRUD area + assign user penanggung jawab. Delete dicek pemakaian data.     |
| Master ▸ User       | CRUD user, **reset password** (→ `Test1234@`). Delete dicek kepemilikan area. |
| View Detail         | Laporan AHP lengkap (pairwise matrix, ranking, rekomendasi) + **Unduh PDF**. |

### Staff

| Menu       | Kemampuan                                                                        |
| ---------- | -------------------------------------------------------------------------------- |
| Dashboard  | Sama seperti admin (read-only KPI + grafik).                                     |
| Data       | Input/Edit/Hapus data energi **hanya untuk area yang di-assign** ke staff tsb.   |

### Semua Role

- **Change Password** lewat dropdown avatar (kanan atas).
- **Notifikasi** otomatis di-generate saat login, dihapus saat logout.

---

## 🧮 Algoritma AHP

Tahapan yang diimplementasikan (`src/lib/ahp.js`):

1. **Pairwise matrix kriteria** — dibangun dari `rank` tiap kriteria.
   Selisih rank dikonversi ke skala Saaty: `diff 0 → 1`, `1 → 3`, `2 → 5`, `3 → 7`.
2. **Bobot kriteria** — eigenvector via normalisasi kolom + rata-rata baris.
3. **Consistency Ratio** — `λmax → CI = (λmax−n)/(n−1) → CR = CI/RI`.
   Untuk `n = 4`, `RI = 0.90`. **CR < 0.1 = valid & konsisten.**
4. **Local priority alternatif (area)** — per kriteria, dari data input bulanan:
   - Konsumsi Energi, Biaya Listrik, Durasi Operasional → **nilai lebih tinggi =
     lebih boros = prioritas lebih tinggi**.
   - Frekuensi Maintenance → **dibalik**: frekuensi lebih rendah = area kurang
     terawat = prioritas optimasi lebih tinggi.
5. **Skor akhir area** = Σ (bobot kriteria × local priority area pada kriteria itu).
6. Hasil disimpan ke `ahp_results_enerlyze`.

Kriteria (tetap, hanya rank yang bisa diubah):

| Kode | Kriteria                  | Rank default |
| ---- | ------------------------- | ------------ |
| KE   | Konsumsi Energi (kWh)     | 1            |
| BL   | Biaya Listrik (Rp)        | 2            |
| DO   | Durasi Operasional (jam)  | 3            |
| FM   | Frekuensi Maintenance     | 4            |

---

## 🗂️ Struktur Firestore

Semua koleksi berakhiran **`_enerlyze`**.

### `users_enerlyze`
| Field        | Tipe      | Keterangan                          |
| ------------ | --------- | ----------------------------------- |
| name         | string    | Nama lengkap                        |
| email        | string    | Identifier login (unik)             |
| password     | string    | `salt:hash` (PBKDF2)                |
| role         | string    | `admin` \| `staff`                  |
| created_at   | timestamp |                                     |
| updated_at   | timestamp |                                     |

### `areas_enerlyze`
| Field        | Tipe      | Keterangan                          |
| ------------ | --------- | ----------------------------------- |
| name         | string    | Nama area                           |
| description  | string    | Detail (mis. "Lobby, Food Court")   |
| user_id      | string    | Ref ke `users_enerlyze` (PIC)       |
| created_at / updated_at | timestamp |                          |

### `criteria_enerlyze` (doc id = `key`)
| Field | Tipe   | Keterangan                    |
| ----- | ------ | ----------------------------- |
| key   | string | `energy`/`cost`/`duration`/`maintenance` |
| code  | string | `KE`/`BL`/`DO`/`FM`           |
| name  | string | Nama kriteria                 |
| rank  | number | 1–4, unik                     |

### `data_enerlyze`
| Field          | Tipe      | Keterangan                       |
| -------------- | --------- | -------------------------------- |
| area_id        | string    | Ref ke `areas_enerlyze`          |
| month          | string    | `YYYY-MM`                        |
| energy         | number    | Konsumsi energi (kWh)            |
| energy_area_m2 | number    | Luasan area (m²) — keterangan    |
| cost           | number    | Biaya listrik (Rp)               |
| duration       | number    | Durasi operasional (jam)         |
| maintenance    | number    | Frekuensi maintenance (x/bulan)  |
| created_by     | string    | Ref user                         |
| created_at / updated_at | timestamp |                         |

### `ahp_results_enerlyze` (doc id = `month`)
| Field            | Tipe      | Keterangan                              |
| ---------------- | --------- | --------------------------------------- |
| month            | string    | `YYYY-MM`                               |
| ahp_id           | string    | `AHP-YYYY-MM`                           |
| criteria         | array     | `{key, code, name, rank, weight}`       |
| criteria_matrix  | array[][] | Pairwise matrix kriteria                |
| criteria_weights | array     | Bobot kriteria                          |
| consistency      | map       | `{lambdaMax, ci, cr, isConsistent}`     |
| ranking          | array     | `{area_id, area_name, score, breakdown, rank}` |
| created_by       | string    | Penyusun                                |
| created_at       | timestamp |                                         |

### `notifications_enerlyze`
| Field      | Tipe      | Keterangan                         |
| ---------- | --------- | ---------------------------------- |
| user_id    | string    | Pemilik notifikasi                 |
| message    | string    | Isi notifikasi                     |
| type       | string    | `missing-data` \| `ahp-pending`    |
| link       | string    | Tujuan navigasi saat diklik        |
| created_at | timestamp |                                    |

---

## 🔔 Notifikasi

- Di-generate **setiap login**, dihapus **setiap logout**.
- Hanya melacak **3 bulan terakhir** dan hanya konteks data AHP.
- **Staff** → notif bila ada bulan yang belum diinput pada area yang di-assign.
- **Admin** → notif bila semua area sudah mengisi data tapi AHP belum dijalankan.
- Klik 1 notif → notif terhapus + navigasi ke halaman terkait.
- "Tandai sudah dibaca semua" → hapus semua notifikasi user.

---

## 🚀 Menjalankan

```bash
npm install
npm run dev      # development
npm run build    # production build
npm run preview  # preview hasil build
```

Sebelum run, pastikan `.env` sudah berisi `SECRET`. Lihat **[SETUP.md](./SETUP.md)**.

---

## 🖼️ Screenshots

> _(placeholder)_

- `docs/login.png` — Halaman Login
- `docs/dashboard.png` — Dashboard
- `docs/data-admin.png` — Data + Run AHP
- `docs/detail-report.png` — Laporan AHP / View Detail
- `docs/master-area.png` — Master Area

---

## 📁 Struktur Proyek

```
src/
├── components/      # UI, layout, auth, data, dashboard components
├── config/          # Inisialisasi Firebase dari SECRET
├── constants/       # Nama koleksi & definisi kriteria
├── lib/             # crypto, ahp, recommendations, format
├── layouts/         # MainLayout (staff) & AdminLayout
├── pages/           # Halaman per route
├── router/          # Definisi route
├── services/        # Akses Firestore (auth, user, area, data, ahp, notif)
└── stores/          # Zustand stores (auth, toast)
scripts/
├── encrypt-env.mjs  # CLI enkripsi config → SECRET
└── seed.mjs         # Seed kriteria + admin awal
```
