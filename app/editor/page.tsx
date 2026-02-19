"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import PdfCanvas, { type PdfCanvasHandle } from "./PdfCanvas";
import { PAID_PLAN_STORAGE_KEY } from "../../lib/billing";

const SESSION_STORAGE_KEY = "pepperpdf_session_id";
const DOC_ID = "editor-main";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type MobilePanel = null | "tool" | "props";

type TempDocResponse = {
  document: {
    title?: string;
    content?: { activeTab?: string; zoom?: number };
    updated_at?: string;
  } | null;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
const Icon = {
  design: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M10 3l7 7-7 7-7-7 7-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M4 6h12M10 6v9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  elements: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  props: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="10" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="14" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 8h9a4 4 0 010 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4L4 8l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M16 8H7a4 4 0 000 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9l6-3M7 11l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  export: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 3v9M10 12l-3-3M10 12l3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
};

const SHAPE_ICONS: Record<string, JSX.Element> = {
  Rectangle: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><rect x="3" y="6" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Circle: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Triangle: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M10 4L17 16H3L10 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  Line: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  Arrow: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 10h12M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Star: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M10 2l2.5 5 5.5.8-4 3.9.95 5.5L10 14.5l-4.95 2.7L6 11.7 2 7.8l5.5-.8L10 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>,
};

const LINE_ICONS: Record<string, JSX.Element> = {
  Line: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  Dashed: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 10h2M8 10h2M13 10h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  Arrow: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 10h12M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Double: <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M7 6L3 10l4 4M13 6l4 4-4 4M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

/* ── Main component ───────────────────────────────────────────────────── */
export default function EditorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("elements");
  const [zoom, setZoom] = useState(100);
  const [title, setTitle] = useState("Untitled Design");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [uploadedPdfName, setUploadedPdfName] = useState("No PDF uploaded");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const previousPdfUrlRef = useRef<string | null>(null);
  const pdfCanvasRef = useRef<PdfCanvasHandle | null>(null);

  const tabs = [
    { id: "design", label: "Design", icon: Icon.design },
    { id: "text", label: "Text", icon: Icon.text },
    { id: "elements", label: "Elements", icon: Icon.elements },
  ];

  const shapes = ["Rectangle", "Circle", "Triangle", "Line", "Arrow", "Star"];
  const lines = ["Line", "Dashed", "Arrow", "Double"];

  const statusText = useMemo(() => {
    if (!sessionId) return "No session";
    if (saveDisabled) return "Autosave off";
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved") return "Saved";
    if (saveStatus === "error") return "Error";
    return "Not saved";
  }, [saveDisabled, saveStatus, sessionId]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    const next = stored || createSessionId();
    if (!stored) localStorage.setItem(SESSION_STORAGE_KEY, next);
    setSessionId(next);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/temp-doc?sessionId=${encodeURIComponent(sessionId)}&docId=${encodeURIComponent(DOC_ID)}`);
        if (res.status === 404) { setIsHydrated(true); return; }
        if (res.status === 503) { setSaveDisabled(true); setSaveStatus("idle"); setIsHydrated(true); return; }
        if (!res.ok) throw new Error();
        const data = (await res.json()) as TempDocResponse;
        if (data.document?.title) setTitle(data.document.title);
        if (data.document?.content?.activeTab) setActiveTab(data.document.content.activeTab);
        if (typeof data.document?.content?.zoom === "number") setZoom(data.document.content.zoom);
      } catch { setSaveStatus("error"); }
      finally { setIsHydrated(true); }
    };
    load();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !isHydrated || saveDisabled) return;
    const t = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const res = await fetch("/api/temp-doc", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, docId: DOC_ID, title, content: { activeTab, zoom } }),
        });
        if (res.status === 503) { setSaveDisabled(true); setSaveStatus("idle"); return; }
        if (!res.ok) throw new Error();
        setSaveStatus("saved");
      } catch { setSaveStatus("error"); }
    }, 900);
    return () => clearTimeout(t);
  }, [activeTab, isHydrated, saveDisabled, sessionId, title, zoom]);

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMessage("Only PDF files are supported.");
      event.target.value = "";
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!bytes.byteLength) { setUploadMessage("Selected PDF is empty."); event.target.value = ""; return; }
      const objectUrl = URL.createObjectURL(file);
      setPdfBytes(bytes);
      setPdfUrl(objectUrl);
      setUploadedPdfName(file.name);
      setUploadMessage(null);
      setActiveTab("elements");
      event.target.value = "";
    } catch {
      setUploadMessage("Could not read this PDF file.");
      event.target.value = "";
    }
  };

  useEffect(() => {
    const prev = previousPdfUrlRef.current;
    previousPdfUrlRef.current = pdfUrl;
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      const cur = previousPdfUrlRef.current;
      if (cur?.startsWith("blob:")) URL.revokeObjectURL(cur);
    };
  }, []);

  const handleExportPdf = async () => {
    const hasPaid = localStorage.getItem(PAID_PLAN_STORAGE_KEY) === "true";
    if (!hasPaid) {
      setUploadMessage("Export requires a paid plan.");
      router.push("/payment?intent=export&returnTo=/editor");
      return;
    }
    try {
      const bytes = await pdfCanvasRef.current?.exportPdf();
      if (!bytes) { setUploadMessage("Upload a PDF before exporting."); return; }
      const buf = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buf).set(bytes);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.trim() || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 250);
      setUploadMessage(null);
    } catch {
      setUploadMessage("Export failed for this PDF.");
    }
  };

  const toggleMobile = (type: "tool" | "props", tabId?: string) => {
    if (tabId) setActiveTab(tabId);
    setMobilePanel((prev) => {
      if (type === "tool" && tabId && prev === "tool" && activeTab === tabId) return null;
      if (prev === type && !tabId) return null;
      return type;
    });
  };

  /* ── Shared sidebar content ─────────────────────────────────────────── */
  const renderSidebar = () => (
    <div className="p-4">
      {activeTab === "design" && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Templates</p>
          <div className="grid grid-cols-2 gap-2">
            {["Business Card", "Invoice", "Certificate", "Flyer"].map((t) => (
              <div key={t} className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-red-300 hover:shadow-md">
                <div className="absolute inset-0 flex items-end bg-transparent transition group-hover:bg-gray-900/50">
                  <span className="w-full px-2 py-2 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">{t}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "text" && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Text</p>
          <div className="space-y-2">
            <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-5 text-left transition hover:border-red-200 hover:bg-red-50 active:scale-[0.99]">
              <span className="text-xl font-bold text-gray-900">Heading</span>
            </button>
            <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-red-200 hover:bg-red-50 active:scale-[0.99]">
              <span className="text-base font-semibold text-gray-700">Subheading</span>
            </button>
            <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-red-200 hover:bg-red-50 active:scale-[0.99]">
              <span className="text-sm text-gray-600">Body text</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "elements" && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Shapes</p>
          <div className="grid grid-cols-3 gap-2">
            {shapes.map((s) => (
              <button key={s} title={s} className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95">
                {SHAPE_ICONS[s]}
                <span className="text-[9px] font-semibold uppercase tracking-wide">{s}</span>
              </button>
            ))}
          </div>
          <p className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Lines</p>
          <div className="grid grid-cols-2 gap-2">
            {lines.map((l) => (
              <button key={l} className="flex h-12 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95">
                {LINE_ICONS[l]}
                <span className="text-[9px] font-semibold uppercase tracking-wide">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );

  /* ── Shared properties content ──────────────────────────────────────── */
  const renderProperties = () => (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Properties</h2>
          <p className="text-[10px] text-gray-400">Selected element</p>
        </div>
        <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">Text only</span>
      </div>

      <div className="space-y-3">
        {/* Transform */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">Transform</p>
          <div className="grid grid-cols-2 gap-2">
            {[["X", "100"], ["Y", "100"], ["W", "200"], ["H", "200"]].map(([lbl, val]) => (
              <div key={lbl}>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">{lbl}</label>
                <input type="number" defaultValue={val} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">Appearance</p>
          <div className="space-y-2.5">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-500">Fill</label>
              <div className="flex items-center gap-2">
                <input type="color" defaultValue="#DC2626" className="h-8 w-8 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5" />
                <input type="text" defaultValue="#DC2626" className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-red-400" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-500">Stroke</label>
              <div className="grid grid-cols-[1fr_60px] gap-2">
                <input type="color" defaultValue="#7f1d1d" className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5" />
                <input type="number" defaultValue="2" className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">Typography</p>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-500">Font</label>
              <select className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-red-400">
                <option>Outfit</option>
                <option>Plus Jakarta Sans</option>
                <option>Space Grotesk</option>
                <option>IBM Plex Sans</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Size</label>
                <input type="number" defaultValue="24" className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500">Weight</label>
                <select className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-red-400">
                  <option>Regular</option>
                  <option>Medium</option>
                  <option>Bold</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99]">
          Delete Element
        </button>
      </div>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="editor-shell flex h-screen flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="editor-card editor-appear z-30 mx-2 mt-2 flex h-13 shrink-0 items-center justify-between rounded-xl px-3 sm:mx-3 sm:mt-3 sm:h-14 sm:px-5">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-black text-white shadow-sm">
            P
          </div>
          <div className="hidden leading-none sm:block">
            <div className="text-sm font-black tracking-widest text-gray-900">PEPPERPDF</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gray-400">Pro Editor</div>
          </div>
          <div className="mx-1 hidden h-5 w-px shrink-0 bg-gray-200 sm:block" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="hidden min-w-0 max-w-[180px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 outline-none transition focus:border-red-400 focus:bg-white sm:block"
          />
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden text-[11px] font-medium text-gray-400 sm:block">{statusText}</span>

          <div className="hidden items-center gap-1 sm:flex">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50" title="Undo">{Icon.undo}</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50" title="Redo">{Icon.redo}</button>
          </div>

          <div className="hidden h-5 w-px bg-gray-200 sm:block" />

          <button className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:flex">
            {Icon.share}
            <span>Share</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 sm:px-4 sm:text-sm"
          >
            {Icon.export}
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 gap-2 p-2 pb-[4.5rem] sm:gap-3 sm:p-3 sm:pb-[4.75rem] lg:grid-cols-[240px_1fr_300px] lg:pb-3">

        {/* Left Sidebar — desktop only */}
        <aside className="editor-card editor-appear hidden overflow-hidden rounded-xl lg:flex lg:flex-col">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-red-600 text-red-600"
                    : "border-b-2 border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {renderSidebar()}
          </div>
        </aside>

        {/* ── Main Canvas ─────────────────────────────────────────────── */}
        <main className="editor-appear flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:px-4">
            {/* Insert buttons */}
            <button
              onClick={() => pdfCanvasRef.current?.addTextBox()}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-red-600 transition hover:bg-red-100 active:scale-95"
            >
              + Text
            </button>
            <button
              onClick={() => pdfCanvasRef.current?.addRectangle()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 active:scale-95"
            >
              + Shape
            </button>

            <div className="mx-1 h-4 w-px bg-gray-200" />

            {/* Format buttons */}
            <div className="flex items-center gap-0.5">
              {[
                { label: "B", title: "Bold", cls: "font-bold" },
                { label: "I", title: "Italic", cls: "italic" },
                { label: "U", title: "Underline", cls: "underline" },
              ].map((btn) => (
                <button key={btn.label} title={btn.title} className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600 ${btn.cls}`}>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Zoom — pushed to right */}
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1">
              <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition hover:bg-white hover:text-gray-900 hover:shadow-sm">
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
              <span className="min-w-[36px] text-center text-xs font-semibold text-gray-600">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition hover:bg-white hover:text-gray-900 hover:shadow-sm">
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>

          {/* Canvas viewport */}
          <div className="relative min-h-0 flex-1 overflow-auto bg-white">
            <div
              className="h-full w-full"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", transition: "transform 0.2s ease" }}
            >
              <PdfCanvas
                ref={pdfCanvasRef}
                key={pdfUrl ?? "empty"}
                url={pdfUrl ?? undefined}
                bytes={pdfBytes ?? undefined}
                onUploadPdf={handlePdfUpload}
              />
            </div>
          </div>
        </main>

        {/* Right Panel — desktop only */}
        <aside className="editor-card editor-appear hidden overflow-y-auto rounded-xl lg:block">
          {renderProperties()}
        </aside>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 shrink-0 items-stretch border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleMobile("tool", tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition ${
              mobilePanel === "tool" && activeTab === tab.id ? "text-red-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => toggleMobile("props")}
          className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition ${
            mobilePanel === "props" ? "text-red-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {Icon.props}
          <span>Props</span>
        </button>
      </nav>

      {/* ── Mobile slide-up panel ──────────────────────────────────────── */}
      {mobilePanel !== null && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMobilePanel(null)} />
          {/* Panel */}
          <div className="fixed inset-x-0 bottom-16 z-50 max-h-[55vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl lg:hidden">
            {/* Handle */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {mobilePanel === "props" ? "Properties" : tabs.find((t) => t.id === activeTab)?.label}
              </span>
              <button onClick={() => setMobilePanel(null)} className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            {mobilePanel === "tool" ? renderSidebar() : renderProperties()}
          </div>
        </>
      )}
    </div>
  );
}
