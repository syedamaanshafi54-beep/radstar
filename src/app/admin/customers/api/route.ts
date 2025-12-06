
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UserProfile } from '@/lib/types';

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

export async function GET() {
  try {
    const firestore = getFirestore(getAdminApp());
    const usersSnapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get();

    if (usersSnapshot.empty) {
        return NextResponse.json([]);
    }

    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data() as UserProfile;
      // Convert Firestore Timestamps to serializable strings
      const createdAt = (userData.createdAt as any)?.toDate ? (userData.createdAt as any).toDate().toISOString() : new Date().toISOString();
      const lastLogin = (userData.lastLogin as any)?.toDate ? (userData.lastLogin as any).toDate().toISOString() : new Date().toISOString();
      const updatedAt = (userData.updatedAt as any)?.toDate ? (userData.updatedAt as any)?.toDate().toISOString() : undefined;

      return {
          ...userData,
          id: doc.id, // ensure id is present
          createdAt,
          lastLogin,
          updatedAt,
      };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch customers', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
