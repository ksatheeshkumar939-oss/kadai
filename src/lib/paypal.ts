
import "server-only";

const BASE = "https://api-m.sandbox.paypal.com"; // sandbox only

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PayPal login failed (${res.status})`);

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(
  amountCents: number,
  description: string,
  referenceId: string
): Promise<{ paypalOrderId: string; approveUrl: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          description: description.slice(0, 127),
          amount: {
            currency_code: "USD",
            value: (amountCents / 100).toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: process.env.SHOP_NAME?.slice(0, 127) || "Kadai",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${process.env.APP_BASE_URL}/pay/return`,
            cancel_url: `${process.env.APP_BASE_URL}/pay/cancel`,
          },
        },
      },
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${JSON.stringify(data)}`);
  }

  const link = data.links?.find(
    (l: { rel: string }) => l.rel === "payer-action" || l.rel === "approve"
  );

  if (!link) throw new Error("PayPal did not return an approve link");

  return { paypalOrderId: data.id, approveUrl: link.href };
}

export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<{ completed: boolean }> {
  const token = await getAccessToken();

  const res = await fetch(
    `${BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    // Page refreshed after payment = already captured = still a success
    if (data?.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED") {
      return { completed: true };
    }

    throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);
  }

  return { completed: data.status === "COMPLETED" };
}
