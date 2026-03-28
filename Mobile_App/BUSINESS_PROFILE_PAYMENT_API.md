# Business Profile Payment API Specification

This document summarizes the frontend requirements for the **“Pay to add business profile”** flow so the backend team can implement the missing endpoints. Please keep the payloads consistent with these contracts; the React Native app already relies on them.

---

## Context

1. A user can create **one** business profile for free.
2. When the same user tries to create additional profiles:
   - The app shows a payment modal.
   - On “Pay Now” we must open the Razorpay checkout screen directly (without navigating to the subscription screen).
   - After payment success, the frontend calls a **payment verification endpoint** and only then creates the pending profile via `/api/mobile/business-profile`.

At present, the frontend expects an order-creation endpoint called `/api/mobile/business-profile/create-payment-order`. This API does not exist yet, so Razorpay can’t be opened.

---

## Required Endpoints

### 1. Create Payment Order
- **Method:** `POST`
- **URL:** `/api/mobile/business-profile/create-payment-order`
- **Purpose:** Create a Razorpay order specifically for purchasing an additional business profile.

#### Request Body
```json
{
  "amount": 99,
  "currency": "INR",
  "type": "business_profile"
}
```

Notes:
- `amount` – integer (₹) or optional; backend can default to configured price. Frontend currently assumes ₹99 but can accept whatever amount backend returns.
- `currency` – optional, default `INR`.
- `type` – optional but helps distinguish from subscription orders.
- User identity should be inferred from the authenticated request (JWT). No need to pass `userId` from the app.

#### Success Response
```json
{
  "success": true,
  "data": {
    "orderId": "order_NZ8F93s7XXXXXX",
     "amount": 99,
     "amountInPaise": 9900,
    "currency": "INR",
    "razorpayKey": "rzp_live_xxxxxxx",
    "expiresAt": "2025-01-01T10:00:00.000Z",
    "metadata": {
      "type": "business_profile",
      "userId": "cm12..."
    }
  }
}
```

Frontend fields:
- `orderId` (mandatory) → passed to Razorpay SDK.
- `amountInPaise` (preferred) → used directly. If missing, the app multiplies `amount * 100`.
- `currency`
- `razorpayKey` → overrides default `RAZORPAY_KEY_ID` from `.env`.
- Other fields are optional but useful for debugging/expiry.

#### Error Response
```json
{
  "success": false,
  "error": "Unable to create payment order",
  "code": "PAYMENT_ORDER_FAILED"
}
```

Return `4xx` for validation issues, `5xx` otherwise.

---

### 2. Verify Payment

Already implemented: `/api/mobile/business-profile/verify-payment`

Current frontend payload:
```json
{
  "orderId": "...",
  "paymentId": "...",
  "signature": "...",
  "amount": 99,
  "amountPaise": 9900,
  "currency": "INR",
  "type": "business_profile"
}
```

Please ensure the response structure is:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "transactionId": "...",
    "message": "Payment verified"
  }
}
```
If verification fails, respond with `success: false` and a descriptive `error`.

---

### 3. Payment Status (already consumed)

Frontend calls `/api/mobile/business-profile/payment-status` to check whether the user has already paid for an additional profile. Please confirm that this endpoint returns:

```json
{
  "success": true,
  "data": {
    "hasPaid": true,
    "message": "Valid payment found",
    "expiresAt": "2025-01-01T10:00:00.000Z",
    "lastPayment": {
      "orderId": "...",
      "paymentId": "...",
      "amount": 99,
      "createdAt": "..."
    }
  }
}
```

If no payment exists, return `hasPaid: false`. HTTP `404` can also indicate “no payment found”, but the frontend expects `200` with `hasPaid: false` going forward.

---

## Frontend Flow Summary

1. User fills business profile form and taps “Save Changes”.
2. If they already created one profile, the app stores the form data in AsyncStorage and shows the payment modal.
3. On “Pay Now”:
   1. Call **`POST /api/mobile/business-profile/create-payment-order`**.
   2. Open Razorpay using the returned `orderId` and `razorpayKey`.
4. Razorpay success → call **`POST /api/mobile/business-profile/verify-payment`** with the Razorpay response.
5. After verification succeeds, the app calls **`POST /api/mobile/business-profile`** with the stored form data.

Any 4xx/5xx at step 3 should be sent back so the app can show an error and allow the user to retry.

---

## Additional Recommendations
- Use a dedicated Razorpay receipt prefix, e.g., `BPAY_{userId}_{timestamp}`, to trace business profile payments.
- Store payment intent metadata in your DB so `/payment-status` can return the latest unpaid/pending payment.
- Consider expiring unpaid orders after ~10 minutes and letting the frontend request a new order if Razorpay is closed.
R
Please let me know once the order endpoint is live or if you plan to use a different route name; I’ll update the app accordingly. Cheers!

