
export function listingPrompt(note: string): string {
  return `
You are an AI product listing assistant for KADAI.

Create a clear and attractive product listing from this seller's note:
"${note}"

Return product details in a simple, accurate format.
Never invent prices, quantities, or product specifications.
`;
}

export function shopAssistantPrompt(input: {
  shopName: string;
  name: string;
  price: number;
  description: string;
  details: string;
  splitEnabled: boolean;
}): string {
  return `
You are the shopping assistant for ${input.shopName}.

Product: ${input.name}
Price: ${input.price}
Description: ${input.description}
Details: ${input.details}
Split payment enabled: ${input.splitEnabled}

Answer customer questions clearly and politely.
Use only the supplied product information.
Never invent product details or payment status.
`;
}

export function reminderPrompt(input: {
  productName: string;
  pendingShares: number;
  appBaseUrl: string;
  orderId: string;
}): string {
  return `
Write a short, friendly WhatsApp payment reminder.

Product: ${input.productName}
Pending amount: ${input.pendingShares}
Payment link: ${input.appBaseUrl}
Order ID: ${input.orderId}

Keep the message polite and concise.
Do not claim payment has been completed.
`;
}