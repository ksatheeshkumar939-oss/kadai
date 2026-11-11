

"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";

const products = [
  {
    id: "1",
    name: "Chocolate Brownie",
    description:
      "Rich, fudgy homemade chocolate brownie, freshly baked with premium chocolate.",
    price: 120,
    emoji: "🍫",
    details: ["Freshly baked", "Premium chocolate", "Eggless option available"],
  },
  {
    id: "2",
    name: "Vanilla Cupcakes",
    description:
      "Soft vanilla cupcakes topped with delicious creamy frosting.",
    price: 180,
    emoji: "🧁",
    details: ["Box of 4 cupcakes", "Fresh cream frosting", "Made to order"],
  },
  {
    id: "3",
    name: "Homemade Cookies",
    description: "Crunchy homemade cookies baked with love.",
    price: 90,
    emoji: "🍪",
    details: ["Freshly baked", "Crispy texture", "Perfect tea-time snack"],
  },
  {
    id: "4",
    name: "Strawberry Cake",
    description: "Delicious strawberry cream celebration cake.",
    price: 450,
    emoji: "🍰",
    details: [
      "Fresh strawberry cream",
      "Made to order",
      "Custom message available",
    ],
  },
];

function ProductPageContent() {
  const params = useParams<{ id: string | string[] }>();

  const productId = String(params.id ?? "").trim();

  const product = products.find(
    (item) => item.id === productId
  );

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! 👋 Ask me anything about this product.",
    },
  ]);
  const [notice, setNotice] = useState("");

  function sendMessage() {
    const userMessage = message.trim();

    if (!userMessage) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: userMessage },
      {
        role: "assistant",
        text: "Thanks for your question! Our AI assistant will be connected here shortly.",
      },
    ]);

    setMessage("");
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] p-6">
        <div className="max-w-md text-center">
          <div className="text-5xl">🔍</div>
          <h1 className="mt-4 text-2xl font-bold">
            Product not found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t find a product with ID: {productId || "missing"}.
          </p>
          <a
            href="/shop"
            className="mt-6 inline-block rounded-xl bg-[#0F766E] px-6 py-3 font-semibold text-white"
          >
            Back to shop
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#202B29]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <a href="/shop" className="text-2xl font-extrabold text-[#0F766E]">
            KADAI<span className="text-[#202B29]">.</span>
          </a>

          <a href="/shop" className="text-sm font-medium text-gray-600">
            ← Back to shop
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2 md:py-12">
        <section>
          <div className="flex aspect-square items-center justify-center rounded-3xl bg-[#E8F4F1]">
            <span className="text-9xl" role="img" aria-label={product.name}>
              {product.emoji}
            </span>
          </div>

          <div className="mt-6">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[#0F766E]">
              Meena&apos;s Home Bakery
            </span>

            <h1 className="mt-4 text-3xl font-bold">
              {product.name}
            </h1>

            <p className="mt-3 text-3xl font-bold text-[#0F766E]">
              ₹{product.price}
            </p>

            <p className="mt-4 leading-7 text-gray-600">
              {product.description}
            </p>

            <h2 className="mt-6 font-bold">Product details</h2>

            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {product.details.map((detail) => (
                <li key={detail}>✓ {detail}</li>
              ))}
            </ul>

            <button
              onClick={() =>
                setNotice(
                  "Payment checkout will be connected in the next step."
                )
              }
              className="mt-8 w-full rounded-xl bg-[#0F766E] px-6 py-3 font-semibold text-white transition hover:bg-[#115E59]"
            >
              Buy now · ₹{product.price}
            </button>

            {notice && (
              <p className="mt-3 text-center text-sm text-[#0F766E]">
                {notice}
              </p>
            )}
          </div>
        </section>

        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[#E8F4F1] p-5">
            <h2 className="text-lg font-bold">
              Chat with our assistant 💬
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Have questions? Let&apos;s talk about this treat!
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    item.role === "user"
                      ? "bg-[#0F766E] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask about this product..."
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0F766E]"
              />

              <button
                type="submit"
                className="rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#115E59]"
              >
                Send
              </button>
            </form>

            <p className="mt-2 text-center text-xs text-gray-400">
              AI connection will be enabled in the next integration step.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
          <p className="text-[#0F766E]">Loading product...</p>
        </main>
      }
    >
      <ProductPageContent />
    </Suspense>
  );
}
