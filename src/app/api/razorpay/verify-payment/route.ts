
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
  firestoreOrderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (authError: any) {
      console.error('Verify-payment auth failed:', authError.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { firestoreOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

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

    // --- SECURE ORDER UPDATE (Admin SDK) ---
    const orderRef = firestore.collection('users').doc(decodedToken.uid).collection('orders').doc(firestoreOrderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error(`Order ${firestoreOrderId} not found for user ${decodedToken.uid}`);
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const currentOrderData = orderDoc.data()!;

    await orderRef.update({
      paymentDetails: {
        ...currentOrderData.paymentDetails,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      },
      status: 'placed',
      paymentStatus: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Payment verified and order confirmed on server:', firestoreOrderId);
    return NextResponse.json({ success: true, message: "Payment verified successfully!", orderId: firestoreOrderId });

  } catch (error: any) {
    let errorMessage = error.message || 'Internal Server Error';
    console.error(`verify-payment failed: ${errorMessage}`);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
