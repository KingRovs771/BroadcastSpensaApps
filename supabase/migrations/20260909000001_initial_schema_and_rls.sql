-- =====================================================================
-- Broadcast Spensa OS v3.0.0
-- Initial Database Migration: Schema & Row Level Security (RLS)
-- =====================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PROFILES & USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_divisi()
RETURNS VARCHAR AS $$
    SELECT divisi FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 2. MASTER DIVISI
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.divisi_ref (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(50) UNIQUE NOT NULL,
    ketua_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. ANGGOTA TETAP & EKSKUL
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anggota (
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

-- ---------------------------------------------------------------------
-- 4. ABSENSI MINGGUAN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.absensi (
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

-- ---------------------------------------------------------------------
-- 5. KAS SETTINGS & PEMBAYARAN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kas_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nominal INT NOT NULL CHECK (nominal > 0),
    periode_type VARCHAR(20) NOT NULL CHECK (periode_type IN ('mingguan', 'dwimingguan')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    diatur_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kas_pembayaran (
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

-- ---------------------------------------------------------------------
-- 6. KEUANGAN PEMBINA (AIR-GAPPED LEDGER)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.keuangan_pembina (
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

-- ---------------------------------------------------------------------
-- 7. NOTULEN RAPAT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notulen (
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

-- ---------------------------------------------------------------------
-- 8. AGENDA PROJECT KANBAN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project (
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

-- ---------------------------------------------------------------------
-- 9. PRODUKSI VIDEO DUAL GATE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produksi_video (
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

-- ---------------------------------------------------------------------
-- 10. AGENDA FOTO / KEJUARAAN (TEXT-ONLY)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agenda_foto (
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

-- ---------------------------------------------------------------------
-- 11. INVENTARIS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventaris (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_barang VARCHAR(200) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    kode_inventaris VARCHAR(30) UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.inventaris_peminjaman (
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

-- ---------------------------------------------------------------------
-- 12. LAPORAN ARSIP SEMESTER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laporan_arsip (
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

-- ---------------------------------------------------------------------
-- 13. AUDIT LOG (APPEND ONLY)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
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

CREATE OR REPLACE RULE no_update_audit_log AS ON UPDATE TO public.audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_log AS ON DELETE TO public.audit_log DO INSTEAD NOTHING;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisi_ref ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan_pembina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notulen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produksi_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_foto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventaris_peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_arsip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles updatable by self or admin" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.get_current_role() = 'administrator');

-- 2. Anggota RLS
CREATE POLICY "Anggota viewable by authenticated" ON public.anggota FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anggota editable by Sekretaris & Admin" ON public.anggota FOR ALL TO authenticated USING (public.get_current_role() IN ('sekretaris', 'administrator'));

-- 3. Absensi RLS
CREATE POLICY "Absensi viewable by authenticated" ON public.absensi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Absensi editable by Sekretaris & Admin" ON public.absensi FOR INSERT TO authenticated WITH CHECK (public.get_current_role() IN ('sekretaris', 'administrator'));
CREATE POLICY "Absensi holiday override by Pembina or Ketua" ON public.absensi FOR UPDATE TO authenticated USING (
    public.get_current_role() IN ('pembina', 'ketua_broadcast', 'administrator')
);

-- 4. Kas Settings RLS
CREATE POLICY "Kas Settings viewable by authenticated" ON public.kas_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kas Settings editable only by Ketua Broadcast & Admin" ON public.kas_settings FOR ALL TO authenticated USING (
    public.get_current_role() IN ('ketua_broadcast', 'administrator')
);

-- 5. Kas Pembayaran RLS
CREATE POLICY "Kas Pembayaran viewable by authenticated" ON public.kas_pembayaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kas Pembayaran editable by Bendahara & Admin" ON public.kas_pembayaran FOR ALL TO authenticated USING (
    public.get_current_role() IN ('bendahara', 'administrator')
);

-- 6. Keuangan Pembina Isolation (Zero-Leakage)
CREATE POLICY "Keuangan Pembina viewable only by privileged roles" ON public.keuangan_pembina FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('pembina', 'ketua_broadcast', 'bendahara', 'administrator')
);
CREATE POLICY "Keuangan Pembina editable exclusively by Pembina and Admin" ON public.keuangan_pembina FOR ALL TO authenticated USING (
    public.get_current_role() IN ('pembina', 'administrator')
);

-- 7. Produksi Video RLS
CREATE POLICY "Produksi viewable by all authenticated users" ON public.produksi_video FOR SELECT TO authenticated USING (true);
CREATE POLICY "Produksi insert by Kreatif, Ketua Divisi, Admin" ON public.produksi_video FOR INSERT TO authenticated WITH CHECK (
    public.get_current_role() IN ('div_kreatif', 'ketua_divisi', 'administrator')
);
CREATE POLICY "Produksi update by Authorized Roles" ON public.produksi_video FOR UPDATE TO authenticated USING (
    public.get_current_role() = 'administrator'
    OR (public.get_current_role() = 'ketua_divisi' AND divisi = public.get_current_divisi())
    OR (public.get_current_role() IN ('pembina', 'ketua_broadcast'))
    OR (auth.uid() = penanggung_jawab_id)
);

-- 8. Project RLS
CREATE POLICY "Project viewable by all authenticated users" ON public.project FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project editable by Ketua Broadcast, Admin, PJ" ON public.project FOR ALL TO authenticated USING (
    public.get_current_role() IN ('ketua_broadcast', 'administrator')
    OR auth.uid() = penanggung_jawab
);

-- 9. Agenda Foto RLS
CREATE POLICY "Agenda Foto viewable by all" ON public.agenda_foto FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agenda Foto insert by Sekretaris & Admin" ON public.agenda_foto FOR INSERT TO authenticated WITH CHECK (
    public.get_current_role() IN ('sekretaris', 'administrator')
);
CREATE POLICY "Agenda Foto update status by Ketua Fotografer" ON public.agenda_foto FOR UPDATE TO authenticated USING (
    public.get_current_role() = 'administrator'
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Fotografer')
);

-- 10. Inventaris RLS
CREATE POLICY "Inventaris viewable by all" ON public.inventaris FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventaris editable by Broadcasting, Sekretaris, Ketua, Admin" ON public.inventaris FOR ALL TO authenticated USING (
    public.get_current_role() IN ('ketua_broadcast', 'sekretaris', 'administrator')
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Broadcasting')
);

-- 11. Notulen RLS
CREATE POLICY "Notulen viewable by all" ON public.notulen FOR SELECT TO authenticated USING (true);
CREATE POLICY "Notulen insert by Sekretaris & Admin" ON public.notulen FOR INSERT TO authenticated WITH CHECK (
    public.get_current_role() IN ('sekretaris', 'administrator')
);
CREATE POLICY "Notulen finalize lock by Ketua Broadcast & Admin" ON public.notulen FOR UPDATE TO authenticated USING (
    public.get_current_role() IN ('ketua_broadcast', 'administrator', 'sekretaris')
);

-- 12. Audit Log RLS
CREATE POLICY "Audit Log viewable by privileged roles" ON public.audit_log FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('administrator', 'pembina')
);
CREATE POLICY "Audit Log insert by all authenticated" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
