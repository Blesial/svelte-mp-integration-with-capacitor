# 🔒 Fixing Bitdefender SSL Issue for iOS Capacitor

## The Problem

When testing your iOS app with the Cloudflare tunnel, you may see errors like:

- "Network connection failed"
- "SSL handshake failed"
- "Certificate verification failed"

This happens because **Bitdefender** (or similar antivirus software) intercepts HTTPS traffic and re-signs it with its own certificate. iOS **doesn't trust** Bitdefender's certificate, causing the connection to fail.

---

## 🎯 Solutions (Choose One)

### **Option A: Disable SSL Scanning** ✅ **EASIEST**

This temporarily disables SSL scanning while you develop:

1. **Open Bitdefender** from your menu bar or Applications
2. **Go to Protection → Web Protection**
3. Click **Settings** (gear icon)
4. Find **"Scan SSL"** or **"SSL Scanning"** toggle
5. **Turn it OFF** (or pause protection temporarily)
6. Click **Save** or **Apply**

**Then test:**

```bash
curl https://oasis-rubber-linking-established.trycloudflare.com
```

If you see HTML content → ✅ Fixed!

**Important:** Remember to re-enable SSL scanning when done testing.

---

### **Option B: Add SSL Exception for Cloudflare**

Keep SSL scanning enabled but add an exception:

1. **Open Bitdefender** from your menu bar
2. **Go to Protection → Web Protection → Settings**
3. Look for **"SSL Exceptions"** or **"Whitelist"**
4. Click **"Add Exception"** or **"+"**
5. Add this domain:
   ```
   *.trycloudflare.com
   ```
6. **Save** and close

**Then test:**

```bash
curl https://oasis-rubber-linking-established.trycloudflare.com
```

---

### **Option C: Use Local IP Instead** (No webhooks)

If you can't modify Bitdefender settings, use local IP:

**1. Update `capacitor.config.ts`:**

```typescript
server: {
  url: "http://192.168.10.175:5174",
  cleartext: true
}
```

**2. Update `.env`:**

```bash
PUBLIC_APP_URL=http://192.168.10.175:5174
PUBLIC_WEBHOOK_URL=http://192.168.10.175:5174/api/mp/webhook
MP_REDIRECT_URI=http://192.168.10.175:5174/api/mp/oauth/callback
```

**3. Sync iOS:**

```bash
npx cap sync ios
```

**Note:** Webhooks won't work with local IP (MercadoPago can't reach it).

---

## 🧪 How to Test If It's Fixed

### **Test 1: Terminal Test**

```bash
curl -I https://oasis-rubber-linking-established.trycloudflare.com
```

**Expected result:**

```
HTTP/1.1 200 OK
```

**If you see SSL error:**

- Bitdefender is still blocking
- Try restarting Bitdefender after changing settings
- Or restart your Mac

### **Test 2: Browser Test**

Open in Safari:

```
https://oasis-rubber-linking-established.trycloudflare.com
```

**Expected:** Your app loads normally

### **Test 3: iOS Simulator**

1. Build and run app in Xcode
2. App should load your Svelte interface
3. Check Xcode console for errors

**If you see:**

```
✅ "Deep links: Initializing..."
✅ App loads normally
```

→ SSL is fixed!

**If you see:**

```
❌ "NSURLErrorDomain Code=-1200"
❌ "SSL handshake failed"
```

→ Still blocked, try Option A

---

## 🔍 Verifying Certificate Chain

You can check what certificate iOS sees:

```bash
openssl s_client -connect oasis-rubber-linking-established.trycloudflare.com:443 -showcerts
```

**Look for:**

- ✅ `CN=Cloudflare` → Good! Real Cloudflare cert
- ❌ `CN=Bitdefender CA SSL` → Bad! Still intercepted

---

## 📊 Quick Comparison

| Solution            | Webhooks Work | Speed   | Effort |
| ------------------- | ------------- | ------- | ------ |
| **Fix Bitdefender** | ✅ Yes        | Medium  | Low    |
| **SSL Exception**   | ✅ Yes        | Medium  | Low    |
| **Use Local IP**    | ❌ No         | ✅ Fast | None   |

---

## ✅ Current Setup

After fixing Bitdefender, your setup will be:

```
iOS Simulator
    ↓ HTTPS (SSL works!)
Cloudflare Tunnel
    ↓
Your Local Server (localhost:5174)
    ↓
MercadoPago Webhooks ✅ Work!
```

---

## 🆘 Still Having Issues?

### Check These:

1. **Is the tunnel running?**

   ```bash
   ps aux | grep cloudflared
   ```

2. **Is the dev server running?**

   ```bash
   ps aux | grep "vite dev"
   ```

3. **Can you reach it locally?**

   ```bash
   curl http://localhost:5174
   ```

4. **Is Bitdefender fully restarted?**
   - Quit Bitdefender completely
   - Restart it
   - Apply settings again

---

## 🚀 Ready to Test!

Once SSL is fixed:

1. ✅ Build app in Xcode (Cmd+B)
2. ✅ Run on simulator (Cmd+R)
3. ✅ Connect a seller (OAuth flow)
4. ✅ Create a payment
5. ✅ Complete payment with test card
6. ✅ **Check webhook logs** in dev server console!

---

**Webhook logs will show:**

```bash
🪝 Procesando notificación de pago: 123456
🪝 Pago 123456:
   Status: approved
   Amount: $100
   ✅ Pago aprobado - procesar orden
```

That's how you know webhooks are working! 🎉
