# PRD.md — Product Requirements Document
## Broadcast Spensa Apps — Production Management & Extracurricular Operating System
### Silicon Valley Engineering Standard · Version 3.0.0 (Enterprise Release)

---

> **Document Status:** Active · Engineering Baseline  
> **Target Release:** Q4 2026  
> **Author:** Senior Staff Full-Stack Software Engineer & Solutions Architect  
> **Stakeholders:** Pembina Broadcast, Ketua Broadcast, Pengurus Divisi, SMP Negeri 1 (Spensa)  
> **Stack Architecture:** Next.js 14+ (App Router, Server Actions, Route Handlers) · Supabase (Postgres 16, Supabase Auth, Supabase Storage, Realtime, Row Level Security) · Vercel Edge/Serverless Deployment · Progressive Web App (PWA)

---

## 1. Executive Summary & Product Vision

### 1.1 Problem Statement
SMP Negeri 1 (Spensa) memiliki ekstrakurikuler **Broadcast** yang mengoperasikan studio media berstandar semi-profesional (podcast, liputan berita sekolah, live streaming acara, fotografi kejuaraan, serta produksi video kreatif). Manajemen operasional sebelumnya menghadapi friksi signifikan:
1. **Bottleneck Alur Produksi:** Penulisan naskah (script/podcast) sering diproduksi tanpa kurasi formal, memicu revisi telat atau konten yang tidak sesuai panduan sekolah.
2. **Desentralisasi File & Hasil Karya:** Link thumbnail, video, dan master audio tersebar di chat personal tanpa kontrol persetujuan bertingkat (dual-gate approval).
3. **Akuntabilitas Finansial & Kas:** Iuran periodik dan kas pembina bercampur, tanpa histori tunggakan yang transparan per anggota.
4. **Hilangnya Jejak Prestasi & Aset:** Riwayat kejuaraan dan inventaris bernilai tinggi (kamera, mic condenser, switcher) rentan rusak atau hilang tanpa log peminjaman per divisi.
5. **Kalkulasi Metrik & Pelaporan Manual:** Rekap penonton (*views*) semesteran tidak terstruktur, khususnya pada masa transisi tahun ajaran (Juli & Desember).

### 1.2 The Solution: Broadcast Spensa OS
Aplikasi web modular berbasis **Next.js 14 + Supabase + PWA** yang mengkonsolidasikan seluruh tata kelola operasional broadcast ke dalam satu *Unified Digital Workspace*. Mengusung sistem **Dual-Gate Script Approval**, **Per-Division Asset & Production Control**, **Dynamic Semester Analytics**, serta **Automated Reporting Engine with Cryptographic/Print Signatures**.

---

## 2. Personas, Roles, & Authorization Matrix (RBAC & RLS)

Sistem mengadopsi 9 peran hierarkis (*Role-Based Access Control*) yang ditegakkan pada tingkat database melalui **Supabase PostgreSQL Row Level Security (RLS)** dan diverifikasi di *Next.js Edge Middleware*.

### 2.1 The 9 Actors

```
                 ┌───────────────────────────┐
                 │       Administrator       │ (System Superuser & Config)
                 └─────────────┬─────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
┌──────────────────┐                       ┌──────────────────┐
│     Pembina      │ (Advisory/Tier-1)     │ Ketua Broadcast  │ (Executive/Tier-2)
└────────┬─────────┘                       └────────┬─────────┘
         │                                          │
         └─────────────────────┬────────────────────┘
                               │
             ┌─────────────────┴─────────────────┐
             ▼                                   ▼
   ┌───────────────────┐               ┌───────────────────┐
   │ 7x Ketua Divisi   │               │   Sekretaris &    │
   │ (Scoped per Dept) │               │     Bendahara     │
   └─────────┬─────────┘               └───────────────────┘
             │
   ┌─────────┴─────────┐
   ▼                   ▼
┌──────────────┐ ┌──────────────┐
│ Div. Kreatif │ │  PJ Project  │
└──────────────┘ └──────────────┘
```

1. **`administrator`:** Manajemen sistem, seed master data, assign hak akses global, pemulihan darurat, dan audit log lengkap.
2. **`pembina`:** Guru Pembina ekstrakurikuler. Memiliki hak **Full Monitoring**, Approver Tier-1 Script Produksi, Approver Tier-2 Kas Pengeluaran, serta pengelola eksklusif **Buku Catatan Keuangan Pembina**.
3. **`ketua_broadcast`:** Siswa Ketua Umum Broadcast. Approver Tier-2 Script Produksi, pembuat inisial Project Kanban, penentu nominal/periode kas, Approver Tier-1 Kas Pengeluaran, Finalizer Notulen, dan co-generator Laporan Resmi.
4. **`ketua_divisi`:** 7 pimpinan divisi spesifik (`Kreatif`, `Presenter`, `Fotografer`, `Videografer`, `Broadcasting`, `Editor`, `Promosi Digital`). Memiliki kontrol kurasi link final produksi pada divisinya, verifikasi status agenda kejuaraan (khusus Fotografer), dan pengelolaan inventaris (khusus Broadcasting).
5. **`sekretaris`:** Koordinator administrasi anggota (Tetap/Ekskul), juru catat absensi mingguan (checkbox masuk/izin/sakit/alpha), pembuat draft notulen rapat, pendaftar rekor agenda lomba, serta co-generator Laporan Resmi.
6. **`bendahara`:** Pengelola Buku Kas Anggota (checkbox pelunasan & pencatatan bayar tunggakan), pemantau saldo real-time, dan co-viewer Keuangan Pembina.
7. **`div_kreatif`:** Anggota tim kreatif yang bertugas menyusun dan mengunggah naskah script video atau daftar pertanyaan podcast untuk dikurasi.
8. **`pj` (Penanggung Jawab):** Anggota yang ditunjuk menangani proyek/produksi tertentu. Bertugas menginput link aset digital (thumbnail, video, audio) dan memperbarui progress teknis.
9. **`anggota`:** Anggota ekskul umum. Read-only pada agenda publik, jadwal kegiatan, dan katalog inventaris.

---

### 2.2 Enterprise Permission Grid

| Modul Operasional | Administrator | Pembina | Ketua Broadcast | Ketua Divisi | Sekretaris | Bendahara | Div. Kreatif | PJ Project | Anggota |
|---|---|---|---|---|---|---|---|---|---|
| **Manajemen Akun & Role** | Full CRUD | Read + Assign Divisi | Read | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Data Anggota (Tetap/Ekskul)**| Full CRUD | Read + Export | Read + Export | Read (Own Divisi)| Full CRUD + Exp | Read | Read | Read | Read |
| **Absensi Mingguan** | Full CRUD | Read + Set Libur | Read + Set Libur | Read (Own Divisi)| Input/Edit + Exp | Read | Read | Read | Read |
| **Notulen Rapat** | Full CRUD | Read + Download | Finalize Lock + DL| Read | Draft/Edit + DL | Read | Read | Read | Read |
| **Kas Anggota (Iuran/Tunggakan)**| Full CRUD | Read + Appr Tier-2| Set Rule + Tier-1| Read | Read | Checkbox / Write | Read | Read | Read |
| **Keuangan Pembina** | Read | Full CRUD + Export| Read + Export | ❌ 403 | ❌ 403 | Read + Export | ❌ 403 | ❌ 403 | ❌ 403 |
| **Agenda Project (Kanban)** | Full CRUD | Read + Comment | Create + Assign | Update Own Divisi| Read | Read | Read | Update Progress | Read |
| **Agenda Foto / Kejuaraan** | Full CRUD | Read + Export | Read + Export | Update (Fotografer)| Create / Input | Read | Read | Read | Read |
| **Inventaris Alat** | Full CRUD | Read + Export | Full CRUD | CRUD (Broadcasting)| Full CRUD | Read | Read | Pinjam / Return | Read |
| **Produksi Video: Upload Script**| Full CRUD | Read | Read | Read | Read | Read | Create / Upload | Read | Read |
| **Produksi Video: Script Approval**| Bypass | **Approve Tier-1** | **Approve Tier-2** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Produksi Video: Input Link** | Full CRUD | Read | Read | Read | Read | Read | ❌ | **Submit Links** | ❌ |
| **Produksi Video: Final Curate** | Full CRUD | Read | Read | **Final-Approve**| Read | Read | ❌ | ❌ | Read |
| **Views Analytics (Des/Jul Rule)**| Full CRUD | Read All Analytics| Read All Analytics| Read (Own Divisi)| Read | Read | Read | Input / Update | Read |
| **Laporan Ekstrakurikuler** | Full CRUD | Read + Sign Print| Generate + Sign | Read (Own Divisi)| Generate + Sign | Read | ❌ | ❌ | ❌ |

---

## 3. Detailed Functional Modules & Technical Specifications

---

### Modul 01: Dual-Gate Video & Podcast Production Pipeline

Sistem kurasi bertingkat untuk menjamin kualitas naskah sebelum proses *shooting/recording* dimulai, serta verifikasi kelayakan materi sebelum *broadcasting*.

```
[Div. Kreatif]
  │  POST /api/produksi (script_text OR pertanyaan_podcast + divisi)
  ▼
[State: pending_approval]
  │
  ├───▶ [Pembina (Any 1)] ───▶ POST /api/produksi/:id/approve-pembina ───┐
  │                                                                       │ (Dual Gate Converge)
  └───▶ [Ketua Broadcast] ───▶ POST /api/produksi/:id/approve-ketua   ───┴──▶ [State: approved]
  │                                                                               │
  └─(Either Rejects)──▶ [State: rejected] ──▶ Feedback Loop ──▶ Re-Upload        │ Assign PJ
                                                                                  ▼
                                                                        [State: in_production]
                                                                                  │
                                                                       [PJ inputs Links: Drive/YT]
                                                                                  │
                                                                                  ▼
                                                                        [State: pending_divisi]
                                                                                  │
                                                                    [Ketua Divisi (Own Scope)]
                                                                                  │
                                                                     POST /api/produksi/:id/final-approve
                                                                                  │
                                                                                  ▼
                                                                         [State: done/published]
```

#### State Machine Spesifikasi
*   `pending_approval`: Initial state setelah submission oleh Div. Kreatif.
*   `pending_ketua`: Telah disetujui Pembina, menunggu Ketua Broadcast.
*   `pending_pembina`: Telah disetujui Ketua Broadcast, menunggu Pembina.
*   `approved`: Kedua belah pihak telah menyetujui. Siap dilakukan penugasan PJ.
*   `rejected`: Ditolak salah satu pihak dengan alasan wajib (`catatan_pembina` atau `catatan_ketua`).
*   `in_production`: PJ ditugaskan dan produksi sedang berlangsung.
*   `pending_divisi`: PJ telah melengkapi URL thumbnail, video, dan/atau audio. Menunggu kurasi Ketua Divisi.
*   `done`: Disetujui final oleh Ketua Divisi dari divisi yang bersangkutan.
*   `published`: Konten telah tayang di kanal resmi Spensa.

#### Acceptance Criteria
*   **`AC-PROD-01`**: Div. Kreatif wajib menginput salah satu antara `script_text` (minimal 50 karakter) atau `pertanyaan_podcast` (minimal 3 butir pertanyaan), dengan memilih 1 dari 7 divisi valid.
*   **`AC-PROD-02`**: Jika Pembina menyetujui lebih dulu, status berubah ke `pending_ketua`. Jika Ketua Broadcast menyetujui lebih dulu, status berubah ke `pending_pembina`. Keduanya harus `approved` untuk mencapai state `approved`.
*   **`AC-PROD-03`**: Upaya assign PJ saat status belum `approved` akan ditolak dengan error `HTTP 409 Conflict`.
*   **`AC-PROD-04`**: Endpoint input hasil link (`thumbnail_url`, `video_url`, `audio_url`) hanya dapat diakses oleh user yang ID-nya sama dengan `penanggung_jawab_id`.
*   **`AC-PROD-05`**: Ketua Divisi hanya dapat memanggil endpoint `/final-approve` jika `user.divisi == produksi.divisi`. Pelanggaran menghasilkan `HTTP 403 Forbidden`.

---

### Modul 02: Buku Kas Anggota (Checkbox & Arrears Engine)

Tata kelola iuran ekskul yang memangkas friksi entri data manual melalui mekanisme *Instant Checkbox* dan *Selective Historical Debt Clearing*.

#### Mekanisme Operasional
1. **Dynamic Frequency & Nominal Rule:** Ketua Broadcast mengonfigurasi frekuensi (`mingguan` atau `dwimingguan`) dan nominal tetap (misal: Rp5.000). Setiap perubahan tercatat dengan tanggal berlaku tanpa mengubah saldo periode historis.
2. **Automated Period Generation:** Sistem secara otomatis membangkitkan entri `kas_pembayaran` untuk semua anggota berstatus aktif setiap siklus baru berjalan.
3. **Instant Toggle:** Bendahara mengonfirmasi pembayaran dengan menekan checkbox pada list periode berjalan. Sistem mengunci `tanggal_bayar = NOW()` dan `dicatat_oleh = auth.uid()`.
4. **Arrears Management (Tunggakan):** Anggota yang melewati batas `periode_end` tanpa pelunasan otomatis masuk ke register tunggakan. Bendahara dapat mencari nama siswa, melihat riwayat minggu yang tertunggak, dan mengeksekusi pelunasan parsial atau borongan.

#### Acceptance Criteria
*   **`AC-KAS-01`**: Non-Ketua Broadcast yang mencoba mengubah `kas_settings` akan menerima `HTTP 403 Forbidden`.
*   **`AC-KAS-02`**: Saldo kas tidak disimpan sebagai nilai mentah statis, melainkan dihitung via agregasi SQL `SUM(nominal)` terhadap entri `status = 'lunas'`.
*   **`AC-KAS-03`**: Pelunasan tunggakan masa lalu tidak mengubah timestamp periode lama, melainkan menyimpan audit `tanggal_bayar` aktual saat checkbox susulan dieksekusi.
*   **`AC-KAS-04`**: Pembina dan Ketua Broadcast memiliki akses dashboard monitoring tunggakan (read-only) dengan filter kelas, divisi, serta ekspor format Excel.

---

### Modul 03: Absensi Mingguan & Manajemen Hari Libur

Pencatatan kehadiran mingguan presisi yang memisahkan register Anggota Tetap dan Anggota Ekskul serta mendukung deklarasi kalender libur.

#### Mekanisme Operasional
*   **Tabular Segregation:** Sekretaris disajikan dua tab berbeda: `[Anggota Tetap]` dan `[Anggota Ekskul]`.
*   **Single-Click Attendance:** 4 opsi diskrit: `masuk`, `izin`, `sakit`, `alpha`.
*   **Holiday Override:** Pembina atau Ketua Broadcast dapat mendeklarasikan pekan tertentu sebagai `is_libur = true` (contoh: masa Penilaian Akhir Semester atau libur nasional). Pekan libur secara otomatis dikecualikan dari kalkulasi persentase kehadiran dan tidak menimbulkan sanksi alpha.

#### Acceptance Criteria
*   **`AC-ABS-01`**: Setiap anggota hanya dapat memiliki tepat satu record absensi per tanggal sesi (`UNIQUE(anggota_id, tanggal, anggota_tipe)`).
*   **`AC-ABS-02`**: Formula persentase kehadiran: $\text{Kehadiran (\%)} = \left( \frac{\text{Total Masuk}}{\text{Total Sesi Aktif} - \text{Total Sesi Libur}} \right) \times 100$.
*   **`AC-ABS-03`**: Upaya Sekretaris menyetel status libur akan diblokir dengan `HTTP 403 Forbidden`.

---

### Modul 04: Analytics Penonton & Formula Semester (Juli/Desember Boundary)

Mesin pelacak performa publikasi karya video dan podcast dengan standarisasi tahun ajaran Indonesia.

#### Aturan Pembagian Semester
Tahun ajaran sekolah berjalan dari Juli tahun berjalan hingga Juni tahun berikutnya. Untuk mengakomodasi masa libur semester dan transisi kurikulum, berlaku aturan bisnis khusus:
*   **Produksi Rilis Bulan Juli ($m = 7$):** Dimasukkan ke kalkulasi **Semester Ganjil** tahun ajaran baru ($T/T+1$).
*   **Produksi Rilis Bulan Desember ($m = 12$):** Dimasukkan ke kalkulasi **Semester Genap** tahun ajaran berjalan ($T/T+1$).

#### Standar Pemetaan Matematis
$$\text{Semester}(m, y) = \begin{cases} 
\text{Ganjil } y/(y+1) & \text{jika } m \in \{7, 8, 9, 10, 11\} \\
\text{Genap } (y-1)/y & \text{jika } m \in \{1, 2, 3, 4, 5, 6\} \\
\text{Genap } y/(y+1) & \text{jika } m = 12 
\end{cases}$$

#### Acceptance Criteria
*   **`AC-VIEW-01`**: Video yang dipublish pada `2026-12-15` dengan 12.000 views akan masuk ke laporan analitik `Semester Genap 2026/2027`.
*   **`AC-VIEW-02`**: Video yang dipublish pada `2026-07-04` dengan 5.000 views akan masuk ke laporan analitik `Semester Ganjil 2026/2027`.
*   **`AC-VIEW-03`**: Update `jumlah_views` dibatasi untuk PJ terkait, Ketua Divisi terkait, dan Ketua Broadcast.

---

### Modul 05: Notulen Rapat & Pengesahan Digital

Digitalisasi risalah musyawarah tanpa redundansi data peserta (menggunakan referensi silang ke modul absensi).
*   **Alur:** Sekretaris membuat risalah (`judul`, `tanggal_rapat`, `tempat`, `agenda`, `isi_notulen`, `keputusan`) dalam status `draft`.
*   **Finalize:** Ketua Broadcast memverifikasi dan mengubah status menjadi `final` (kunci mutlak, tidak dapat disunting kembali).
*   **Export:** Konversi on-the-fly ke berkas PDF lengkap dengan Kop Surat resmi Spensa tanpa tanda tangan basah untuk distribusi digital cepat.

---

### Modul 06: Buku Catatan Keuangan Pembina

Buku besar terisolasi (*air-gapped ledger*) khusus dana operasional strategis (BOS, Subsidi Komite Sekolah, Sponsor Eksternal).
*   **Akses:** Pembina memiliki hak penuh (*create, read, update, delete*). Transaksi langsung tercatat efektif tanpa mekanisme approval.
*   **Visibilitas:** Pembina, Ketua Broadcast, dan Bendahara dapat meninjau mutasi dan mengunduh laporan. Peran lain dikenakan restriksi ketat `HTTP 403`.

---

### Modul 07: Agenda Project (Kanban Engine)

Pelacak proyek kreatif non-reguler (Liputan Khusus, Dokumenter Sekolah, Podcast Spesial Hari Guru).
*   **Inisiasi:** Dibuat langsung oleh Ketua Broadcast dengan menetapkan Judul, Divisi pelaksana, Tenggat waktu, PJ, serta Multi-select Anggota Tim sejak pembentukan awal.
*   **Visualisasi:** Papan Kanban interaktif dengan 4 kolom status: `perencanaan`, `proses`, `selesai`, `tunda`.
*   **Dokumentasi:** Integrasi eksklusif tautan Google Drive (`https://drive.google.com/...`) untuk mencegah penumpukan file server lokal.

---

### Modul 08: Rekor Agenda Kejuaraan & Lomba (Non-Upload Foto)

Log prestasi dan delegasi kejuaraan siswa yang terhubung ke divisi dokumentasi.
*   **Alur Data:** Sekretaris mendaftarkan identitas siswa, kelas, nama kejuaraan, tingkat lomba (`sekolah`, `kecamatan`, `kabupaten`, `kota`, `provinsi`, `nasional`), serta tanggal pelaksanaan.
*   **Kurasi Status:** Hanya **Ketua Divisi Fotografer** yang berhak memperbarui indikator apakah dokumentasi telah tuntas (`sudah`) atau belum (`belum`). Divisi lain dilarang mengubah status.

---

### Modul 09: Manajemen Inventaris Aset Studio

Pencatatan sirkulasi perangkat studio bernilai tinggi dengan atribusi divisi jelas.
*   **Klasifikasi Dinamis:** Kategori barang berupa *free-text* yang dapat diperluas sewaktu-waktu (kamera, mic condenser, audio interface, lighting, tripod, kostum presenter).
*   **Identitas Tagging:** Penomoran terstandarisasi dengan label visual divisi, contoh: `BRC-VID-001`, `BRC-BC-004`.
*   **Sirkulasi:** Pencatatan peminjaman multi-unit dengan riwayat kondisi barang kembali (`baik`, `rusak ringan`, `rusak berat`, `hilang`).
*   **Otoritas:** Dikelola bersama oleh Ketua Divisi Broadcasting, Sekretaris, dan Ketua Broadcast.

---

### Modul 10: Generator Laporan Semester Terpadu

Penyusunan berkas pertanggungjawaban resmi ekstrakurikuler per semester.
*   **Waktu Pembuatan:** Dieksekusi pada akhir Semester Ganjil atau Genap oleh Ketua Broadcast bersama Sekretaris.
*   **Visualisasi Terintegrasi:** Menghasilkan dokumen cetak dengan infografis/grafik performa (tren kehadiran absensi, rekapitulasi iuran vs tunggakan kas, grafik views konten per divisi, serta kondisi aset inventaris).
*   **Dual-Mode Signing:**
    *   *Mode Digital Archive (`with_ttd = false`):* PDF bersih dengan kop surat resmi untuk arsip cloud.
    *   *Mode Cetak Fisik (`with_ttd = true`):* Menyertakan lembar pengesahan formal 3 kolom ttd (Ketua Broadcast, Sekretaris, dan Pembina) menggunakan stempel digital atau tanda tangan terdaftar.

---

## 4. Comprehensive Database Schema (Supabase PostgreSQL DDL)

Berikut adalah skema tabel relasional lengkap beserta konstrain integritas data:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USERS
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'administrator', 'pembina', 'ketua_broadcast', 'ketua_divisi',
        'sekretaris', 'bendahara', 'div_kreatif', 'pj', 'anggota'
    )),
    divisi VARCHAR(50) CHECK (divisi IN (
        'Kreatif', 'Presenter', 'Fotografer', 'Videografer',
        'Broadcasting', 'Editor', 'Promosi Digital'
    )),
    signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MASTER DIVISI
CREATE TABLE public.divisi_ref (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(50) UNIQUE NOT NULL,
    ketua_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ANGGOTA TETAP & EKSKUL
CREATE TABLE public.anggota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('tetap', 'ekskul')),
    nama_lengkap VARCHAR(150) NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    kelas VARCHAR(10) NOT NULL,
    jabatan VARCHAR(50) DEFAULT 'Anggota',
    divisi VARCHAR(50) CHECK (divisi IN (
        'Kreatif', 'Presenter', 'Fotografer', 'Videografer',
        'Broadcasting', 'Editor', 'Promosi Digital'
    )),
    tahun_ajaran VARCHAR(10) NOT NULL, -- Format: 2026/2027
    status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'cuti', 'lulus', 'nonaktif')),
    no_hp VARCHAR(25),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ABSENSI MINGGUAN
CREATE TABLE public.absensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    anggota_tipe VARCHAR(10) NOT NULL CHECK (anggota_tipe IN ('tetap', 'ekskul')),
    tanggal DATE NOT NULL,
    pertemuan_ke INT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('masuk', 'izin', 'sakit', 'alpha')),
    keterangan TEXT,
    is_libur BOOLEAN NOT NULL DEFAULT false,
    libur_oleh UUID REFERENCES public.profiles(id),
    libur_alasan TEXT,
    dicatat_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(anggota_id, tanggal, anggota_tipe)
);

-- 5. KAS SETTINGS & PEMBAYARAN
CREATE TABLE public.kas_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nominal INT NOT NULL CHECK (nominal > 0),
    periode_type VARCHAR(20) NOT NULL CHECK (periode_type IN ('mingguan', 'dwimingguan')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    diatur_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.kas_pembayaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anggota_id UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    periode_start DATE NOT NULL,
    periode_end DATE NOT NULL,
    periode_label VARCHAR(50) NOT NULL,
    nominal INT NOT NULL CHECK (nominal > 0),
    status VARCHAR(10) NOT NULL DEFAULT 'belum' CHECK (status IN ('lunas', 'belum')),
    tanggal_bayar TIMESTAMPTZ,
    dicatat_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(anggota_id, periode_start)
);

-- 6. KEUANGAN PEMBINA
CREATE TABLE public.keuangan_pembina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal DATE NOT NULL,
    sumber_dana VARCHAR(30) NOT NULL CHECK (sumber_dana IN ('BOS', 'Dana Sekolah', 'Sponsor')),
    keterangan TEXT NOT NULL,
    pemasukan INT NOT NULL DEFAULT 0 CHECK (pemasukan >= 0),
    pengeluaran INT NOT NULL DEFAULT 0 CHECK (pengeluaran >= 0),
    catatan_pembina TEXT,
    lampiran_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (pemasukan > 0 OR pengeluaran > 0)
);

-- 7. NOTULEN RAPAT
CREATE TABLE public.notulen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(200) NOT NULL,
    tanggal_rapat DATE NOT NULL,
    tempat VARCHAR(150),
    agenda TEXT,
    isi_notulen TEXT NOT NULL,
    keputusan TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
    dibuat_oleh UUID REFERENCES public.profiles(id),
    disetujui_oleh UUID REFERENCES public.profiles(id),
    disetujui_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AGENDA PROJECT KANBAN
CREATE TABLE public.project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_project VARCHAR(200) NOT NULL,
    deskripsi TEXT,
    penanggung_jawab UUID NOT NULL REFERENCES public.profiles(id),
    tim UUID[] NOT NULL DEFAULT '{}',
    deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'perencanaan' CHECK (status IN ('perencanaan', 'proses', 'selesai', 'tunda')),
    progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    link_drive TEXT CHECK (link_drive ~ '^https://drive\.google\.com/.*'),
    divisi VARCHAR(50) NOT NULL CHECK (divisi IN (
        'Kreatif', 'Presenter', 'Fotografer', 'Videografer',
        'Broadcasting', 'Editor', 'Promosi Digital'
    )),
    jumlah_views INT NOT NULL DEFAULT 0 CHECK (jumlah_views >= 0),
    published_at DATE,
    catatan_update JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PRODUKSI VIDEO DUAL GATE
CREATE TABLE public.produksi_video (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(200) NOT NULL,
    jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('podcast', 'video', 'liputan', 'live')),
    script_text TEXT,
    pertanyaan_podcast TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
        'pending_approval', 'pending_pembina', 'pending_ketua',
        'approved', 'rejected', 'in_production', 'pending_divisi', 'done', 'published'
    )),
    divisi VARCHAR(50) NOT NULL CHECK (divisi IN (
        'Kreatif', 'Presenter', 'Fotografer', 'Videografer',
        'Broadcasting', 'Editor', 'Promosi Digital'
    )),
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_pembina_by UUID REFERENCES public.profiles(id),
    approved_pembina_at TIMESTAMPTZ,
    approved_ketua_by UUID REFERENCES public.profiles(id),
    approved_ketua_at TIMESTAMPTZ,
    penanggung_jawab_id UUID REFERENCES public.profiles(id),
    thumbnail_url TEXT,
    video_url TEXT,
    audio_url TEXT,
    jumlah_views INT NOT NULL DEFAULT 0 CHECK (jumlah_views >= 0),
    published_at DATE,
    catatan_pembina TEXT,
    catatan_ketua TEXT,
    catatan_ketua_divisi TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (script_text IS NOT NULL OR pertanyaan_podcast IS NOT NULL)
);

-- 10. AGENDA FOTO / KEJUARAAN (TEXT-ONLY)
CREATE TABLE public.agenda_foto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_siswa VARCHAR(150) NOT NULL,
    kelas VARCHAR(10) NOT NULL,
    kejuaraan VARCHAR(255) NOT NULL,
    tingkat VARCHAR(20) NOT NULL CHECK (tingkat IN ('sekolah', 'kecamatan', 'kabupaten', 'kota', 'provinsi', 'nasional')),
    tanggal DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'sudah')),
    keterangan TEXT,
    divisi VARCHAR(50) DEFAULT 'Fotografer',
    dibuat_oleh UUID REFERENCES public.profiles(id),
    diupdate_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVENTARIS
CREATE TABLE public.inventaris (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_barang VARCHAR(200) NOT NULL,
    kategori VARCHAR(100) NOT NULL, -- Free text (kostum, lighting, mic, dll)
    kode_inventaris VARCHAR(30) UNIQUE NOT NULL, -- e.g. BRC-VID-001
    jumlah INT NOT NULL DEFAULT 1 CHECK (jumlah >= 0),
    kondisi VARCHAR(20) NOT NULL DEFAULT 'baik' CHECK (kondisi IN ('baik', 'rusak ringan', 'rusak berat', 'hilang')),
    lokasi_simpan VARCHAR(150),
    penanggung_jawab UUID REFERENCES public.profiles(id),
    tgl_peroleh DATE,
    harga_peroleh INT CHECK (harga_peroleh >= 0),
    divisi VARCHAR(50) NOT NULL CHECK (divisi IN (
        'Kreatif', 'Presenter', 'Fotografer', 'Videografer',
        'Broadcasting', 'Editor', 'Promosi Digital'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'dipinjam')),
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.inventaris_peminjaman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventaris_id UUID NOT NULL REFERENCES public.inventaris(id) ON DELETE CASCADE,
    anggota_id UUID NOT NULL REFERENCES public.anggota(id) ON DELETE CASCADE,
    jumlah_pinjam INT NOT NULL DEFAULT 1 CHECK (jumlah_pinjam > 0),
    tgl_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
    tgl_kembali DATE,
    kondisi_kembali VARCHAR(20) CHECK (kondisi_kembali IN ('baik', 'rusak ringan', 'rusak berat', 'hilang')),
    dicatat_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. LAPORAN ARSIP SEMESTER
CREATE TABLE public.laporan_arsip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester VARCHAR(10) NOT NULL CHECK (semester IN ('ganjil', 'genap')),
    tahun_ajaran VARCHAR(10) NOT NULL,
    file_path_pdf TEXT NOT NULL,
    file_path_xlsx TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}',
    generated_by UUID REFERENCES public.profiles(id),
    with_ttd BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOG (APPEND ONLY)
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    divisi VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id UUID,
    extra_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE RULE no_update_audit_log AS ON UPDATE TO public.audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_log AS ON DELETE TO public.audit_log DO INSTEAD NOTHING;
```

---

## 5. Non-Functional Requirements (NFR)

*   **PWA Compliance:** Service Worker dengan strategi `StaleWhileRevalidate` untuk aset statis dan `NetworkFirst` dengan fallback *IndexedDB Offline Queue* untuk checklist absensi di area studio blind-spot. Skor Lighthouse PWA $\ge 95$.
*   **Security & Data Integrity:** Password ter-enkripsi via Supabase Auth (Argon2id/Bcrypt). RLS diaktifkan pada 100% tabel transaksi publik. Tidak ada akses `service_role` pada runtime client-side.
*   **Response Latency:** Server Actions & Route Handlers menjawab $\le 250\text{ms}$ (p95) di edge deployment Vercel.
*   **Mobile-First Responsive Touch:** Target ketukan (*touch target*) minimal $48\times 48\text{px}$, navigasi jempol bersahabat (*thumb-friendly bottom sheet*).

---

*PRD.md — Broadcast Spensa Apps v3.0.0 · Production Architecture Standard*
