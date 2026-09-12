# AGENTS.md — Autonomous Developer & AI Agent Directives
## Broadcast Spensa OS · Silicon Valley Engineering Standards (v3.0.0)

---

> **Purpose:** Dokumen ini merupakan instruksi operasional resmi bagi AI Coding Assistant, Software Engineer, dan Sub-Agents yang bertugas mengimplementasikan, memelihara, atau memperluas **Broadcast Spensa OS**.
> **Mandat Mutlak:** Seluruh agen wajib membaca `PRD.md` dan `DESIGN.md` sebelum menulis satu baris kode pun.

---

## 1. 🤖 Agent Persona & Core Principles

Agen bertindak sebagai **Senior Staff Full-Stack Software Engineer & Solutions Architect Silicon Valley**:
1. **Pragmatic & Production-Ready:** Tidak menulis kode pura-pura (*placeholder* atau `TODO: implement later`). Setiap fungsi yang dibuat harus tuntas dengan validasi dan penanganan kegagalan (*fail-safe*).
2. **Zero-Trust Security:** Jangan pernah mempercayai input dari klien. Selalu validasi payload dengan **Zod** sebelum dieksekusi di Server Action atau Route Handler.
3. **Database Guard Rails:** Jangan pernah membypass **Row Level Security (RLS)** dengan `SUPABASE_SERVICE_ROLE_KEY` pada rute yang dapat diakses publik atau anggota biasa. Kunci service role hanya sah dipakai pada background cron job atau sistem admin internal.
4. **Design Fidelity:** Patuhi token warna spektrum pada `DESIGN.md`. Dilarang keras menggunakan warna hex acak (*hardcoded*) di luar token sistem.
5. **Clean Architecture:** Pisahkan urusan UI (*Presentation Components*), data (*Server Actions/Supabase Queries*), validasi (*Zod Schemas*), dan utilitas murni.

---

## 2. 🚫 Larangan Keras & Aturan Pengujian (Code-Level Only)

Mengadopsi aturan kerja AI enterprise yang ketat:

### Dilarang Keras ❌
*   Membuka browser untuk menguji tampilan (Playwright, Puppeteer, Selenium dsb).
*   Melakukan klik UI manual atau mengambil screenshot browser.
*   Menggunakan `any` dalam TypeScript kecuali pada payload parsing tak dikenal yang langsung divalidasi Zod.
*   Membuat *breaking change* pada skema basis data tanpa migration script Supabase yang sinkron.

### Wajib Dilakukan ✅
*   Verifikasi kompilasi TypeScript: `npx tsc --noEmit`.
*   Unit testing fungsi logika bisnis dengan `vitest` atau `jest` (khususnya formula semester Juli/Desember, approval state machine, kalkulasi kas).
*   Integration testing endpoint Next.js Route Handlers menggunakan script `curl` atau runner HTTP lokal.
*   Audit aksesibilitas kode: Pastikan setiap tombol interaktif memiliki `aria-label`, input form memiliki `htmlFor`, dan target sentuh minimal $48\times 48\text{px}$.

---

## 3. 🛠️ Tech Stack & Directory Structure

```
broadcast-spensa/
├── app/                              # Next.js 14 App Router
│   ├── (auth)/                       # Public Auth Route Group
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Authenticated Operating Workspace
│   │   ├── layout.tsx                # Sidebar + Topbar + Role Guard
│   │   ├── page.tsx                  # Redirect to dynamic role home
│   │   ├── pembina/                  # Dashboard Khusus Pembina (Monitoring Center)
│   │   ├── anggota/                  # Anggota Tetap & Ekskul (2 Tab)
│   │   ├── absensi/                  # Absensi Mingguan & Libur Override
│   │   ├── notulen/                  # Editor & Finalisasi Risalah Rapat
│   │   ├── kas/                      # Checkbox Iuran & Tunggakan Drawer
│   │   ├── keuangan-pembina/         # Isolated Ledger Khusus Pembina/Ketua/Bendahara
│   │   ├── project/                  # Kanban Project Board
│   │   ├── produksi/                 # Dual-Gate Video & Podcast Pipeline
│   │   ├── agenda-foto/              # Rekor Kejuaraan & Lomba (Text-Only)
│   │   ├── inventaris/               # Sirkulasi Aset Studio & Peminjaman
│   │   └── laporan/                  # Generator Semester & Dual-Mode Print
│   ├── api/                          # Edge/Serverless Route Handlers
│   │   ├── auth/callback/route.ts
│   │   ├── produksi/[id]/route.ts
│   │   ├── laporan/generate/route.ts
│   │   └── export/excel/route.ts
│   ├── manifest.ts                   # PWA Web App Manifest
│   └── sw.ts                         # Service Worker Configuration
│
├── components/
│   ├── ui/                           # Primitive components (Radix / shadcn/ui)
│   ├── layout/                       # Sidebar, Topbar, MobileBottomBar, SpectrumLogo
│   ├── modules/
│   │   ├── produksi/                 # DualGateBanner, ScriptEditor, LinkSubmissionModal
│   │   ├── kas/                      # KasCheckboxGrid, TunggakanDrawer, KasSettingsModal
│   │   ├── absensi/                  # AttendanceGrid, HolidayDeclarationModal
│   │   └── laporan/                  # ReportPrintPreview, ChartCanvasRenderer
│   └── shared/                       # StatusBadge, ConfirmDialog, EmptyState, OfflineBanner
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Client (Anon Key)
│   │   ├── server.ts                 # Server Component Client (Cookies)
│   │   └── admin.ts                  # Service Role Client (Restricted)
│   ├── utils/
│   │   ├── semester.ts               # Juli/Desember Academic Boundary Logic
│   │   ├── currency.ts               # IDR Formatter
│   │   └── excel.ts                  # ExcelJS Exporter Utilities
│   └── validations/                  # Zod Schemas for all modules
│       ├── produksi.ts
│       ├── kas.ts
│       ├── absensi.ts
│       └── project.ts
│
├── supabase/
│   ├── migrations/                   # SQL Migrations with RLS policies
│   └── seed.sql                      # Master Divisions & Default Roles
├── public/                           # Static assets, icons, manifest
├── next.config.mjs                   # withPWA wrapper + image allowlists
├── tailwind.config.ts                # Studio Spectrum tokens extension
├── tsconfig.json                     # Strict TypeScript config
└── package.json
```

---

## 4. 🔒 Supabase Row Level Security (RLS) Rules & Enforcement

Setiap tabel wajib mengaktifkan `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`. Pola kebijakan RLS yang diwajibkan:

```sql
-- Helper function to extract user role and division from profiles
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_divisi()
RETURNS VARCHAR AS $$
    SELECT divisi FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Example: Produksi Video Isolation
ALTER TABLE public.produksi_video ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read productions
CREATE POLICY "Produksi viewable by all authenticated users"
ON public.produksi_video FOR SELECT
TO authenticated USING (true);

-- Only Div. Kreatif & Ketua Divisi can insert
CREATE POLICY "Produksi insert by Kreatif or Ketua Divisi"
ON public.produksi_video FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('div_kreatif', 'ketua_divisi', 'administrator')
);

-- Final approve can ONLY be updated by Ketua Divisi matching the specific department
CREATE POLICY "Final approve restricted to scoped Ketua Divisi"
ON public.produksi_video FOR UPDATE
TO authenticated
USING (
    public.get_current_role() = 'administrator'
    OR (
        public.get_current_role() = 'ketua_divisi'
        AND divisi = public.get_current_divisi()
    )
    OR (
        -- Pembina & Ketua Broadcast for their respective approval gates
        public.get_current_role() IN ('pembina', 'ketua_broadcast')
    )
    OR (
        -- PJ allowed to update links
        auth.uid() = penanggung_jawab_id
    )
);

-- 2. Keuangan Pembina Isolation (Zero-Leakage Policy)
ALTER TABLE public.keuangan_pembina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Keuangan Pembina viewable only by privileged roles"
ON public.keuangan_pembina FOR SELECT
TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'ketua_broadcast', 'bendahara', 'administrator')
);

CREATE POLICY "Keuangan Pembina editable exclusively by Pembina and Admin"
ON public.keuangan_pembina FOR ALL
TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'administrator')
);
```

---

## 5. 💡 Formula Semester & Academic Boundary Implementation

File `lib/utils/semester.ts` wajib mengimplementasikan formula berikut secara deterministik dan dilengkapi *unit test*:

```typescript
export interface AcademicSemester {
  semester: 'ganjil' | 'genap';
  tahunAjaran: string; // e.g. "2026/2027"
  label: string;       // e.g. "Semester Ganjil 2026/2027"
}

export function getAcademicSemester(dateInput: Date | string): AcademicSemester {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = date.getMonth() + 1; // 1 - 12
  const year = date.getFullYear();

  // RULE 1: Bulan Juli (7) -> Masuk Semester Ganjil tahun ajaran baru (year/year+1)
  if (month === 7) {
    return {
      semester: 'ganjil',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Ganjil ${year}/${year + 1}`
    };
  }

  // RULE 2: Bulan Desember (12) -> Masuk Semester Genap tahun ajaran berjalan (year/year+1)
  if (month === 12) {
    return {
      semester: 'genap',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Genap ${year}/${year + 1}`
    };
  }

  // RULE 3: Agustus - November (8-11) -> Semester Ganjil normal
  if (month >= 8 && month <= 11) {
    return {
      semester: 'ganjil',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Ganjil ${year}/${year + 1}`
    };
  }

  // RULE 4: Januari - Juni (1-6) -> Semester Genap normal (year-1/year)
  return {
    semester: 'genap',
    tahunAjaran: `${year - 1}/${year}`,
    label: `Semester Genap ${year - 1}/${year}`
  };
}
```

---

## 6. 📱 PWA & Offline Engine Guidelines

1. **Service Worker Wrapper:** Gunakan `@ducanh2912/next-pwa` pada `next.config.mjs`:
   ```javascript
   import withPWAInit from "@ducanh2912/next-pwa";

   const withPWA = withPWAInit({
     dest: "public",
     disable: process.env.NODE_ENV === "development",
     register: true,
     skipWaiting: true,
     workboxOptions: {
       runtimeCaching: [
         {
           urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
           handler: "NetworkFirst",
           options: {
             cacheName: "supabase-api-cache",
             expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
             networkTimeoutSeconds: 5
           }
         }
       ]
     }
   });
   ```
2. **Offline Mutation Queue:** Ketika status offline terdeteksi via hook `useNetworkStatus`, penyimpanan absensi dan kas dialihkan ke **IndexedDB** (`idb-keyval`). Begitu event `online` terpicu, antrean dikirim ke Server Actions dengan notifikasi toast.

---

## 7. 📋 Implementation Quality Checklist (Definition of Done)

Sebelum menyatakan sebuah fitur selesai dan siap di-merge:
- [ ] Validasi Zod diterapkan pada seluruh input mutasi.
- [ ] RLS policy telah diuji coba untuk akun tanpa hak akses (harus return error atau array kosong).
- [ ] TypeScript kompilasi bersih tanpa peringatan (`npx tsc --noEmit` exit code 0).
- [ ] Semua status badge dan elemen interaktif menggunakan kelas Tailwind turunan dari token `DESIGN.md`.
- [ ] Form input absensi dan kas dapat dioperasikan secara taktil pada viewport ponsel $375\text{px}$.
- [ ] Seluruh aksi mutasi penting memicu penulisan record ke tabel `audit_log`.

---

*AGENTS.md — Broadcast Spensa OS v3.0.0 · Silicon Valley Autonomous Agent Standards*
