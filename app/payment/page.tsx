import Link from "next/link";
import PaymentClient from "./PaymentClient";

type PaymentPageProps = {
  searchParams?: {
    intent?: string;
    returnTo?: string;
  };
};

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  const intent = searchParams?.intent;
  const returnTo = searchParams?.returnTo || "/editor";
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/editor";

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">P</div>
            <span className="text-sm font-black tracking-widest text-gray-900">PEPPERPDF</span>
          </Link>
          <Link
            href={safeReturnTo}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Back to editor
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">Checkout</p>
          <h1 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">Export your PDF for €1</h1>
          {intent === "export" && (
            <p className="mt-1.5 text-sm text-gray-500">Your export will be ready immediately after payment.</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">

          {/* Payment form */}
          <div className="order-2 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 lg:order-1">
            <h2 className="mb-5 text-base font-bold text-gray-900">Payment details</h2>
            <form className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <PaymentClient safeReturnTo={safeReturnTo} />

              <p className="text-center text-xs text-gray-400">
                Demo UI only — integrate Stripe or PayPal to process real payments.
              </p>
            </form>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-4">
              {["Secure payment", "Instant delivery", "No subscription", "Receipt by email"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 shrink-0 text-green-500">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3.5 6l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="order-1 lg:order-2">
            <div className="rounded-2xl border-2 border-red-600 bg-white p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600">Order summary</p>

              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">PDF Export</p>
                    <p className="text-xs text-gray-400">Single export · one-time charge</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">€1.00</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">Tax</span>
                  <span className="text-xs text-gray-400">€0.00</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-red-600">€1.00</span>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">What you get</p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  "Fully editable PDF exported",
                  "All text edits preserved",
                  "Shapes & annotations included",
                  "Download ready instantly",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-red-500">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
