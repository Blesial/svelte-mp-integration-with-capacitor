import { json } from "@sveltejs/kit";
import { MP_CLIENT_SECRET, WEEBHOOK_SECRET } from "$env/static/private";
import { getSeller, refreshTokenIfNeeded } from "$lib/server/seller.repo";
import {
  getOrderByReference,
  updateOrderStatus,
  getOrderByPaymentId,
} from "$lib/server/order.repo";
import type { RequestHandler } from "./$types";
import crypto from "crypto";

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
  // MP SIEMPRE envía body JSON con la notificación
  const body = await request.json();

  console.log("Webhook recibido:");
  console.log(JSON.stringify(body, null, 2));

  // Extraer datos del body según documentación oficial de MP
  const topic = body.type; // "payment", "merchant_order", etc
  const id = body.data?.id; // ID del recurso notificado

  if (!topic || !id) {
    console.error("Webhook sin type o data.id en body");
    return json({ error: "Missing type or data.id" }, { status: 400 });
  }

  // Obtener headers para validación de firma
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  // También pueden venir query params (usados en la validación de firma)
  const dataIdFromQuery = url.searchParams.get("data.id") || id;

  console.log(`Type: ${topic}`);
  console.log(`Data ID: ${id}`);
  console.log(`X-Signature: ${xSignature}`);
  console.log(`X-Request-Id: ${xRequestId}`);

  // Validar firma si vienen headers (webhooks reales)
  // El simulador NO envía firma, así que si no hay headers, asumir testing
  if (xSignature && xRequestId) {
    if (!WEEBHOOK_SECRET) {
      console.error("Webhook secret not configured");
      return json({ error: "Server configuration error" }, { status: 500 });
    }

    // Validar firma según documentación oficial de MP
    const isValid = validateSignature(xSignature, xRequestId, dataIdFromQuery);
    if (!isValid) {
      console.error("Firma inválida - posible request fraudulento");
      return json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Firma validada correctamente");
  } else {
    console.warn("⚠️ Webhook sin firma - probablemente simulador o testing");
  }

  // Procesar según el topic
  try {
    if (topic === "payment") {
      const existingOrder = getOrderByPaymentId(id);
      if (existingOrder && existingOrder.status !== "pending") {
        return json(
          { success: true, message: "Already processed" },
          { status: 200 }
        );
      }
    }

    switch (topic) {
      case "payment":
        await processPaymentNotification(id);
        break;
      case "merchant_order":
        await processMerchantOrderNotification(id);
        break;
      default:
        console.log(`Topic no soportado: ${topic}`);
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(
      `Error procesando webhook [topic=${topic}, id=${id}]:`,
      error
    );
    return json({ success: false, error: "Internal error" }, { status: 200 });
  }
};

/**
 * Valida la firma de Mercado Pago usando HMAC-SHA256
 * Según documentación oficial de MercadoPago
 */
function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  try {
    // Separar x-signature en partes
    const parts = xSignature.split(",");

    // Inicializar variables para ts y hash
    let ts: string | undefined;
    let hash: string | undefined;

    // Iterar para obtener ts y v1
    parts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === "ts") {
          ts = trimmedValue;
        } else if (trimmedKey === "v1") {
          hash = trimmedValue;
        }
      }
    });

    if (!ts || !hash) {
      console.error("Formato de firma inválido - falta ts o v1");
      return false;
    }

    // Generar el manifest string
    // IMPORTANTE: data.id debe estar en minúsculas
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;

    // Crear HMAC signature
    const hmac = crypto.createHmac("sha256", WEEBHOOK_SECRET);
    hmac.update(manifest);

    // Obtener hash como string hexadecimal
    const sha = hmac.digest("hex");

    // Verificar HMAC
    if (sha === hash) {
      console.log("✅ HMAC verification passed");
      return true;
    } else {
      console.error("❌ HMAC verification failed");
      console.error(`Esperado: ${hash}`);
      console.error(`Calculado: ${sha}`);
      console.error(`Manifest: ${manifest}`);
      return false;
    }
  } catch (error) {
    console.error("Error validando firma:", error);
    return false;
  }
}

/**
 * Procesa notificación de pago
 */
async function processPaymentNotification(paymentId: string) {
  console.log(`🪝 Procesando notificación de pago: ${paymentId}`);

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_CLIENT_SECRET}`, // Solo para obtener info básica
        },
      }
    );

    if (!response.ok) {
      console.error(`Error obteniendo pago ${paymentId}: ${response.status}`);
      return;
    }

    const payment = await response.json();
    const sellerId = payment.collector_id?.toString();

    console.log(`🪝 Pago ${paymentId}:`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Status detail: ${payment.status_detail}`);
    console.log(`   Amount: $${payment.transaction_amount}`);
    console.log(`   External reference: ${payment.external_reference}`);
    console.log(`   Seller ID: ${sellerId}`);

    const marketplaceFee =
      payment.fee_details?.find((f: any) => f.type === "marketplace_fee")
        ?.amount || 0;
    console.log(`   Marketplace fee: $${marketplaceFee}`);

    // Log seller info (simplificado - solo para debugging)
    if (sellerId) {
      const seller = await getSeller(sellerId);
      if (seller) {
        console.log(`✅ Seller: ${seller.nickname || seller.id}`);
      } else {
        console.warn(`⚠️ Seller ${sellerId} no encontrado en nuestra DB`);
      }
    }

    // Procesar según el estado del pago
    if (payment.status === "approved") {
      console.log("✅ Pago aprobado - procesar orden");
      await processApprovedPayment(payment, marketplaceFee);
    } else if (payment.status === "rejected") {
      console.log("❌ Pago rechazado");
      await processRejectedPayment(payment);
    } else if (payment.status === "pending") {
      console.log("⏳ Pago pendiente");
      await processPendingPayment(payment);
    }
  } catch (error) {
    console.error(`Error procesando pago ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Procesa pago aprobado
 */
async function processApprovedPayment(payment: any, marketplaceFee: number) {
  console.log("🎉 Procesando pago aprobado:");
  console.log(`   Total: $${payment.transaction_amount}`);
  console.log(`   Fee del marketplace: $${marketplaceFee}`);
  console.log(
    `   Seller recibe: $${payment.transaction_amount - marketplaceFee}`
  );
  console.log(`   Referencia: ${payment.external_reference}`);

  // Actualizar orden en base de datos
  const updated = updateOrderStatus(
    payment.external_reference,
    "approved",
    payment.id,
    payment.payment_method_id
  );

  if (updated) {
    console.log(
      `✅ Orden ${payment.external_reference} marcada como aprobada en DB`
    );
  } else {
    console.warn(
      `⚠️ No se pudo actualizar orden ${payment.external_reference} en DB`
    );
  }

  // TODO (futuro): Lógica adicional
  // - Actualizar stock
  // - Enviar email de confirmación
  // - Notificar al seller
}

/**
 * Procesa pago rechazado
 */
async function processRejectedPayment(payment: any) {
  console.log("💸 Procesando pago rechazado:");
  console.log(`   Razón: ${payment.status_detail}`);
  console.log(`   Referencia: ${payment.external_reference}`);

  // Actualizar orden en base de datos
  const updated = updateOrderStatus(
    payment.external_reference,
    "rejected",
    payment.id,
    payment.payment_method_id
  );

  if (updated) {
    console.log(
      `❌ Orden ${payment.external_reference} marcada como rechazada en DB`
    );
  } else {
    console.warn(
      `⚠️ No se pudo actualizar orden ${payment.external_reference} en DB`
    );
  }

  // TODO (futuro): Lógica adicional
  // - Liberar stock
  // - Notificar al usuario
}

/**
 * Procesa pago pendiente
 */
async function processPendingPayment(payment: any) {
  console.log("⏰ Procesando pago pendiente:");
  console.log(`   Método: ${payment.payment_method_id}`);
  console.log(`   Referencia: ${payment.external_reference}`);

  // Actualizar orden en base de datos
  const updated = updateOrderStatus(
    payment.external_reference,
    "pending",
    payment.id,
    payment.payment_method_id
  );

  if (updated) {
    console.log(
      `⏳ Orden ${payment.external_reference} marcada como pendiente en DB`
    );
  } else {
    console.warn(
      `⚠️ No se pudo actualizar orden ${payment.external_reference} en DB`
    );
  }

  // TODO (futuro): Lógica adicional
  // - Mantener reserva de stock
  // - Programar seguimiento
}

/**
 * Procesa notificación de merchant order
 */
async function processMerchantOrderNotification(orderId: string) {
  console.log(`Procesando notificación de merchant order: ${orderId}`);

  try {
    const response = await fetch(
      `https://api.mercadopago.com/merchant_orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_CLIENT_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Error obteniendo orden ${orderId}: ${response.status}`);
      return;
    }

    const order = await response.json();

    console.log(`Orden ${orderId}:`);
    console.log(`Status: ${order.status}`);
    console.log(`Total: $${order.total_amount}`);
    console.log(`Paid: $${order.paid_amount}`);
  } catch (error) {
    console.error(`Error procesando orden ${orderId}:`, error);
    throw error;
  }
}
