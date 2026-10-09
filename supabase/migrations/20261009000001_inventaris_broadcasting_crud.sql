-- Izinkan seluruh anggota divisi Broadcasting melakukan CRUD inventaris
DROP POLICY IF EXISTS "Inventaris editable by Broadcasting, Sekretaris, Ketua, Admin" ON public.inventaris;
DROP POLICY IF EXISTS "Inventaris editable by Broadcasting division" ON public.inventaris;

CREATE POLICY "Inventaris editable by Broadcasting division"
ON public.inventaris FOR ALL TO authenticated
USING (
    public.get_current_role() IN ('ketua_broadcast', 'sekretaris', 'pembina', 'administrator')
    OR public.get_current_divisi() = 'Broadcasting'
)
WITH CHECK (
    public.get_current_role() IN ('ketua_broadcast', 'sekretaris', 'pembina', 'administrator')
    OR public.get_current_divisi() = 'Broadcasting'
);
