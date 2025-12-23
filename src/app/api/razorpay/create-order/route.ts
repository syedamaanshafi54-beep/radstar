
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

const admin = getFirebaseAdmin();

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
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 1. Extract Data
    const { amount, receipt, orderPayload } = parsed.data;

    // 2. Save Pending Order to Firestore (Admin SDK)
    // Using Admin SDK syntax: firestore.collection().doc() matches the server environment
    const firestore = admin.firestore();
    const ordersCollection = firestore.collection('users').doc(decodedToken.uid).collection('orders');

    // Create a new document reference with an auto-generated ID
    const newOrderRef = ordersCollection.doc();
    const firestoreOrderId = newOrderRef.id;

    // Prepare the order data with server-side validations/overrides
    const orderData = {
      ...orderPayload,
      id: firestoreOrderId, // Ensure ID matches
      userId: decodedToken.uid,
      status: 'pending_payment',
      paymentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      amount: amount, // Persist the amount we are charging
    };

    await newOrderRef.set(orderData);

    // 3. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: firestoreOrderId, // Link Firestore ID as receipt
      payment_capture: 1
    });

    // 4. Update Firestore with Razorpay Order ID for linkage
    await newOrderRef.update({
      'paymentDetails.razorpayOrderId': razorpayOrder.id
    });

    console.log('Order created in Firestore & Razorpay:', firestoreOrderId, razorpayOrder.id);
    return NextResponse.json(razorpayOrder);

  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
