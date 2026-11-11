
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function NewProductPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");

  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0];

    setError("");
    setMessage("");
    setImageUrl("");
    setFile(null);
    setPreview("");

    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setError("File too large. Please select an image under 4 MB.");
      event.target.value = "";
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only photos allowed. Please select JPG, PNG or WEBP.");
      event.target.value = "";
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleGenerate() {
    if (!file) {
      setError("Please upload a product photo first.");
      return;
    }

    setGenerating(true);
    setError("");
    setMessage("AI is analyzing your product photo. Please wait...");

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "note",
        note.trim() || "Create a product listing based on this product image."
      );

      const response = await fetch("/api/ai/listing", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI generation failed.");
      }

      if (result.image_url) {
        setImageUrl(result.image_url);
      }

      if (result.ai_failed) {
        setMessage(
          "AI is busy, please fill the details yourself."
        );
        return;
      }

      setName(result.name || "");
      setDescription(result.description || "");
      setPrice(
        result.suggested_price_usd != null
          ? String(result.suggested_price_usd)
          : ""
      );
      setDetails(result.details || "");

      setMessage("Product details generated successfully!");
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a product description.");
      return;
    }

    const numericPrice = Number(price);

    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Price must be greater than $0.");
      return;
    }

    if (!imageUrl) {
      setError("Please upload a product photo and generate the listing first.");
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: numericPrice,
          image_url: imageUrl,
          details: details.trim()
            ? { "Product details": details.trim() }
            : {},
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not publish product.");
      }

      setMessage("Product published successfully!");
      router.push("/seller");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Publishing failed. Please try again."
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/seller")}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Add a new product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Upload a photo and let AI help create your product listing.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">
            1. Product photo
          </h2>

          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-[#0F766E]">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <span className="text-sm font-medium text-gray-700">
              Click to upload product photo
            </span>

            <span className="mt-1 block text-xs text-gray-500">
              JPG, PNG or WEBP · Maximum 4 MB
            </span>
          </label>

          {preview && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Product preview"
                className="max-h-64 w-full rounded-xl object-contain"
              />
              <p className="mt-2 text-xs text-gray-500">
                {file?.name}
              </p>
            </div>
          )}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Optional product note
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Example: Homemade chocolate brownie with chocolate chips..."
              className="w-full rounded-xl border p-3 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!file || generating || publishing}
            className="mt-4 w-full rounded-xl bg-[#0F766E] px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating your listing..."
              : "✨ Generate with AI"}
          </button>
        </section>

        {message && (
          <p
            role="status"
            className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handlePublish}
          className="space-y-5 rounded-2xl border bg-white p-4 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">
              2. Product details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and edit the AI-generated information before publishing.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Product name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              placeholder="Enter product name"
              className="w-full rounded-xl border p-3 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              required
              placeholder="Describe your product"
              className="w-full rounded-xl border p-3 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Price (USD) *
            </label>
            <div className="flex items-center rounded-xl border px-3 focus-within:border-[#0F766E]">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="0.00"
                className="w-full p-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Additional product details"
              className="w-full rounded-xl border p-3 text-sm outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="submit"
            disabled={publishing || generating}
            className="w-full rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish product"}
          </button>
        </form>
      </div>
    </main>
  );
}
