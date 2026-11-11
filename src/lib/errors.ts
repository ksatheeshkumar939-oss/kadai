const GENERIC = "Something went wrong, please try again.";
const OFFLINE = "Can't reach the internet. Please check your connection and try again.";

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (e instanceof SyntaxError) return GENERIC;

  if (
    e instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(msg)
  ) {
    return OFFLINE;
  }

  if (msg && msg.length < 120 && !/[{}\[\]]|status|\b\d{3}\b|PayPal|Supabase|Gemini/i.test(msg)) {
    return msg;
  }
  return GENERIC;
}
