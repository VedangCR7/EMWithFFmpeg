# Mobile App: Razorpay Autopay Integration & Testing Guide

This guide is for the Mobile App development team to ensure seamless integration with the Backend's Razorpay Autopay (recurring subscriptions) implementation.

---

## 🏗️ 1. The Core Architecture Flow

The backend handles all heavy lifting (creating plans, maintaining transaction records, listening to webhooks). The mobile app's responsibility is simplified to three main steps:

1.  **Initiate**: Call the backend API to get the Razorpay checkout link.
2.  **Transact**: Open the checkout link in an in-app browser or web view.
3.  **Verify & Refresh**: Once the payment is completed in the web view, refresh the user's profile data to get the updated `isActive` status.

---

## 📡 2. API Integration Points

### Step 1: Create Subscription
When the user clicks "Subscribe" on a plan (e.g., Monthly VIP):
*   **Endpoint:** `POST /api/mobile/subscription/create-autopay`
*   **Action:** The backend will return a Razorpay `short_url` (along with a `subscription_id`).
*   **Mobile App Duty:** Open this `short_url` in an in-app browser component (like `react-native-webview`).

### Step 2: User Validation (The Success State)
Once the user completes the payment in the WebView and closes it:
*   **Endpoint:** `GET /api/mobile/auth/profile`
*   **Action:** Immediately call your profile endpoint to fetch the user's latest data.
*   **Mobile App Duty:** Check the `isActive` boolean flag in the user object.
    *   If `isActive === true`: Grant premium access. Hide the "Subscribe" prompts.
    *   If `isActive === false`: Show a "Payment Pending/Processing" message (webhooks can sometimes take 5-10 seconds to hit the backend).

> [!IMPORTANT]
> The Mobile App MUST rely on `user.isActive` as the absolute source of truth for unlocking premium features (like downloading un-watermarked posters). Do not rely solely on the WebView returning a success callback, as the backend needs the webhook to sync the database.

---

## 🧪 3. Mandatory Mobile App Test Cases (Checklist)

The mobile team MUST execute and pass the following tests to guarantee the user does not get stuck in a "Paid but Inactive" state.

### Test Case 1: The Initial Subscription (Happy Path)
- [ ] Log in as a completely new, free user (`isActive` is currently `false`).
- [ ] Select an Autopay plan and generate the checkout link.
- [ ] Complete the test payment using Razorpay's Test UPI or Test Card.
- [ ] **Assertion 1**: When the WebView closes, the app automatically fetches the latest user profile.
- [ ] **Assertion 2**: The app's state updates immediately if `isActive` comes back as `true`.
- [ ] **Assertion 3**: All premium features are instantly unlocked without requiring a hard restart of the app.

### Test Case 2: The "Background Completion" Scenario
- [ ] Initiate the payment flow in the app.
- [ ] While on the Razorpay authorization screen (entering OTP), force-close the mobile app.
- [ ] Complete the authorization on a separate device/browser using the same link (simulating a delayed approval).
- [ ] Re-open the mobile app.
- [ ] **Assertion**: The app fetches the user profile on launch, sees `isActive: true` (because the backend webhook processed the background success), and grants premium access immediately.

### Test Case 3: Cancellation Simulation
- [ ] Have an active subscriber.
- [ ] Ask the backend team to manually trigger a `subscription.cancelled` webhook for this user.
- [ ] Refresh the app.
- [ ] **Assertion 1**: The app profile fetch returns `isActive: false`.
- [ ] **Assertion 2**: Premium features are immediately locked, and the "Subscribe" UI reappears.
- [ ] **Assertion 3**: (Crucial) The user is **not logged out**. They should still be able to use the free features of the app.

### Test Case 4: Login as Inactive User
- [ ] Pick a user whose subscription has expired or been cancelled.
- [ ] Log out of the app.
- [ ] Attempt to log back in using their credentials.
- [ ] **Assertion**: The login is successful. The app does not show an "Account Inactive" block, but rather lands them on the home screen with "Subscribe" prompts visible.

---

## 🛠️ Common Pitfalls to Avoid

1.  **Trusting the Frontend Callback:** Do NOT upgrade the user locally just because Razorpay's javascript says "Success". Only upgrade the UI state when `GET /api/mobile/auth/profile` returns `isActive: true`.
2.  **Stale Caching:** Ensure that whatever state management you use (Redux, Context, Zustand) instantly updates the `isActive` variable application-wide after a successful payment or profile refresh.
3.  **Polling Aggressively:** If the payment succeeds but `isActive` is still false, implement a gentle retry (e.g., fetch profile 3 times, waiting 3 seconds between each) to allow the backend webhook to finish processing.
