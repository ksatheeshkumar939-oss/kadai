"use client";

import { useCallback, useEffect, useState } from "react";

type Product = { id: string; name: string; price: number | string; image_url: string };
type Order = {
  id: string;
  buyer_name: string | null;
  total: number | string;
  type: "single" | "split";
  status: "pending" | "paid" | "partially_paid" | "fully_paid";
  created_at: string;
  product_name: string;
};

const BADGES: Record<Order["status"], { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-green-100 text-green-800" },
  fully_paid: { label: "Fully paid", cls: "bg-green-100 text-green-800" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
  partially_paid: { label: "Partially paid", cls: "bg-blue-100 text-blue-800" },
};

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      if (!pRes.ok || !oRes.ok) throw new Error("load failed");
      setProducts(await pRes.json());
      setOrders(await oRes.json());
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Products</h2>
        {!loading && products.length === 0 ? (
          <p className="text-sm text-gray-500">No products yet. Add your first one.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-gray-600">${Number(p.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orders</h2>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0F766E]" />
            )}
            Refresh
          </button>
        </div>

        {!loading && orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const b = BADGES[o.status] ?? BADGES.pending;
                  return (
                    <tr key={o.id} className="border-t">
                      <td className="whitespace-nowrap p-3">
                        {new Date(o.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3">{o.product_name}</td>
                      <td className="p-3">{o.buyer_name || "-"}</td>
                      <td className="p-3">{o.type === "split" ? "Split" : "Single"}</td>
                      <td className="p-3">${Number(o.total).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={"rounded-full px-3 py-1 text-xs font-medium " + b.cls}>
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}