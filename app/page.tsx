import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#ffe8c2_0%,transparent_26%),radial-gradient(circle_at_88%_0%,#cfdfff_0%,transparent_32%),linear-gradient(180deg,#f6f8fd_0%,#e9eef7_100%)]">
      <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 lg:px-10 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8deea] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1f2738] text-lg font-bold text-white shadow-[0_10px_20px_rgba(31,39,56,0.25)]">
              P
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.22em] text-[#1f2738]">PEPPERPDF</div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#7b859a]">Document Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/payment"
              className="rounded-full border border-[#d8deea] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f6880] transition hover:border-[#c4d0e5] hover:bg-[#f6f9ff]"
            >
              Pricing
            </Link>
            <Link
              href="/editor"
              className="rounded-full bg-[#1f2738] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(31,39,56,0.25)] transition hover:bg-[#161d2c]"
            >
              Open Editor
            </Link>
          </div>
        </header>

        <section className="grid items-start gap-5 pt-6 xl:min-h-[calc(100vh-7.5rem)] xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
          <div className="rounded-3xl border border-[#d8deea] bg-gradient-to-b from-[#f9fbff] to-[#eff4ff] p-5 sm:p-7 lg:p-10 xl:p-12">
            <span className="inline-flex rounded-full border border-[#ffd7bc] bg-[#fff6eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a35d2e]">
              FAST PDF WORKFLOW
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#1f2738] sm:text-5xl lg:text-6xl xl:text-7xl xl:leading-[1.02]">
              Edit PDFs with
              <br />
              clean precision.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5f6880] sm:text-base sm:leading-8">
              Replace text, add annotations, and export production-ready files from one focused workspace for forms,
              reports, and internal docs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/editor"
                className="rounded-full bg-[#ea4335] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_28px_rgba(234,67,53,0.28)] transition hover:bg-[#d73a2d]"
              >
                Start Editing
              </Link>
              <Link
                href="/payment"
                className="rounded-full border border-[#c9d3e5] bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f6880] transition hover:bg-[#f6f9ff]"
              >
                See Plans
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-[#4f5a72] sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-[#d8deea] bg-white px-4 py-3">3-click PDF upload</div>
              <div className="rounded-xl border border-[#d8deea] bg-white px-4 py-3">Smart text overlays</div>
              <div className="rounded-xl border border-[#d8deea] bg-white px-4 py-3">Fast export output</div>
            </div>
          </div>

          <div className="grid auto-rows-min content-start gap-4">
            <div className="rounded-2xl border border-[#d8deea] bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8b94a8]">Preview</div>
              <div className="mt-4 rounded-xl border border-[#d8deea] bg-[#f6f9ff] p-3">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#8791a6]">
                  <span>Editor Canvas</span>
                  <span>Ready</span>
                </div>
                <div className="h-40 rounded-lg bg-gradient-to-br from-[#ffffff] to-[#eef2fa] p-3">
                  <div className="h-2 w-24 rounded bg-[#d8deea]" />
                  <div className="mt-3 h-2 w-40 rounded bg-[#d8deea]" />
                  <div className="mt-2 h-2 w-32 rounded bg-[#d8deea]" />
                  <div className="mt-5 rounded-md border border-[#c8d4ea] bg-white px-3 py-2 text-xs text-[#5f6880]">
                    Text Layer Active
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#2d3d57] bg-[#1f2738] p-5 text-white">
              <div className="text-xs uppercase tracking-[0.28em] text-white/70">Pro Annual</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-semibold sm:text-5xl">$190</span>
                <span className="mb-1 text-xs uppercase tracking-[0.24em] text-white/70">per year</span>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#ffb8b2]">Save 16% vs monthly</div>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>Unlimited exports</li>
                <li>Advanced editing tools</li>
                <li>Priority support</li>
                <li>Version history (90 days)</li>
                <li>Team sharing</li>
              </ul>
              <Link
                href="/payment"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1f2738] transition hover:bg-[#eef3ff]"
              >
                Start Annual Plan
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
