
'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * The result from handling Google Sign-In.
 * @property userCredential The user credential from the sign-in.
 * @property isNewUser True if the user's profile is new or incomplete.
 */
export type GoogleSignInResult = {
  userCredential: UserCredential;
  isNewUser: boolean;
};


/**
 * Handles the entire Google Sign-In process, including Firestore user creation/update.
 * It now returns an object indicating if the user is new to direct them to onboarding.
 * @returns {Promise<GoogleSignInResult>} The user credential and a flag for new users.
 */
export async function handleGoogleSignIn(): Promise<GoogleSignInResult> {
  const auth = getAuth();
  const firestore = getFirestore();
  const provider = new GoogleAuthProvider();

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let isNewUser = false;

    if (!userSnap.exists() || userSnap.data()?.isProfileComplete === false) {
      isNewUser = true;
      // For a brand new user, create the document with profile incomplete.
      // If it exists but is incomplete, this will merge and update lastLogin.
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
        lastLogin: serverTimestamp(),
        isProfileComplete: false, // Explicitly mark profile as incomplete
      }, { merge: true });
    } else {
      // Existing, complete user: Just update their last login time
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }

    return { userCredential, isNewUser };
  } catch (error: any) {
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google Sign-In Error:", error);
        throw error;
    }
    // If the error is that the user closed the popup, we don't need to do anything.
    // We can just re-throw to allow the caller to handle if needed, but it won't be a breaking error.
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

/**
 * Updates the user's profile in both Firebase Auth and Firestore.
 * @param user The current Firebase user object.
 * @param data The profile data to update.
 */
export async function updateUserProfile(user: User, data: { displayName: string; phone?: string; address?: string }) {
    const auth = getAuth();
    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', user.uid);

    // Update Firebase Auth profile
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
            displayName: data.displayName,
        });
    }

    // Update Firestore document
    await setDoc(userRef, {
        displayName: data.displayName,
        phone: data.phone,
        address: data.address,
        isProfileComplete: true,
    }, { merge: true });
}
