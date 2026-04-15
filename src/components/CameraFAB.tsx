"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, X, Send, RotateCcw, Loader2, Images, FolderOpen, ChevronRight } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;
const getCV = () => (window as any).cv;

const AW = 320, AH = 240;
const MIN_AREA_PERCENT = 5;
const MAX_AREA_PERCENT = 95;
type Point = { x: number; y: number };

// ─── OpenCV loader ───
function useOpenCV() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Script allaqachon bor bo'lsa tekshir
    const poll = setInterval(() => {
      if ((window as any).cv?.getBuildInformation) {
        clearInterval(poll);
        setReady(true);
      }
    }, 100);

    if (!document.getElementById("opencv-script")) {
      const s = document.createElement("script");
      s.id = "opencv-script";
      s.src = "/opencv.js";
      s.async = true;
      document.body.appendChild(s);
    }

    return () => clearInterval(poll);
  }, []);
  return ready;
}

// ─── Nuqtalarni to'g'ri tartiblash ───
function orderCorners(points: Point[]): Point[] {
  const cx = points.reduce((s, p) => s + p.x, 0) / 4;
  const cy = points.reduce((s, p) => s + p.y, 0) / 4;
  return [...points].sort((a, b) =>
    Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
}

// ─── Rasm sifatini yaxshilash ───
function enhanceImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0);
  const d = ctx.getImageData(0, 0, out.width, out.height);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i]   = Math.min(255, Math.max(0, (d.data[i]   - 128) * 1.2 + 138));
    d.data[i+1] = Math.min(255, Math.max(0, (d.data[i+1] - 128) * 1.2 + 138));
    d.data[i+2] = Math.min(255, Math.max(0, (d.data[i+2] - 128) * 1.2 + 138));
  }
  ctx.putImageData(d, 0, 0);
  return out;
}

export default function CameraFAB() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvReady = useOpenCV();

  // ── Student context from URL ──
  const urlStudentId = searchParams.get("studentId");
  const urlStudentName = searchParams.get("studentName");
  const urlCamera = searchParams.get("camera");

  // ── Folder tanlash state ──
  type Folder = { id: string; name: string };
  const [folderModal, setFolderModal] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // ── Camera modal state ──
  const [camOpen, setCamOpen] = useState(false);
  const [detected, setDetected] = useState(false);
  const [cvLabel, setCvLabel] = useState("Kamera yuklanmoqda...");
  const [snapping, setSnapping] = useState(false);

  // ── Confirm modal state ──
  const [captured, setCaptured] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // ── URL da camera=1 bo'lsa avtomatik ochish ──
  useEffect(() => {
    if (urlCamera === "1" && !camOpen) {
      setCamOpen(true);
      document.body.classList.add("modal-open");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCamera]);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const contourRef = useRef<any>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Kamerani to'xtatish ──
  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (contourRef.current) { contourRef.current.delete(); contourRef.current = null; }
    streamRef.current = null;
  }, []);

  // ── Modal yopish ──
  const closeAll = useCallback(() => {
    stopCamera();
    setCamOpen(false);
    setCaptured(null);
    setPrompt("");
    setSendError("");
    setDetected(false);
    setCvLabel("Kamera yuklanmoqda...");
    setSelectedFolder(null);
    setFolderModal(false);
    document.body.classList.remove("modal-open");
    if (urlCamera === "1") router.replace("/home");
  }, [stopCamera, urlCamera, router]);

  // ── Default yashil to'rtburchak ──
  function drawDefaultBorder() {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ov.width, ov.height);
    const pad = 24;
    const x = pad, y = pad, w = ov.width - pad*2, h = ov.height - pad*2;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(34,197,94,0.05)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    // Burchak nuqtalar
    [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].forEach(([px,py]) => {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2); ctx.fill();
    });
  }

  // ── Kontur chizish ──
  function drawBorder(contour: any, stable: boolean) {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ov.width, ov.height);
    if (!contour) return;

    const sx = ov.width / AW, sy = ov.height / AH;
    const color = stable ? "#22c55e" : "#3b82f6";
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = stable ? 20 : 10;
    ctx.fillStyle = stable ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.05)";

    const pts: Point[] = [];
    for (let i = 0; i < contour.rows; i++)
      pts.push({ x: contour.data32S[i*2] * sx, y: contour.data32S[i*2+1] * sy });

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (stable && pts.length === 4) {
      pts.forEach(p => {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
      });
    }
  }

  // ── Asosiy tahlil ──
  function analyze() {
    const cv = getCV();
    const video = videoRef.current;
    const overlay = overlayRef.current;
    const ac = analysisCanvasRef.current;
    if (!video || !overlay || !ac || video.readyState < 2) return;

    const rect = video.getBoundingClientRect();
    if (overlay.width !== Math.round(rect.width)) overlay.width = Math.round(rect.width);
    if (overlay.height !== Math.round(rect.height)) overlay.height = Math.round(rect.height);

    const ctx = ac.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, AW, AH);

    const src = cv.imread(ac);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 21, 4);
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const morphed = new cv.Mat();
    cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0, best: any = null;
    const frameArea = AW * AH;
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = cv.contourArea(c);
      const pct = (area / frameArea) * 100;
      if (pct >= MIN_AREA_PERCENT && pct <= MAX_AREA_PERCENT && area > maxArea) {
        const peri = cv.arcLength(c, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(c, approx, 0.01 * peri, true);
        if (approx.rows >= 3 && approx.rows <= 8) {
          maxArea = area;
          if (best) best.delete();
          best = approx.clone();
        }
        approx.delete();
      }
      c.delete();
    }

    if (best && best.rows !== 4) {
      const r = cv.boundingRect(best);
      const rect4 = cv.matFromArray(4, 1, cv.CV_32SC2, [
        r.x, r.y, r.x+r.width, r.y, r.x+r.width, r.y+r.height, r.x, r.y+r.height
      ]);
      best.delete(); best = rect4;
    }

    if (contourRef.current) contourRef.current.delete();
    contourRef.current = best;

    if (best) {
      setDetected(true);
    } else {
      setDetected(false);
    }

    src.delete(); gray.delete(); blurred.delete();
    thresh.delete(); kernel.delete(); morphed.delete();
    contours.delete(); hierarchy.delete();
  }

  // ── Kamerani boshlash ──
  useEffect(() => {
    if (!camOpen || !cvReady) return;
    const video = videoRef.current;
    if (!video) return;

    if (!analysisCanvasRef.current) {
      const ac = document.createElement("canvas");
      ac.width = AW; ac.height = AH;
      analysisCanvasRef.current = ac;
    }

    setCvLabel("Kamera ochilmoqda...");

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then(stream => {
      streamRef.current = stream;
      video.srcObject = stream;
      const start = () => {
        video.play().then(() => {
          intervalRef.current = setInterval(analyze, 150);
        });
      };
      if (video.readyState >= 2) start();
      else video.addEventListener("loadedmetadata", start, { once: true });
    }).catch(err => {
      setCvLabel("Kamera xatosi: " + err.message);
    });

    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOpen, cvReady]);

  // ── Rasmga olish ──
  async function captureAndCorrect() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setSnapping(true);
    try {
      const fc = document.createElement("canvas");
      fc.width = video.videoWidth; fc.height = video.videoHeight;
      fc.getContext("2d")!.drawImage(video, 0, 0);

      let dataUrl: string;

      if (contourRef.current) {
        // Hujjat aniqlangan — perspective transform
        const cv = getCV();
        const srcMat = cv.imread(fc);
        const raw: Point[] = [];
        for (let i = 0; i < contourRef.current.rows; i++)
          raw.push({ x: contourRef.current.data32S[i*2], y: contourRef.current.data32S[i*2+1] });
        const rx = video.videoWidth / AW, ry = video.videoHeight / AH;
        const corners = raw.map(c => ({ x: c.x * rx, y: c.y * ry }));
        const [tl, tr, br, bl] = orderCorners(corners);
        const w = Math.max(Math.hypot(tr.x-tl.x, tr.y-tl.y), Math.hypot(br.x-bl.x, br.y-bl.y));
        const h = Math.max(Math.hypot(bl.x-tl.x, bl.y-tl.y), Math.hypot(br.x-tr.x, br.y-tr.y));
        const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x,tl.y, tr.x,tr.y, br.x,br.y, bl.x,bl.y]);
        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0, w,0, w,h, 0,h]);
        const M = cv.getPerspectiveTransform(srcPts, dstPts);
        const warped = new cv.Mat();
        cv.warpPerspective(srcMat, warped, M, new cv.Size(w, h));
        const wc = document.createElement("canvas");
        cv.imshow(wc, warped);
        [srcMat, warped, M, srcPts, dstPts].forEach(m => m.delete());
        dataUrl = enhanceImage(wc).toDataURL("image/jpeg", 0.95);
      } else {
        // Hujjat aniqlanmagan — oddiy foto
        dataUrl = enhanceImage(fc).toDataURL("image/jpeg", 0.95);
      }

      stopCamera();
      setCamOpen(false);
      setCaptured(dataUrl);
    } finally {
      setSnapping(false);
    }
  }

  // ── Folder tanlash modali ochish ──
  async function openFolderPicker() {
    setFolderModal(true);
    setFoldersLoading(true);
    try {
      const res = await fetch(`${API}/api/folders`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data.data ?? data ?? []);
      }
    } finally {
      setFoldersLoading(false);
    }
  }

  function selectFolderAndOpenCamera(folder: Folder) {
    setSelectedFolder(folder);
    setFolderModal(false);
    setCamOpen(true);
    document.body.classList.add("modal-open");
  }

  // ── Galereyadan rasm tanlash ──
  function pickFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setCamOpen(false);
      setCaptured(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── AI ga yuborish ──
  async function sendToAI() {
    if (!captured) return;
    setSending(true);
    setSendError("");
    try {
      const blob = await (await fetch(captured)).blob();
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("image", file);
      if (prompt.trim()) fd.append("subject", prompt.trim());
      if (urlStudentId) fd.append("studentId", urlStudentId);
      if (selectedFolder) fd.append("folderId", selectedFolder.id);

      const res = await fetch(`${API}/api/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendError((err as any).error || "Xatolik yuz berdi");
        return;
      }

      closeAll();
      router.push("/home");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ── FAB tugma ── */}
      <div className="fixed z-50 bottom-28 right-4 md:bottom-8 md:right-8">
        <button
          onClick={openFolderPicker}
          className="w-14 h-14 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{
            background: "var(--cta)",
            borderRadius: "var(--radius-md)",
            color: "#fff",
            boxShadow: "6px 6px 14px rgba(104,117,245,0.3), inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.2)",
          }}
        >
          <Camera size={24} />
        </button>
      </div>

      {/* ── Folder tanlash modali ── */}
      {folderModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setFolderModal(false)}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                Jild tanlang
              </p>
              <button onClick={() => setFolderModal(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-72">
              {foldersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
                </div>
              ) : folders.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Jild topilmadi
                </p>
              ) : (
                folders.map(folder => (
                  <button key={folder.id} onClick={() => selectFolderAndOpenCamera(folder)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <FolderOpen size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {folder.name}
                    </span>
                    <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Kamera modali ── */}
      {camOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#000" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "rgba(0,0,0,0.6)" }}>
            <p className="text-sm font-semibold text-white">Hujjatni skanerlash</p>
            <button onClick={closeAll} className="p-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <X size={20} />
            </button>
          </div>

          {/* Kamera */}
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          </div>

          {/* Capture tugma */}
          <div className="flex items-center justify-center gap-8 py-6 shrink-0" style={{ background: "rgba(0,0,0,0.6)" }}>
            {/* Galereya */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            >
              <Images size={22} />
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickFromGallery}
            />

            {/* Suratga olish */}
            <button
              onClick={captureAndCorrect}
              disabled={snapping}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "#22c55e",
                boxShadow: "0 0 24px rgba(34,197,94,0.5)",
                border: "4px solid rgba(255,255,255,0.3)",
                transform: snapping ? "scale(0.9)" : "scale(1)",
              }}
            >
              {snapping
                ? <Loader2 size={24} color="#fff" className="animate-spin" />
                : <Camera size={24} color="#fff" />
              }
            </button>

            {/* Balans uchun bo'sh joy */}
            <div className="w-12 h-12" />
          </div>
        </div>
      )}

      {/* ── Tasdiqlash modali ── */}
      {captured && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  Tahlilga yuborish
                </p>
                {urlStudentName && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
                    {decodeURIComponent(urlStudentName)}
                  </p>
                )}
                {selectedFolder && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <FolderOpen size={11} /> {selectedFolder.name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCaptured(null); setCamOpen(true); }}
                  className="p-1.5 rounded-lg"
                  style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                  title="Qayta suratga olish"
                >
                  <RotateCcw size={15} />
                </button>
                <button onClick={closeAll} className="p-1.5 rounded-lg" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Rasm preview */}
            <div className="mx-5 mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <img src={captured} alt="Skan" className="w-full object-contain max-h-52" />
            </div>

            {/* Prompt input */}
            <div className="px-5 mt-3">
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Qo'shimcha ko'rsatma (ixtiyoriy)
              </label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="Masalan: 7-sinf matematika..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !sending && sendToAI()}
                autoFocus
              />
              {sendError && (
                <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>{sendError}</p>
              )}
            </div>

            {/* Send tugma */}
            <div className="px-5 py-4">
              <button
                onClick={sendToAI}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--cta)", color: "#fff", opacity: sending ? 0.7 : 1 }}
              >
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> Yuborilmoqda...</>
                  : <><Send size={16} /> Tahlil qilish</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
