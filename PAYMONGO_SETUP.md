# PayMongo Integration Troubleshooting Guide

## Common Errors and Solutions

### Error 404: Failed to load resource
**Cause:** The payment endpoint is not registered or the backend server needs to be restarted.

**Solution:**
1. Make sure the backend server is running:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Verify the PaymentModule is imported in `app.module.ts` (should already be done)

3. Restart the backend server to pick up new routes

### Error 400: Bad Request
**Possible Causes:**

#### 1. PayMongo API Keys Not Configured
**Error Message:** "PayMongo API keys not configured"

**Solution:**
1. Sign up for PayMongo at https://dashboard.paymongo.com/
2. Get your test API keys from the dashboard
3. Create a `.env` file in the `backend` directory:
   ```
   PAYMONGO_SECRET_KEY=sk_test_your_actual_secret_key
   PAYMONGO_PUBLIC_KEY=pk_test_your_actual_public_key
   ```
4. Restart the backend server

#### 2. Validation Errors
**Error Message:** Validation failed for DTO

**Solution:**
- Ensure `amount` is a number greater than 0.01
- Ensure `description` is a string
- `metadata` is optional but should be an object if provided

#### 3. Invalid PayMongo API Response
**Error Message:** "Invalid response from PayMongo API"

**Solution:**
- Check your PayMongo API keys are correct
- Verify you're using test keys for development
- Check PayMongo dashboard for API status

### Error 401: Unauthorized
**Cause:** Missing or invalid authentication token

**Solution:**
- Make sure you're logged in
- Check that the token is being sent in the Authorization header
- Verify the token hasn't expired

## Testing the Integration

1. **Start the backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test the payment flow:**
   - Add items to cart
   - Click "Proceed to Checkout"
   - Payment modal should appear
   - Select payment method and complete payment

## Verify Endpoints

You can test the endpoints using:
- Swagger UI: http://localhost:3001/api-docs
- Or using curl:
  ```bash
  curl -X POST http://localhost:3001/payment/create-intent \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "amount": 100.00,
      "description": "Test payment",
      "metadata": {"itemCount": 1}
    }'
  ```

## Environment Variables

Make sure your `.env` file in the backend directory contains:
```
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
```

**Important:** Never commit your `.env` file to version control!

## Debugging Tips

1. Check backend console logs for detailed error messages
2. Check browser console for frontend errors
3. Verify PayMongo dashboard for payment attempts
4. Use Swagger UI to test endpoints directly
5. Check network tab in browser DevTools for request/response details
