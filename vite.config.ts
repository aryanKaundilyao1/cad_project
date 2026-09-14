import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from 'dotenv';
import { exec } from 'child_process';
dotenv.config();

const apiPlugin = () => ({
  name: 'local-api',
  configureServer(server: any) {
    server.middlewares.use('/api/create-order', async (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', async () => {
          try {
            const Razorpay = (await import('razorpay')).default;
            const data = JSON.parse(body);
            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '',
              key_secret: process.env.RAZORPAY_KEY_SECRET || '',
            });

            const isSubscription = data.type === 'subscription' && ['1m', '3m', '6m', 'Monthly', 'Quarterly'].includes(data.duration);
            
            if (isSubscription) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                type: 'subscription', 
                subscription_id: `sub_mock_${Date.now()}`, 
                plan_id: `plan_mock_${Date.now()}`, 
                amount: Math.round(data.amount * 100), 
                currency: "INR" 
              }));
              return;
            }

            const order = await razorpay.orders.create({
              amount: Math.round(data.amount * 100),
              currency: "INR",
              receipt: `receipt_order_${Date.now()}`
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ type: 'order', order_id: order.id, amount: order.amount }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message || 'Razorpay Error' }));
          }
        });
      }
    });

    server.middlewares.use('/api/verify-payment', (req: any, res: any) => {
      if (req.method === 'POST') {
        // Automatically verify for local testing
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      }
    });

    server.middlewares.use('/api/run-oie', (req: any, res: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const productId = url.searchParams.get('productId') || '';
      
      exec(`python3 -m opportunity_engine.api_runner --product_id "${productId}"`, (error: any, stdout: any, stderr: any) => {
        if (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: stderr || error.message }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(stdout);
      });
    });

    server.middlewares.use('/api/scrape-website', async (req: any, res: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'URL is required' }));
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const fetchRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        clearTimeout(timeoutId);

        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch: ${fetchRes.status}`);
        }
        const html = await fetchRes.text();
        res.setHeader('Content-Type', 'text/plain');
        res.end(html);
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.name === 'AbortError' ? 'Website took too long to respond' : err.message }));
      }
    });
  }
});
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), apiPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
