
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  UserCredential,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password).catch(error => {
    if (error.code === 'auth/operation-not-allowed') {
      console.error(
        'Email/Password sign-in is not enabled in the Firebase console. Please enable it to use this feature.'
      );
    } else {
      // Re-throw other errors to be handled by global error handlers or other catch blocks.
      throw error;
    }
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate Google sign-in with a popup (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Call signInWithPopup directly. It returns a promise we can use for success/error handling.
  return signInWithPopup(authInstance, provider).catch((error) => {
    // We will now let the caller handle the error messages for a better user experience.
    // The specific error codes will be checked in the UI components (login/signup pages).
    throw error;
  });
}

/**
 * Sets the session persistence for Firebase Auth.
 * @param authInstance The Firebase Auth instance.
 * @param rememberMe If true, uses local persistence. Otherwise, uses session persistence.
 */
export async function setSessionPersistence(authInstance: Auth, rememberMe?: boolean) {
  const persistence = rememberMe
    ? browserLocalPersistence
    : browserSessionPersistence;
  await setPersistence(authInstance, persistence);
}

/**
 * Sends a password reset email.
 * This function can be awaited as it's typically used in a dedicated 'Forgot Password' flow.
 * @param authInstance The Firebase Auth instance.
 * @param email The user's email address.
 */
export async function sendPasswordReset(authInstance: Auth, email: string) {
    return sendPasswordResetEmail(authInstance, email);
}
