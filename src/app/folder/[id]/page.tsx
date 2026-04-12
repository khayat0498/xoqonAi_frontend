"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Camera, Upload, X, MoreVertical, Trash2, FolderInput, Share2, FileText, Folder, Pencil } from "lucide-react";
import { loadFolders, loadFiles, deleteFile, moveFile, renameFile, SINFLAR_FOLDER_ID } from "@/lib/store";
import type { Folder as FolderType, FileItem } from "@/lib/store";
import ViewToggle from "@/components/ViewToggle";

export default function FolderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [folder, setFolder] = useState<FolderType | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderType[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [menuOpenFile, setMenuOpenFile] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [editFileId, setEditFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    const flds = loadFolders();
    const fls = loadFiles();
    const current = flds.find((f) => f.id === id);
    setFolder(current ?? null);
    setAllFolders(flds);
    setFiles(fls.filter((f) => f.folderId === id));
  };

  useEffect(() => { refresh(); }, [id]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenFile) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenFile(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenFile]);

  const toggleMenu = (fileId: string, e: React.MouseEvent) => {
    if (menuOpenFile === fileId) { setMenuOpenFile(null); return; }
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpenFile(fileId);
  };

  const handleShare = async (file: FileItem) => {
    const text = `${file.studentName} — ${file.subject} (${file.grade})\n${file.date}`;
    if (navigator.share) {
      try { await navigator.share({ title: file.subject, text }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
    setMenuOpenFile(null);
  };

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
    setMenuOpenFile(null);
    refresh();
  };

  const handleRename = () => {
    if (!editFileId || !editFileName.trim()) return;
    renameFile(editFileId, editFileName.trim());
    setEditFileId(null);
    setEditFileName("");
    refresh();
  };

  const handleMove = (fileId: string, targetFolderId: string) => {
    moveFile(fileId, targetFolderId);
    setMoveFileId(null);
    refresh();
  };

  if (!folder) return null;

  const isReadonly = folder.id === SINFLAR_FOLDER_ID;
  const gradeColor = (grade: string) => {
    const num = parseInt(grade);
    if (num >= 5) return "var(--success)";
    if (num >= 4) return "var(--accent)";
    if (num >= 3) return "var(--warning)";
    return "var(--error)";
  };

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-4 md:px-6 py-3.5 flex items-center gap-3 shrink-0"
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px solid rgba(0,0,0,0.06)",
          boxShadow: "var(--shadow-clay-sm)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-clay-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-2xl">{folder.icon || "📁"}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {folder.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {files.length} ta fayl
          </p>
        </div>
        <ViewToggle view={viewMode} onChange={setViewMode} />
        {!isReadonly && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 font-bold transition-all hover:scale-105 text-white"
            style={{
              background: "var(--cta)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-clay-sm)",
            }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Yangi</span>
          </button>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <FileText size={48} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Hozircha fayllar yo'q</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {files.map((file, i) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-4 py-3 transition-all animate-fade-in"
                style={{
                  background: "var(--bg-card)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--accent-light)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "inset -1px -1px 3px rgba(0,0,0,0.05), inset 1px 1px 3px rgba(255,255,255,0.5)",
                  }}
                >
                  <FileText size={18} style={{ color: "var(--accent)" }} />
                </div>

                <Link href={file.submissionId ? `/submission/${file.submissionId}` : "#"} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{file.studentName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {file.subject} · {file.date}
                  </p>
                </Link>

                <span
                  className="text-xs font-bold px-2 py-0.5 shrink-0"
                  style={{
                    color: gradeColor(file.grade),
                    background: `${gradeColor(file.grade)}15`,
                    borderRadius: 8,
                  }}
                >
                  {file.grade}
                </span>

                {/* ⋮ trigger */}
                <button
                  onClick={(e) => toggleMenu(file.id, e)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Grid view */
          <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((file, i) => (
              <div
                key={file.id}
                className="relative flex flex-col items-center gap-2 p-4 transition-all animate-fade-in"
                style={{
                  background: "var(--bg-card)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-clay-sm)",
                  animationDelay: `${i * 40}ms`,
                }}
              >
                {/* ⋮ trigger */}
                <button
                  onClick={(e) => toggleMenu(file.id, e)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}
                >
                  <MoreVertical size={14} />
                </button>

                <Link href={file.submissionId ? `/submission/${file.submissionId}` : "#"} className="flex flex-col items-center gap-2 w-full">
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    style={{
                      background: "var(--accent-light)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "inset -1px -1px 3px rgba(0,0,0,0.05), inset 1px 1px 3px rgba(255,255,255,0.5)",
                    }}
                  >
                    <FileText size={22} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="text-sm font-semibold text-center truncate w-full" style={{ color: "var(--text-primary)" }}>{file.studentName}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{file.subject}</p>
                  <span
                    className="text-xs font-bold px-2 py-0.5"
                    style={{
                      color: gradeColor(file.grade),
                      background: `${gradeColor(file.grade)}15`,
                      borderRadius: 8,
                    }}
                  >
                    {file.grade}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed context menu — card ustida chiqadi */}
      {menuOpenFile && (() => {
        const file = files.find((f) => f.id === menuOpenFile);
        if (!file) return null;
        return (
          <>
            {/* Backdrop — tashqariga bosganda yopish */}
            <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpenFile(null)} />
            <div
              ref={menuRef}
              className="fixed z-[95] animate-fade-in py-1"
              style={{
                top: menuPos.top,
                right: menuPos.right,
                background: "var(--bg-card-solid, var(--bg-card))",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-clay)",
                minWidth: 170,
              }}
            >
              {!isReadonly && (
                <button
                  onClick={() => { setEditFileId(file.id); setEditFileName(file.studentName); setMenuOpenFile(null); }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Pencil size={14} /> Tahrirlash
                </button>
              )}
              {!isReadonly && (
                <button
                  onClick={() => { setMoveFileId(file.id); setMenuOpenFile(null); }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--text-primary)" }}
                >
                  <FolderInput size={14} /> Ko'chirish
                </button>
              )}
              <button
                onClick={() => handleShare(file)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-primary)" }}
              >
                <Share2 size={14} /> Ulashish
              </button>
              {!isReadonly && (
                <button
                  onClick={() => handleDelete(file.id)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                  style={{ color: "var(--error)" }}
                >
                  <Trash2 size={14} /> O'chirish
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* Rename modal */}
      {editFileId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setEditFileId(null); setEditFileName(""); } }}
        >
          <div
            className="w-full max-w-sm animate-fade-in"
            style={{
              background: "var(--bg-card-solid, var(--bg-card))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-clay)",
              overflow: "hidden",
            }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Pencil size={16} style={{ color: "var(--accent)" }} />
                <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Nomini o'zgartirish</span>
              </div>
              <button
                onClick={() => { setEditFileId(null); setEditFileName(""); }}
                className="w-8 h-8 flex items-center justify-center"
                style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-4">
              <input
                autoFocus
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setEditFileId(null); setEditFileName(""); } }}
                placeholder="Fayl nomi..."
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditFileId(null); setEditFileName(""); }}
                  className="px-4 py-2 text-sm font-semibold"
                  style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}
                >
                  Bekor
                </button>
                <button
                  onClick={handleRename}
                  className="px-4 py-2 text-sm font-bold text-white"
                  style={{ background: "var(--cta)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move modal — papka tanlash */}
      {moveFileId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setMoveFileId(null); }}
        >
          <div
            className="w-full max-w-sm animate-fade-in flex flex-col"
            style={{
              background: "var(--bg-card-solid, var(--bg-card))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-clay)",
              maxHeight: "70vh",
              overflow: "hidden",
            }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <FolderInput size={18} style={{ color: "var(--accent)" }} />
                <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Papkaga ko'chirish
                </span>
              </div>
              <button
                onClick={() => setMoveFileId(null)}
                className="w-8 h-8 flex items-center justify-center"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {allFolders
                .filter((f) => f.id !== id && f.id !== SINFLAR_FOLDER_ID)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMove(moveFileId, f.id)}
                    className="w-full text-left px-5 py-3 flex items-center gap-3 transition-all hover:bg-[var(--surface-hover)]"
                  >
                    <span className="text-xl">{f.icon || "📁"}</span>
                    <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.fileIds.length} ta</span>
                  </button>
                ))}
              {allFolders.filter((f) => f.id !== id && f.id !== SINFLAR_FOLDER_ID).length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Folder size={32} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Boshqa papkalar yo'q</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
        >
          <div
            className="w-full max-w-sm p-6 animate-fade-in"
            style={{
              background: "var(--bg-card-solid, var(--bg-card))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-clay)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                Rasm yuklash
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="flex items-center gap-3 px-4 py-3.5 transition-all hover:scale-[1.02] text-white font-semibold"
                style={{
                  background: "var(--cta)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                <Camera size={18} />
                <span className="text-sm">Kamera bilan olish</span>
              </button>

              <button
                className="flex items-center gap-3 px-4 py-3.5 transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                  color: "var(--text-primary)",
                }}
              >
                <Upload size={18} style={{ color: "var(--text-secondary)" }} />
                <span className="text-sm">Fayldan tanlash</span>
              </button>
            </div>

            <div
              className="mt-3 p-6 flex flex-col items-center gap-2 transition-all"
              style={{
                border: "2px dashed var(--border)",
                color: "var(--text-muted)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <Upload size={24} />
              <p className="text-xs text-center">Rasmni shu yerga tashlang</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
