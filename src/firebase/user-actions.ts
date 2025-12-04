
'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  User,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
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
 * @param {'signin' | 'signup'} mode - The mode of operation.
 * @returns {Promise<GoogleSignInResult>} The user credential and a flag for new users.
 */
export async function handleGoogleSignIn(mode: 'signin' | 'signup'): Promise<GoogleSignInResult> {
  const auth = getAuth();
  const firestore = getFirestore();
  const provider = new GoogleAuthProvider();

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let isNewUser = false;
    
    if (!userSnap.exists()) {
      if (mode === 'signin') {
        // User is trying to sign in, but no account exists.
        await auth.signOut(); // Sign them out to prevent being in a weird state
        throw new Error('Account not found. Please sign up first.');
      }

      // This is a new user signing up, generate a custom ID and create the document
      isNewUser = true;
      await runTransaction(firestore, async (transaction) => {
        const counterRef = doc(firestore, 'metadata', 'userCounter');
        const counterSnap = await transaction.get(counterRef);
        
        let lastNumber = 0;
        if (counterSnap.exists()) {
          lastNumber = counterSnap.data().lastUserNumber || 0;
        }
        
        const newNumber = lastNumber + 1;
        const customUserId = `RST-${String(newNumber).padStart(4, '0')}`;

        // Update the counter
        transaction.set(counterRef, { lastUserNumber: newNumber }, { merge: true });

        // Create the new user document
        transaction.set(userRef, {
          uid: user.uid,
          customUserId: customUserId,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isProfileComplete: false, // Explicitly mark profile as incomplete
        });
      });

    } else {
        // Existing user, just update lastLogin and check if they need onboarding
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        if (userSnap.data()?.isProfileComplete === false) {
            isNewUser = true;
        }
    }


    return { userCredential, isNewUser };
  } catch (error: any) {
    // Gracefully handle popup closed by user
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google Sign-In Error:", error);
    }
    // Re-throw the error to be handled by the calling component
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
export async function updateUserProfile(user: User, data: { displayName?: string; phone?: string; address?: string }) {
    const auth = getAuth();
    const firestore = getFirestore();
    const userRef = doc(firestore, 'users', user.uid);

    // Prepare data for Firestore update
    const firestoreData: any = { ...data, updatedAt: serverTimestamp() };
    
    // Check if essential fields are being provided to mark profile as complete
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.data();
    const hasName = !!(data.displayName || existingData?.displayName);
    const hasPhone = !!(data.phone || existingData?.phone);
    const hasAddress = !!(data.address || existingData?.address);

    if (hasName && hasPhone && hasAddress) {
       firestoreData.isProfileComplete = true;
    }


    // Update Firebase Auth profile if displayName is being changed
    if (auth.currentUser && data.displayName && data.displayName !== auth.currentUser.displayName) {
        await updateAuthProfile(auth.currentUser, {
            displayName: data.displayName,
        });
    }

    // Update Firestore document
    await setDoc(userRef, firestoreData, { merge: true });
}
