'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Handles the entire Google Sign-In process, including Firestore user creation/update.
 * @returns {Promise<UserCredential>} The user credential from the sign-in.
 */
export async function handleGoogleSignIn(): Promise<UserCredential> {
  const auth = getAuth();
  const firestore = getFirestore();
  const provider = new GoogleAuthProvider();

  try {
    // 1. Set session persistence to local
    await setPersistence(auth, browserLocalPersistence);

    // 2. Initiate Google Sign-In
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // 3. Sync user data with Firestore
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 3a. User is new: Create a new document
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      // 3b. User exists: Update their last login time
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }

    return userCredential;
  } catch (error) {
    // Re-throw the error to be caught by the calling component
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

/**
 * Retrieves the user's name from a User object.
 * @param user The Firebase User object.
 * @returns {string} The first name of the user or 'there'.
 */
export function getFirstName(user: User | null): string {
    if (!user || !user.displayName) {
        return 'there';
    }
    return user.displayName.split(' ')[0];
}
