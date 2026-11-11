"use client";

import { useCallback, useEffect, useState } from "react";
import { friendlyError } from "@/lib/errors";

type Product = {
  id: string;
  name: string;
  price: number | string;
  image_url: string;
};

type Order = {
  id: string;
  created_at?: string;
  buyer_name?: string | null;
  type?: string;
  total?: number | string;
  amount?: number | string;
  status?: string;
  product_name?: string;
  name?: string;
  product?: { name?: string } | null;
  products?: { name?: string } | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-green-100 text-green-800" },
  fully_paid: { label: "Fully paid", cls: "bg-green-100 text-green-800" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
  partially_paid: { label: "Partially paid", cls: "bg-blue-100 text-blue-800" },
};

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function orderProduct(o: Order) {
  return o.product_name ?? o.product?.name ?? o.products?.name ?? o.name ?? "-";
}

export default function SellerDashboard() {
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
      if (!pRes.ok || !oRes.ok) {
        throw new Error("We couldn't load your dashboard. Please try again.");
      }
      const p = await pRes.json();
      const o = await oRes.json();
      setProducts(Array.isArray(p) ? p : p.products ?? []);
      setOrders(Array.isArray(o) ? o : o.orders ?? []);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Seller dashboard</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-busy={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-medium text-gray-800 disabled:opacity-60"
          >
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            )}
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <a
            href="/seller/new"
            className="flex h-11 items-center justify-center rounded-xl bg-[#0F766E] px-4 text-sm font-medium text-white"
          >
            + Add product
          </a>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Products</h2>
        {products.length === 0 && !loading ? (
          <p className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            No products yet. Click + Add product to create one.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="aspect-square w-full object-cover"
                />
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
        <h2 className="mb-3 text-lg font-semibold">Orders</h2>
        {orders.length === 0 && !loading ? (
          <p className="rounded-xl border bg-white p-4 text-sm text-gray-500">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Buyer</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell">Type</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const s = STATUS[o.status ?? ""] ?? {
                    label: o.status ?? "-",
                    cls: "bg-gray-100 text-gray-700",
                  };
                  const amount = Number(o.total ?? o.amount ?? 0);
                  return (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-3 py-3">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-3">{orderProduct(o)}</td>
                      <td className="px-3 py-3">{o.buyer_name || "-"}</td>
                      <td className="hidden px-3 py-3 capitalize sm:table-cell">
                        {o.type || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">${amount.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium " +
                            s.cls
                          }
                        >
                          {s.label}
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
    </main>
  );
}
