"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Share = {
  id: string;
  participant_name: string;
  amount: string | number;
  status: "pending" | "paid";
};
type Data = {
  order: { id: string; total: string | number; status: string };
  product: { name: string; image_url: string } | null;
  shares: Share[];
};

export default function SplitTrackerPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0F766E]" />
        </main>
      }
    >
      <SplitTracker />
    </Suspense>
  );
}

function SplitTracker() {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/split/${orderId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "error");
      setData(json);
      setError("");
    } catch {
      setError("We couldn't load this split. Please try again.");
    }
  }, [orderId]);

  // Load now, then refresh every 10 seconds
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function payShare(shareId: string) {
    if (payingId) return; // stops double clicks
    setPayingId(shareId);
    setPayError("");
    try {
      const res = await fetch("/api/split/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const json = await res.json();
      if (!res.ok || !json.approveUrl) throw new Error(json.error || "error");
      window.location.href = json.approveUrl;
    } catch {
      setPayError("Something went wrong, please try again.");
      setPayingId(null);
      load();
    }
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-gray-600">{error}</p>
        <Link href="/shop" className="inline-block rounded-xl bg-[#0F766E] px-5 py-2 text-white">
          Back to shop
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0F766E]" />
      </main>
    );
  }

  const paidCount = data.shares.filter((s) => s.status === "paid").length;
  const allPaid = data.shares.length > 0 && paidCount === data.shares.length;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <div className="overflow-hidden rounded-xl border">
        {data.product?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.product.image_url} alt={data.product.name} className="h-48 w-full object-cover" />
        )}
        <div className="p-4">
          <h1 className="text-lg font-semibold">{data.product?.name ?? "Group order"}</h1>
          <p className="text-gray-600">Total: ${Number(data.order.total).toFixed(2)}</p>
        </div>
      </div>

      {allPaid && (
        <div className="rounded-xl bg-green-100 p-4 text-center font-medium text-green-800">
          🎉 Fully paid! The seller is preparing your order.
        </div>
      )}

      <p className="text-sm font-medium text-gray-700">
        {paidCount} of {data.shares.length} paid
      </p>

      <ul className="divide-y rounded-xl border">
        {data.shares.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 p-3">
            <div>
              <p className="font-medium">{s.participant_name}</p>
              <p className="text-sm text-gray-600">${Number(s.amount).toFixed(2)}</p>
            </div>
            {s.status === "paid" ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">✅ Paid</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">⏳ Pending</span>
                <button
                  onClick={() => payShare(s.id)}
                  disabled={payingId !== null}
                  className="rounded-xl bg-[#0F766E] px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {payingId === s.id ? "Opening PayPal..." : "Pay my share"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {payError && <p className="text-center text-sm text-red-600">{payError}</p>}
    </main>
  );
}
