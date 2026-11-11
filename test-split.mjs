// Run with:  node test-split.mjs
// Needs the app running on http://localhost:3000 (npm run dev)

const BASE = "http://localhost:3000";

// Same formula as src/lib/money.ts
function splitCents(totalCents, people) {
  const base = Math.floor(totalCents / people);
  const extra = totalCents % people;
  return Array.from({ length: people }, (_, i) => base + (i < extra ? 1 : 0));
}
const usd = (c) => (c / 100).toFixed(2);

let pass = 0;
let fail = 0;
function check(label, ok) {
  console.log((ok ? "PASS  " : "FAIL  ") + label);
  ok ? pass++ : fail++;
}

// --- Maths tests (TC29, TC30, TC31) ---
const a = splitCents(2200, 3).map(usd).join(",");
check("TC29: $22 / 3 = 7.34,7.33,7.33  (got " + a + ")", a === "7.34,7.33,7.33");
const b = splitCents(1000, 4).map(usd).join(",");
check("TC30: $10 / 4 = 2.50 each  (got " + b + ")", b === "2.50,2.50,2.50,2.50");
const c = splitCents(2500, 3).map(usd).join(",");
check("TC31: $25 / 3 = 8.34,8.33,8.33  (got " + c + ")", c === "8.34,8.33,8.33");

// --- API tests (TC32, TC33, TC34) ---
async function post(names, productId) {
  const res = await fetch(BASE + "/api/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, names }),
  });
  let json = {};
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

try {
  const prodRes = await fetch(BASE + "/api/products");
  const products = await prodRes.json();
  const list = Array.isArray(products) ? products : products.products;
  if (!list || list.length === 0) throw new Error("No published products found. Publish one first.");
  const id = list[0].id;
  console.log("\nUsing product: " + list[0].name + " ($" + list[0].price + ")\n");

  const r1 = await post(["Arun"], id);
  check("TC32: 1 name is blocked (status " + r1.status + ")", r1.status === 400);

  const r2 = await post(["A", "B", "C", "D", "E", "F", "G", "H", "I"], id);
  check("TC33: 9 names is blocked (status " + r2.status + ")", r2.status === 400);

  const r3 = await post(["Arun", "arun"], id);
  check("TC34a: duplicate names blocked (status " + r3.status + ")", r3.status === 400);

  const r4 = await post(["Arun", ""], id);
  check("TC34b: empty name blocked (status " + r4.status + ")", r4.status === 400);

  const r5 = await post(["Arun", "Divya", "Karthik"], id);
  check("Valid split of 3 returns an orderId (status " + r5.status + ")", r5.status === 200 && !!r5.json.orderId);
  if (r5.json.orderId) console.log("   orderId: " + r5.json.orderId);
} catch (e) {
  console.log("\nCould not run API tests: " + e.message);
  console.log("Is the app running with npm run dev?");
  fail++;
}

console.log("\n" + pass + " passed, " + fail + " failed");
