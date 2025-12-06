'use server';
import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This is a singleton pattern to ensure we only initialize the app once.
let adminApp: App;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  
  // App Hosting provides the config via environment variables.
  // No need to manage service account keys.
  adminApp = initializeApp();
  return adminApp;
}

export function getAdminAuth() {
    return getAuth(getAdminApp());
}

export function getAdminFirestore() {
    return getFirestore(getAdminApp());
}
