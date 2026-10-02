"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  ChevronRight,
  TriangleAlert,
} from "lucide-react";
import {
  parseAnggotaFromCSV,
  downloadImportTemplate,
  ImportedAnggotaRow,
  ParseCSVResult,
} from "@/lib/utils/excel";
import { useSession } from "@/components/shared/SessionContext";
import { createClient } from "@/lib/supabase/client";
import { AnggotaRecord } from "@/lib/mock/store";

interface ImportAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipe?: "tetap" | "ekskul";
  onImported?: (newRecords: AnggotaRecord[]) => void;
}

type Step = "upload" | "preview" | "importing" | "done";

export function ImportAnggotaModal({
  isOpen,
  onClose,
  defaultTipe = "tetap",
  onImported,
}: ImportAnggotaModalProps) {
  const { refreshData, logAction } = useSession();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<ParseCSVResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);

  if (!isOpen) return null;

  // ── Handler file pick ──────────────────────────────────────────────────────
  const processFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Hanya file .CSV yang didukung.");
      return;
    }
    setErrorMsg(null);
    setFileName(file.name);
    const text = await file.text();
    const result = parseAnggotaFromCSV(text);
    setParseResult(result);
    setStep("preview");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Import ke Supabase ─────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;
    setStep("importing");
    setImportProgress(0);

    const rows = parseResult.valid;
    let success = 0;
    let failed = 0;
    const importedRecords: AnggotaRecord[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { data, error } = await supabase
          .from("anggota")
          .insert({
            tipe: row.tipe,
            nama_lengkap: row.nama_lengkap,
            nis: row.nis,
            nisn: row.nisn || null,
            kelas: row.kelas,
            jabatan: row.jabatan,
            divisi: row.divisi || null,
            tahun_ajaran: row.tahun_ajaran,
            status: row.status,
            no_hp: row.no_hp || null,
          })
          .select()
          .single();

        if (error) {
          // NIS duplikat → lewati tanpa crash
          failed++;
        } else if (data) {
          success++;
          importedRecords.push(data as AnggotaRecord);
        }
      } catch {
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    if (success > 0) {
      logAction(
        "IMPORT_ANGGOTA_CSV",
        "anggota",
        "bulk",
        `Import CSV: ${success} anggota berhasil ditambahkan, ${failed} gagal.`
      );
      await refreshData();
      if (onImported && importedRecords.length > 0) {
        onImported(importedRecords);
      }
    }

    setImportedCount(success);
    setFailedCount(failed);
    setStep("done");
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setParseResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setFailedCount(0);
    setErrorMsg(null);
    setShowInvalidOnly(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previewRows: ImportedAnggotaRow[] = parseResult
    ? showInvalidOnly
      ? parseResult.invalid
      : [...parseResult.valid, ...parseResult.invalid].sort((a, b) => a._rowIndex - b._rowIndex)
    : [];

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-2xl w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div>
              <h3 id="import-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-spectrum-cyan" />
                Import Data Anggota dari CSV
              </h3>
              <p className="text-xs text-studio-text-secondary mt-0.5">
                Upload file CSV yang sesuai format ekspor Broadcast Spensa OS.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup modal import"
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── STEP: Upload ── */}
          {step === "upload" && (
            <div className="mt-5 space-y-4">
              {/* Drag-and-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 transition-all ${
                  isDragging
                    ? "border-spectrum-cyan bg-spectrum-cyan/10"
                    : "border-studio-border-medium hover:border-spectrum-cyan/60 bg-surface-1/50 hover:bg-surface-1"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-spectrum-cyan/20 to-blue-600/20 border border-spectrum-cyan/30 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-spectrum-cyan" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    Seret file CSV ke sini, atau klik untuk pilih file
                  </p>
                  <p className="text-xs text-studio-text-secondary mt-1">
                    Hanya mendukung format <span className="font-mono text-spectrum-cyan">.csv</span> — sesuai format ekspor sistem ini
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="Pilih file CSV untuk diimport"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Download template */}
              <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">Belum punya file CSV?</p>
                  <p className="text-[11px] text-studio-text-secondary mt-0.5">
                    Download template sesuai tipe anggota, isi, lalu upload kembali.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadImportTemplate("tetap")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-spectrum-cyan border border-spectrum-cyan/30 flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template Tetap
                  </button>
                  <button
                    onClick={() => downloadImportTemplate("ekskul")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-orbital-magenta border border-orbital-violet/30 flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template Ekskul
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: Preview ── */}
          {step === "preview" && parseResult && (
            <div className="mt-5 space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle text-center">
                  <p className="text-2xl font-bold text-white font-mono">{parseResult.total}</p>
                  <p className="text-[10px] font-mono text-studio-text-muted uppercase mt-0.5">Total Baris</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{parseResult.valid.length}</p>
                  <p className="text-[10px] font-mono text-emerald-400/70 uppercase mt-0.5">Siap Import</p>
                </div>
                <div className={`p-3 rounded-xl text-center border ${parseResult.invalid.length > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-surface-1 border-studio-border-subtle"}`}>
                  <p className={`text-2xl font-bold font-mono ${parseResult.invalid.length > 0 ? "text-rose-400" : "text-white"}`}>
                    {parseResult.invalid.length}
                  </p>
                  <p className={`text-[10px] font-mono uppercase mt-0.5 ${parseResult.invalid.length > 0 ? "text-rose-400/70" : "text-studio-text-muted"}`}>
                    Error / Tidak Valid
                  </p>
                </div>
              </div>

              {/* File info */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-1 border border-studio-border-subtle">
                <FileText className="w-4 h-4 text-spectrum-cyan shrink-0" />
                <span className="text-xs font-mono text-white truncate flex-1">{fileName}</span>
                <button
                  onClick={handleReset}
                  className="text-[10px] font-semibold text-studio-text-secondary hover:text-rose-400 transition-colors"
                >
                  Ganti file
                </button>
              </div>

              {parseResult.invalid.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    <strong>{parseResult.invalid.length} baris</strong> memiliki data tidak lengkap dan akan dilewati saat import.
                    Baris yang valid ({parseResult.valid.length}) tetap akan diimport.
                  </p>
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Preview Data</p>
                    {parseResult.invalid.length > 0 && (
                      <button
                        onClick={() => setShowInvalidOnly((v) => !v)}
                        className="text-[11px] font-semibold text-studio-text-secondary hover:text-amber-400 transition-colors"
                      >
                        {showInvalidOnly ? "Tampilkan semua" : "Tampilkan hanya yang error"}
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-studio-border-subtle max-h-56 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-surface-1 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">Baris</th>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">Nama</th>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">NIS</th>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">Kelas</th>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">Tipe</th>
                          <th className="px-2 py-2 text-left text-studio-text-muted font-mono uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 50).map((row) => {
                          const hasError = row._errors.length > 0;
                          return (
                            <tr
                              key={row._rowIndex}
                              className={`border-t border-studio-border-subtle/50 ${hasError ? "bg-rose-500/5" : ""}`}
                            >
                              <td className="px-2 py-1.5 font-mono text-studio-text-muted">{row._rowIndex}</td>
                              <td className="px-2 py-1.5 text-white font-semibold max-w-[140px] truncate">
                                {row.nama_lengkap || <span className="text-rose-400 italic">kosong</span>}
                              </td>
                              <td className="px-2 py-1.5 font-mono text-studio-text-secondary">{row.nis || "-"}</td>
                              <td className="px-2 py-1.5 text-studio-text-secondary">{row.kelas || "-"}</td>
                              <td className="px-2 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  row.tipe === "tetap"
                                    ? "bg-cyan-500/15 text-cyan-400"
                                    : "bg-purple-500/15 text-purple-400"
                                }`}>
                                  {row.tipe}
                                </span>
                              </td>
                              <td className="px-2 py-1.5">
                                {hasError ? (
                                  <span className="flex items-center gap-1 text-rose-400">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{row._errors.join(", ")}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {previewRows.length > 50 && (
                      <p className="text-[10px] text-center text-studio-text-muted py-2">
                        Menampilkan 50 dari {previewRows.length} baris...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {parseResult.valid.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Tidak ada baris yang valid untuk diimport. Perbaiki file CSV terlebih dahulu.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleImport}
                  disabled={parseResult.valid.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-spectrum-cobalt hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-cyan min-h-[44px] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import {parseResult.valid.length} Data Valid
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Importing ── */}
          {step === "importing" && (
            <div className="mt-8 space-y-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-spectrum-cyan/20 to-blue-600/20 border border-spectrum-cyan/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-spectrum-cyan animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Sedang mengimport data...</p>
                <p className="text-xs text-studio-text-secondary mt-1">
                  Harap tunggu, jangan tutup halaman ini.
                </p>
              </div>
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-studio-text-secondary">
                  <span>Progress</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-spectrum-cyan to-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${importProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: Done ── */}
          {step === "done" && (
            <div className="mt-8 space-y-5 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Import Selesai!</p>
                <p className="text-xs text-studio-text-secondary mt-1">
                  Data anggota telah berhasil ditambahkan ke database.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <p className="text-3xl font-bold text-emerald-400 font-mono">{importedCount}</p>
                  <p className="text-[10px] font-mono uppercase text-emerald-400/70 mt-0.5">Berhasil</p>
                </div>
                <div className={`p-4 rounded-xl text-center border ${failedCount > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-surface-1 border-studio-border-subtle"}`}>
                  <p className={`text-3xl font-bold font-mono ${failedCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
                    {failedCount}
                  </p>
                  <p className={`text-[10px] font-mono uppercase mt-0.5 ${failedCount > 0 ? "text-rose-400/70" : "text-studio-text-muted"}`}>
                    Dilewati
                  </p>
                </div>
              </div>
              {failedCount > 0 && (
                <p className="text-[11px] text-amber-400">
                  Baris yang dilewati kemungkinan memiliki NIS yang sudah terdaftar di database.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-xl min-h-[44px] border border-studio-border-subtle hover:border-spectrum-cyan/50 transition-colors"
                >
                  Import Lagi
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-spectrum-cobalt hover:bg-blue-500 rounded-xl transition-all min-h-[44px]"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
