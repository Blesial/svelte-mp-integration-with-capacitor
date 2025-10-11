import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketplace.poc',
  appName: 'Marketplace POC',
  webDir: 'build',
  server: {
    // Apunta al servidor remoto Node.js (SSR)
    url: 'https://journals-originally-paso-scales.trycloudflare.com',
    cleartext: true
  }
};

export default config;
