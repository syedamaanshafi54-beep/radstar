
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
      
      const toSerializable = (timestamp: any): string | null => {
        if (timestamp instanceof Timestamp) {
          return timestamp.toDate().toISOString();
        }
        if (timestamp && typeof timestamp.toDate === 'function') {
           return timestamp.toDate().toISOString();
        }
        return null;
      };

      return {
          ...userData,
          id: doc.id,
          createdAt: toSerializable(userData.createdAt) || new Date().toISOString(),
          lastLogin: toSerializable(userData.lastLogin) || new Date().toISOString(),
          updatedAt: toSerializable(userData.updatedAt) || undefined,
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
