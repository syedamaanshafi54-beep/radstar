
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

    // --- SECURE ORDER UPDATE & STOCK REDUCTION (Admin SDK) ---
    const orderRef = firestore.collection('users').doc(decodedToken.uid).collection('orders').doc(firestoreOrderId);

    await firestore.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error('Order not found.');
      }

      const currentOrderData = orderDoc.data();
      if (!currentOrderData) throw new Error("Order data is missing");

      // Verify stock availability and prepare updates
      const items = currentOrderData.items;
      for (const item of items) {
        const productRef = firestore.collection('products').doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product ${item.productId} not found.`); // Or handle gracefully
        }

        const productData = productDoc.data();
        if (!productData) throw new Error(`Product data missing for ${item.productId}`);

        // Handle Variant Stock
        if (item.variantName && productData.variants) {
          const variantIndex = productData.variants.findIndex((v: any) => v.name === item.variantName);
          if (variantIndex > -1) {
            const currentStock = productData.variants[variantIndex].stock;
            if (typeof currentStock !== 'number') {
              // If stock is not tracked for this variant, we can skip or assume unlimited.
              // For now, let's assume if it exists, strict tracking. If undefined, ignore.
            } else if (currentStock < item.qty) {
              throw new Error(`Insufficient stock for ${item.name} (${item.variantName}). Available: ${currentStock}`);
            } else {
              // Update variant stock in the variants array
              // Note: Updating a specific array element in Firestore is tricky without reading/writing the whole array.
              // Since we are in a transaction, reading and writing the whole 'variants' field is safe.
              const newVariants = [...productData.variants];
              newVariants[variantIndex] = {
                ...newVariants[variantIndex],
                stock: currentStock - item.qty
              };
              transaction.update(productRef, { variants: newVariants });
            }
          }
        }
        // Handle Main Product Stock (Simple Products) for products without variants or if variant tracking fails
        else {
          const currentStock = productData.stock;
          if (typeof currentStock === 'number') {
            if (currentStock < item.qty) {
              throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
            }
            transaction.update(productRef, { stock: currentStock - item.qty });
          }
        }
      }

      // Update Order Status
      transaction.update(orderRef, {
        paymentDetails: {
          ...currentOrderData.paymentDetails,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        },
        status: 'placed',
        paymentStatus: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log('Payment verified, stock updated, and order confirmed on server:', firestoreOrderId);
    return NextResponse.json({ success: true, message: "Payment verified successfully!", orderId: firestoreOrderId });

  } catch (error: any) {
    let errorMessage = error.message || 'Internal Server Error';
    console.error(`verify-payment failed: ${errorMessage}`);

    // If stock check failed, we should probably void/refund the payment or alert admin manually, 
    // but for now, we return a 400 so the UI knows.
    // In a real prod scenario, you might want to accept the payment and trigger a "backorder" status 
    // instead of failing the whole verification if money is already deducted. 
    // However, since we verify *before* fulfilling, failing here is safer for inventory integrity.

    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
