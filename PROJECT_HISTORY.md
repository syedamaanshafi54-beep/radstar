# Project History & Knowledge Transfer

This document provides a comprehensive history of the Asli Talbina e-commerce application's development, outlining major architectural changes, user requests, and the reasoning behind key decisions.

## 1. Initial State: Next.js + Firebase Cloud Functions

The project began as a standard Next.js application with the following architecture:

- **Frontend:** Next.js with React and ShadCN UI components.
- **Backend Logic:** Firebase Cloud Functions (`functions/src/index.ts`).
- **Database & Auth:** Firebase Firestore and Authentication.
- **Payment Gateway:** A placeholder mock function (`mockPaymentVerificationService`) was used in the Cloud Functions to simulate payment verification. There was no real payment integration.

## 2. Iteration 1: Attempted PhonePe Integration (and Failures)

This phase was marked by incorrect implementations and critical user corrections.

- **User Request:** Integrate PhonePe for payments, providing API keys in the `.env` file.
- **First Action (Incorrect):** An incorrect attempt was made to implement PhonePe by modifying the Cloud Function. The wrong API endpoints were used, and the `axios` implementation was flawed.
- **User Correction 1:** The user expressed frustration, provided the correct PhonePe sandbox API documentation, and specified the exact endpoints and header requirements (`X-VERIFY`).
- **Second Action (Corrected by User):** The user provided the exact, correctly structured TypeScript code for the PhonePe verification function.
- **Final Action:** The user-provided code was adopted, replacing the faulty implementation in `functions/src/index.ts`. This version used `axios` and correctly calculated the SHA256 hash for the `X-VERIFY` header.

At the end of this phase, the app had a partially working, but unstable, PhonePe integration running on Firebase Cloud Functions.

## 3. Iteration 2: Migration from Firebase Functions to a Manual Express Server

This was the most significant architectural pivot, driven by instability and development friction with Cloud Functions.

- **User Mandate:** The user reported numerous issues with Cloud Functions (instability, emulator problems, billing) and ordered a full migration of all payment logic to a manual Express server located in the `server/` directory.
- **Strict Requirements:**
    - **Remove Firebase Functions for payments entirely.**
    - **Make Razorpay the sole payment gateway (removing PhonePe).**
    - The Express server must become the single source of truth for payment processing.
    - The frontend must be updated to call the Express server instead of Firebase Functions.
    - Security was paramount: The server must handle secrets, and user identity must be verified.

#### Migration Sub-Steps:

1.  **Initial Express Implementation (Flawed):** The first attempt at migration involved setting up `create-order` and `verify-payment` endpoints on the Express server. However, it insecurely trusted the `userId` sent from the client and had CORS issues, leading to `net::ERR_BLOCKED_BY_CLIENT` errors.

2.  **User Correction 2 (Security Hardening):** The user mandated a more secure, production-ready architecture. The key requirements were:
    - **Implement Firebase ID Token Verification:** The Express server must use middleware to verify a Firebase ID token sent from the client in the `Authorization` header.
    - **Remove Client-Side `userId` Trust:** The server must extract the `uid` from the verified token and use that for all Firestore operations, never trusting a `userId` from the request body.
    - **Server-Side Authority:** The Express server must be the sole authority for updating an order's payment status in Firestore after successful verification.

3.  **Final, Correct Implementation:**
    - **`package.json`:** The `razorpay` dependency was correctly moved to the `server/package.json` file. All payment-related dependencies were removed from `functions/package.json`.
    - **`server/index.ts`:**
        - Implemented a `verifyFirebaseToken` middleware to protect payment endpoints.
        - The `create-order` endpoint was updated to use the `uid` from the verified token.
        - The `verify-payment` endpoint was implemented to securely verify the Razorpay signature and then update the order status in Firestore using the verified `uid`.
    - **`src/app/(app)/checkout/page.tsx`:**
        - All `httpsCallable` functions were removed.
        - The checkout flow was rewritten to use `fetch`.
        - It now gets the user's ID token (`user.getIdToken()`) and includes it in the `Authorization` header for all requests to the Express server.
    - **`functions/` directory:** All payment-related code was scrubbed from `functions/src/index.ts`, and its `package.json` was cleaned of related dependencies, effectively decommissioning it for payment processing.

## 4. Final Architecture (Current State)

- **Frontend (`src/app`):** A Next.js application that handles all UI. For payments, it communicates directly and securely with the Express server.
- **Backend (`server/`):** An Express.js server responsible exclusively for payment processing with Razorpay. It is the only part of the system with access to the Razorpay secret key. It verifies user identity via Firebase ID tokens before processing requests.
- **Firebase:** Provides two core services:
    - **Authentication:** To sign in users and issue ID tokens.
    - **Firestore:** To store application data like users and orders.
- **Firebase Cloud Functions (`functions/`):** No longer used for any payment-related logic. They are effectively disabled for the core application flow but remain for other potential uses.