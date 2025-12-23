
import * as admin from 'firebase-admin';

// Ensure the project ID is loaded from environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('FIREBASE_PROJECT_ID environment variable is not set.');
}

/**
 * Returns the initialized Firebase Admin SDK instance.
 * Ensures the SDK is initialized only once and with the correct project ID.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    // In production environments (like Cloud Run, Vercel), GOOGLE_APPLICATION_CREDENTIALS
    // will be set automatically. In a local or containerized dev environment,
    // this might not be the case.
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId: projectId,
      });
      console.log('Firebase Admin SDK initialized with explicit credentials for project:', projectId);
    } else {
      // Fallback to Google Application Default Credentials
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV === 'production') {
        console.warn(
          'WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. ' +
          'Firebase Admin SDK may fail to initialize in a production environment.'
        );
      }
      admin.initializeApp({
        projectId: projectId,
      });
      console.log('Firebase Admin SDK initialized with default credentials for project:', projectId);
    }
  }

  return admin;
}
