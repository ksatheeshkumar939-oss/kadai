import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { createPayPalOrder } from "@/lib/paypal";
import { toCents } from "@/lib/money";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request.");
  }

  const productId = String(body.productId ?? "").trim();
  const buyerName = String(body.buyerName ?? "").trim().slice(0, 60) || null;
  if (!UUID.test(productId)) return err("Product not found.", 404);

  const { data: product, error: pErr } = await db
    .from("products")
    .select("id, name, price, status")
    .eq("id", productId)
    .maybeSingle();

  if (pErr) {
    console.error("checkout: product lookup failed:", pErr.message);
    return err("Something went wrong, please try again.", 500);
  }
  if (!product || product.status !== "published") return err("Product not found.", 404);

  const cents = toCents(Number(product.price));
  if (!Number.isInteger(cents) || cents <= 0) {
    return err("This product has an invalid price.", 500);
  }

  const { data: order, error: oErr } = await db
    .from("orders")
    .insert({
      product_id: product.id,
      buyer_name: buyerName,
      total: Number((cents / 100).toFixed(2)),
      type: "single",
      status: "pending",
    })
    .select("id")
    .single();

  if (oErr || !order) {
    console.error("checkout: order insert failed:", oErr?.message);
    return err("Something went wrong, please try again.", 500);
  }

  try {
    const { paypalOrderId, approveUrl } = await createPayPalOrder(
      cents,
      product.name,
      order.id
    );
    const { error: uErr } = await db
      .from("orders")
      .update({ paypal_order_id: paypalOrderId })
      .eq("id", order.id);
    if (uErr) throw new Error(uErr.message);

    return NextResponse.json({ approveUrl });
  } catch (e) {
    console.error("checkout: PayPal step failed:", e);
    await db.from("orders").delete().eq("id", order.id);
    return err("Could not start the payment. Please try again.", 500);
  }
}