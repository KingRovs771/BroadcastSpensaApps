import { KasPembayaran } from "../mock/store";

export interface KasSummary {
  totalTerkumpul: number;
  totalTertunggak: number;
  jumlahTransaksiLunas: number;
  jumlahTransaksiTertunggak: number;
}

export function calculateKasSummary(pembayaranList: KasPembayaran[]): KasSummary {
  return pembayaranList.reduce(
    (acc, curr) => {
      if (curr.status === "lunas") {
        acc.totalTerkumpul += curr.nominal;
        acc.jumlahTransaksiLunas += 1;
      } else {
        acc.totalTertunggak += curr.nominal;
        acc.jumlahTransaksiTertunggak += 1;
      }
      return acc;
    },
    {
      totalTerkumpul: 0,
      totalTertunggak: 0,
      jumlahTransaksiLunas: 0,
      jumlahTransaksiTertunggak: 0,
    }
  );
}

export function getAnggotaTunggakan(
  pembayaranList: KasPembayaran[],
  anggotaId: string
): KasPembayaran[] {
  return pembayaranList.filter(
    (item) => item.anggota_id === anggotaId && item.status === "belum"
  );
}

export interface GeneratedKasPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  label: string; // e.g. "D1 Jul 2026", "W1 Jul", "Bulan Jul 2026"
}

export function generateKasPeriodsBetween(
  effectiveFrom: string,
  periodeType: "mingguan" | "dwimingguan" | "bulanan",
  referenceDate: Date = new Date()
): GeneratedKasPeriod[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const effParts = (effectiveFrom || "").split("-");
  let startYear = parseInt(effParts[0], 10);
  let startMonth = parseInt(effParts[1], 10);

  if (isNaN(startYear) || isNaN(startMonth) || startMonth < 1 || startMonth > 12) {
    startYear = referenceDate.getFullYear();
    startMonth = referenceDate.getMonth() + 1;
  }

  const curYear = referenceDate.getFullYear();
  const curMonth = referenceDate.getMonth() + 1;
  const curDate = referenceDate.getDate();

  let endYear = curYear;
  let endMonth = curMonth;
  // Jika effective_from di masa depan, batasi ke bulan effective_from
  if (startYear > curYear || (startYear === curYear && startMonth > curMonth)) {
    endYear = startYear;
    endMonth = startMonth;
  }

  const periods: GeneratedKasPeriod[] = [];

  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    const lastDay = new Date(y, m, 0).getDate();
    const monthStr = monthNames[m - 1];
    const isCurrentMonth = y === curYear && m === curMonth;

    if (periodeType === "bulanan") {
      periods.push({
        start: `${y}-${pad(m)}-01`,
        end: `${y}-${pad(m)}-${pad(lastDay)}`,
        label: `Bulan ${monthStr} ${y}`,
      });
    } else if (periodeType === "dwimingguan") {
      periods.push({
        start: `${y}-${pad(m)}-01`,
        end: `${y}-${pad(m)}-14`,
        label: `D1 ${monthStr} ${y}`,
      });
      if (!isCurrentMonth || curDate >= 15) {
        periods.push({
          start: `${y}-${pad(m)}-15`,
          end: `${y}-${pad(m)}-${pad(lastDay)}`,
          label: `D2 ${monthStr} ${y}`,
        });
      }
    } else {
      // mingguan
      periods.push({
        start: `${y}-${pad(m)}-01`,
        end: `${y}-${pad(m)}-07`,
        label: `W1 ${monthStr}`,
      });
      if (!isCurrentMonth || curDate >= 8) {
        periods.push({
          start: `${y}-${pad(m)}-08`,
          end: `${y}-${pad(m)}-14`,
          label: `W2 ${monthStr}`,
        });
      }
      if (!isCurrentMonth || curDate >= 15) {
        periods.push({
          start: `${y}-${pad(m)}-15`,
          end: `${y}-${pad(m)}-21`,
          label: `W3 ${monthStr}`,
        });
      }
      if (!isCurrentMonth || curDate >= 22) {
        periods.push({
          start: `${y}-${pad(m)}-22`,
          end: `${y}-${pad(m)}-${pad(lastDay)}`,
          label: `W4 ${monthStr}`,
        });
      }
    }

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return periods;
}
