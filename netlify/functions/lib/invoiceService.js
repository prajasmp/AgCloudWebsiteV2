import { addInvoiceToStore, getInvoiceByOrderId } from './devStore.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin.js';

export function generateInvoiceForOrder(order) {
  const existing = getInvoiceByOrderId(order.id);
  if (existing) return existing;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${order.id.replace('ORD-', '')}`;
  const nowIso = new Date().toISOString();

  const invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_id: order.id,
    invoice_number: invoiceNumber,
    customer_name: order.user_name || 'Customer',
    customer_email: order.user_email || order.contact_email,
    mobile: order.mobile || '',
    plan_id: order.plan_id,
    plan_name: order.plan_name,
    amount: order.amount,
    currency: order.currency || 'INR',
    tax_amount: 0,
    total_amount: order.amount,
    payment_method: 'Razorpay (UPI / Card / NetBanking)',
    razorpay_payment_id: order.razorpay_payment_id || '',
    status: 'paid',
    issued_at: nowIso,
    created_at: nowIso
  };

  addInvoiceToStore(invoice);

  if (isSupabaseAdminConfigured() && supabaseAdmin) {
    try {
      supabaseAdmin.from('invoices').insert(invoice).then(() => {}).catch(e => {
        console.warn('[Invoice DB Warning]:', e.message);
      });
    } catch (e) {}
  }

  return invoice;
}
