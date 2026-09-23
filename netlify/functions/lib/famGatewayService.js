import crypto from 'crypto';

const UPI_RECEIVER_ID = process.env.UPI_RECEIVER_ID || process.env.FAMGATEWAY_RECEIVER_VPA || 'anandagcloud@fam';
const UPI_RECEIVER_NAME = process.env.UPI_RECEIVER_NAME || 'AG Cloud Hosting';

export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') return false;

  const upiRegex = /^[\w.-]+@[\w.-]+$/i;
  return upiRegex.test(upiId.trim());
}

export async function createUpiCollectRequest({ orderId, upiId, amount, name, mobile }) {

  const cleanUpi = (upiId || '').trim();
  if (!isValidUpiId(cleanUpi)) {
    throw new Error(`Invalid UPI ID format: "${cleanUpi}". Please enter a valid UPI VPA (e.g. name@upi or number@paytm).`);
  }

  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_RECEIVER_ID)}&pn=${encodeURIComponent(UPI_RECEIVER_NAME)}&am=${amount}&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(`AG Cloud Order ${orderId}`)}`;

  console.log(`[UPI Payment] Order ${orderId} generated for ${amount} INR to ${UPI_RECEIVER_ID}`);

  return {
    success: true,
    isUpiIntent: true,
    upiUri,
    receiverVpa: UPI_RECEIVER_ID,
    receiverName: UPI_RECEIVER_NAME,
    gatewayPaymentId: `UPI_DIRECT_${orderId}`,
    gatewayReference: orderId,
    status: 'pending'
  };
}

export function verifyWebhookSignature(headers, rawBody) {
  return true;
}

export async function fetchPaymentStatus(gatewayPaymentId) {
  return { status: 'pending' };
}
