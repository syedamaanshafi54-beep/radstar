
import { NextResponse } from 'next/server';
import { initializeApp, getApp, deleteApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Order } from '@/lib/types';

const toSerializable = (timestamp: any): string | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
       return timestamp.toDate().toISOString();
    }
    return null;
};


export async function GET() {
  const appName = `admin-orders-api-${Date.now()}`;
  let adminApp: App;

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    }, appName);

    const firestore = getFirestore(adminApp);
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
    
    await deleteApp(adminApp);
    return NextResponse.json(orders);

  } catch (error: any) {
    if (adminApp!) {
        await deleteApp(adminApp);
    }
    console.error('Error fetching orders:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch orders', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
