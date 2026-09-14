const crypto = require('crypto');

/**
 * Express Middleware to verify Razorpay Webhook Signatures.
 * Mitigates spoofing attacks by ensuring payloads originate from Razorpay.
 */
function verifyRazorpaySignature(req, res, next) {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
        console.error("Missing signature or webhook secret");
        return res.status(400).send('Webhook Error: Missing Signature');
    }

    try {
        // Must use the raw unparsed body for the HMAC computation
        // Ensure Express is configured with `express.raw({type: 'application/json'})` for this route
        const bodyString = req.body.toString();

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyString)
            .digest('hex');

        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return next();
        } else {
            console.error("Razorpay Signature Mismatch Detected - Potential Spoofing Attack");
            return res.status(400).send('Webhook Error: Invalid Signature');
        }
    } catch (err) {
        console.error("Error verifying signature:", err);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = verifyRazorpaySignature;
