
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Order } from '@/lib/types';

// Helper function to safely initialize and get the admin app
function getAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

  return initializeApp({
    credential: cert(serviceAccount)
  });
}

const toSerializable = (timestamp: any): string | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    // Handle cases where it might already be a string or other primitive
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    // Attempt to convert if it has a toDate method (like a server-side SDK Timestamp)
    if (timestamp && typeof timestamp.toDate === 'function') {
       return timestamp.toDate().toISOString();
    }
    return null;
};


export async function GET() {
  try {
    const firestore = getFirestore(getAdminApp());
    const ordersSnapshot = await firestore.collectionGroup('orders').orderBy('createdAt', 'desc').get();

    if (ordersSnapshot.empty) {
        return NextResponse.json([]);
    }

    const orders = ordersSnapshot.docs.map(doc => {
        const orderData = doc.data() as Order;

        return {
            ...orderData,
            id: doc.id,
            customerName: orderData.shippingInfo?.name || 'Unknown User',
            customerEmail: orderData.shippingInfo?.email || 'No Email',
            createdAt: toSerializable(orderData.createdAt) || new Date(0).toISOString(),
            statusUpdatedAt: toSerializable(orderData.statusUpdatedAt) || new Date(0).toISOString(),
            estDeliveryDate: toSerializable(orderData.estDeliveryDate) || undefined,
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
