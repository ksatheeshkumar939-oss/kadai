import Link from "next/link";

export default function PayCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <div className="rounded-xl border p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold">Payment cancelled</h1>
        <p className="mb-4 text-gray-600">No money was taken.</p>
        <Link href="/shop" className="inline-block rounded-xl bg-[#0F766E] px-5 py-2 text-white">
          Back to shop
        </Link>
      </div>
    </main>
  );
}