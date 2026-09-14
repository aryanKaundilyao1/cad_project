import Razorpay from 'razorpay';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, duration, planName, type } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount. Must be >= 1.' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay environment variables are missing.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const isSubscription = type === 'subscription' && ['1m', '3m', '6m', 'Monthly', 'Quarterly'].includes(duration);

    if (isSubscription) {
      // Create Razorpay Plan dynamically
      let period = "monthly";
      let interval = 1;
      if (duration === '3m' || duration === 'Quarterly') {
        interval = 3;
      } else if (duration === '6m') {
        interval = 6;
      }

      const plan = await razorpay.plans.create({
        period,
        interval,
        item: {
          name: `JAS CONNECT - ${planName || 'Plan'} (${duration})`,
          amount: Math.round(amount * 100),
          currency: "INR",
          description: `Subscription for ${planName || 'Plan'}`
        }
      });

      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.id,
        customer_notify: 1,
        total_count: 120 // Run for 10 years by default unless cancelled
      });

      console.log('Create Subscription Success');

      return res.status(200).json({
        type: 'subscription',
        subscription_id: subscription.id,
        plan_id: plan.id,
        amount: Math.round(amount * 100),
        currency: "INR"
      });
    }

    // Default to One-Time Order
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    console.log('Create Order Success');

    return res.status(200).json({
      type: 'order',
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error('Create Order Failed');
    console.error('Razorpay Order Creation Error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong while creating the order.' });
  }
}
