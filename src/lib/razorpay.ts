// Razorpay Payment Integration Utility
// Ensure VITE_RAZORPAY_KEY_ID is set in your .env file
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

interface RazorpayOptions {
  amount: number; // in INR (will be converted to paise)
  description: string;
  prefillEmail?: string;
  prefillName?: string;
  prefillPhone?: string;
  notes?: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
  type?: 'subscription' | 'order';
  plan_id?: string;
}

/**
 * Load Razorpay checkout script dynamically
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay checkout and return payment response
 */
export async function initiateRazorpayCheckout(
  options: RazorpayOptions
): Promise<RazorpayResponse> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load Razorpay SDK. Check your internet connection.');
  }

  // 1. Create order or subscription on backend
  let checkoutData: any;
  try {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: options.amount,
        type: options.notes?.type,
        duration: options.notes?.duration,
        planName: options.notes?.plan
      }),
    });
    checkoutData = await res.json();
    if (!res.ok) {
      throw new Error(checkoutData.error || 'Failed to initialize payment');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Could not initialize payment. Please try again.');
  }

  return new Promise((resolve, reject) => {
    const rzpOptions: any = {
      key: RAZORPAY_KEY_ID,
      amount: options.amount * 100, // Convert INR to paise
      currency: 'INR',
      name: 'JAS CONNECT',
      description: options.description,
      image: '/favicon.ico',
      prefill: {
        email: options.prefillEmail || '',
        name: options.prefillName || '',
        contact: options.prefillPhone || '',
      },
      notes: options.notes || {},
      theme: {
        color: '#3B82F6',
        backdrop_color: '#0A0E1A',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user.'));
        },
      },
      handler: async (response: RazorpayResponse) => {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            reject(new Error(verifyData.error || 'Payment verification failed.'));
          } else {
            resolve({
              ...response,
              type: checkoutData.type,
              plan_id: checkoutData.plan_id
            });
          }
        } catch (err: any) {
          reject(new Error('Payment verification error: ' + err.message));
        }
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.on('payment.failed', (response: any) => {
      reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
    });
    rzp.open();
  });
}

/**
 * Quick helper for lead unlock payment
 */
export async function payForLeadUnlock(
  leadTitle: string,
  userEmail?: string,
  userName?: string,
  userPhone?: string,
): Promise<RazorpayResponse> {
  return initiateRazorpayCheckout({
    amount: 99,
    description: `Unlock Lead: ${leadTitle}`,
    prefillEmail: userEmail,
    prefillName: userName,
    prefillPhone: userPhone,
    notes: { type: 'lead_unlock' },
  });
}

/**
 * Quick helper for plan subscription payment
 */
export async function payForSubscription(
  planName: string,
  amount: number,
  duration: string,
  userEmail?: string,
  userName?: string,
  userPhone?: string,
): Promise<RazorpayResponse> {
  return initiateRazorpayCheckout({
    amount,
    description: `JAS CONNECT ${planName} Plan — ${duration}`,
    prefillEmail: userEmail,
    prefillName: userName,
    prefillPhone: userPhone,
    notes: { type: 'subscription', plan: planName, duration },
  });
}
