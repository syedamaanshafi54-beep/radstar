
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/firebase-admin';
import crypto from 'crypto';
import { z } from 'zod';

export const runtime = 'nodejs';

// Initialize Firebase Admin SDK
const admin = getFirebaseAdmin();
const firestore = admin.firestore();

// Define the schema for the request body
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get('authorization');

    // NOTE: In an ideal world we would verify the token here too.
    // However, since the user is in the checkout flow, we can use their token to verify ownership.
    // Ideally this is called client-side, so headers are present.
    // If we wanted a webhook, we'd not have headers, but this is an API route for the client.

    // Actually, let's keep it simple: If called from client, we trust the signature + database link.
    // We do need to find WHICH user this order belongs to if we don't have the UID in the payload.
    // BUT, we stored the userId in the order document itself.
    // We can query collectionGroup OR since we are authenticated, we can search under the user's collection.

    // Let's assume the client sends the Auth header (Next.js automatically does? No, page.tsx does fetch).
    // Wait, page.tsx fetch call to verify-payment currently DOES NOT include Authorization header.
    // I should add it, OR use collectionGroup query (Admin SDK allows this).

    // Let's try to verify signature first, then find the order.

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request body.', details: parsed.error.format() }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // --- RAZORPAY SIGNATURE VERIFICATION ---
    const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(`Invalid signature for order attempt. OrderID: ${razorpay_order_id}`);
      return NextResponse.json({ success: false, message: "Payment verification failed: Invalid signature." }, { status: 400 });
    }

    // --- FIND ORDER IN FIRESTORE ---
    // We need to find the order that has this razorpay_order_id. A collection group query is perfect here.
    const ordersQuery = await firestore.collectionGroup('orders')
      .where('paymentDetails.razorpayOrderId', '==', razorpay_order_id)
      .limit(1)
      .get();

    if (ordersQuery.empty) {
      return NextResponse.json({ success: false, error: 'Order not found for this payment.' }, { status: 404 });
    }

    const orderDoc = ordersQuery.docs[0];
    const currentOrderData = orderDoc.data();

    // --- UPDATE ORDER STATUS ---
    await orderDoc.ref.update({
      paymentDetails: {
        ...currentOrderData.paymentDetails,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      },
      status: 'placed', // or 'confirmed'
      paymentStatus: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Payment verified and order updated:', orderDoc.id);
    return NextResponse.json({ success: true, message: "Payment verified successfully!", orderId: orderDoc.id });

  } catch (error: any) {
    let errorMessage = error.message || 'Internal Server Error';
    console.error(`verify-payment failed: ${errorMessage}`);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
