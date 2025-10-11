import { db } from './db';
import { MP_CLIENT_ID, MP_CLIENT_SECRET } from '$env/static/private';

export interface SellerToken {
	id: string;
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	scope?: string;
	expires_at?: number; // epoch seconds
	mp_user_id: string;
	nickname?: string;
	email?: string;
}

/**
 * Inserta o actualiza un seller en la base de datos
 */
export function upsertSeller(seller: SellerToken): void {
	const now = Math.floor(Date.now() / 1000);
	const stmt = db.prepare(`
		INSERT INTO sellers (
			id, access_token, refresh_token, token_type, scope,
			expires_at, mp_user_id, nickname, email, updated_at
		)
		VALUES (
			@id, @access_token, @refresh_token, @token_type, @scope,
			@expires_at, @mp_user_id, @nickname, @email, @updated_at
		)
		ON CONFLICT(id) DO UPDATE SET
			access_token = excluded.access_token,
			refresh_token = excluded.refresh_token,
			token_type = excluded.token_type,
			scope = excluded.scope,
			expires_at = excluded.expires_at,
			mp_user_id = excluded.mp_user_id,
			nickname = excluded.nickname,
			email = excluded.email,
			updated_at = excluded.updated_at
	`);

	stmt.run({
		...seller,
		updated_at: now
	});
}

/**
 * Obtiene un seller por ID
 */
export function getSeller(sellerId: string): SellerToken | null {
	const row = db.prepare('SELECT * FROM sellers WHERE id = ?').get(sellerId);
	return (row as SellerToken) ?? null;
}

/**
 * Obtiene un seller por mp_user_id
 */
export function getSellerByMpUserId(mpUserId: string): SellerToken | null {
	const row = db.prepare('SELECT * FROM sellers WHERE mp_user_id = ?').get(mpUserId);
	return (row as SellerToken) ?? null;
}

/**
 * Lista todos los sellers
 */
export function listSellers(): SellerToken[] {
	return db.prepare('SELECT * FROM sellers').all() as SellerToken[];
}

/**
 * Refresca el access_token si está vencido
 * Retorna el access_token válido (nuevo o existente)
 */
export async function refreshTokenIfNeeded(seller: SellerToken): Promise<string> {
	// Si no hay expires_at o refresh_token, devolver el token tal cual
	if (!seller.expires_at || !seller.refresh_token) {
		return seller.access_token;
	}

	// Verificar si el token todavía es válido (con margen de 60 segundos)
	const now = Math.floor(Date.now() / 1000) + 60;
	if (seller.expires_at > now) {
		return seller.access_token; // Aún válido
	}

	// Token expirado, refrescar
	console.log(`🔄 Refreshing token for seller ${seller.id}...`);

	const response = await fetch('https://api.mercadopago.com/oauth/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			client_id: MP_CLIENT_ID,
			client_secret: MP_CLIENT_SECRET,
			refresh_token: seller.refresh_token
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
	}

	const data = await response.json();
	const {
		access_token,
		refresh_token,
		token_type,
		scope,
		expires_in
	}: {
		access_token: string;
		refresh_token?: string;
		token_type?: string;
		scope?: string;
		expires_in?: number;
	} = data;

	const expires_at = Math.floor(Date.now() / 1000) + (expires_in ?? 3600);

	// Actualizar en DB
	const updatedSeller: SellerToken = {
		...seller,
		access_token,
		refresh_token: refresh_token ?? seller.refresh_token,
		token_type,
		scope,
		expires_at
	};

	upsertSeller(updatedSeller);

	console.log(`✅ Token refreshed for seller ${seller.id}`);

	return access_token;
}
