'use client';
import { useFirebase } from '@/firebase/provider';
import { UserHookResult } from '@/firebase/provider';

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, claims, isUserLoading, userError } = useFirebase();
  return { user, claims, isUserLoading, userError };
};
