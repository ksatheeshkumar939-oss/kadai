import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!/^[0-9a-fA-F-]{36}$/.test(orderId)) return err("Split not found.", 404);

  const { data: order, error } = await db
    .from("orders")
    .select("id, product_id, buyer_name, total, type, status, created_at")
    .eq("id", orderId)
    .eq("type", "split")
    .maybeSingle();

  if (error) {
    console.error("split tracker: order lookup failed:", error.message);
    return err("Something went wrong, please try again.", 500);
  }
  if (!order) return err("Split not found.", 404);

  const { data: product } = await db
    .from("products")
    .select("id, name, image_url, price")
    .eq("id", order.product_id)
    .maybeSingle();

  const { data: shares, error: sErr } = await db
    .from("split_shares")
    .select("id, participant_name, amount, status, paid_at")
    .eq("order_id", orderId)
    .order("participant_name", { ascending: true });

  if (sErr) {
    console.error("split tracker: shares lookup failed:", sErr.message);
    return err("Something went wrong, please try again.", 500);
  }

  return NextResponse.json({ order, product, shares: shares ?? [] });
}
