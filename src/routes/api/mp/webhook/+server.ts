import { json } from '@sveltejs/kit';
import { MP_CLIENT_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

/**
 * Webhook de Mercado Pago para recibir notificaciones de pagos
 *
 * Mercado Pago envía:
 * - Query params: ?topic=payment&id=123456
 * - Headers: x-signature, x-request-id
 *
 * Docs: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const topic = url.searchParams.get('topic');
	const id = url.searchParams.get('id');
	const dataId = url.searchParams.get('data.id') || id; // Algunos webhooks usan data.id

	console.log('\n🔔 Webhook recibido:');
	console.log(`   Topic: ${topic}`);
	console.log(`   ID: ${id}`);
	console.log(`   Data ID: ${dataId}`);

	// Validar que tenemos los parámetros necesarios
	if (!topic || !id) {
		console.error('Webhook sin topic o id');
		return json({ error: 'Missing topic or id' }, { status: 400 });
	}

	// Obtener headers para validación
	const xSignature = request.headers.get('x-signature');
	const xRequestId = request.headers.get('x-request-id');

	console.log(`   X-Signature: ${xSignature}`);
	console.log(`   X-Request-Id: ${xRequestId}`);

	// Validar firma de Mercado Pago
	// CHEQUEAR ESTO EN PRODUCCIÓN
	if (xSignature && xRequestId && dataId) {
		try {
			const isValid = validateSignature(xSignature, xRequestId, dataId);
			if (!isValid) {
				console.error('Firma inválida - posible request fraudulento');
				return json({ error: 'Invalid signature' }, { status: 401 });
			}
			console.log('✅ Firma validada correctamente');
		} catch (error) {
			console.error('Error validando firma:', error);
			// Continuar de todas formas en desarrollo
		}
	}

	// Procesar según el topic
	try {
		switch (topic) {
			case 'payment':
				await processPaymentNotification(id);
				break;

			case 'merchant_order':
				await processMerchantOrderNotification(id);
				break;

			default:
				console.log(`⚠️  Topic desconocido: ${topic}`);
		}

		// IMPORTANTE: Siempre responder 200 OK para que MP no reintente
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('❌ Error procesando webhook:', error);
		// Aún así respondemos 200 para evitar reintentos
		return json({ success: false, error: String(error) }, { status: 200 });
	}
};

/**
 * Valida la firma de Mercado Pago usando HMAC-SHA256
 *
 * Formato de x-signature: "ts=1234567890,v1=hash_value"
 * Se calcula: HMAC-SHA256(id + request_id + ts, client_secret)
 */
function validateSignature(
	xSignature: string,
	xRequestId: string,
	dataId: string
): boolean {
	try {
		// Parsear x-signature
		const parts = xSignature.split(',');
		const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
		const hash = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

		if (!ts || !hash) {
			console.error('Formato de firma inválido');
			return false;
		}

		// Construir el mensaje a verificar
		const message = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

		// Calcular HMAC-SHA256
		const hmac = crypto.createHmac('sha256', MP_CLIENT_SECRET);
		hmac.update(message);
		const calculatedHash = hmac.digest('hex');

		// Comparar hashes
		const isValid = calculatedHash === hash;

		if (!isValid) {
			console.error(`Hash no coincide:`);
			console.error(`   Esperado: ${hash}`);
			console.error(`   Calculado: ${calculatedHash}`);
			console.error(`   Mensaje: ${message}`);
		}

		return isValid;
	} catch (error) {
		console.error('Error en validación de firma:', error);
		return false;
	}
}

/**
 * Procesa notificación de pago
 */
async function processPaymentNotification(paymentId: string) {
	console.log(`💰 Procesando notificación de pago: ${paymentId}`);

	try {
		// Obtener datos del pago desde la API de MP
		const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
			headers: {
				Authorization: `Bearer ${MP_CLIENT_SECRET}` // Nota: en producción usar access_token del seller
			}
		});

		if (!response.ok) {
			console.error(`Error obteniendo pago ${paymentId}: ${response.status}`);
			return;
		}

		const payment = await response.json();

		console.log(`📋 Pago ${paymentId}:`);
		console.log(`   Status: ${payment.status}`);
		console.log(`   Status detail: ${payment.status_detail}`);
		console.log(`   Amount: $${payment.transaction_amount}`);
		console.log(`   External reference: ${payment.external_reference}`);
		console.log(`   Marketplace fee: $${payment.fee_details?.find((f: any) => f.type === 'marketplace_fee')?.amount || 0}`);

		if (payment.status === 'approved') {
			console.log('✅ Pago aprobado - procesar orden');
			// TODO: Actualizar orden en DB, enviar confirmación, etc.
		} else if (payment.status === 'rejected') {
			console.log('❌ Pago rechazado');
			// TODO: Notificar al usuario
		} else if (payment.status === 'pending') {
			console.log('⏳ Pago pendiente');
			// TODO: Esperar confirmación
		}
	} catch (error) {
		console.error(`❌ Error procesando pago ${paymentId}:`, error);
		throw error;
	}
}

/**
 * Procesa notificación de merchant order
 */
async function processMerchantOrderNotification(orderId: string) {
	console.log(`Procesando notificación de merchant order: ${orderId}`);

	try {
		const response = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
			headers: {
				Authorization: `Bearer ${MP_CLIENT_SECRET}`
			}
		});

		if (!response.ok) {
			console.error(`Error obteniendo orden ${orderId}: ${response.status}`);
			return;
		}

		const order = await response.json();

		console.log(`📋 Orden ${orderId}:`);
		console.log(`   Status: ${order.status}`);
		console.log(`   Total: $${order.total_amount}`);
		console.log(`   Paid: $${order.paid_amount}`);

		// Procesar según estado de la orden
	} catch (error) {
		console.error(`Error procesando orden ${orderId}:`, error);
		throw error;
	}
}
