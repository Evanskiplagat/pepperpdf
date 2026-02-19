"use client";

import { useRouter } from "next/navigation";
import { PAID_PLAN_STORAGE_KEY } from "../../lib/billing";

type PaymentClientProps = {
  safeReturnTo: string;
};

export default function PaymentClient({ safeReturnTo }: PaymentClientProps) {
  const router = useRouter();

  const handlePay = () => {
    localStorage.setItem(PAID_PLAN_STORAGE_KEY, "true");
    router.push(safeReturnTo);
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      className="mt-2 w-full rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.3)] transition hover:bg-red-700 active:scale-95"
    >
      Pay €1.00 and Export PDF
    </button>
  );
}
