
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/firebase/firebase-admin';


export const runtime = 'nodejs';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay secrets are not configured in environment variables.');
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Firebase Admin SDK
const admin = getFirebaseAdmin();
const firestore = admin.firestore();

const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive.'),
  receipt: z.string().min(1, 'Receipt is required.'),
  orderPayload: z.any(), // Accepting full order details to persist state
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
    } catch (error: any) {
      console.error('Token verification failed:', error.code, error.message);
      return NextResponse.json({ success: false, error: `Unauthorized: Invalid token. (Reason: ${error.code})` }, { status: 401 });
    }

    if (!decodedToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const { amount, receipt, orderPayload } = parsed.data;

    // 1. Save Pending Order to Firestore (Admin SDK)
    const ordersCollection = firestore.collection('users').doc(decodedToken.uid).collection('orders');
    const newOrderRef = ordersCollection.doc();
    const firestoreOrderId = newOrderRef.id;

    const orderData = {
      ...orderPayload,
      id: firestoreOrderId,
      userId: decodedToken.uid,
      status: 'pending_payment',
      paymentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      amount: amount,
    };

    await newOrderRef.set(orderData);

    // 2. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: firestoreOrderId,
      payment_capture: 1
    });

    // 3. Link Razorpay ID
    await newOrderRef.update({
      'paymentDetails.razorpayOrderId': razorpayOrder.id
    });

    console.log('Order created in Firestore & Razorpay:', firestoreOrderId, razorpayOrder.id);
    return NextResponse.json({
      ...razorpayOrder,
      firestoreOrderId: firestoreOrderId
    });

  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
