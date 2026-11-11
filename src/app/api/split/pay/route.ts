import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { createPayPalOrder } from "@/lib/paypal";
import { toCents } from "@/lib/money";

export async function POST(req: Request) {
  try {
    if (process.env.SPLIT_ENABLED !== "true") {
      return NextResponse.json({ error: "Group payment is coming soon." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const shareId = body?.shareId;
    if (typeof shareId !== "string" || !shareId) {
      return NextResponse.json({ error: "Missing share." }, { status: 400 });
    }

    // Load the share (amount always comes from the database)
    const { data: share } = await db
      .from("split_shares")
      .select("id, order_id, participant_name, amount, status")
      .eq("id", shareId)
      .maybeSingle();
    if (!share) {
      return NextResponse.json({ error: "Share not found." }, { status: 404 });
    }
    if (share.status === "paid") {
      return NextResponse.json({ error: "This share is already paid." }, { status: 400 });
    }

    // Find the product name for the PayPal description
    const { data: order } = await db
      .from("orders")
      .select("product_id")
      .eq("id", share.order_id)
      .maybeSingle();
    const { data: product } = order
      ? await db.from("products").select("name").eq("id", order.product_id).maybeSingle()
      : { data: null };

    const { paypalOrderId, approveUrl } = await createPayPalOrder(
      toCents(Number(share.amount)),
      `${product?.name ?? "Product"} - share of ${share.participant_name}`,
      share.id
    );

    const { error: saveErr } = await db
      .from("split_shares")
      .update({ paypal_order_id: paypalOrderId })
      .eq("id", share.id);
    if (saveErr) throw saveErr;

    return NextResponse.json({ approveUrl });
  } catch (e) {
    console.error("split pay failed", e);
    return NextResponse.json({ error: "Something went wrong, please try again." }, { status: 500 });
  }
}
