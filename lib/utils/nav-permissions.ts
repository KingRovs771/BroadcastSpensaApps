import { UserRole, DivisiName } from "../mock/store";

export interface NavItemConfig {
  label: string;
  href: string;
  badge?: string;
  allowedRoles: UserRole[];
  // If defined, user with ketua_divisi must match one of these divisions to see this menu
  allowedDivisi?: DivisiName[];
}

export const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Dashboard",
    href: "/",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
      "sekretaris",
      "bendahara",
      "div_kreatif",
      "pj",
      "anggota",
    ],
  },
  {
    label: "Produksi Dual-Gate",
    href: "/produksi",
    badge: "GATE",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
      "div_kreatif",
      "pj",
    ],
  },
  {
    label: "Buku Kas Anggota",
    href: "/kas",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "bendahara",
    ],
  },
  {
    label: "Absensi Mingguan",
    href: "/absensi",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "sekretaris",
    ],
  },
  {
    label: "Project Kanban",
    href: "/project",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
      "div_kreatif",
      "pj",
      "anggota",
    ],
  },
  {
    label: "Notulen Rapat",
    href: "/notulen",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "sekretaris",
    ],
  },
  {
    label: "Keuangan Pembina",
    href: "/keuangan-pembina",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "bendahara",
    ],
  },
  {
    label: "Agenda Foto / Lomba",
    href: "/agenda-foto",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
    ],
    // Hanya Ketua Divisi Fotografer
    allowedDivisi: ["Fotografer"],
  },
  {
    label: "Inventaris Aset",
    href: "/inventaris",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "pj",
      "ketua_divisi",
    ],
    // Hanya Ketua Divisi Broadcasting
    allowedDivisi: ["Broadcasting"],
  },
  {
    label: "Data Anggota",
    href: "/anggota",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "sekretaris",
      "bendahara",
    ],
  },
  {
    label: "Laporan Semester",
    href: "/laporan",
    allowedRoles: [
      "administrator",
      "pembina",
      "ketua_broadcast",
      "sekretaris",
    ],
  },
  {
    label: "Kelola Pengguna",
    href: "/pengguna",
    badge: "USER",
    allowedRoles: ["administrator", "pembina"],
  },
  {
    label: "Audit Log Sistem",
    href: "/audit-log",
    badge: "SEC",
    allowedRoles: ["administrator"],
  },
];

/**
 * Filter menu items strictly according to user role and department
 */
export function isRouteAllowedForUser(
  item: NavItemConfig,
  role: UserRole,
  divisi?: DivisiName
): boolean {
  if (role === "administrator") return true;

  // Semua anggota yang tergabung di Divisi Kreatif berhak mengakses modul Produksi Dual-Gate
  if (item.href === "/produksi" && (role === "div_kreatif" || divisi === "Kreatif")) {
    return true;
  }

  if (!item.allowedRoles.includes(role)) {
    return false;
  }

  // Check division scope if restricted (e.g. Agenda Foto for ketua_divisi must be Fotografer)
  if (role === "ketua_divisi" && item.allowedDivisi && item.allowedDivisi.length > 0) {
    if (!divisi || !item.allowedDivisi.includes(divisi)) {
      return false;
    }
  }

  return true;
}
