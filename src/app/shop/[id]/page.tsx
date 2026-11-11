"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  image_url: string;
  details: Record<string, string> | null;
};
type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content: "Hi! \uD83D\uDC4B Ask me anything about this product.",
};

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [paying, setPaying] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((list: Product[]) => {
        const found = list.find((p) => p.id === id) ?? null;
        setProduct(found);
        setState(found ? "ready" : "missing");
      })
      .catch(() => setState("missing"));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending, confirmCheckout]);

  // If the buyer presses Back from PayPal, make the buttons usable again
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPaying(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending || !product) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setConfirmCheckout(false);
    setError("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, messages: next.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "chat failed");
      setMessages([...next, { role: "assistant", content: data.reply }]);
      if (data.action === "checkout") setConfirmCheckout(true);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, I could not answer that right now. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function pay() {
    if (paying || !product) return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, buyerName: buyerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.approveUrl) {
        throw new Error(data.error || "Something went wrong, please try again.");
      }
      window.location.href = data.approveUrl; // stays disabled until the page leaves
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong, please try again.");
      setPaying(false);
    }
  }

  if (state === "loading") {
    return <main className="p-6 text-gray-500">Loading...</main>;
  }

  if (state === "missing" || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/shop" className="mt-4 inline-block text-[#0F766E] underline">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const price = Number(product.price).toFixed(2);
  const details = Object.entries(product.details ?? {});

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#202B29]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/shop" className="text-2xl font-extrabold text-[#0F766E]">
            KADAI<span className="text-[#202B29]">.</span>
          </Link>
          <Link href="/shop" className="text-sm font-medium text-gray-600">
            Back to shop
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
        <section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full rounded-xl object-cover"
          />
          <h1 className="mt-4 text-2xl font-semibold">{product.name}</h1>
          <p className="text-xl font-medium text-[#0F766E]">${price}</p>
          <p className="mt-2 text-gray-700">{product.description}</p>
          {details.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              {details.map(([k, v]) => (
                <li key={k}>
                  <span className="font-medium capitalize">{k}:</span> {v}
                </li>
              ))}
            </ul>
          )}

          <input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            maxLength={60}
            placeholder="Your name (optional)"
            className="mt-4 w-full rounded-xl border bg-white p-3 text-sm"
          />
          <button
            onClick={pay}
            disabled={paying}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-3 font-medium text-white disabled:opacity-60"
          >
            {paying && <Spinner />}
            {paying ? "Opening PayPal..." : "Buy now"}
          </button>
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
        </section>

        <section className="flex h-[28rem] flex-col rounded-xl border bg-white md:h-auto md:min-h-[28rem]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm " +
                    (m.role === "user" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-800")
                  }
                >
                  {m.content}
                </p>
              </div>
            ))}
            {sending && <p className="text-sm text-gray-400">Typing...</p>}
            {confirmCheckout && (
              <button
                onClick={pay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {paying && <Spinner />}
                {paying ? "Opening PayPal..." : "Confirm & pay $" + price}
              </button>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask about this product..."
              className="flex-1 rounded-xl border p-3 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-xl bg-[#0F766E] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}