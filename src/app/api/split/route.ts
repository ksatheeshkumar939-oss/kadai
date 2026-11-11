import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { toCents, centsToUsd, splitCents } from "@/lib/money";

export async function POST(req: Request) {
  try {
    if (process.env.SPLIT_ENABLED !== "true") {
      return NextResponse.json({ error: "Group payment is coming soon." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const productId = body?.productId;
    if (typeof productId !== "string" || !productId) {
      return NextResponse.json({ error: "Missing product." }, { status: 400 });
    }

    // Validate names: 2 to 8, no empties, no duplicates
    const raw: unknown[] = Array.isArray(body?.names) ? body.names : [];
    const names = raw.map((n) => String(n ?? "").trim());
    if (names.some((n) => n === "" || n.length > 40)) {
      return NextResponse.json({ error: "Every person needs a name (max 40 characters)." }, { status: 400 });
    }
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
      return NextResponse.json({ error: "Each name must be different." }, { status: 400 });
    }
    if (names.length < 2 || names.length > 8) {
      return NextResponse.json({ error: "Split needs 2 to 8 people." }, { status: 400 });
    }

    // Price always comes from the database, never from the browser
    const { data: product } = await db
      .from("products")
      .select("id, price, status")
      .eq("id", productId)
      .eq("status", "published")
      .maybeSingle();
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const totalCents = toCents(Number(product.price));
    const amounts = splitCents(totalCents, names.length);

    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        product_id: product.id,
        buyer_name: names[0],
        total: centsToUsd(totalCents),
        type: "split",
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw orderErr ?? new Error("Order not created");

    const { error: sharesErr } = await db.from("split_shares").insert(
      names.map((name, i) => ({
        order_id: order.id,
        participant_name: name,
        amount: centsToUsd(amounts[i]),
        status: "pending",
      }))
    );
    if (sharesErr) {
      await db.from("orders").delete().eq("id", order.id); // shares cascade
      throw sharesErr;
    }

    return NextResponse.json({ orderId: order.id });
  } catch (e) {
    console.error("split create failed", e);
    return NextResponse.json({ error: "Something went wrong, please try again." }, { status: 500 });
  }
}
