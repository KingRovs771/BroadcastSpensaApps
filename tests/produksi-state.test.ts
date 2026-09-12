import { describe, it, expect } from "vitest";
import { transitionDualGateApproval } from "../lib/utils/produksi-state";
import { ProduksiVideo } from "../lib/mock/store";

describe("Dual-Gate Script Approval State Machine (PRD Modul 01 & AC-PROD-02)", () => {
  const initialItem: ProduksiVideo = {
    id: "prod-test",
    judul: "Podcast Eksperimen Robotik",
    jenis: "podcast",
    divisi: "Kreatif",
    status: "pending_approval",
    uploaded_by: "usr-kreatif",
    uploader_name: "Kevin",
    jumlah_views: 0,
    created_at: new Date().toISOString(),
  };

  it("Pembina approves first -> Status changes to pending_ketua", () => {
    const res = transitionDualGateApproval(initialItem, "pembina", "approve", "Script disetujui");
    expect(res.status).toBe("pending_ketua");
    expect(res.approved_pembina_by).toBe("usr-pembina");
    expect(res.catatan_pembina).toBe("Script disetujui");
  });

  it("Ketua approves first -> Status changes to pending_pembina", () => {
    const res = transitionDualGateApproval(initialItem, "ketua_broadcast", "approve", "Mantap");
    expect(res.status).toBe("pending_pembina");
    expect(res.approved_ketua_by).toBe("usr-ketua-bc");
  });

  it("Pembina approves then Ketua approves -> Converges to approved state", () => {
    const step1 = transitionDualGateApproval(initialItem, "pembina", "approve");
    expect(step1.status).toBe("pending_ketua");

    const step2 = transitionDualGateApproval(step1, "ketua_broadcast", "approve");
    expect(step2.status).toBe("approved");
    expect(step2.approved_pembina_by).toBeDefined();
    expect(step2.approved_ketua_by).toBeDefined();
  });

  it("Ketua approves then Pembina approves -> Converges to approved state", () => {
    const step1 = transitionDualGateApproval(initialItem, "ketua_broadcast", "approve");
    expect(step1.status).toBe("pending_pembina");

    const step2 = transitionDualGateApproval(step1, "pembina", "approve");
    expect(step2.status).toBe("approved");
  });

  it("Either party rejecting causes immediate state: rejected", () => {
    const rejected = transitionDualGateApproval(initialItem, "pembina", "reject", "Konten belum sesuai aturan sekolah");
    expect(rejected.status).toBe("rejected");
    expect(rejected.catatan_pembina).toBe("Konten belum sesuai aturan sekolah");
  });
});
