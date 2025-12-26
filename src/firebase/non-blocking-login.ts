
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  return createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  return signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
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

import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

/**
 * Initiates phone number sign-in by sending an OTP.
 * @param authInstance The Firebase Auth instance.
 * @param phoneNumber The phone number to verify (e.g., "+919876543210").
 * @param appVerifier The RecaptchaVerifier instance.
 * @returns Promise<ConfirmationResult> The confirmation result object to use for OTP verification.
 */
export async function initiatePhoneSignIn(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(authInstance, phoneNumber, appVerifier);
}

