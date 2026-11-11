import ShopGrid from "./shop-grid";

export default function ShopPage() {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Meena&apos;s Home Bakery &#127856;</h1>
        <p className="text-gray-600">Fresh, homemade, made with love.</p>
      </header>
      <ShopGrid />
    </main>
  );
}