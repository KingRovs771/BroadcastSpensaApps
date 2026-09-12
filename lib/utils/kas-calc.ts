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
