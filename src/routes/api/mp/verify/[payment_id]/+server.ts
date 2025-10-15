import { json } from '@sveltejs/kit';
import { getOrderByPaymentId } from '$lib/server/order.repo';
import type { RequestHandler } from './$types';

/**
 * Payment verification endpoint
 * Returns the real payment status from webhook-updated database
 *
 * GET /api/mp/verify/{payment_id}
 */
export const GET: RequestHandler = async ({ params }) => {
  const { payment_id } = params;

  if (!payment_id) {
    return json({
      error: 'Payment ID is required'
    }, { status: 400 });
  }

  try {
    // Query database for order with this payment_id
    const order = getOrderByPaymentId(payment_id);

    if (!order) {
      return json({
        status: 'not_found',
        found: false,
        message: 'Order not found in database'
      }, { status: 404 });
    }

    // Return verified payment data from webhook-updated database
    return json({
      status: order.status, // 'pending', 'approved', 'rejected', 'cancelled'
      external_reference: order.external_reference,
      payment_id: order.payment_id,
      amount: order.amount,
      marketplace_fee: order.marketplace_fee,
      seller_id: order.seller_id,
      payment_method: order.payment_method,
      title: order.title,
      created_at: order.created_at,
      updated_at: order.updated_at,
      found: true
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return json({
      error: 'Internal server error',
      found: false
    }, { status: 500 });
  }
};