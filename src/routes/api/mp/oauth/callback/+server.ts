import { redirect, error } from '@sveltejs/kit';
import { MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI } from '$env/static/private';
import { upsertSeller } from '$lib/server/seller.repo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const stateCookie = cookies.get('oauth_state');

	// Validar CSRF state
	if (!code || !state || !stateCookie || state !== stateCookie) {
		throw error(400, 'Invalid OAuth state or missing code');
	}

	if (!MP_CLIENT_ID || !MP_CLIENT_SECRET || !MP_REDIRECT_URI) {
		throw error(500, 'MP OAuth env variables missing');
	}

	try {
		// 1. Intercambiar code por tokens
		console.log('🔄 Exchanging code for tokens...');

		const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: MP_CLIENT_ID,
				client_secret: MP_CLIENT_SECRET,
				code,
				redirect_uri: MP_REDIRECT_URI
			})
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			throw error(502, `MP OAuth token error: ${errorText}`);
		}

		const tokenData = await tokenResponse.json();
		const { access_token, refresh_token, token_type, scope, expires_in } = tokenData;

		// 2. Obtener datos del usuario (seller) con el access_token
		console.log('👤 Fetching user data...');

		const userResponse = await fetch('https://api.mercadopago.com/users/me', {
			headers: { Authorization: `Bearer ${access_token}` }
		});

		if (!userResponse.ok) {
			const errorText = await userResponse.text();
			throw error(502, `MP Users/me error: ${errorText}`);
		}

		const userData = await userResponse.json();
		const mp_user_id = String(userData.id);
		const nickname = userData.nickname;
		const email = userData.email || userData.default_address?.email;

		// 3. Calcular expires_at
		const expires_at = Math.floor(Date.now() / 1000) + (expires_in ?? 3600);

		// 4. Guardar en DB (usamos mp_user_id como id del seller)
		const sellerId = mp_user_id;

		upsertSeller({
			id: sellerId,
			access_token,
			refresh_token,
			token_type,
			scope,
			expires_at,
			mp_user_id,
			nickname,
			email
		});

		console.log(`✅ Seller connected: ${sellerId} (${nickname})`);

		// 5. Limpiar cookie de state
		cookies.delete('oauth_state', { path: '/' });

		// 6. Redirigir a página de confirmación
		throw redirect(
			302,
			`/seller/connected?sellerId=${sellerId}&nickname=${encodeURIComponent(nickname ?? '')}`
		);
	} catch (err) {
		// Si el error ya es un error de SvelteKit, re-lanzarlo
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Otros errores
		console.error('OAuth callback error:', err);
		throw error(500, `OAuth callback failed: ${err}`);
	}
};
