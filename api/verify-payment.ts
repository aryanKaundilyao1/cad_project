import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_order_id && !razorpay_subscription_id)) {
      return res.status(400).json({ error: 'Missing payment verification details.' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay secret key is missing.' });
    }

    let body = "";
    if (razorpay_order_id) {
      body = razorpay_order_id + "|" + razorpay_payment_id;
    } else if (razorpay_subscription_id) {
      body = razorpay_payment_id + "|" + razorpay_subscription_id;
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      console.log('Payment Verification Success');
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      console.error('Payment Verification Failed');
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }
  } catch (error: any) {
    console.error('Payment Verification Failed');
    console.error('Razorpay Verification Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Something went wrong while verifying payment.' });
  }
}
