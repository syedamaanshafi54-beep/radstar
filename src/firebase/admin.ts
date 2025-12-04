
import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization errors
if (!admin.apps.length) {
  // When running in a Google Cloud environment like App Hosting,
  // the SDK automatically discovers the service account credentials.
  admin.initializeApp();
}

const getAdminApp = () => {
    return admin.app();
};

const getAdminAuth = () => {
    return admin.auth();
};

export { getAdminApp, getAdminAuth };
