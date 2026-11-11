import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local" });

let passed = 0;
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}\n   → ${e instanceof Error ? e.message : e}`);
  }
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  // Imported after dotenv so env vars exist (supabase.ts reads them on import)
  const paypal = await import("../src/lib/paypal");
  const money = await import("../src/lib/money");
  const { db } = await import("../src/lib/supabase");
  const ai = await import("../src/lib/ai");

  await check("TC1: PayPal login returns a token", async () => {
    // Token fetch is internal, so a successful order creation proves login worked.
    // Direct check against the sandbox:
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");
    const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    assert(res.ok && data.access_token, `Status ${res.status}: check CLIENT_ID / SECRET`);
  });

  await check("TC2: $1.00 test order returns an approve link", async () => {
    const r = await paypal.createPayPalOrder(100, "Kadai test order", "test-1");
    assert(r.paypalOrderId, "No PayPal order ID");
    assert(r.approveUrl.includes("sandbox.paypal.com"), `Bad link: ${r.approveUrl}`);
    console.log(`   link: ${r.approveUrl}`);
  });

  await check("TC3: toCents(22)=2200, centsToUsd(2200)='22.00'", async () => {
    assert(money.toCents(22) === 2200, `toCents gave ${money.toCents(22)}`);
    assert(money.centsToUsd(2200) === "22.00", `centsToUsd gave ${money.centsToUsd(2200)}`);
    const s = money.splitCents(2200, 3);
    assert(s.join(",") === "734,733,733", `splitCents gave ${s}`);
  });

  await check("TC4: AI helper returns JSON in the right shape", async () => {
    const schema = z.object({ greeting: z.string(), number: z.number() });
    const out = await ai.aiJson(
      'Return a short greeting in "greeting" and the number 7 in "number".',
      schema
    );
    const parsed = schema.safeParse(out);
    assert(parsed.success, "Output did not match schema");
  });

  await check("TC5: Database reads the products table", async () => {
    const { error } = await db.from("products").select("id").limit(1);
    assert(!error, error?.message ?? "");
  });

  console.log(`\n${passed}/5 passed`);
  process.exit(passed === 5 ? 0 : 1);
}

main();