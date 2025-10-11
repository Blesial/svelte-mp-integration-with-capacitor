import { json, error } from '@sveltejs/kit';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getSeller, refreshTokenIfNeeded } from '$lib/server/seller.repo';
import { MARKETPLACE_COMMISSION_PERCENTAGE } from '$env/static/private';
import { PUBLIC_APP_URL, PUBLIC_WEBHOOK_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sellerId, amount, title, external_reference, isNative } = body;

	// Validar parámetros requeridos
	if (!sellerId || !amount || !title || !external_reference) {
		throw error(400, 'Missing required parameters: sellerId, amount, title, external_reference');
	}

	// 1. Obtener seller de la DB
	const seller = await getSeller(sellerId);
	if (!seller || !seller.access_token) {
		throw error(404, `Seller ${sellerId} not found or not connected to Mercado Pago`);
	}

	try {
		// 2. Refresh token si expiró
		const validAccessToken = await refreshTokenIfNeeded(seller);

		// 3. Crear cliente MP con el access_token del SELLER (no del marketplace)
		const mpClient = new MercadoPagoConfig({
			accessToken: validAccessToken
		});

		// 4. Calcular marketplace_fee (comisión para el marketplace)
		const commissionPercentage = Number(MARKETPLACE_COMMISSION_PERCENTAGE) || 5;
		const marketplace_fee = Math.round(amount * (commissionPercentage / 100));

		// 5. Determinar back_urls según si es app móvil o web
		const baseUrl = isNative === 'app' ? 'marketplacepoc://payment' : `${PUBLIC_APP_URL}/payment`;

		console.log(`💰 Creating preference for seller ${sellerId}:`);
		console.log(`   Amount: $${amount}`);
		console.log(`   Marketplace fee (${commissionPercentage}%): $${marketplace_fee}`);
		console.log(`   Seller receives: $${amount - marketplace_fee}`);
		console.log(`   Is native app: ${isNative === 'app'}`);

		// 6. Crear preferencia con marketplace_fee
		const preference = await new Preference(mpClient).create({
			body: {
				items: [
					{
						id: 'item-1',
						title,
						quantity: 1,
						unit_price: amount,
						currency_id: 'ARS'
					}
				],
				external_reference,
				metadata: {
					seller_id: sellerId,
					title,
					amount,
					marketplace_fee
				},
				// IMPORTANTE: marketplace_fee va al marketplace
				marketplace_fee,
				// URLs de retorno
				back_urls: {
					success: `${baseUrl}/success`,
					failure: `${baseUrl}/failure`,
					pending: `${baseUrl}/pending`
				},
				// Auto-retorno cuando el pago es aprobado
				auto_return: 'approved',
				// Webhook para confirmación server-side
				notification_url: PUBLIC_WEBHOOK_URL || `${PUBLIC_APP_URL}/api/mp/webhook`
			}
		});

		console.log(`✅ Preference created: ${preference.id}`);
		console.log(`   Init point: ${preference.init_point}`);

		return json({
			id: preference.id,
			init_point: preference.init_point,
			sandbox_init_point: preference.sandbox_init_point
		});
	} catch (err) {
		console.error('Error creating preference:', err);
		throw error(500, `Failed to create preference: ${err}`);
	}
};
