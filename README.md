# 🐝 Beauty Bee — Order Management App


A full-stack Next.js ordering and admin app for Beauty Bee, integrated with PostEx courier and Firebase.

---

## Quick Start

### 1. Install dependencies
```bash
cd beauty-bee-app
npm install
```

### 2. Configure environment variables
Create a `.env.local` file in the project root and fill in your credentials:

```env
# PostEx API (required for courier booking & tracking)
POSTEX_TOKEN=your_postex_api_token_here
POSTEX_PICKUP_ADDRESS_CODE=your_pickup_address_code_here
POSTEX_BASE_URL=https://api.postex.pk/services/integration/api

# Firebase (optional — app runs in demo mode without these)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin PIN (change this!)
NEXT_PUBLIC_ADMIN_PIN=1234

# WhatsApp number for customer confirmations (country code + number, no +)
NEXT_PUBLIC_WHATSAPP_NUMBER=923XXXXXXXXX

# Delivery charge in PKR
NEXT_PUBLIC_DELIVERY_CHARGE=200
```

### 3. Run development server
```bash
npm run dev
```

App runs at **http://localhost:3000**

---

## Pages & Routes

| URL | Description |
|-----|-------------|
| `/order` | Customer ordering page (products, bundles, checkout) |
| `/track` | Customer order tracking page |
| `/admin` | Admin dashboard |
| `/admin/orders` | Order management (search, filter, book on PostEx) |
| `/admin/postex` | PostEx hub (bulk booking, load sheets, status refresh) |
| `/admin/products` | Product & bundle catalogue management |
| `/admin/analytics` | Revenue & order analytics with charts |

---

## Getting Your PostEx Credentials

1. Log in to [PostEx Merchant Portal](https://merchant.postex.pk)
2. Go to **Settings → API Integration**
3. Copy your **API Token** → `POSTEX_TOKEN`
4. Go to **Manage Addresses** and note your pickup address code → `POSTEX_PICKUP_ADDRESS_CODE`

---

## Firebase Setup (Optional but Recommended)

Without Firebase, the app runs in demo mode with sample data. With Firebase, orders persist in real-time.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `beauty-bee-orders`)
3. Enable **Firestore Database** (start in test mode)
4. Go to **Project Settings → General → Your apps → Web app**
5. Copy the config values into `.env.local`

**Firestore Collections created automatically:**
- `orders` — all customer orders
- `products` — product catalogue
- `bundles` — bundle deals

---

## Deploying to Vercel (Recommended)

1. Push the code to a GitHub repo
2. Connect the repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy — your app gets a live URL like `beautybee.vercel.app`

---

## Admin PIN

Default PIN is `1234`. Change it by setting `NEXT_PUBLIC_ADMIN_PIN` in `.env.local`.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **State**: Zustand (cart)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Courier**: PostEx API v4.1.9
