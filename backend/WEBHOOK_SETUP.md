# PayMongo Webhook Setup with ngrok

This guide will help you set up ngrok to expose your local backend server to the internet so PayMongo can send webhook events.

## Prerequisites

1. Backend server running on `http://localhost:3001`
2. PayMongo account with API keys configured
3. ngrok installed on your system

## Step 1: Install ngrok

### Windows
1. Download ngrok from https://ngrok.com/download
2. Extract the ngrok.exe file
3. Add ngrok to your PATH or use it directly from the extracted folder

### macOS
```bash
brew install ngrok/ngrok/ngrok
```

### Linux
```bash
# Download and extract
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

## Step 2: Sign up for ngrok (Optional but Recommended)

1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your authtoken from the dashboard
4. Run: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

**Note:** Free accounts have limitations (session timeout after 2 hours). For production, consider a paid plan.

## Step 3: Start ngrok Tunnel

Open a new terminal and run:

```bash
ngrok http 3001
```

This will create a tunnel to your local backend server. You'll see output like:

```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:3001
```

**Important:** Copy the HTTPS URL (e.g., `https://abc123xyz.ngrok-free.app`). This is your public webhook URL.

## Step 4: Configure PayMongo Webhook

1. Log in to PayMongo Dashboard: https://dashboard.paymongo.com/
2. Go to **Developers** > **Webhooks**
3. Click **Create Webhook**
4. Configure the webhook:
   - **URL**: `https://abc123xyz.ngrok-free.app/payment/webhook` (your ngrok URL + `/payment/webhook`)
   - **Events to Listen**: Select these events:
     - `checkout_session.payment.paid` - Payment successful
     - `checkout_session.payment.failed` - Payment failed
     - `payment.paid` - Payment completed (for Payment Links)
     - `payment.failed` - Payment failed (for Payment Links)
   - **Status**: Enabled
5. Click **Create Webhook**
6. **Important**: Copy the **Webhook Secret** (it looks like `whsec_...`). You'll need this for signature verification.

## Step 5: Configure Backend Environment Variables

Add the webhook secret to your `.env` file in the backend directory:

```env
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 6: Test the Webhook

1. Restart your backend server to load the new environment variables:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Make a test payment through your application

3. Check your backend console logs - you should see:
   ```
   PayMongo webhook received: { type: 'checkout_session.payment.paid', id: '...' }
   Payment successful: { ... }
   ```

4. Check the PayMongo Dashboard > Webhooks > Your Webhook > Logs to see if the webhook was delivered successfully

## Step 7: Keep ngrok Running

**Important:** You must keep the ngrok terminal window open while testing. If you close it, the webhook URL will change and you'll need to:
- Restart ngrok
- Update the webhook URL in PayMongo Dashboard
- Update the webhook secret if it changed

### Keeping ngrok Running in Background (Optional)

On Windows (PowerShell):
```powershell
Start-Process ngrok -ArgumentList "http", "3001"
```

On macOS/Linux:
```bash
nohup ngrok http 3001 > ngrok.log 2>&1 &
```

## Troubleshooting

### Webhook not being received

1. **Check ngrok is running**: Visit `http://localhost:4040` (ngrok's web interface) to see incoming requests
2. **Check backend logs**: Look for any errors in your backend console
3. **Check PayMongo Dashboard**: Go to Webhooks > Your Webhook > Logs to see delivery status
4. **Verify webhook URL**: Make sure the URL in PayMongo matches your ngrok URL exactly
5. **Check webhook secret**: Ensure `PAYMONGO_WEBHOOK_SECRET` is correctly set in your `.env` file

### Invalid webhook signature error

- Make sure `PAYMONGO_WEBHOOK_SECRET` is set correctly
- The secret should start with `whsec_`
- Restart your backend server after updating the `.env` file

### ngrok URL changes every time

This is normal for free accounts. To get a fixed URL:
1. Upgrade to a paid ngrok plan
2. Use ngrok config file to set a custom domain:
   ```bash
   ngrok config edit
   # Add: addr: 3001
   #      domain: your-custom-domain.ngrok.io
   ```

## Production Setup

For production, you should:
1. Deploy your backend to a public server (not localhost)
2. Use a fixed domain name for webhooks
3. Ensure HTTPS is enabled
4. Keep the webhook secret secure (never commit to Git)
5. Monitor webhook delivery logs regularly

## Webhook Endpoint

Your webhook endpoint is available at:
- **Local**: `http://localhost:3001/payment/webhook`
- **ngrok**: `https://your-ngrok-url.ngrok-free.app/payment/webhook`

The endpoint:
- Accepts POST requests from PayMongo
- Verifies webhook signatures for security
- Handles various payment events
- Logs all webhook events for debugging

## Supported Webhook Events

- `checkout_session.payment.paid` - Checkout session payment successful
- `checkout_session.payment.failed` - Checkout session payment failed
- `payment.paid` - Payment completed (for Payment Links/Intents)
- `payment.failed` - Payment failed (for Payment Links/Intents)

You can add more event handlers in `payment.service.ts` in the `handleWebhook` method.
