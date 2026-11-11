import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";


const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request.");
  }

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const image_url = String(body.image_url ?? "").trim();
  const price = Math.round(Number(body.price) * 100) / 100;

  if (!name) return err("Please enter a product name.");
  if (name.length > 100) return err("Product name is too long.");
  if (!description) return err("Please enter a description.");
  if (description.length > 1000) return err("Description is too long.");
  if (!Number.isFinite(price) || price <= 0) return err("Price must be more than $0.");
  if (price > 10000) return err("Price is too high.");
  if (!/^https?:\/\//.test(image_url)) return err("Please upload a product photo.");

  const details: Record<string, string> = {};
  if (body.details && typeof body.details === "object" && !Array.isArray(body.details)) {
    for (const [k, v] of Object.entries(body.details)) {
      const key = String(k).trim();
      const val = String(v ?? "").trim();
      if (key && val && Object.keys(details).length < 6) details[key] = val;
    }
  }

  const { data, error } = await db
    .from("products")
    .insert({ name, description, price, image_url, details, status: "published" })
    .select("id")
    .single();

  if (error) {
    console.error("create product failed:", error.message);
    return err("Could not save the product. Please try again.", 500);
  }
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const { data, error } = await db
    .from("products")
    .select("id, name, description, price, image_url, details, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list products failed:", error.message);
    return err("Could not load products.", 500);
  }
  return NextResponse.json(data);
}
