import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";
import { aiJson } from "@/lib/ai";
import { chatPrompt } from "@/lib/chat-prompt";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  reply: z.string(),
  action: z.enum(["none", "checkout", "split"]),
  names: z.array(z.string()),
});

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request.");
  }

  const productId = String(body.productId ?? "").trim();
  if (!UUID.test(productId)) return err("Product not found.", 404);

  // Only the last 10 messages, only valid roles, each capped in length
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const history = raw
    .filter(
      (m: any) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).trim().slice(0, 500),
    }))
    .slice(-10);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return err("Please type a message.");
  }

  const { data: product, error } = await db
    .from("products")
    .select("id, name, description, price, details, status")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("chat: product lookup failed:", error.message);
    return err("Something went wrong, please try again.", 500);
  }
  if (!product || product.status !== "published") return err("Product not found.", 404);

  const splitEnabled = process.env.SPLIT_ENABLED === "true";

  const details: Record<string, string> = {};
  if (product.details && typeof product.details === "object") {
    for (const [k, v] of Object.entries(product.details as Record<string, unknown>)) {
      details[k] = String(v);
    }
  }

  let out;
  try {
    out = await aiJson(
      chatPrompt({
        shopName: process.env.SHOP_NAME || "our shop",
        name: product.name,
        price: Number(product.price),
        description: product.description,
        details,
        splitEnabled,
        history,
      }),
      schema
    );
  } catch (e) {
    console.error("chat: AI failed:", e);
    return err("The assistant is busy, please try again.", 503);
  }

  // Safety checks on the AI's answer
  let action = out.action;
  let names: string[] = [];

  if (action === "split") {
    const seen = new Set<string>();
    for (const n of out.names) {
      const name = String(n).trim().slice(0, 40);
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    }
    names = names.slice(0, 8);
    if (!splitEnabled || names.length < 2) {
      action = "none";
      names = [];
    }
  }

  const reply = out.reply.trim().slice(0, 400) || "Sorry, could you say that again?";
  return NextResponse.json({ reply, action, names });
}