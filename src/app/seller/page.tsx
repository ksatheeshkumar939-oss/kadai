import Link from "next/link";
import Dashboard from "./dashboard";

export default function SellerPage() {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Seller dashboard</h1>
        <Link
          href="/seller/new"
          className="rounded-xl bg-[#0F766E] px-4 py-2 text-sm font-medium text-white"
        >
          + Add product
        </Link>
      </div>
      <Dashboard />
    </main>
  );
}