-- Sekretaris sebelumnya hanya punya INSERT pada absensi, sehingga upsert (UPDATE)
-- saat mengubah status kehadiran ditolak oleh RLS (hanya bisa input 1x).
DROP POLICY IF EXISTS "Absensi holiday override by Pembina or Ketua" ON public.absensi;
DROP POLICY IF EXISTS "Absensi update by Sekretaris, Pembina, Ketua & Admin" ON public.absensi;
DROP POLICY IF EXISTS "Absensi delete by Pembina, Ketua & Admin" ON public.absensi;

CREATE POLICY "Absensi update by Sekretaris, Pembina, Ketua & Admin"
ON public.absensi FOR UPDATE TO authenticated
USING (
    public.get_current_role() IN ('sekretaris', 'pembina', 'ketua_broadcast', 'administrator')
)
WITH CHECK (
    public.get_current_role() IN ('sekretaris', 'pembina', 'ketua_broadcast', 'administrator')
);

-- Pembatalan pekan libur (DELETE) oleh Pembina/Ketua/Admin
CREATE POLICY "Absensi delete by Pembina, Ketua & Admin"
ON public.absensi FOR DELETE TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'ketua_broadcast', 'administrator')
);
