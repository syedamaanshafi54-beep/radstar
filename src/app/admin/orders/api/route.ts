
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Order } from '@/lib/types';

// Helper function to safely initialize and get the admin app
function getAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function GET() {
  try {
    const firestore = getFirestore(getAdminApp());
    const ordersSnapshot = await firestore.collectionGroup('orders').orderBy('createdAt', 'desc').get();

    if (ordersSnapshot.empty) {
        return NextResponse.json([]);
    }

    const orders = ordersSnapshot.docs.map(doc => {
        const orderData = doc.data() as Order;
        // Convert Firestore Timestamps to serializable strings
        const createdAt = (orderData.createdAt as any)?.toDate ? (orderData.createdAt as any).toDate().toISOString() : new Date().toISOString();
        const statusUpdatedAt = (orderData.statusUpdatedAt as any)?.toDate ? (orderData.statusUpdatedAt as any).toDate().toISOString() : new Date().toISOString();

        return {
            ...orderData,
            id: doc.id,
            customerName: orderData.shippingInfo?.name || 'Unknown User',
            customerEmail: orderData.shippingInfo?.email || 'No Email',
            createdAt,
            statusUpdatedAt,
        };
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch orders', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
