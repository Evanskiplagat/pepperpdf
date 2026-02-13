"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import PdfCanvas, { type PdfCanvasHandle } from "./PdfCanvas";

const SESSION_STORAGE_KEY = "pepperpdf_session_id";
const DOC_ID = "editor-main";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type TempDocResponse = {
  document: {
    title?: string;
    content?: {
      activeTab?: string;
      zoom?: number;
    };
    updated_at?: string;
  } | null;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function EditorPage() {
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
  const previousPdfUrlRef = useRef<string | null>(null);
  const pdfCanvasRef = useRef<PdfCanvasHandle | null>(null);

  const tabs = [
    { id: "design", label: "Design", icon: "🎨" },
    { id: "text", label: "Text", icon: "📝" },
    { id: "elements", label: "Elements", icon: "⬛" },
    { id: "uploads", label: "Uploads", icon: "⬆" },
  ];

  const shapes = [
    { label: "Rectangle", icon: "▭" },
    { label: "Circle", icon: "◯" },
    { label: "Triangle", icon: "△" },
    { label: "Line", icon: "—" },
    { label: "Arrow", icon: "→" },
    { label: "Star", icon: "★" },
  ];

  const statusText = useMemo(() => {
    if (!sessionId) {
      return "No session";
    }
    if (saveDisabled) {
      return "Autosave Off";
    }
    if (saveStatus === "saving") {
      return "Saving...";
    }
    if (saveStatus === "saved") {
      return "Saved";
    }
    if (saveStatus === "error") {
      return "Save failed";
    }

    return "Not saved yet";
  }, [saveDisabled, saveStatus, sessionId]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    const nextSessionId = stored || createSessionId();

    if (!stored) {
      localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    }

    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(
          `/api/temp-doc?sessionId=${encodeURIComponent(sessionId)}&docId=${encodeURIComponent(DOC_ID)}`
        );

        if (response.status === 404) {
          setIsHydrated(true);
          return;
        }
        if (response.status === 503) {
          setSaveDisabled(true);
          setSaveStatus("idle");
          setIsHydrated(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load temp document");
        }

        const data = (await response.json()) as TempDocResponse;
        if (data.document?.title) {
          setTitle(data.document.title);
        }

        if (data.document?.content?.activeTab) {
          setActiveTab(data.document.content.activeTab);
        }

        if (typeof data.document?.content?.zoom === "number") {
          setZoom(data.document.content.zoom);
        }
      } catch {
        setSaveStatus("error");
      } finally {
        setIsHydrated(true);
      }
    };

    load();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !isHydrated || saveDisabled) {
      return;
    }

    const saveTimer = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const response = await fetch("/api/temp-doc", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            docId: DOC_ID,
            title,
            content: {
              activeTab,
              zoom,
            },
          }),
        });

        if (response.status === 503) {
          setSaveDisabled(true);
          setSaveStatus("idle");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to save temp document");
        }

        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 900);

    return () => clearTimeout(saveTimer);
  }, [activeTab, isHydrated, saveDisabled, sessionId, title, zoom]);

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMessage("Only PDF files are supported.");
      event.target.value = "";
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!bytes.byteLength) {
        setUploadMessage("Selected PDF is empty.");
        event.target.value = "";
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPdfBytes(bytes);
      setPdfUrl(objectUrl);
      setUploadedPdfName(file.name);
      setUploadMessage(null);
      setActiveTab("uploads");
      event.target.value = "";
    } catch {
      setUploadMessage("Could not read this PDF file.");
      event.target.value = "";
    }
  };

  useEffect(() => {
    const previousUrl = previousPdfUrlRef.current;
    previousPdfUrlRef.current = pdfUrl;

    if (previousUrl && previousUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previousUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      const currentUrl = previousPdfUrlRef.current;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, []);

  const handleExportPdf = async () => {
    try {
      const bytes = await pdfCanvasRef.current?.exportPdf();
      if (!bytes) {
        setUploadMessage("Upload a PDF before exporting.");
        return;
      }

      // Create the blob from exact PDF bytes to avoid byte-offset corruption.
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${title.trim() || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 250);
      setUploadMessage(null);
    } catch {
      setUploadMessage("Export failed for this PDF.");
    }
  };

  return (
    <div className="editor-shell">

      {/* Header */}
      <header className="editor-card editor-appear sticky top-0 z-30 mx-3 mt-3 flex h-16 items-center justify-between rounded-2xl px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f2738] text-lg font-bold text-white shadow-[0_12px_30px_rgba(31,39,56,0.35)] ring-1 ring-white/70">
            P
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-wide text-[#1f2738]">
              PEPPERPDF
            </div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#6c7483]">
              Pro Editor
            </div>
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="ml-6 rounded-full border border-[#d8deea] bg-white px-4 py-2 text-sm text-[#1f2738] shadow-sm outline-none transition focus:border-[#94a0b8] focus:shadow-md"
          />
        </div>
        <div className="flex items-center gap-3 text-[#6c7483]">
          <span className="hidden rounded-full border border-[#ffd7bc] bg-[#fff6eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a35d2e] shadow-sm md:inline-flex">
            Text edits only
          </span>
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
            {statusText}
          </span>
          <label className="cursor-pointer rounded-full border border-[#d8deea] bg-white px-4 py-2 text-sm font-semibold text-[#394258] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]">
            Upload PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </label>
          <button className="rounded-full border border-[#d8deea] bg-white p-2 text-sm text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Undo">
            ↶
          </button>
          <button className="rounded-full border border-[#d8deea] bg-white p-2 text-sm text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Redo">
            ↷
          </button>
          <div className="h-6 w-px bg-[#d8deea]" />
          <button className="flex items-center gap-2 rounded-full border border-[#d8deea] bg-white px-4 py-2 text-sm text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]">
            <span>⤴</span> Share
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 rounded-full bg-[#1f2738] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(31,39,56,0.3)] transition hover:bg-[#161d2c] hover:shadow-[0_16px_40px_rgba(31,39,56,0.32)]"
          >
            <span>📄</span> Export PDF
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-5.25rem)] grid-cols-1 gap-3 p-3 lg:grid-cols-[260px_1fr_320px]">
        {/* Left Sidebar */}
        <aside className="editor-card editor-appear hidden overflow-hidden rounded-2xl lg:block">
          {/* Sidebar Tabs */}
          <div className="flex flex-col border-b border-[#d8deea]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#f3f6fc] text-[#1f2738]"
                    : "text-[#5f6880] hover:bg-[#f8fafe] hover:text-[#1f2738]"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="overflow-y-auto p-6">
            {activeTab === "design" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
                  Templates
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    "Business Card",
                    "Invoice",
                    "Certificate",
                    "Flyer",
                  ].map((template) => (
                    <div
                      key={template}
                      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#d8deea] bg-[#f7f9fd] shadow-sm transition hover:border-[#bcc6d8] hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute bottom-2 left-2 text-xs font-medium opacity-0 transition group-hover:opacity-100">
                        {template}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "text" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
                  Add Text
                </div>
                <div className="mt-4 space-y-3">
                  <button className="w-full rounded-xl border border-[#d8deea] bg-white px-4 py-6 text-left shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff] hover:shadow-md">
                    <div className="text-2xl font-bold">Add Heading</div>
                  </button>
                  <button className="w-full rounded-xl border border-[#d8deea] bg-white px-4 py-5 text-left shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff] hover:shadow-md">
                    <div className="text-lg">Add Subheading</div>
                  </button>
                  <button className="w-full rounded-xl border border-[#d8deea] bg-white px-4 py-4 text-left shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff] hover:shadow-md">
                    <div className="text-sm">Add Body Text</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "elements" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
                  Shapes
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {shapes.map((item) => (
                    <button
                      key={item.label}
                      className="flex h-20 flex-col items-center justify-center gap-2 rounded-xl border border-[#d8deea] bg-white text-sm text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff] hover:shadow-md"
                      title={item.label}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] text-[#6c7483]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
                  Lines & Connectors
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "Line", icon: "—" },
                      { label: "Dashed", icon: "⋯" },
                      { label: "Arrow", icon: "→" },
                      { label: "Double", icon: "⇄" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="flex h-16 flex-col items-center justify-center gap-2 rounded-xl border border-[#d8deea] bg-white text-xs text-[#6c7483] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff] hover:shadow-md"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "uploads" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7483]">
                  Upload Media
                </div>
                <div className="mt-4">
                  <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#c5cedf] bg-white shadow-sm transition hover:border-[#94a0b8] hover:bg-[#f9fbff] hover:shadow-md">
                    <span className="text-3xl">⬆</span>
                    <div className="text-sm text-[#525e78]">Click to upload PDF</div>
                    <div className="text-xs text-[#8b94a8]">{uploadedPdfName}</div>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadMessage && (
                    <p className="mt-3 text-xs text-[#6c7483]">{uploadMessage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="editor-appear flex min-w-0 flex-col rounded-2xl border border-[#d8deea] bg-[#e9edf5]">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-[#d8deea] bg-white/90 px-6 py-3 shadow-[0_6px_14px_rgba(15,23,42,0.04)] backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-[#6c7483]">
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 font-semibold text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Bold">
                B
              </button>
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 italic text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Italic">
                I
              </button>
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 underline text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Underline">
                U
              </button>
              <div className="mx-2 h-6 w-px bg-[#d8deea]" />
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Align Left">
                ⫶
              </button>
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Align Center">
                ≡
              </button>
              <button className="rounded-full border border-[#d8deea] bg-white px-3 py-1.5 text-[#525e78] shadow-sm transition hover:border-[#bcc6d8] hover:bg-[#f9fbff]" title="Align Right">
                ≣
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 rounded-full border border-[#d8deea] bg-white px-3 py-1.5 shadow-sm">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="rounded-lg px-2 py-1 text-[#6c7483] transition hover:bg-[#f9fbff]"
              >
                −
              </button>
              <span className="min-w-[52px] text-center text-sm text-[#6c7483]">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="rounded-lg px-2 py-1 text-[#6c7483] transition hover:bg-[#f9fbff]"
              >
                +
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex flex-1 items-start justify-center overflow-auto p-4 lg:p-8">
            <div
              className="editor-glow h-full w-full max-w-[1100px] rounded-[24px] border border-[#d8deea] bg-white"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
              }}
            >
              <PdfCanvas
                ref={pdfCanvasRef}
                key={pdfUrl ?? "empty"}
                url={pdfUrl ?? undefined}
                bytes={pdfBytes ?? undefined}
              />
            </div>
          </div>
        </main>

        {/* Right Properties Panel */}
        <aside className="editor-card editor-appear hidden overflow-y-auto rounded-2xl lg:block">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1f2738]">Properties</h2>
              <p className="text-xs text-[#6c7483]">Customize selected element</p>
            </div>

            <div className="space-y-5">
              {/* Transform */}
              <div className="rounded-2xl border border-[#d8deea] bg-[#f7f9fd] p-4">
                <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#8b94a8]">
                  Transform
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">X</label>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Y</label>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Width</label>
                    <input
                      type="number"
                      defaultValue="200"
                      className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Height</label>
                    <input
                      type="number"
                      defaultValue="200"
                      className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                    />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="rounded-2xl border border-[#d8deea] bg-[#f7f9fd] p-4">
                <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#8b94a8]">
                  Appearance
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue="#DC2626"
                        className="h-9 w-10 cursor-pointer rounded-lg border border-[#c5cedf] bg-white"
                      />
                      <input
                        type="text"
                        defaultValue="#DC2626"
                        className="flex-1 rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Stroke</label>
                    <div className="grid grid-cols-[1fr_90px] gap-2">
                      <input
                        type="color"
                        defaultValue="#7f1d1d"
                        className="h-9 w-full cursor-pointer rounded-lg border border-[#c5cedf] bg-white"
                      />
                      <input
                        type="number"
                        defaultValue="2"
                        className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="rounded-2xl border border-[#d8deea] bg-[#f7f9fd] p-4">
                <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#8b94a8]">
                  Typography
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-[#6c7483]">Font</label>
                    <select className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]">
                      <option>Outfit</option>
                      <option>Plus Jakarta Sans</option>
                      <option>Space Grotesk</option>
                      <option>IBM Plex Sans</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-[#6c7483]">Size</label>
                      <input
                        type="number"
                        defaultValue="24"
                        className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#6c7483]">Weight</label>
                      <select className="w-full rounded-lg border border-[#c5cedf] bg-white px-3 py-2 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]">
                        <option>Regular</option>
                        <option>Medium</option>
                        <option>Semibold</option>
                        <option>Bold</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-lg border border-[#d8deea] bg-[#eef2fa] px-4 py-2.5 text-sm font-semibold text-[#5f6880] transition hover:bg-[#e3e9f5]">
                Delete Element
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
