import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const show = (name: string) => {
  const v = process.env[name];
  if (!v) return console.log(`${name}: MISSING`);
  const flags = [
    v !== v.trim() ? "HAS SPACES AT ENDS" : "",
    /^["']|["']$/.test(v) ? "HAS QUOTES" : "",
  ].filter(Boolean).join(" ");
  console.log(`${name}: length ${v.length}, starts "${v.slice(0, 4)}" ${flags}`);
};

["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "GOOGLE_GENERATIVE_AI_API_KEY",
 "GEMINI_MODEL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].forEach(show);

// Supabase keys: tell us which role the key really is
const k = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (k.startsWith("eyJ")) {
  const role = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString()).role;
  console.log(`Supabase key role: ${role}  (must be service_role)`);
} else if (k.startsWith("sb_secret_")) {
  console.log("Supabase key type: secret key (OK)");
} else if (k.startsWith("sb_publishable_")) {
  console.log("Supabase key type: PUBLISHABLE key (WRONG, need the secret key)");
}