export type UserRole =
  | "administrator"
  | "pembina"
  | "ketua_broadcast"
  | "ketua_divisi"
  | "sekretaris"
  | "bendahara"
  | "div_kreatif"
  | "pj"
  | "anggota";

export type DivisiName =
  | "Kreatif"
  | "Presenter"
  | "Fotografer"
  | "Videografer"
  | "Broadcasting"
  | "Editor"
  | "Promosi Digital";

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  divisi?: DivisiName;
  signature_url?: string;
}

export interface AnggotaRecord {
  id: string;
  tipe: "tetap" | "ekskul";
  nama_lengkap: string;
  nis: string;
  nisn?: string;
  kelas: string;
  jabatan: string;
  divisi?: DivisiName;
  tahun_ajaran: string;
  status: "aktif" | "cuti" | "lulus" | "nonaktif";
  no_hp?: string;
  catatan?: string;
}

export interface AbsensiRecord {
  id: string;
  anggota_id: string;
  anggota_tipe: "tetap" | "ekskul";
  tanggal: string; // YYYY-MM-DD
  pertemuan_ke: number;
  status: "masuk" | "izin" | "sakit" | "alpha";
  keterangan?: string;
  is_libur: boolean;
  libur_oleh?: string;
  libur_alasan?: string;
  dicatat_oleh?: string;
}

export interface KasSettings {
  nominal: number;
  periode_type: "mingguan" | "dwimingguan";
  effective_from: string;
}

export interface KasPembayaran {
  id: string;
  anggota_id: string;
  periode_start: string;
  periode_end: string;
  periode_label: string; // e.g. "Minggu 1 (Sep 2026)"
  nominal: number;
  status: "lunas" | "belum";
  tanggal_bayar?: string;
  dicatat_oleh?: string;
}

export interface ProduksiVideo {
  id: string;
  judul: string;
  jenis: "podcast" | "video" | "liputan" | "live";
  script_text?: string;
  pertanyaan_podcast?: string;
  status:
    | "pending_approval"
    | "pending_pembina"
    | "pending_ketua"
    | "approved"
    | "rejected"
    | "in_production"
    | "pending_divisi"
    | "done"
    | "published";
  divisi: DivisiName;
  uploaded_by: string;
  uploader_name: string;
  approved_pembina_by?: string;
  approved_pembina_at?: string;
  approved_ketua_by?: string;
  approved_ketua_at?: string;
  penanggung_jawab_id?: string;
  pj_name?: string;
  thumbnail_url?: string;
  video_url?: string;
  audio_url?: string;
  jumlah_views: number;
  published_at?: string;
  catatan_pembina?: string;
  catatan_ketua?: string;
  catatan_ketua_divisi?: string;
  created_at: string;
}

export interface ProjectKanban {
  id: string;
  nama_project: string;
  deskripsi?: string;
  penanggung_jawab: string;
  pj_name: string;
  tim: string[];
  deadline?: string;
  status: "perencanaan" | "proses" | "selesai" | "tunda";
  progress: number;
  link_drive?: string;
  divisi: DivisiName;
  jumlah_views: number;
  published_at?: string;
  created_at: string;
}

export interface AgendaFoto {
  id: string;
  nama_siswa: string;
  kelas: string;
  kejuaraan: string;
  tingkat: "sekolah" | "kecamatan" | "kabupaten" | "kota" | "provinsi" | "nasional";
  tanggal: string;
  status: "belum" | "sudah";
  keterangan?: string;
  divisi: "Fotografer";
}

export interface InventarisItem {
  id: string;
  nama_barang: string;
  kategori: string;
  kode_inventaris: string;
  jumlah: number;
  kondisi: "baik" | "rusak ringan" | "rusak berat" | "hilang";
  lokasi_simpan: string;
  divisi: DivisiName;
  status: "tersedia" | "dipinjam";
  peminjam_nama?: string;
}

export interface NotulenItem {
  id: string;
  judul: string;
  tanggal_rapat: string;
  tempat: string;
  agenda: string;
  isi_notulen: string;
  keputusan: string;
  status: "draft" | "final";
  dibuat_oleh: string;
  disetujui_oleh?: string;
  disetujui_at?: string;
}

export interface KeuanganPembinaItem {
  id: string;
  tanggal: string;
  sumber_dana: "BOS" | "Dana Sekolah" | "Sponsor";
  keterangan: string;
  pemasukan: number;
  pengeluaran: number;
  catatan_pembina?: string;
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  divisi?: string;
  action: string;
  target_table: string;
  target_id?: string;
  details?: string;
  extra_json?: Record<string, any>;
  timestamp: string;
}

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "audit-init-01",
    actor_id: "usr-admin",
    actor_name: "Bpk. Irawan Kurnia, M.Kom",
    actor_role: "administrator",
    action: "SYSTEM_INITIALIZE",
    target_table: "system",
    details: "Inisialisasi core broadcast OS v3.0.0 & sinkronisasi skema basis data Supabase",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    extra_json: { ip: "127.0.0.1", platform: "Next.js App Router", version: "3.0.0" },
  },
  {
    id: "audit-init-02",
    actor_id: "usr-admin",
    actor_name: "Bpk. Irawan Kurnia, M.Kom",
    actor_role: "administrator",
    action: "REGISTER_USER",
    target_table: "profiles",
    details: "Mendaftarkan akun baru: Dra. Hj. Endang Sulastri (Dewan Pembina)",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    extra_json: { email: "endang@spensa.sch.id", role: "pembina" },
  },
  {
    id: "audit-init-03",
    actor_id: "usr-bendahara",
    actor_name: "Zahra Aulia",
    actor_role: "bendahara",
    action: "BAYAR_KAS",
    target_table: "kas_pembayaran",
    details: "Mencatat setoran iuran kas mingguan periode September 2026",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    extra_json: { nominal: 2000, jumlah_siswa: 15 },
  },
  {
    id: "audit-init-04",
    actor_id: "usr-kreatif",
    actor_name: "Fadhil Muhammad",
    actor_role: "div_kreatif",
    divisi: "Kreatif",
    action: "UPDATE_PRODUKSI",
    target_table: "produksi_video",
    details: "Mengajukan naskah kurasi Gate 1: Profil Ekstrakurikuler Spensa 2026",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    extra_json: { status: "review_pembina", gate: 1 },
  },
  {
    id: "audit-init-05",
    actor_id: "usr-admin",
    actor_name: "Bpk. Irawan Kurnia, M.Kom",
    actor_role: "administrator",
    action: "RESET_PASSWORD",
    target_table: "auth.users",
    details: "Melakukan reset kata sandi mandiri akun pengguna: zahra@spensa.sch.id",
    timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
    extra_json: { target_email: "zahra@spensa.sch.id", method: "admin_override" },
  },
];

// ---------------------------------------------------------------------
// MOCK DATA INITIALIZATION
// ---------------------------------------------------------------------

export const MOCK_USERS: UserProfile[] = [
  {
    id: "usr-admin",
    nama: "Bpk. Irawan Kurnia, M.Kom",
    email: "admin@spensa.sch.id",
    role: "administrator",
  },
  {
    id: "usr-pembina",
    nama: "Bpk. Haryanto, S.Pd",
    email: "pembina.broadcast@spensa.sch.id",
    role: "pembina",
    signature_url: "https://api.dicebear.com/7.x/initials/svg?seed=Haryanto",
  },
  {
    id: "usr-ketua-bc",
    nama: "Raditya Pratama",
    email: "raditya.ketua@spensa.sch.id",
    role: "ketua_broadcast",
    signature_url: "https://api.dicebear.com/7.x/initials/svg?seed=Raditya",
  },
  {
    id: "usr-ketua-kreatif",
    nama: "Cindy Claudia",
    email: "cindy.kreatif@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Kreatif",
  },
  {
    id: "usr-ketua-presenter",
    nama: "Nadia Zahra",
    email: "nadia.presenter@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Presenter",
  },
  {
    id: "usr-ketua-foto",
    nama: "Anisa Rahma",
    email: "anisa.foto@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Fotografer",
  },
  {
    id: "usr-ketua-video",
    nama: "Dimas Anggara",
    email: "dimas.videografer@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Videografer",
  },
  {
    id: "usr-ketua-bc-div",
    nama: "Bima Sakti",
    email: "bima.broadcasting@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Broadcasting",
  },
  {
    id: "usr-ketua-editor",
    nama: "Rio Firmansyah",
    email: "rio.editor@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Editor",
  },
  {
    id: "usr-ketua-promosi",
    nama: "Jessica Vania",
    email: "jessica.promosi@spensa.sch.id",
    role: "ketua_divisi",
    divisi: "Promosi Digital",
  },
  {
    id: "usr-sekretaris",
    nama: "Nabila Syakieb",
    email: "nabila.sekretaris@spensa.sch.id",
    role: "sekretaris",
    signature_url: "https://api.dicebear.com/7.x/initials/svg?seed=Nabila",
  },
  {
    id: "usr-bendahara",
    nama: "Farhan Maulana",
    email: "farhan.bendahara@spensa.sch.id",
    role: "bendahara",
  },
  {
    id: "usr-kreatif",
    nama: "Kevin Sanjaya",
    email: "kevin.kreatif@spensa.sch.id",
    role: "div_kreatif",
    divisi: "Kreatif",
  },
  {
    id: "usr-pj",
    nama: "Zidan Al-Ghifari",
    email: "zidan.pj@spensa.sch.id",
    role: "pj",
    divisi: "Videografer",
  },
  {
    id: "usr-anggota",
    nama: "Tiara Andini",
    email: "tiara.anggota@spensa.sch.id",
    role: "anggota",
    divisi: "Presenter",
  },
];

export const INITIAL_ANGGOTA: AnggotaRecord[] = [
  {
    id: "ang-01",
    tipe: "tetap",
    nama_lengkap: "Raditya Pratama",
    nis: "89201",
    nisn: "0081234501",
    kelas: "IX-A",
    jabatan: "Ketua Broadcast",
    divisi: "Broadcasting",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567801",
  },
  {
    id: "ang-02",
    tipe: "tetap",
    nama_lengkap: "Nabila Syakieb",
    nis: "89202",
    nisn: "0081234502",
    kelas: "IX-B",
    jabatan: "Sekretaris",
    divisi: "Kreatif",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567802",
  },
  {
    id: "ang-03",
    tipe: "tetap",
    nama_lengkap: "Farhan Maulana",
    nis: "89203",
    nisn: "0081234503",
    kelas: "IX-C",
    jabatan: "Bendahara",
    divisi: "Promosi Digital",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567803",
  },
  {
    id: "ang-04",
    tipe: "tetap",
    nama_lengkap: "Anisa Rahma",
    nis: "89204",
    nisn: "0081234504",
    kelas: "IX-D",
    jabatan: "Ketua Divisi Fotografer",
    divisi: "Fotografer",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567804",
  },
  {
    id: "ang-05",
    tipe: "tetap",
    nama_lengkap: "Bima Sakti",
    nis: "89205",
    nisn: "0081234505",
    kelas: "IX-E",
    jabatan: "Ketua Divisi Broadcasting",
    divisi: "Broadcasting",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567805",
  },
  {
    id: "ang-kc-kreatif",
    tipe: "tetap",
    nama_lengkap: "Cindy Claudia",
    nis: "89206",
    nisn: "0081234506",
    kelas: "IX-C",
    jabatan: "Ketua Divisi Kreatif",
    divisi: "Kreatif",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567806",
  },
  {
    id: "ang-kc-presenter",
    tipe: "tetap",
    nama_lengkap: "Nadia Zahra",
    nis: "89207",
    nisn: "0081234507",
    kelas: "IX-B",
    jabatan: "Ketua Divisi Presenter",
    divisi: "Presenter",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567807",
  },
  {
    id: "ang-kc-video",
    tipe: "tetap",
    nama_lengkap: "Dimas Anggara",
    nis: "89208",
    nisn: "0081234508",
    kelas: "IX-F",
    jabatan: "Ketua Divisi Videografer",
    divisi: "Videografer",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567808",
  },
  {
    id: "ang-kc-editor",
    tipe: "tetap",
    nama_lengkap: "Rio Firmansyah",
    nis: "89209",
    nisn: "0081234509",
    kelas: "IX-A",
    jabatan: "Ketua Divisi Editor",
    divisi: "Editor",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567809",
  },
  {
    id: "ang-kc-promosi",
    tipe: "tetap",
    nama_lengkap: "Jessica Vania",
    nis: "89210",
    nisn: "0081234510",
    kelas: "IX-D",
    jabatan: "Ketua Divisi Promosi Digital",
    divisi: "Promosi Digital",
    tahun_ajaran: "2026/2027",
    status: "aktif",
    no_hp: "081234567810",
  },
  {
    id: "ang-06",
    tipe: "ekskul",
    nama_lengkap: "Tiara Andini",
    nis: "89301",
    kelas: "VIII-A",
    jabatan: "Anggota",
    divisi: "Presenter",
    tahun_ajaran: "2026/2027",
    status: "aktif",
  },
  {
    id: "ang-07",
    tipe: "ekskul",
    nama_lengkap: "Kevin Sanjaya",
    nis: "89302",
    kelas: "VIII-B",
    jabatan: "Anggota",
    divisi: "Kreatif",
    tahun_ajaran: "2026/2027",
    status: "aktif",
  },
  {
    id: "ang-08",
    tipe: "ekskul",
    nama_lengkap: "Zidan Al-Ghifari",
    nis: "89303",
    kelas: "VIII-C",
    jabatan: "Anggota",
    divisi: "Videografer",
    tahun_ajaran: "2026/2027",
    status: "aktif",
  },
];

export const INITIAL_KAS_SETTINGS: KasSettings = {
  nominal: 5000,
  periode_type: "mingguan",
  effective_from: "2026-08-01",
};

export const INITIAL_KAS_PEMBAYARAN: KasPembayaran[] = [
  // W1 (Aug)
  { id: "kas-1", anggota_id: "ang-01", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "Minggu 1 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-04" },
  { id: "kas-2", anggota_id: "ang-02", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "Minggu 1 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-04" },
  { id: "kas-3", anggota_id: "ang-03", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "Minggu 1 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-05" },
  { id: "kas-4", anggota_id: "ang-04", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "Minggu 1 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-05" },
  { id: "kas-5", anggota_id: "ang-05", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "Minggu 1 (Agt)", nominal: 5000, status: "belum" }, // Tertunggak W1
  // W2 (Aug)
  { id: "kas-6", anggota_id: "ang-01", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "Minggu 2 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-11" },
  { id: "kas-7", anggota_id: "ang-02", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "Minggu 2 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-12" },
  { id: "kas-8", anggota_id: "ang-03", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "Minggu 2 (Agt)", nominal: 5000, status: "belum" }, // Tertunggak W2
  { id: "kas-9", anggota_id: "ang-04", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "Minggu 2 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-12" },
  { id: "kas-10", anggota_id: "ang-05", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "Minggu 2 (Agt)", nominal: 5000, status: "belum" }, // Tertunggak W2
  // W3 (Aug)
  { id: "kas-11", anggota_id: "ang-01", periode_start: "2026-08-17", periode_end: "2026-08-23", periode_label: "Minggu 3 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-18" },
  { id: "kas-12", anggota_id: "ang-02", periode_start: "2026-08-17", periode_end: "2026-08-23", periode_label: "Minggu 3 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-18" },
  { id: "kas-13", anggota_id: "ang-03", periode_start: "2026-08-17", periode_end: "2026-08-23", periode_label: "Minggu 3 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-19" },
  { id: "kas-14", anggota_id: "ang-04", periode_start: "2026-08-17", periode_end: "2026-08-23", periode_label: "Minggu 3 (Agt)", nominal: 5000, status: "lunas", tanggal_bayar: "2026-08-19" },
  { id: "kas-15", anggota_id: "ang-05", periode_start: "2026-08-17", periode_end: "2026-08-23", periode_label: "Minggu 3 (Agt)", nominal: 5000, status: "belum" }, // Tertunggak W3
];

export const INITIAL_PRODUKSI: ProduksiVideo[] = [
  {
    id: "prod-01",
    judul: 'Podcast Episode 04: "Kiprah Juara Robotik Spensa Menuju Kancah Nasional"',
    jenis: "podcast",
    divisi: "Kreatif",
    status: "pending_ketua",
    uploaded_by: "usr-kreatif",
    uploader_name: "Kevin Sanjaya",
    pertanyaan_podcast: "1. Bagaimana awal mula tim robotik Spensa terbentuk?\n2. Apa tantangan utama saat perakitan sensor micro-controller?\n3. Pesan apa yang ingin disampaikan untuk adik-adik kelas 7?",
    approved_pembina_by: "usr-pembina",
    approved_pembina_at: "2026-09-02T10:14:00Z",
    catatan_pembina: "Topik sangat inspiratif, pertajam pertanyaan nomor 2 agar lebih mudah dipahami siswa umum.",
    jumlah_views: 0,
    created_at: "2026-09-01T08:30:00Z",
  },
  {
    id: "prod-02",
    judul: "Liputan Dokumenter: Semarak Peringatan Hari Kemerdekaan RI ke-81 di Spensa",
    jenis: "liputan",
    divisi: "Videografer",
    status: "in_production",
    uploaded_by: "usr-kreatif",
    uploader_name: "Kevin Sanjaya",
    script_text: "Suasana pagi di lapangan utama SMP Negeri 1 Spensa tampak begitu megah. Ratusan siswa berbaris rapi dengan balutan seragam putih biru dan ornamen merah putih. Paskibra Spensa mengibarkan Sang Saka Merah Putih dengan langkah tegap dan penuh dedikasi. Kami mengajak Anda menyimak kilas balik momen bersejarah ini.",
    approved_pembina_by: "usr-pembina",
    approved_pembina_at: "2026-08-18T09:00:00Z",
    approved_ketua_by: "usr-ketua-bc",
    approved_ketua_at: "2026-08-18T14:30:00Z",
    penanggung_jawab_id: "usr-pj",
    pj_name: "Zidan Al-Ghifari",
    jumlah_views: 0,
    created_at: "2026-08-17T11:00:00Z",
  },
  {
    id: "prod-03",
    judul: 'Spensa Profile Video 2026: "Tradisi Berprestasi & Inovasi Tiada Henti"',
    jenis: "video",
    divisi: "Videografer",
    status: "published",
    uploaded_by: "usr-kreatif",
    uploader_name: "Kevin Sanjaya",
    script_text: "Selamat datang di SMP Negeri 1 Spensa, rumah bagi para talenta muda, calon pemimpin bangsa. Berdiri sejak tahun 1950, kami terus bertransformasi mengintegrasikan nilai akademik luhur dengan keunggulan teknologi media masa depan.",
    approved_pembina_by: "usr-pembina",
    approved_pembina_at: "2026-07-02T08:00:00Z",
    approved_ketua_by: "usr-ketua-bc",
    approved_ketua_at: "2026-07-02T10:00:00Z",
    penanggung_jawab_id: "usr-pj",
    pj_name: "Zidan Al-Ghifari",
    thumbnail_url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800",
    video_url: "https://youtube.com/watch?v=mock-spensa-profile-2026",
    jumlah_views: 14500,
    published_at: "2026-07-04",
    created_at: "2026-07-01T07:00:00Z",
  },
];

export const INITIAL_PROJECTS: ProjectKanban[] = [
  {
    id: "proj-01",
    nama_project: "Liputan Khusus Dies Natalis Spensa ke-75",
    deskripsi: "Dokumentasi multikamera upacara agung, temu alumni lintas angkatan, dan pameran karya ilmiah.",
    penanggung_jawab: "usr-pj",
    pj_name: "Zidan Al-Ghifari",
    tim: ["usr-kreatif", "usr-ketua-foto", "usr-ketua-bc-div"],
    deadline: "2026-10-15",
    status: "perencanaan",
    progress: 25,
    link_drive: "https://drive.google.com/drive/folders/spensa-diesnatalis-75",
    divisi: "Broadcasting",
    jumlah_views: 0,
    created_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "proj-02",
    nama_project: "Serial Mini Dokumenter Ekstrakurikuler Spensa",
    deskripsi: "Profil 12 ekstrakurikuler unggulan untuk masa pengenalan lingkungan sekolah siswa baru.",
    penanggung_jawab: "usr-pj",
    pj_name: "Zidan Al-Ghifari",
    tim: ["usr-kreatif", "usr-anggota"],
    deadline: "2026-09-28",
    status: "proses",
    progress: 60,
    link_drive: "https://drive.google.com/drive/folders/spensa-mini-doc-ekskul",
    divisi: "Videografer",
    jumlah_views: 3200,
    created_at: "2026-08-20T09:00:00Z",
  },
  {
    id: "proj-03",
    nama_project: "Live Streaming Pemilihan Ketua OSIS (Pilkasis) 2026",
    deskripsi: "Broadcast live 3 angle kamera debat kandidat dan perhitungan suara real-time via YouTube Live.",
    penanggung_jawab: "usr-ketua-bc-div",
    pj_name: "Bima Sakti",
    tim: ["usr-pj", "usr-ketua-foto"],
    deadline: "2026-08-25",
    status: "selesai",
    progress: 100,
    link_drive: "https://drive.google.com/drive/folders/spensa-pilkasis-live-2026",
    divisi: "Broadcasting",
    jumlah_views: 8900,
    published_at: "2026-08-25",
    created_at: "2026-08-10T08:00:00Z",
  },
];

export const INITIAL_AGENDA_FOTO: AgendaFoto[] = [
  {
    id: "foto-01",
    nama_siswa: "Ahmad Fauzi & Tim",
    kelas: "IX-A",
    kejuaraan: "Olimpiade Sains Nasional (OSN) Bidang Fisika",
    tingkat: "nasional",
    tanggal: "2026-09-15",
    status: "belum",
    keterangan: "Liputan foto pengalungan medali dan portofolio wawancara kepala sekolah.",
    divisi: "Fotografer",
  },
  {
    id: "foto-02",
    nama_siswa: "Clarissa Putri",
    kelas: "VIII-D",
    kejuaraan: "Lomba Story Telling Bahasa Inggris Tingkat Provinsi",
    tingkat: "provinsi",
    tanggal: "2026-08-28",
    status: "sudah",
    keterangan: "Dokumentasi stage performance dan foto bersama trofi juara 1.",
    divisi: "Fotografer",
  },
  {
    id: "foto-03",
    nama_siswa: "Tim Paduan Suara Spensa",
    kelas: "Lintas Kelas",
    kejuaraan: "Festival Seni Suara Pelajar Kota",
    tingkat: "kota",
    tanggal: "2026-08-14",
    status: "sudah",
    keterangan: "Foto panggung lighting studio dan penyerahan piagam penghargaan.",
    divisi: "Fotografer",
  },
];

export const INITIAL_INVENTARIS: InventarisItem[] = [
  {
    id: "inv-01",
    nama_barang: "Sony Alpha 7 IV Mirrorless Camera",
    kategori: "Kamera",
    kode_inventaris: "BRC-VID-001",
    jumlah: 2,
    kondisi: "baik",
    lokasi_simpan: "Lemari Dry Cabinet Studio A",
    divisi: "Videografer",
    status: "tersedia",
  },
  {
    id: "inv-02",
    nama_barang: "Rode Wireless PRO Dual Transmitter Mic",
    kategori: "Audio",
    kode_inventaris: "BRC-AUD-003",
    jumlah: 1,
    kondisi: "baik",
    lokasi_simpan: "Rak Audio Studio B",
    divisi: "Broadcasting",
    status: "dipinjam",
    peminjam_nama: "Zidan Al-Ghifari (Liputan Kemerdekaan)",
  },
  {
    id: "inv-03",
    nama_barang: "Blackmagic ATEM Mini Pro Switcher",
    kategori: "Live Switcher",
    kode_inventaris: "BRC-BC-002",
    jumlah: 1,
    kondisi: "baik",
    lokasi_simpan: "Meja Master Control Room (MCR)",
    divisi: "Broadcasting",
    status: "tersedia",
  },
  {
    id: "inv-04",
    nama_barang: "Aputure Amaran 200d LED Studio Light",
    kategori: "Lighting",
    kode_inventaris: "BRC-LGT-005",
    jumlah: 3,
    kondisi: "baik",
    lokasi_simpan: "Studio Utama Lantai 2",
    divisi: "Broadcasting",
    status: "tersedia",
  },
];

export const INITIAL_NOTULEN: NotulenItem[] = [
  {
    id: "not-01",
    judul: "Rapat Evaluasi Pra-Produksi Liputan Hari Kemerdekaan & Penataan Jadwal Studio",
    tanggal_rapat: "2026-08-15",
    tempat: "Studio Broadcast Spensa Lt. 2",
    agenda: "1. Pembagian kru kamera upacara\n2. Cek kesiapan baterai & memory card\n3. Target upload H+1",
    isi_notulen: "Rapat dihadiri oleh 18 kru inti. Disepakati bahwa Divisi Videografer membagi 3 pos kamera: Pos Panggung VIP, Pos Pasukan Pengibar, dan Pos Paduan Suara. Naskah disetujui Pembina.",
    keputusan: "Semua memori di-format ulang sebelum hari H. Zidan bertindak sebagai PJ Koordinator Lapangan.",
    status: "final",
    dibuat_oleh: "Nabila Syakieb (Sekretaris)",
    disetujui_oleh: "Raditya Pratama (Ketua)",
    disetujui_at: "2026-08-15T16:00:00Z",
  },
  {
    id: "not-02",
    judul: "Rapat Koordinasi Perencanaan Podcast Spesial Hari Guru Nasional 2026",
    tanggal_rapat: "2026-09-05",
    tempat: "Ruang Media Spensa",
    agenda: "Brainstorming daftar pertanyaan dan seleksi narasumber guru senior Spensa.",
    isi_notulen: "Tim kreatif mengusulkan 3 nominasi narasumber guru berprestasi. Format podcast dirancang semi-formal dengan durasi 20-25 menit.",
    keputusan: "Menunggu finalisasi script dari tim kreatif untuk disubmit ke sistem approval.",
    status: "draft",
    dibuat_oleh: "Nabila Syakieb (Sekretaris)",
  },
];

export const INITIAL_KEUANGAN_PEMBINA: KeuanganPembinaItem[] = [
  {
    id: "kp-01",
    tanggal: "2026-08-01",
    sumber_dana: "BOS",
    keterangan: "Alokasi Dana Operasional Ekstrakurikuler Media Semester Ganjil TA 2026/2027",
    pemasukan: 15000000,
    pengeluaran: 0,
    catatan_pembina: "Pencairan Tahap 1 dari Bendahara Sekolah Spensa.",
  },
  {
    id: "kp-02",
    tanggal: "2026-08-10",
    sumber_dana: "BOS",
    keterangan: "Pembelian 2 Unit SSD Eksternal Sandisk Extreme 1TB untuk Storage Master Video",
    pemasukan: 0,
    pengeluaran: 3200000,
    catatan_pembina: "Nota resmi toko terlampir di file arsip pembina.",
  },
  {
    id: "kp-03",
    tanggal: "2026-08-22",
    sumber_dana: "Sponsor",
    keterangan: "Dana Bantuan Sponsor Komite Sekolah untuk Pengadaan Backdrop Studio Baru",
    pemasukan: 5000000,
    pengeluaran: 0,
    catatan_pembina: "Bantuan komite disetujui Kepala Sekolah.",
  },
];

export const INITIAL_ABSENSI: AbsensiRecord[] = [
  { id: "ab-01", anggota_id: "ang-01", anggota_tipe: "tetap", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
  { id: "ab-02", anggota_id: "ang-02", anggota_tipe: "tetap", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
  { id: "ab-03", anggota_id: "ang-03", anggota_tipe: "tetap", tanggal: "2026-08-08", pertemuan_ke: 1, status: "izin", keterangan: "Lomba olimpiade", is_libur: false },
  { id: "ab-04", anggota_id: "ang-04", anggota_tipe: "tetap", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
  { id: "ab-05", anggota_id: "ang-05", anggota_tipe: "tetap", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
  { id: "ab-06", anggota_id: "ang-06", anggota_tipe: "ekskul", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
  { id: "ab-07", anggota_id: "ang-07", anggota_tipe: "ekskul", tanggal: "2026-08-08", pertemuan_ke: 1, status: "sakit", keterangan: "Demam", is_libur: false },
  { id: "ab-08", anggota_id: "ang-08", anggota_tipe: "ekskul", tanggal: "2026-08-08", pertemuan_ke: 1, status: "masuk", is_libur: false },
];
