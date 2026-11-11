import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";


export async function GET() {
  const { data, error } = await db
    .from("orders")
    .select("id, buyer_name, total, type, status, created_at, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list orders failed:", error.message);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }

  const orders = (data ?? []).map((o: any) => ({
    id: o.id,
    buyer_name: o.buyer_name,
    total: o.total,
    type: o.type,
    status: o.status,
    created_at: o.created_at,
    product_name: o.products?.name ?? "(deleted product)",
  }));

  return NextResponse.json(orders);
}
