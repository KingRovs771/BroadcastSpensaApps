import { InventarisItem, DivisiName } from "@/lib/mock/store";

/**
 * Menghasilkan prefix standar penomoran BRC berdasarkan divisi pemegang dan kategori perangkat.
 * Format standar Broadcast Spensa:
 * - Videografer / Kamera: VID
 * - Fotografer / Foto: FOT
 * - Broadcasting / Switcher / MCR: BC
 * - Audio / Mic / Sound: AUD
 * - Lighting / Lampu: LGT
 * - Editor: EDT
 * - Presenter: PRS
 * - Kreatif: KRT
 * - Promosi Digital: PRM
 */
export function getPrefixForInventaris(divisi: DivisiName, kategori: string): string {
  const katLower = (kategori || "").toLowerCase().trim();

  // Deteksi berbasis kata kunci kategori jika lebih spesifik
  if (
    katLower.includes("audio") ||
    katLower.includes("mic") ||
    katLower.includes("sound") ||
    katLower.includes("headphone") ||
    katLower.includes("clip on") ||
    katLower.includes("wireless pro")
  ) {
    return "AUD";
  }

  if (
    katLower.includes("light") ||
    katLower.includes("lampu") ||
    katLower.includes("softbox") ||
    katLower.includes("ring light") ||
    katLower.includes("amaran") ||
    katLower.includes("aputure")
  ) {
    return "LGT";
  }

  if (
    katLower.includes("switcher") ||
    katLower.includes("atem") ||
    katLower.includes("kabel hdmi") ||
    katLower.includes("capture card")
  ) {
    return "BC";
  }

  if (divisi === "Videografer") return "VID";
  if (divisi === "Fotografer") return "FOT";
  if (divisi === "Broadcasting") return "BC";
  if (divisi === "Editor") return "EDT";
  if (divisi === "Kreatif") return "KRT";
  if (divisi === "Presenter") return "PRS";
  if (divisi === "Promosi Digital") return "PRM";

  return "AST";
}

/**
 * Menghasilkan kode tagging otomatis terstandarisasi BRC-[PREFIX]-[001]
 * yang dijamin unik dan tidak bentrok dengan aset yang sudah terdaftar sebelumnya.
 */
export function generateAutoKodeInventaris(
  existingItems: InventarisItem[],
  divisi: DivisiName,
  kategori: string
): string {
  const prefix = getPrefixForInventaris(divisi, kategori);
  const pattern = new RegExp(`^BRC-${prefix}-(\\d+)`, "i");
  let maxNum = 0;

  for (const item of existingItems) {
    if (!item.kode_inventaris) continue;
    const match = item.kode_inventaris.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `BRC-${prefix}-${String(nextNum).padStart(3, "0")}`;

  // Double check pencegahan bentrok dengan aset apa pun
  const allCodes = new Set(
    existingItems.map((i) => (i.kode_inventaris || "").toUpperCase().trim())
  );

  while (allCodes.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `BRC-${prefix}-${String(nextNum).padStart(3, "0")}`;
  }

  return candidate;
}
