import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { capturePayPalOrder } from "@/lib/paypal";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

// Count all shares of an order and set the order status:
// 0 paid = pending, some paid = partially_paid, all paid = fully_paid
async function recountOrder(orderId: string) {
  const { data: shares, error } = await db
    .from("split_shares")
    .select("status")
    .eq("order_id", orderId);
  if (error || !shares) throw error ?? new Error("Could not read shares");

  const paid = shares.filter((s) => s.status === "paid").length;
  const status =
    paid === 0 ? "pending" : paid === shares.length ? "fully_paid" : "partially_paid";

  const { error: uErr } = await db.from("orders").update({ status }).eq("id", orderId);
  if (uErr) throw uErr;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request.");
  }

  const token = String(body.token ?? "").trim();
  if (!/^[A-Za-z0-9]{10,40}$/.test(token)) return err("Payment not found.", 404);

  // ---------- 1) Is this a normal single purchase? ----------
  const { data, error } = await db
    .from("orders")
    .select("id, status, total, products(name)")
    .eq("paypal_order_id", token)
    .maybeSingle();

  if (error) {
    console.error("capture: lookup failed:", error.message);
    return err("Something went wrong, please try again.", 500);
  }

  if (data) {
    const order: any = data;
    const productName = order.products?.name ?? "your order";
    const done = () =>
      NextResponse.json({
        status: "paid",
        kind: "single",
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

  // ---------- 2) Not in orders: is it a friend's split share? ----------
  const { data: shareData, error: sErr } = await db
    .from("split_shares")
    .select("id, order_id, status, amount, participant_name, orders(id, products(name))")
    .eq("paypal_order_id", token)
    .maybeSingle();

  if (sErr) {
    console.error("capture: share lookup failed:", sErr.message);
    return err("Something went wrong, please try again.", 500);
  }
  if (!shareData) return err("Payment not found.", 404);

  const share: any = shareData;
  const productName = share.orders?.products?.name ?? "your order";
  const shareDone = () =>
    NextResponse.json({
      status: "paid",
      kind: "share",
      orderId: share.order_id,
      productName,
      amount: Number(share.amount).toFixed(2),
    });

  // Page refreshed after paying: already paid, just confirm
  if (share.status === "paid") return shareDone();

  try {
    const { completed } = await capturePayPalOrder(token);
    if (!completed) return err("Payment was not completed. No money was taken.", 400);
  } catch (e) {
    console.error("capture: PayPal failed (share):", e);
    return err("We could not confirm your payment. Please contact the seller.", 500);
  }

  const { error: pErr } = await db
    .from("split_shares")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", share.id);

  if (pErr) {
    console.error("capture: share update failed:", pErr.message);
    return err("Payment received, but we could not update your share. Please contact the seller.", 500);
  }

  try {
    await recountOrder(share.order_id);
  } catch (e) {
    console.error("capture: recount failed:", e);
    // The share is already saved as paid. A refresh of this page will not
    // re-charge, and the next payment recounts again.
  }

  return shareDone();
}
