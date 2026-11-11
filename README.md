# KADAI – Shop in a Chat

KADAI is an AI-powered small-business e-commerce platform. Sellers can create product listings using photos and AI, while customers can discover products, ask questions through an AI shopping assistant, and pay using PayPal Sandbox.

## Features

- **AI Product Listing:** Upload a product photo and provide a short note to generate a product name, description, suggested price, and details.
- **AI Shopping Assistant:** Customers can ask questions about products using the available product information.
- **AI Provider Fallback:** Gemini is the primary AI provider. Groq is used as a fallback when Gemini fails.
- **Product Management:** Sellers can create and publish product listings.
- **PayPal Sandbox Payments:** Supports the order creation, approval, and capture payment flow.
- **Split Payments:** Supports split-payment functionality when enabled.
- **Order Management:** Provides order-related API functionality.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend and Backend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS |
| AI | Vercel AI SDK, Google Gemini, Groq |
| Database and Storage | Supabase |
| Validation | Zod |
| Payments | PayPal Sandbox |
| Deployment | Render |

## AI Usage

KADAI uses AI for three main tasks:

1. **Product listing generation:** The seller uploads an image and adds a product note. The image is uploaded to Supabase Storage, and AI generates structured listing information.
2. **Shopping assistance:** The assistant answers customer questions using the supplied shop and product information.
3. **Fallback handling:** Gemini is tried first. If it fails, the application tries Groq. If both providers fail, the application returns an AI service error or preserves the uploaded image for manual listing completion.

The AI listing endpoint validates image size, MIME type, and file signature. Supported formats are JPG, PNG, and WEBP. Maximum image size is 4 MB.

## PayPal Integration

KADAI uses PayPal Sandbox for test payments.

The payment flow is:

1. Create an order.
2. Redirect the buyer for PayPal approval.
3. Return to the application.
4. Capture the approved payment.

Use PayPal Sandbox credentials only during development and testing.

## Split Payments

Split-payment functionality is controlled using the `SPLIT_ENABLED` environment variable.

- `false` – Split payments disabled.
- `true` – Split payments enabled.

The split-payment API supports creating and retrieving split-payment information and processing shares.

## Project Structure

```text
kadai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── pay/
│   │   │   ├── products/
│   │   │   └── split/
│   │   ├── seller/
│   │   ├── shop/
│   │   └── split/
│   └── lib/
│       ├── ai.ts
│       ├── chat-prompt.ts
│       ├── prompts.ts
│       └── supabase.ts
├── scripts/
├── public/
├── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js and npm
- Supabase project
- PayPal Developer Sandbox account
- Google Gemini API key
- Groq API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/ksatheeshkumar939-oss/kadai.git
cd kadai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and add your own credentials.

```powershell
Copy-Item .env.example .env.local
```

Configure the following variables:

| Variable | Purpose |
|---|---|
| `PAYPAL_CLIENT_ID` | PayPal Sandbox client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox client secret |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Gemini model identifier |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Groq model identifier |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key |
| `APP_BASE_URL` | Application base URL |
| `SHOP_NAME` | Shop display name |
| `SPLIT_ENABLED` | Enable or disable split payments |

Never commit `.env.local` or expose API keys and service-role credentials.

### 4. Configure Supabase

- Create a Supabase project.
- Configure the required database tables and permissions for the application.
- Create a public Storage bucket named `product-images`.
- Add the Supabase URL and service-role key to `.env.local`.

**Note:** The database SQL setup scripts are not included in this repository. Obtain the required schema and setup instructions from the project team before configuring a fresh database.

### 5. Start the development server

```bash
npm run dev
```

Open:

http://localhost:3000

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## PayPal Sandbox Testing

1. Create or sign in to a PayPal Developer account.
2. Create Sandbox buyer and business accounts.
3. Configure the Sandbox client credentials.
4. Use a Sandbox Personal account to test buyer payments.
5. Verify order creation, approval, and capture.

No real money should be used during Sandbox testing.

## Known Limitations

- The application uses PayPal Sandbox for testing, not live payment processing.
- AI-generated product information must be reviewed by the seller before publishing.
- AI responses depend on the configured AI providers and their availability.
- A fresh Supabase database requires the correct project schema and storage configuration.
- Split payments depend on the `SPLIT_ENABLED` setting.

## Deployment

The project is deployed using Render.

Production deployment requires the correct Git branch, environment variables, Supabase configuration, and PayPal Sandbox credentials.

## License

This project is licensed under the MIT License. See the repository's `LICENSE` file for details.
## Screenshots

Add the following screenshots after running the application locally:

1. **Shop Home Page** � `screenshots/shop-home.png`
2. **AI Product Listing** � `screenshots/ai-product-listing.png`
3. **AI Shopping Assistant** � `screenshots/ai-shopping-assistant.png`
4. **PayPal Checkout** � `screenshots/paypal-checkout.png`

