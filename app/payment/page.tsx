import Link from "next/link";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#ffe8c2_0%,transparent_26%),radial-gradient(circle_at_88%_0%,#cfdfff_0%,transparent_32%),linear-gradient(180deg,#f6f8fd_0%,#e9eef7_100%)]">
      <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b94a8]">Secure Checkout</div>
            <h1 className="mt-2 text-2xl font-semibold text-[#1f2738] lg:text-3xl">Choose annual plan and pay</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#d8deea] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f6880] transition hover:bg-[#f8fbff]"
          >
            Back
          </Link>
        </header>

        <section className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#d8deea] bg-gradient-to-br from-[#1f2738] to-[#2d3d57] p-6 text-white">
              <div className="text-xs uppercase tracking-[0.28em] text-white/70">Pro Annual</div>
              <div className="mt-2 text-4xl font-semibold sm:text-5xl">$190</div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/70">per year</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#ffb8b2]">Equivalent to $15.83/month</div>
              <ul className="mt-5 space-y-2 text-sm text-white/90">
                <li>Unlimited exports</li>
                <li>Advanced text editing</li>
                <li>Priority support</li>
                <li>Version history (90 days)</li>
                <li>Team sharing</li>
                <li>Watermark removal</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#d8deea] bg-[#f7f9fd] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8b94a8]">Order Summary</div>
              <div className="mt-4 space-y-2 text-sm text-[#5f6880]">
                <div className="flex items-center justify-between">
                  <span>Pro Annual</span>
                  <span>$190.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#d8deea] pt-3 font-semibold text-[#1f2738]">
                  <span>Total today</span>
                  <span>$190.00</span>
                </div>
              </div>
            </div>
          </div>

          <form className="rounded-2xl border border-[#d8deea] bg-white p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b94a8]">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-[#c5cedf] bg-white px-3 py-3 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b94a8]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-[#c5cedf] bg-white px-3 py-3 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b94a8]">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-[#c5cedf] bg-white px-3 py-3 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b94a8]">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full rounded-xl border border-[#c5cedf] bg-white px-3 py-3 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b94a8]">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full rounded-xl border border-[#c5cedf] bg-white px-3 py-3 text-sm text-[#1f2738] outline-none focus:border-[#94a0b8]"
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-[#1f2738] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#161d2c]"
            >
              Pay $190.00 yearly
            </button>

            <p className="mt-3 text-xs text-[#8b94a8]">Demo UI only. Integrate Stripe/PayPal to process payments.</p>
            <div className="mt-5 grid gap-2 rounded-xl border border-[#d8deea] bg-[#f7f9fd] p-4 text-xs text-[#5f6880] sm:grid-cols-2">
              <span>Includes 12 months access</span>
              <span>Cancel before renewal</span>
              <span>Secure card processing</span>
              <span>Email invoice receipt</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
