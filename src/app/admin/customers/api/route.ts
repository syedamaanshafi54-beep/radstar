
import { NextResponse } from 'next/server';
import { initializeApp, getApp, deleteApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { UserProfile } from '@/lib/types';

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
  const appName = `admin-customers-api-${Date.now()}`;
  let adminApp: App;

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    }, appName);

    const firestore = getFirestore(adminApp);
    const usersSnapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get();

    if (usersSnapshot.empty) {
        await deleteApp(adminApp);
        return NextResponse.json([]);
    }

    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data() as UserProfile;
      
      return {
          ...userData,
          id: doc.id,
          createdAt: toSerializable(userData.createdAt) || new Date(0).toISOString(),
          lastLogin: toSerializable(userData.lastLogin) || new Date(0).toISOString(),
          updatedAt: toSerializable(userData.updatedAt) || undefined,
      };
    });

    await deleteApp(adminApp);
    return NextResponse.json(users);

  } catch (error: any) {
     if (adminApp!) {
        await deleteApp(adminApp);
    }
    console.error('Error fetching customers:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch customers', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
