import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { aiText } from "@/lib/ai";
import { reminderPrompt } from "@/lib/prompts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: { orderId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong, please try again." }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!UUID.test(orderId)) {
    return NextResponse.json({ error: "We couldn't find this split." }, { status: 404 });
  }

  const { data: order } = await db
    .from("orders")
    .select("id, product_id, type")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.type !== "split") {
    return NextResponse.json({ error: "We couldn't find this split." }, { status: 404 });
  }

  const [{ data: product }, { data: shares }] = await Promise.all([
    db.from("products").select("name").eq("id", order.product_id).maybeSingle(),
    db.from("split_shares").select("participant_name, amount, status").eq("order_id", orderId),
  ]);

  const pending = (shares ?? []).filter((s) => s.status === "pending");

  // Nobody left to remind: no AI call needed
  if (pending.length === 0) {
    return NextResponse.json({ message: "Everyone has paid! \uD83C\uDF89" });
  }

  const base = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
  const link = `${base}/split/${orderId}`;

  const prompt = reminderPrompt({
    productName: product?.name ?? "our group gift",
    pending: pending.map((s) => ({
      name: String(s.participant_name),
      amount: Number(s.amount).toFixed(2),
    })),
    link,
  });

  try {
    let message = (await aiText(prompt)).trim();
    if (!message) throw new Error("empty");
    // Make sure the link is always there, even if the AI forgot it
    if (!message.includes(link)) message += `\n${link}`;
    return NextResponse.json({ message });
  } catch {
    return NextResponse.json(
      { error: "I couldn't write the reminder right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
