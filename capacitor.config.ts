import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.marketplace.poc",
  appName: "Marketplace POC",
  webDir: "build",
  server: {
    // Using Cloudflare tunnel - Works on real iPhone + webhooks work!
    // Bitdefender on Mac doesn't affect the iPhone
    url: "https://maintains-adopted-vic-operations.trycloudflare.com",
    cleartext: false,

    // Alternative: Use local IP (faster, but webhooks won't work)
    // url: "http://192.168.10.175:5174",
    // cleartext: true,
  },
  // Note: For iOS navigation issues, ensure the URL is reachable; no 'allowNavigation' needed in Capacitor config.
};

export default config;
