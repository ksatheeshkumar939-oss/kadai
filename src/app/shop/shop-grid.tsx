"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = { id: string; name: string; price: number | string; image_url: string };

export default function ShopGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then(setProducts)
      .catch(() => setError("Something went wrong, please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (products.length === 0) return <p className="text-gray-500">No products yet. Check back soon!</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => (
        <Link key={p.id} href={`/shop/${p.id}`} className="overflow-hidden rounded-xl border transition hover:shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" />
          <div className="p-3">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-sm text-gray-600">${Number(p.price).toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}