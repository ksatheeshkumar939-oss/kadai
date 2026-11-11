import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { capturePayPalOrder } from "@/lib/paypal";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request.");
  }

  const token = String(body.token ?? "").trim();
  if (!/^[A-Za-z0-9]{10,40}$/.test(token)) return err("Payment not found.", 404);

  const { data, error } = await db
    .from("orders")
    .select("id, status, total, products(name)")
    .eq("paypal_order_id", token)
    .maybeSingle();

  if (error) {
    console.error("capture: lookup failed:", error.message);
    return err("Something went wrong, please try again.", 500);
  }
  if (!data) return err("Payment not found.", 404);

  const order: any = data;
  const productName = order.products?.name ?? "your order";
  const done = () =>
    NextResponse.json({
      status: "paid",
      productName,
      amount: Number(order.total).toFixed(2),
    });

  // Page refreshed after paying: already marked paid, just confirm
  if (order.status === "paid") return done();

  try {
    const { completed } = await capturePayPalOrder(token);
    if (!completed) return err("Payment was not completed. No money was taken.", 400);
  } catch (e) {
    console.error("capture: PayPal failed:", e);
    return err("We could not confirm your payment. Please contact the seller.", 500);
  }

  const { error: uErr } = await db
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id);

  if (uErr) {
    console.error("capture: status update failed:", uErr.message);
    return err("Payment received, but we could not update the order. Please contact the seller.", 500);
  }
  return done();
}