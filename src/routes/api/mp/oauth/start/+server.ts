import { redirect, error } from '@sveltejs/kit';
import { MP_CLIENT_ID, MP_REDIRECT_URI } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
		throw error(500, 'MP OAuth env variables missing');
	}

	// Generar CSRF state token
	const state = crypto.randomUUID();

	// Guardar en cookie para verificar en callback
	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // true en producción con HTTPS
		maxAge: 60 * 10 // 10 minutos
	});

	// Construir URL de autorización de Mercado Pago
	const authUrl = new URL('https://auth.mercadopago.com/authorization');
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('client_id', MP_CLIENT_ID);
	authUrl.searchParams.set('redirect_uri', MP_REDIRECT_URI);
	authUrl.searchParams.set('state', state);
	// Scopes: offline_access para refresh_token
	authUrl.searchParams.set('scope', 'offline_access read write');

	console.log('🔗 Redirecting to MP OAuth:', authUrl.toString());

	throw redirect(302, authUrl.toString());
};
