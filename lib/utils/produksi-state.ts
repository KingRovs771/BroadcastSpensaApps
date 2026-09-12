import { ProduksiVideo } from "../mock/store";

export type ApprovalActor = "pembina" | "ketua_broadcast";

/**
 * Pure state machine transition logic for Dual-Gate Production Approval
 */
export function transitionDualGateApproval(
  current: ProduksiVideo,
  actor: ApprovalActor,
  decision: "approve" | "reject",
  catatan?: string
): ProduksiVideo {
  if (decision === "reject") {
    return {
      ...current,
      status: "rejected",
      ...(actor === "pembina" ? { catatan_pembina: catatan } : { catatan_ketua: catatan }),
    };
  }

  // Decision is approve
  if (actor === "pembina") {
    if (current.status === "pending_pembina") {
      // Ketua already approved -> Both approved!
      return {
        ...current,
        status: "approved",
        approved_pembina_by: "usr-pembina",
        approved_pembina_at: new Date().toISOString(),
        catatan_pembina: catatan,
      };
    } else {
      // Waiting for ketua
      return {
        ...current,
        status: "pending_ketua",
        approved_pembina_by: "usr-pembina",
        approved_pembina_at: new Date().toISOString(),
        catatan_pembina: catatan,
      };
    }
  } else if (actor === "ketua_broadcast") {
    if (current.status === "pending_ketua") {
      // Pembina already approved -> Both approved!
      return {
        ...current,
        status: "approved",
        approved_ketua_by: "usr-ketua-bc",
        approved_ketua_at: new Date().toISOString(),
        catatan_ketua: catatan,
      };
    } else {
      // Waiting for pembina
      return {
        ...current,
        status: "pending_pembina",
        approved_ketua_by: "usr-ketua-bc",
        approved_ketua_at: new Date().toISOString(),
        catatan_ketua: catatan,
      };
    }
  }

  return current;
}
