// Supabase Client Initialization (Mocked for demonstration)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Razorpay Webhook Controller with Database Idempotency
 */
async function handleRazorpayWebhook(req, res) {
    // Note: Due to `express.raw`, req.body must be parsed back to JSON here if needed.
    const payload = JSON.parse(req.body.toString());
    const eventId = req.headers['x-razorpay-event-id'];
    const eventType = payload.event;

    if (!eventId) {
        return res.status(400).send('Missing Event ID');
    }

    try {
        // 1. Attempt Idempotency Lock
        // If this exact eventId already exists, it will throw a unique constraint error (Postgres 23505)
        const { data, error } = await supabase
            .from('webhook_events')
            .insert([{
                event_id: eventId,
                provider: 'razorpay',
                event_type: eventType,
                payload: payload
            }]);

        if (error) {
            // Error code 23505 is Unique Violation in Postgres
            if (error.code === '23505') {
                console.log(`[Idempotency] Ignoring duplicate Razorpay event: ${eventId}`);
                // Return 200 OK so Razorpay stops retrying
                return res.status(200).send('Duplicate Event Ignored');
            }
            throw error; // Other DB errors
        }

        // 2. Process Business Logic
        console.log(`[Webhook Processed] New Event: ${eventType} - ${eventId}`);

        switch (eventType) {
            case 'payment.captured':
                // Handle payment capture logic
                break;
            case 'subscription.activated':
                // Handle subscription activation
                break;
            case 'subscription.charged':
                // Handle recurring charge
                break;
            case 'subscription.cancelled':
                // Handle cancellation
                break;
            default:
                console.log(`Unhandled Razorpay event type: ${eventType}`);
        }

        // 3. Respond OK
        return res.status(200).send('OK');

    } catch (err) {
        console.error("Webhook Processing Error:", err);
        // Do NOT return 500 blindly. If the DB fails, returning 500 tells Razorpay to retry.
        // Only return 500 if it's a transient failure we WANT retried.
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    handleRazorpayWebhook
};
