"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State =
  | { kind: "loading" }
  | { kind: "done"; productName: string; amount: string }
  | { kind: "error"; message: string };

export default function ReturnClient() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>({ kind: "loading" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState({ kind: "error", message: "Missing payment details." });
      return;
    }

    fetch("/api/pay/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong, please try again.");
        setState({ kind: "done", productName: data.productName, amount: data.amount });
      })
      .catch((e) =>
        setState({
          kind: "error",
          message: "We couldn't confirm your payment. If money was taken, please contact the seller.",
        })
      );
  }, [token]);

  if (state.kind === "loading") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0F766E]" />
        <p className="text-gray-600">Processing your payment...</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-xl border p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold">Payment problem</h1>
        <p className="mb-4 text-gray-600">{state.message}</p>
        <Link href="/shop" className="inline-block rounded-xl bg-[#0F766E] px-5 py-2 text-white">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
        &#10003;
      </div>
      <h1 className="mb-2 text-xl font-semibold">Order confirmed</h1>
      <p className="mb-4 text-gray-600">
        {state.productName} - ${state.amount}
      </p>
      <Link href="/shop" className="inline-block rounded-xl bg-[#0F766E] px-5 py-2 text-white">
        Back to shop
      </Link>
    </div>
  );
}