import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Permitir hosts de Cloudflare Tunnel
		allowedHosts: ['.trycloudflare.com']
	}
});
