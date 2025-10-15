import { db } from "./db";

export interface Order {
  id?: number;
  external_reference: string;
  seller_id: string;
  payment_id?: string;
  amount: number;
  marketplace_fee: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  payment_method?: string;
  title: string;
  created_at?: number;
  updated_at?: number;
}

/**
 * Crear nueva orden
 */
export function createOrder(
  order: Omit<Order, "id" | "created_at" | "updated_at">
): Order {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO orders (
      external_reference, seller_id, payment_id, amount, marketplace_fee,
      status, payment_method, title, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    order.external_reference,
    order.seller_id,
    order.payment_id || null,
    order.amount,
    order.marketplace_fee,
    order.status,
    order.payment_method || null,
    order.title,
    now,
    now
  );

  return {
    id: result.lastInsertRowid as number,
    created_at: now,
    updated_at: now,
    ...order,
  };
}

/**
 * Obtener orden por external_reference
 */
export function getOrderByReference(external_reference: string): Order | null {
  const stmt = db.prepare("SELECT * FROM orders WHERE external_reference = ?");
  return stmt.get(external_reference) as Order | null;
}

/**
 * Obtener orden por payment_id
 */
export function getOrderByPaymentId(payment_id: string): Order | null {
  const stmt = db.prepare("SELECT * FROM orders WHERE payment_id = ?");
  return stmt.get(payment_id) as Order | null;
}

/**
 * Actualizar estado de orden
 */
export function updateOrderStatus(
  external_reference: string,
  status: Order["status"],
  payment_id?: string,
  payment_method?: string
): boolean {
  const stmt = db.prepare(`
    UPDATE orders
    SET status = ?, payment_id = COALESCE(?, payment_id),
        payment_method = COALESCE(?, payment_method), updated_at = ?
    WHERE external_reference = ?
  `);

  const result = stmt.run(
    status,
    payment_id || null,
    payment_method || null,
    Date.now(),
    external_reference
  );
  return result.changes > 0;
}

/**
 * Obtener todas las órdenes
 */
export function getAllOrders(): Order[] {
  const stmt = db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
  return stmt.all() as Order[];
}

/**
 * Obtener órdenes por seller
 */
export function getOrdersBySeller(seller_id: string): Order[] {
  const stmt = db.prepare(
    "SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(seller_id) as Order[];
}
