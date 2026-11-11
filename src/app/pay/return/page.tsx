import { Suspense } from "react";
import ReturnClient from "./return-client";

export default function PayReturnPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <Suspense fallback={<p className="text-gray-600">Processing your payment...</p>}>
        <ReturnClient />
      </Suspense>
    </main>
  );
}