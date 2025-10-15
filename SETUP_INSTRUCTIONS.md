# 🚀 Setup Instructions - MercadoPago Integration

## ✅ What's Already Done

1. ✅ **Svelte dev server running** on `http://localhost:5174`
2. ✅ **Cloudflare tunnel running** - Public URL: `https://oasis-rubber-linking-established.trycloudflare.com`
3. ✅ **Capacitor config updated** - Points to Cloudflare tunnel URL
4. ✅ **iOS project synced** - Ready to build
5. ✅ **.env file created** - Needs your MercadoPago credentials

---

## 🔧 What You Need to Do

### 1. Configure MercadoPago Test Account

You need to update the `.env` file with your MercadoPago TEST credentials:

**Location:** `/Users/iquirelli/Documents/Svelte-MP-With-Capacitor/svelte-mp-integration-with-capacitor/.env`

```bash
# Replace these with your actual TEST credentials:
MP_CLIENT_ID=YOUR_TEST_CLIENT_ID_HERE
MP_CLIENT_SECRET=YOUR_TEST_CLIENT_SECRET_HERE
WEEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

#### Where to get these credentials:

1. **Go to MercadoPago Developers Panel:**
   - 🔗 https://www.mercadopago.com/developers/panel/app
2. **Select or Create a TEST Application:**

   - Make sure you're using **TEST mode** (not production!)
   - Click on your application

3. **Get Client ID and Client Secret:**

   - In the app details, you'll find:
     - **APP_ID** or **Client ID** → Copy this to `MP_CLIENT_ID`
     - **Client Secret** or **Access Token** → Copy this to `MP_CLIENT_SECRET`

4. **Configure OAuth Redirect URI:**

   - In the same app settings, look for **Redirect URI** or **OAuth Redirect URLs**
   - Add this URL:
     ```
     https://oasis-rubber-linking-established.trycloudflare.com/api/mp/oauth/callback
     ```
   - **IMPORTANT:** This must match exactly what's in your `.env` file (`MP_REDIRECT_URI`)

5. **Configure Webhook URL:**
   - In the app settings, find **Webhooks** or **Notifications**
   - Add this URL:
     ```
     https://oasis-rubber-linking-established.trycloudflare.com/api/mp/webhook
     ```
   - Select to receive notifications for: **Payments** (at minimum)
   - Copy the **Webhook Secret** and paste it in your `.env` as `WEEBHOOK_SECRET`

---

### 2. Update URLs in MercadoPago Dashboard

⚠️ **IMPORTANT:** The Cloudflare tunnel URL changes every time you restart `cloudflared`!

**Current tunnel URL:** `https://oasis-rubber-linking-established.trycloudflare.com`

When the tunnel URL changes, update these in MercadoPago:

| Setting                | Location in MP Dashboard     | Current Value                                                                      |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| **OAuth Redirect URI** | App Settings → Redirect URIs | `https://oasis-rubber-linking-established.trycloudflare.com/api/mp/oauth/callback` |
| **Webhook URL**        | App Settings → Webhooks      | `https://oasis-rubber-linking-established.trycloudflare.com/api/mp/webhook`        |

**Also update in your code:**

- `.env` file: `PUBLIC_APP_URL`, `PUBLIC_WEBHOOK_URL`, `MP_REDIRECT_URI`
- `capacitor.config.ts`: `server.url`

---

### 3. Restart the Dev Server (after updating .env)

After you update the `.env` file with your credentials:

```bash
# Kill the current dev server
pkill -f "vite dev"

# Restart it
cd /Users/iquirelli/Documents/Svelte-MP-With-Capacitor/svelte-mp-integration-with-capacitor
npm run dev -- --host 0.0.0.0
```

The server will automatically pick up the new environment variables.

---

### 4. Run the iOS App

Xcode should now be open with your project. To run the app:

1. **Select a simulator or device:**

   - Click the device selector at the top (next to the scheme)
   - Choose: **iPhone 15 Pro** (or any iOS simulator)

2. **Build and Run:**

   - Click the ▶️ (Play) button or press `Cmd + R`
   - Wait for the build to complete
   - The simulator will launch with your app

3. **Expected behavior:**
   - App opens and loads content from the Cloudflare tunnel
   - You should see your Svelte app home page
   - All backend API calls will work through the tunnel

---

## 🧪 Testing the Complete Flow

### Step 1: Connect a Seller (OAuth Flow)

1. In the app, click **"Conectar Seller"** or similar button
2. It should open Safari/Browser with MercadoPago OAuth page
3. Log in with a TEST user account
4. Authorize the app
5. You should be redirected back to the app showing "Seller Connected"

### Step 2: Create a Payment

1. Select a connected seller
2. Click **"Pagar"** or **"Create Payment"**
3. It should open MercadoPago checkout in browser
4. Use a test card (see below)
5. Complete the payment

### Step 3: Verify Deep Link Redirect

1. After payment, MercadoPago redirects to: `marketplacepoc://payment/success?payment_id=XXX`
2. The app should capture this deep link
3. The browser closes automatically
4. The app shows the success/failure/pending page

---

## 💳 MercadoPago Test Cards

Use these test cards in TEST mode:

| Card Type              | Number                | CVV | Expiry | Result   |
| ---------------------- | --------------------- | --- | ------ | -------- |
| ✅ Visa Approved       | `4509 9535 6623 3704` | 123 | 11/25  | Approved |
| ✅ Mastercard Approved | `5031 7557 3453 0604` | 123 | 11/25  | Approved |
| ❌ Visa Rejected       | `4013 5406 8274 6260` | 123 | 11/25  | Rejected |

**Cardholder name:** Any name
**Document:** Any valid CPF/CNPJ format

More test cards: https://www.mercadopago.com/developers/en/docs/checkout-pro/additional-content/test-cards

---

## 🔍 Debugging

### Check if servers are running:

```bash
# Dev server
ps aux | grep "vite dev"

# Cloudflare tunnel
ps aux | grep cloudflared

# Or check logs:
tail -f /tmp/dev-server.log
tail -f /tmp/cloudflared-tunnel.log
```

### Common Issues:

#### ❌ "Network connection failed" in iOS

**Cause:** The tunnel might have stopped or the dev server crashed.

**Solution:**

```bash
# Check if tunnel responds
curl https://oasis-rubber-linking-established.trycloudflare.com

# Restart if needed (see commands above)
```

#### ❌ OAuth redirect fails

**Cause:** The redirect URI in MercadoPago doesn't match.

**Solution:**

- Verify the URL in MercadoPago dashboard exactly matches your `.env` (`MP_REDIRECT_URI`)
- Make sure there are no trailing slashes or typos

#### ❌ Webhook not receiving notifications

**Cause:** MercadoPago can't reach your webhook URL.

**Solution:**

- Test webhook URL manually: `curl https://oasis-rubber-linking-established.trycloudflare.com/api/mp/webhook`
- Check that the URL in MP dashboard is correct
- Verify `WEEBHOOK_SECRET` is set correctly

#### ❌ Deep links not working

**Cause:** iOS needs to rebuild to register URL schemes.

**Solution:**

```bash
cd /Users/iquirelli/Documents/Svelte-MP-With-Capacitor/svelte-mp-integration-with-capacitor
npx cap sync ios
```

Then rebuild in Xcode.

---

## 📱 Alternative: Use Local IP (Faster, but no webhooks)

If you want faster loading and don't need webhooks during development:

1. **Update capacitor.config.ts:**

   ```typescript
   server: {
     url: "http://192.168.10.175:5174",
     cleartext: true,
   }
   ```

2. **Sync iOS:**

   ```bash
   npx cap sync ios
   ```

3. **Note:** MercadoPago webhooks won't work with local IP addresses!

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  iOS Simulator (on your Mac)                        │
│                                                      │
│  Loads: https://oasis-rubber-linking-established... │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────┐
    │  Cloudflare Tunnel (Proxy)       │
    │  Public → Local                  │
    └──────────────┬───────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────┐
    │  Vite Dev Server                 │
    │  localhost:5174                  │
    │                                  │
    │  - Serves Svelte App (SSR)       │
    │  - API Routes (/api/mp/...)      │
    │  - SQLite Database               │
    └──────────────────────────────────┘
```

**Benefits of this setup:**

- ✅ MercadoPago webhooks work (public URL)
- ✅ OAuth redirects work
- ✅ Can test on real devices from anywhere
- ✅ Backend runs locally (fast development)
- ✅ Hot reload works (Vite watches files)

---

## ✅ Checklist

- [ ] Updated `.env` with MercadoPago TEST credentials
- [ ] Added redirect URI in MercadoPago dashboard
- [ ] Added webhook URL in MercadoPago dashboard
- [ ] Copied webhook secret to `.env`
- [ ] Restarted dev server after updating `.env`
- [ ] Built and ran app in iOS simulator
- [ ] Tested OAuth flow (connect seller)
- [ ] Tested payment flow
- [ ] Verified deep link redirect works
- [ ] Checked webhook logs for payment notifications

---

**You're all set!** 🎉

Run the app in Xcode and test the complete flow. Let me know if you encounter any issues!
