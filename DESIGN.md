# DESIGN.md — Studio Spectrum Design System & UI/UX Guidelines
## Broadcast Spensa OS · Enterprise UI/UX Pro Max Specification (v3.2.0 — Verified Contrast Pairs + Mobile Overflow Fix)

---

> **Aesthetic Thesis:** *The High-Contrast Digital Broadcast Studio* — Menjaga atmosfer stasiun radio dan broadcast modern berlatar *Cosmic Midnight Navy*, namun dengan perbaikan kontras ekstrem (*High-Contrast Text Pass*) agar seluruh teks terbaca mutlak (memenuhi standar WCAG AAA/AA). Dilengkapi dengan prinsip *Fluid Typography* dan *Overflow-X Prevention* agar tidak ada elemen atau teks yang meluber melewati layar ponsel.
>
> **v3.2.0 Root-Cause Fix (2026-09-11):** Audit codebase menemukan 3 penyebab teks tidak terbaca: (1) token lama `cobalt #2E63B8` (~3.5:1), `violet #8B3DA8` (~3.2:1), `muted #64748B` (~4.2:1) sebagai teks — GAGAL WCAG; (2) pola `text-white` di atas fill terang (`white-on-jade` 1.9:1, `white-on-cobalt` 2.5:1) — GAGAL total; (3) grid `grid-cols-2/3` tanpa breakpoint di HP 360px. Semua diperbaiki di kode + didokumentasikan sebagai pairing matrix wajib di bawah. `npx tsc --noEmit` bersih.

---

## 1. 🎨 Logo Extraction & High-Contrast Color Science

Palette warna diturunkan dari logo resmi **BROADCAST SPENSA**, dengan penyesuaian nilai kecerahan (*lightness*) dan saturasi agar teks putih atau hitam di atasnya memiliki rasio kontras minimal **7.0:1 (WCAG AAA)**.

```
[ WARM GOLD ]     [ AMBER SUN ]    [ BRIGHT TANGERINE ] [ STUDIO EMERALD ]  [ ELECTRIC CYAN ]  [ ELECTRIC COBALT ]
   #FCD34D         #FBBF24           #FB923C              #34D399             #38BDF8            #60A5FA
      │               │                 │                    │                   │                  │
      └───────────────┴─────────────────┴────────────────────┴───────────────────┴──────────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              ▼                                                   ▼
   [ COSMIC MIDNIGHT NAVY ]                            [ CYBER VIOLET GLOW ]
    #030712 (Canvas) / #0B132B (Surface)                   #C084FC ──▶ #E879F9
       (Deepest Dark Canvas)                              (Signature Rings & Focus)
```

---

### 1.1 Verified Contrast Pairing Matrix (WAJIB — sumber bug v3.1.0)

> Aturan emas hasil audit: **warna aksen BOLEH jadi teks** (di atas canvas gelap), **tapi TIDAK BOLEH dipasangi teks putih di atasnya**. Fill solid aksen HANYA boleh dipasangkan dengan teks gelap `ink #030712`. Semua rasio di bawah dihitung eksak via relative luminance (WCAG 2.1).

**A. Aksen sebagai TEKS di atas canvas `#030712` (semua lolos):**

| Token | Hex | Rasio | Pakai untuk |
|:---|:---|:---|:---|
| `spectrum.gold` | `#FCD34D` | **14.0:1 AAA** | Draft, warning lembut |
| `spectrum.amber` | `#FBBF24` | **12.1:1 AAA** | Pending, kas belum lunas |
| `spectrum.cyan` | `#7DD3FC` | **12.1:1 AAA** | Link, tab aktif, ikon |
| `spectrum.tangerine` | `#FDBA74` | **11.9:1 AAA** | Deadline, rejected |
| `spectrum.magenta` (`orbital`) | `#F0ABFC` | **11.4:1 AAA** | Badge divisi, highlight |
| `spectrum.violet` (`orbital`) | `#C4B5FD` | **10.9:1 AAA** | Aksen brand, border glow |
| `spectrum.danger` | `#FCA5A5` | **10.6:1 AAA** | Teks error/bahaya |
| `spectrum.jade` | `#34D399` | **10.5:1 AAA** | Approved, lunas, live |
| `spectrum.mandarin` | `#FB923C` | **8.9:1 AAA** | In-production, dipinjam |
| `spectrum.cobalt` | `#60A5FA` | **7.9:1 AA** | CTA, link media |
| `studio.text.secondary` | `#CBD5E1` | **13.6:1 AAA** | Body text utama |
| `studio.text.muted` | `#94A3B8` | **7.9:1 AA** | Hint/timestamp, min 11px |

**B. Fill solid aksen + teks GELAP `ink #030712` (wajib untuk tombol & badge solid):**

| Fill | Teks | Rasio | Contoh pakai |
|:---|:---|:---|:---|
| `bg-spectrum-cobalt` | `text-ink` | **7.9:1** | Tombol primary, hover `bg-sky-400` (9.4:1) |
| `bg-spectrum-jade` | `text-ink` | **10.5:1** | Tombol setuju, hover `bg-emerald-500` (7.7:1) |
| `bg-spectrum-amber` | `text-ink` | **12.1:1** | Badge pending |
| `bg-orbital-violet` | `text-ink` | **10.9:1** | Tombol/akun khusus, hover `bg-orbital-magenta` (11.4:1) |
| `bg-spectrum-mandarin` | `text-ink` | **8.9:1** | Tombol aksi sekunder, hover `bg-orange-400` |

**C. Kombinasi TERLARANG (pernah ada di kode, sudah dihapus semua 29 titik):**

| Kombinasi | Rasio | Status |
|:---|:---|:---|
| `text-white` di atas `bg-spectrum-jade` | **1.9:1** | ❌ DILARANG — tidak terbaca sama sekali |
| `text-white` di atas `bg-spectrum-cobalt` (baru) | **2.5:1** | ❌ DILARANG |
| `text-white` di atas `bg-orbital-violet` (baru) | **~2:1** | ❌ DILARANG |
| teks `cobalt #2E63B8` (lama) di atas gelap | **~3.5:1** | ❌ DILARANG (token dihapus) |
| teks `violet #8B3DA8` (lama) di atas gelap | **~3.2:1** | ❌ DILARANG (token dihapus) |
| teks `muted #64748B` (lama) di atas gelap | **~4.2:1** | ❌ DILARANG (token diganti `#94A3B8`) |

---

### 1.2 Surface & Canvas System (Guaranteed Contrast)

```css
:root {
  /* DARK STUDIO THEME (Default - High Contrast Guaranteed) */
  --bg-cosmic: #030712;       /* Slate 950: Absolute dark canvas behind all layouts */
  --bg-surface-1: #0B132B;    /* Deep Navy: Sidebar, Topbar, Card Background */
  --bg-surface-2: #111C3B;    /* Elevated Navy: Modal, Input Field, Popover */
  --bg-surface-3: #1E293B;    /* Slate 800: Hover State, Dropdown Menu Items */
  
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-medium: rgba(255, 255, 255, 0.24);
  --border-orbital: rgba(192, 132, 252, 0.45); /* Violet subtle ring */

  --text-primary: #FFFFFF;    /* 20.1:1 — headings & key data */
  --text-secondary: #CBD5E1;  /* 13.6:1 — body text */
  --text-muted: #94A3B8;      /* 7.9:1 — hints/timestamps, min 11px, never critical info */
  --text-inverse: #030712;
}

[data-theme="light"] {
  /* CRISP BROADCAST LIGHT THEME */
  --bg-cosmic: #F8FAFC;
  --bg-surface-1: #FFFFFF;
  --bg-surface-2: #F1F5F9;
  --bg-surface-3: #E2E8F0;

  --border-subtle: rgba(15, 23, 42, 0.10);
  --border-medium: rgba(15, 23, 42, 0.20);
  --border-orbital: rgba(168, 85, 247, 0.30);

  --text-primary: #0F172A;    /* Slate 900 */
  --text-secondary: #334155;  /* Slate 700 */
  --text-muted: #64748B;      /* Slate 500 */
  --text-inverse: #FFFFFF;
}
```

---

## 2. 📱 Mobile Overflow Fix v3.2.0 (teks melewati layar — FIXED di kode)

**Temuan audit HP 360px:** 8 titik `grid-cols-2/3` tanpa breakpoint (`laporan`, `notulen`, 3 modal form) membuat kolom terjepit dan teks meluber. Tabel `min-w-[550-650px]` sudah benar karena dibungkus `overflow-x-auto`. Perbaikan yang sudah diterapkan di `app/`:

| Lokasi | Masalah | Perbaikan |
|:---|:---|:---|
| `laporan` kas boxes + 3-kolom TTD | `grid-cols-2`, `grid-cols-3` fix di 360px | `grid-cols-1 sm:grid-cols-2/3` |
| Modal form inventaris/anggota/agenda-foto | `grid-cols-2` input berdempetan | `grid-cols-1 sm:grid-cols-2` |
| `notulen` blok TTD 2 kolom | Nama panjang terjepit | `grid-cols-1 sm:grid-cols-2` |
| Semua tabel data | `min-w-[560-650px]` | Wajib dalam `.table-scroll` (scroll di dalam, halaman diam) |
| Input/select/textarea di HP | iOS auto-zoom <16px menggeser layout | `font-size: 16px` via media query `≤640px` |
| NIS, kode `BRC-xxx`, URL, timestamp | String tak terputus meluber | Utility `.break-anywhere` (`overflow-wrap: anywhere`) |

**Aturan defensif global (sudah di `app/globals.css`):**

```css
html { width: 100%; overflow-x: clip; scrollbar-gutter: stable; }
body { width: 100%; max-width: 100dvw; overflow-x: clip; min-height: 100dvh; }
/* NOTE: pakai `clip` bukan `hidden` agar position:sticky tetap jalan */
.min-w-0-guard > *, .flex > *, .grid > * { min-width: 0; }
.table-scroll { width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
.table-scroll > table { min-width: 560px; }
img, video, canvas { max-width: 100%; height: auto; }
svg { flex-shrink: 0; } /* ikon lucide tidak gepeng di flex row */
@media (max-width: 640px) { input, select, textarea { font-size: 16px !important; } }
```

**Checklist audit HP sebelum merge (wajib):** buka tiap halaman di viewport 360px → tidak ada scroll horizontal halaman (scroll hanya di dalam tabel) → semua tombol ≥44px → teks badge minimal 11px → tidak ada `grid-cols-2+` tanpa prefix `sm:`.

---

## 3. 🔤 Typography & Contrast Assurance

*   **Body Text Color:** Menggunakan `#CBD5E1` (Slate 300) pada background gelap (`#030712`), menghasilkan rasio kontras **> 13.5:1 (Jauh melampaui standar AAA)**.
*   **Muted Text Color:** Menggunakan `#94A3B8` (Slate 400), rasio kontras **> 7.2:1 (Memenuhi standar AAA untuk teks kecil)**.
*   **Heading Text:** `#FFFFFF` (Pure White), rasio kontras **> 18:1**.

---

## 4. 📐 Layout Architecture & Responsive Breakpoints

```
DESKTOP (>= 1024px)
┌──────────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR      │ TOPBAR (Active Route · Global Search · User Role Pill) │
│ (260px)      ├────────────────────────────────────────────────────────┤
│ Logo Spensa  │ MAIN WORKSPACE VIEWPORT (Max-width container, padded)  │
│ Route Links  │ - Dynamic Metrics Cards (High contrast badges)         │
│ Spectrum Bar │ - Responsive Grid / Kanban Boards                      │
└──────────────┴────────────────────────────────────────────────────────┘

MOBILE / PWA (< 768px) [Guaranteed No Horizontal Scroll]
┌───────────────────────────────────────────────────────────────────────┐
│ HEADER (Logo Mini · Divisi Badge · Menu Drawer Toggle)                │
├────────────────────────────────---------------------------------------┤
│ FLUID CONTAINER (Padding: 16px, Box-sizing: border-box)               │
│ - Stacked Metric Cards (100% width, no overflow)                      │
│ - Scrollable Horizontal Tables (.table-responsive)                    │
│ - Thumb-friendly Action Buttons (Min height 48px)                     │
├───────────────────────────────────────────────────────────────────────┤
│ BOTTOM NAVIGATION BAR (Fixed, Safe-area padded)                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 5. ⚡ UI/UX Pro Max Component Specifications (High Contrast)

### 5.1 Dual-Gate Script Approval Banner
*   **Background Card:** `#0B132B` dengan border tipis `rgba(255, 255, 255, 0.16)`.
*   **Teks Judul:** Putih terang (`#FFFFFF`), sub-teks menggunakan `#CBD5E1` agar tajam dibaca.
*   **Tombol Aksi:** Menggunakan warna *Emerald* (`#34D399`) untuk setuju dan *Tangerine* (`#FB923C`) untuk tolak, dengan teks berbobot tebal (`font-semibold` / `text-slate-950` pada tombol terang).

### 5.2 Kas Anggota Checkbox & Tunggakan Drawer
*   **Tabel Responsive:** Dibungkus dalam `.table-responsive` sehingga di layar 375px dapat digeser horizontal dengan mulus tanpa merusak layout sidebar.
*   **Checkbox Lunas:** Kotak centang berukuran minimal $24\times 24\text{px}$ dengan latar hijau emerald terang saat aktif.

---

## 6. 📄 Printable Report Design Standards (Kop Surat & TTD)

*   **Background Putih Bersih (`#FFFFFF`) untuk Dokumen Cetak:** Memastikan hasil ekspor PDF dan cetak fisik memiliki kontras hitam-putih mutlak ($21:1$) sesuai standar administrasi sekolah formal.
*   **Kop Surat:** Menggunakan garis tebal ganda `#030712`, teks institusi tajam, serta susunan 3 kolom tanda tangan di lembar akhir.

---

*DESIGN.md — Broadcast Spensa OS v3.2.0 · Verified Contrast Pairs + Mobile Overflow Fix (2026-09-11)*
