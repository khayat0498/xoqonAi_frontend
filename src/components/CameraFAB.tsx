"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, X, Send, RotateCcw, Loader2, Images, ChevronRight, BookOpen, Check, Trash2 } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;
const getCV = () => (window as any).cv;

const AW = 320, AH = 240;
const MIN_AREA_PERCENT = 5;
const MAX_AREA_PERCENT = 95;
type Point = { x: number; y: number };

function useOpenCV() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const poll = setInterval(() => {
      if ((window as any).cv?.getBuildInformation) { clearInterval(poll); setReady(true); }
    }, 100);
    if (!document.getElementById("opencv-script")) {
      const s = document.createElement("script");
      s.id = "opencv-script"; s.src = "/opencv.js"; s.async = true;
      document.body.appendChild(s);
    }
    return () => clearInterval(poll);
  }, []);
  return ready;
}

function orderCorners(points: Point[]): Point[] {
  const cx = points.reduce((s, p) => s + p.x, 0) / 4;
  const cy = points.reduce((s, p) => s + p.y, 0) / 4;
  return [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
}

function enhanceImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width; out.height = canvas.height;
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

type Folder = { id: string; name: string; icon?: string | null; subjectId?: string | null; subjectName?: string | null; subjectIcon?: string | null };

export default function CameraFAB() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvReady = useOpenCV();

  const urlStudentId   = searchParams.get("studentId");
  const urlStudentName = searchParams.get("studentName");
  const urlCamera      = searchParams.get("camera");
  const urlClassId     = searchParams.get("classId");
  const urlSubject     = searchParams.get("subject");
  const urlCondition   = searchParams.get("condition");
  const urlReturnTo    = searchParams.get("returnTo");

  // ── Step state ──
  const [step, setStep] = useState<"idle" | "folder" | "condition" | "cam" | "confirm">("idle");

  // ── Data ──
  const [folders, setFolders]       = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderCondition, setFolderCondition] = useState("");
  const [loading, setLoading]       = useState(false);

  // ── Camera ──
  const [detected, setDetected]   = useState(false);
  const [snapping, setSnapping]   = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null); // lightbox
  const [prompt, setPrompt]       = useState("");
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState("");

  const videoRef            = useRef<HTMLVideoElement>(null);
  const overlayRef          = useRef<HTMLCanvasElement>(null);
  const galleryInputRef     = useRef<HTMLInputElement>(null);
  const contourRef          = useRef<any>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisCanvasRef   = useRef<HTMLCanvasElement | null>(null);

  // URL camera=1
  useEffect(() => {
    if (urlCamera === "1" && step === "idle") { setStep("cam"); document.body.classList.add("modal-open"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCamera]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (contourRef.current) { contourRef.current.delete(); contourRef.current = null; }
    streamRef.current = null;
  }, []);

  const closeAll = useCallback(() => {
    stopCamera();
    setStep("idle");
    setCapturedImages([]); setPrompt(""); setSendError(""); setDetected(false);
    setPreviewIndex(null);
    setSelectedFolder(null); setFolderCondition("");
    document.body.classList.remove("modal-open");
    if (urlCamera === "1") router.replace(urlReturnTo ?? "/home");
  }, [stopCamera, urlCamera, router]);

  // ── Step: folder ──
  async function openFolderPicker() {
    setStep("folder");
    setLoading(true);
    const res = await fetch(`${API}/api/folders`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (res.ok) { const d = await res.json(); setFolders(d.data ?? d ?? []); }
    setLoading(false);
  }

  function selectFolder(folder: Folder) {
    setSelectedFolder(folder);
    setFolderCondition("");
    setStep("condition");
  }

  function openCamera() {
    setStep("cam");
    document.body.classList.add("modal-open");
  }

  // ── Camera overlay ──
  function drawDefaultBorder() {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ov.width, ov.height);
    const pad = 24;
    const x = pad, y = pad, w = ov.width - pad*2, h = ov.height - pad*2;
    ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3;
    ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(34,197,94,0.05)";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
    [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].forEach(([px,py]) => {
      ctx.shadowBlur = 0; ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2); ctx.fill();
    });
  }

  function analyze() {
    const cv = getCV();
    const video = videoRef.current, overlay = overlayRef.current, ac = analysisCanvasRef.current;
    if (!video || !overlay || !ac || video.readyState < 2) return;
    const rect = video.getBoundingClientRect();
    if (overlay.width !== Math.round(rect.width)) overlay.width = Math.round(rect.width);
    if (overlay.height !== Math.round(rect.height)) overlay.height = Math.round(rect.height);
    const ctx = ac.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, AW, AH);
    const src = cv.imread(ac);
    const gray = new cv.Mat(); cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const blurred = new cv.Mat(); cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 21, 4);
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const morphed = new cv.Mat(); cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);
    const contours = new cv.MatVector(), hierarchy = new cv.Mat();
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
        if (approx.rows >= 3 && approx.rows <= 8) { maxArea = area; if (best) best.delete(); best = approx.clone(); }
        approx.delete();
      }
      c.delete();
    }
    if (best && best.rows !== 4) {
      const r = cv.boundingRect(best);
      const rect4 = cv.matFromArray(4, 1, cv.CV_32SC2, [r.x, r.y, r.x+r.width, r.y, r.x+r.width, r.y+r.height, r.x, r.y+r.height]);
      best.delete(); best = rect4;
    }
    if (contourRef.current) contourRef.current.delete();
    contourRef.current = best;
    setDetected(!!best);
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); kernel.delete(); morphed.delete(); contours.delete(); hierarchy.delete();
  }

  useEffect(() => {
    if (step !== "cam" || !cvReady) return;
    const video = videoRef.current;
    if (!video) return;
    if (!analysisCanvasRef.current) {
      const ac = document.createElement("canvas"); ac.width = AW; ac.height = AH;
      analysisCanvasRef.current = ac;
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then(stream => {
      streamRef.current = stream; video.srcObject = stream;
      const start = () => { video.play().then(() => { intervalRef.current = setInterval(analyze, 150); }); };
      if (video.readyState >= 2) start();
      else video.addEventListener("loadedmetadata", start, { once: true });
    }).catch(err => { console.error("Kamera xatosi:", err.message); });
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cvReady]);

  // ── Rasmga olish — massivga qo'shadi, kamera ochiq qoladi ──
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
        dataUrl = enhanceImage(fc).toDataURL("image/jpeg", 0.95);
      }
      // Rasmlar massiviga qo'shish — kamera yopilmaydi
      setCapturedImages(prev => [...prev, dataUrl]);
    } finally {
      setSnapping(false);
    }
  }

  function pickFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setCapturedImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function goToConfirm() {
    stopCamera();
    setStep("confirm");
  }

  function removeImage(index: number) {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    if (previewIndex === index) setPreviewIndex(null);
  }

  async function sendToAI() {
    if (capturedImages.length === 0) return;
    setSending(true); setSendError("");
    try {
      const fd = new FormData();
      for (const dataUrl of capturedImages) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
        fd.append("images", file);
      }
      if (selectedFolder?.subjectName) fd.append("subject", selectedFolder.subjectName);
      else if (urlSubject) fd.append("subject", urlSubject);
      if (folderCondition.trim()) fd.append("condition", folderCondition.trim());
      else if (urlCondition) fd.append("condition", urlCondition);
      if (urlStudentId) fd.append("studentId", urlStudentId);
      if (urlClassId) fd.append("classId", urlClassId);
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
      router.push(urlReturnTo ?? "/home");
    } finally {
      setSending(false);
    }
  }

  const camOpen = step === "cam";

  return (
    <>
      {/* FAB */}
      <div className="fixed z-50 bottom-28 right-4 md:bottom-8 md:right-8">
        <button onClick={openFolderPicker}
          className="w-14 h-14 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--cta)", borderRadius: "var(--radius-md)", color: "#fff",
            boxShadow: "6px 6px 14px rgba(104,117,245,0.3), inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.2)" }}>
          <Camera size={24} />
        </button>
      </div>

      {/* ── STEP 1: Folder tanlash ── */}
      {step === "folder" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && closeAll()}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Jild tanlang</p>
              <button onClick={closeAll} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-72">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
              ) : folders.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Jild topilmadi</p>
              ) : folders.map(f => (
                <button key={f.id} onClick={() => selectFolder(f)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xl">{f.icon || "📁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                    {f.subjectName && (
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{f.subjectIcon} {f.subjectName}</p>
                    )}
                  </div>
                  <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Masala sharti ── */}
      {step === "condition" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && closeAll()}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Masala sharti</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedFolder?.icon} {selectedFolder?.name}</p>
              </div>
              <button onClick={closeAll} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            {selectedFolder?.subjectName && (
              <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--accent-light)" }}>
                <BookOpen size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                  {selectedFolder.subjectIcon} {selectedFolder.subjectName}
                </span>
              </div>
            )}
            <div className="px-5 pt-4 pb-2">
              <textarea
                autoFocus
                value={folderCondition}
                onChange={e => setFolderCondition(e.target.value)}
                placeholder="Masalan: Darslik 45-bet, 3-mashq... (ixtiyoriy)"
                rows={4}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="px-5 pb-5">
              <button onClick={openCamera}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--cta)", color: "#fff" }}>
                <Camera size={16} /> Kamerani ochish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camera ── */}
      {camOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#000" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div>
              <p className="text-sm font-semibold text-white">Hujjatni skanerlash</p>
              {selectedFolder && (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{selectedFolder.icon} {selectedFolder.name}</p>
              )}
            </div>
            <button onClick={closeAll} className="p-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <X size={20} />
            </button>
          </div>

          {/* Video */}
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>

          {/* Thumbnail strip — olingan rasmlar */}
          {capturedImages.length > 0 && (
            <div className="shrink-0 px-3 py-2 flex gap-2 overflow-x-auto" style={{ background: "rgba(0,0,0,0.7)" }}>
              {capturedImages.map((img, i) => (
                <button key={i} onClick={() => setPreviewIndex(i)}
                  className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden"
                  style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "var(--cta)", color: "#fff" }}>{i + 1}</span>
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ background: "rgba(0,0,0,0.6)" }}>
            {/* Gallery */}
            <button onClick={() => galleryInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <Images size={22} />
            </button>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={pickFromGallery} />

            {/* Capture */}
            <button onClick={captureAndCorrect} disabled={snapping}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{ background: "#22c55e", boxShadow: "0 0 24px rgba(34,197,94,0.5)",
                border: "4px solid rgba(255,255,255,0.3)", transform: snapping ? "scale(0.9)" : "scale(1)" }}>
              {snapping ? <Loader2 size={24} color="#fff" className="animate-spin" /> : <Camera size={24} color="#fff" />}
            </button>

            {/* Tayyor yoki bo'sh joy */}
            {capturedImages.length > 0 ? (
              <button onClick={goToConfirm}
                className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5"
                style={{ background: "var(--cta)", color: "#fff" }}>
                <Check size={18} />
                <span className="text-[9px] font-bold">{capturedImages.length}</span>
              </button>
            ) : (
              <div className="w-12 h-12" />
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox: to'liq ko'rish ── */}
      {previewIndex !== null && capturedImages[previewIndex] && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setPreviewIndex(null)}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm font-semibold">{previewIndex + 1} / {capturedImages.length}</p>
            <div className="flex gap-2">
              <button onClick={() => { removeImage(previewIndex); setPreviewIndex(null); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <Trash2 size={16} />
              </button>
              <button onClick={() => setPreviewIndex(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img src={capturedImages[previewIndex]} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
          {/* Thumbnail navigation */}
          {capturedImages.length > 1 && (
            <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto justify-center" onClick={e => e.stopPropagation()}>
              {capturedImages.map((img, i) => (
                <button key={i} onClick={() => setPreviewIndex(i)}
                  className="shrink-0 w-12 h-12 rounded-lg overflow-hidden"
                  style={{ border: `2px solid ${i === previewIndex ? "var(--cta)" : "rgba(255,255,255,0.2)"}` }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm ── */}
      {step === "confirm" && capturedImages.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  Tahlilga yuborish · {capturedImages.length} ta rasm
                </p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {urlStudentName && <p className="text-xs" style={{ color: "var(--accent)" }}>{urlStudentName}</p>}
                  {selectedFolder?.subjectName && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedFolder.subjectIcon} {selectedFolder.subjectName}</p>}
                  {urlSubject && !selectedFolder?.subjectName && <p className="text-xs" style={{ color: "var(--text-muted)" }}>📖 {urlSubject}</p>}
                  {folderCondition.trim() && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>📝 {folderCondition}</p>}
                  {urlCondition && !folderCondition.trim() && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>📝 {urlCondition}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {/* Yana rasm olish */}
                <button onClick={() => { setStep("cam"); document.body.classList.add("modal-open"); }}
                  className="p-1.5 rounded-lg" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                  <Camera size={15} />
                </button>
                <button onClick={closeAll} className="p-1.5 rounded-lg" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Thumbnail grid */}
            <div className="mx-5 mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {capturedImages.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                  style={{ border: "1px solid var(--border)" }}>
                  <img src={img} alt="" className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewIndex(i)} />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>

            {/* Subject input (agar kerak) */}
            {!selectedFolder?.subjectId && !urlSubject && (
              <div className="px-5 mt-3">
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  Fan / ko&apos;rsatma (ixtiyoriy)
                </label>
                <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  placeholder="Masalan: 7-sinf matematika..."
                  value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !sending && sendToAI()} />
              </div>
            )}

            {sendError && <p className="text-xs px-5 mt-2" style={{ color: "var(--error)" }}>{sendError}</p>}

            <div className="px-5 py-4">
              <button onClick={sendToAI} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--cta)", color: "#fff", opacity: sending ? 0.7 : 1 }}>
                {sending ? <><Loader2 size={16} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={16} /> Tahlil qilish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
