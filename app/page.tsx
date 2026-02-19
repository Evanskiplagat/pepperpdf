import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0f172a]">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-black text-white">P</div>
            <span className="text-sm font-black tracking-widest text-gray-900">PEPPERPDF</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm font-medium text-gray-500 transition hover:text-gray-900">Features</a>
            <a href="#how" className="text-sm font-medium text-gray-500 transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 transition hover:text-gray-900">Pricing</a>
          </div>
          <Link href="/editor" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95">
            Open Editor
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pt-28">
        <div className="text-center">
          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600">
            PDF Editor · €1 per export
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Edit PDFs like a pro.<br className="hidden sm:block" />
            <span className="text-red-600"> Pay only when you export.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-gray-500 sm:text-lg">
            Click any text to edit it, add shapes and annotations, then export your finished PDF for just €1. No subscription, no account needed.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/editor" className="w-full rounded-xl bg-red-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(220,38,38,0.3)] transition hover:bg-red-700 active:scale-95 sm:w-auto">
              Start Editing — Free
            </Link>
            <a href="#pricing" className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:w-auto">
              See Pricing
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-400">No account needed · Edit free · Pay only to export</p>
        </div>

        {/* Editor mockup */}
        <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto rounded-md border border-gray-200 bg-gray-50 px-4 py-1 text-[11px] text-gray-400">
                pepperpdf.app/editor
              </div>
            </div>
            <div className="flex h-52 items-stretch gap-0 sm:h-72 lg:h-80">
              <div className="hidden w-36 shrink-0 flex-col gap-2 border-r border-gray-100 p-3 sm:flex">
                <div className="h-1.5 w-16 rounded bg-gray-200" />
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-9 rounded-lg border border-gray-100 bg-gray-50" />
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <div className="h-5 w-10 rounded bg-red-100" />
                  <div className="h-5 w-14 rounded bg-gray-100" />
                  <div className="ml-auto h-5 w-10 rounded bg-gray-100" />
                </div>
                <div className="flex-1 bg-[#f8fafc] p-4">
                  <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="h-2.5 w-full rounded bg-gray-100" />
                    <div className="h-2.5 w-5/6 rounded bg-gray-100" />
                    <div className="mt-2 inline-flex rounded bg-red-50 px-2 py-0.5">
                      <div className="h-2 w-16 rounded bg-red-200" />
                    </div>
                    <div className="h-2.5 w-full rounded bg-gray-100" />
                    <div className="h-2.5 w-3/4 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
              <div className="hidden w-28 shrink-0 flex-col gap-2 border-l border-gray-100 p-3 lg:flex">
                <div className="h-1.5 w-14 rounded bg-gray-200" />
                <div className="mt-2 space-y-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 rounded-lg border border-gray-100 bg-gray-50" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">Features</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Everything you need to edit PDFs</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Click-to-edit text", desc: "Click any text in your PDF to edit it directly. Font and position preserved.", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
              { title: "Shapes & annotations", desc: "Add rectangles, text boxes, and annotations anywhere on your document.", icon: "M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" },
              { title: "Export to PDF", desc: "Download your finished PDF with all edits baked in. Just €1 per export.", icon: "M12 15V3m0 12l-4-4m4 4l4-4M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" },
              { title: "No account needed", desc: "Start editing instantly. No sign-up, no subscription, no commitment.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { title: "Runs in your browser", desc: "No installs, no plugins. PepperPDF works entirely in your browser.", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" },
              { title: "Your files stay private", desc: "PDFs are processed locally. Nothing is ever uploaded to our servers.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-red-200 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d={f.icon} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Three steps, that&apos;s it</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { step: "01", title: "Upload your PDF", desc: "Click Upload PDF and choose any PDF from your device. It loads instantly in the editor." },
              { step: "02", title: "Edit freely", desc: "Click text to edit it, add shapes and annotations — all for free with no account." },
              { step: "03", title: "Pay €1 and export", desc: "Happy with your edits? Pay just €1 to download your finished PDF. One-time, no subscription." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-gray-200 bg-white p-6">
                <span className="text-5xl font-black text-red-50 leading-none">{s.step}</span>
                <h3 className="mt-2 text-base font-bold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">Pricing</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-3 text-sm text-gray-500">Edit for free. Pay only when you export.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mx-auto lg:max-w-2xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Free plan</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">€0</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Forever free editing</p>
              <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                {["Upload any PDF", "Click-to-edit text", "Add shapes & annotations", "Unlimited sessions"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-green-500"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-gray-300">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  Export PDF
                </li>
              </ul>
              <Link href="/editor" className="mt-6 block rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                Start editing free
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-red-600 bg-white p-6">
              <span className="absolute -top-3 left-5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Most popular</span>
              <p className="text-xs font-bold uppercase tracking-widest text-red-600">Pay per export</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">€1</span>
                <span className="mb-1 text-sm text-gray-400">/ export</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">One-time · no subscription</p>
              <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                {["Everything in Free", "Download finished PDF", "All edits preserved", "Instant delivery"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-red-500"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/editor" className="mt-6 block rounded-xl bg-red-600 py-3 text-center text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.25)] transition hover:bg-red-700 active:scale-95">
                Start editing → Export for €1
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">Ready to edit your PDF?</h2>
          <p className="mt-3 text-gray-500">No account. No subscription. Just open, edit, and export.</p>
          <Link href="/editor" className="mt-8 inline-block rounded-xl bg-red-600 px-10 py-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(220,38,38,0.3)] transition hover:bg-red-700 active:scale-95">
            Open Editor — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600 text-[10px] font-black text-white">P</div>
            <span className="text-xs font-black tracking-widest text-gray-600">PEPPERPDF</span>
          </div>
          <p className="text-xs text-gray-400">Edit free · Export for €1 · No subscription</p>
          <div className="flex gap-5">
            <a href="#features" className="text-xs text-gray-400 transition hover:text-gray-700">Features</a>
            <a href="#pricing" className="text-xs text-gray-400 transition hover:text-gray-700">Pricing</a>
            <Link href="/editor" className="text-xs text-gray-400 transition hover:text-gray-700">Editor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
