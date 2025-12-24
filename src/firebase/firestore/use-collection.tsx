'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      segments: string[];
      canonicalString(): string;
      toString(): string;
    };
    collectionGroup: string | null;
  }
}

function getPathFromRef(ref: CollectionReference<DocumentData> | Query<DocumentData>): string {
  const internalQuery = ref as unknown as InternalQuery;

  // Handle collection group queries
  if (internalQuery._query.collectionGroup) {
    return internalQuery._query.collectionGroup;
  }

  // Handle regular collection and query paths
  if (internalQuery._query.path) {
    return internalQuery._query.path.canonicalString();
  }

  return ''; // Fallback for safety, though should not be reached with valid refs
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean; }) | null | undefined, p0: { listen: boolean; },
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // --- SAFETY CHECK ---
    // 1. Get the path from the reference.
    const path = getPathFromRef(memoizedTargetRefOrQuery);
    const isCollectionGroup = !!(memoizedTargetRefOrQuery as unknown as InternalQuery)._query.collectionGroup;

    // 2. Add debug logging to see what path is being subscribed to.
    console.debug(`[useCollection] Subscribing to path: '${path}' (isCollectionGroup: ${isCollectionGroup})`);

    // 3. Validate the path. A valid collection path must have an odd number of segments.
    // An empty path or a path with an even number of segments (like 'users/userId') is invalid for a collection query.
    // This check is bypassed for collection group queries, as their path is just the collection ID (1 segment).
    if (!isCollectionGroup && path.split('/').filter(Boolean).length % 2 !== 1) {
      const devError = new Error(
        `[useCollection] Invalid path for collection query: "${path}". A collection path must have an odd number of segments. You may be passing a document path or an uninitialized dynamic value.`
      );
      setError(devError);
      setData(null);
      setIsLoading(false);
      console.error(devError);
      return; // Stop execution
    }


    setIsLoading(true);
    setError(null);

    const useListen = p0?.listen !== false;

    if (useListen) {
      const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: ResultItemType[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
          setData(results);
          setError(null);
          setIsLoading(false);
          console.debug(`[useCollection] Realtime update from path: '${path}' - Count: ${results.length}`);
        },
        (error: FirestoreError) => {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          })

          setError(contextualError)
          setData(null)
          setIsLoading(false)

          // trigger global error propagation
          errorEmitter.emit('permission-error', contextualError);
        }
      );
      return () => unsubscribe();
    } else {
      // One-time fetch
      const fetchDocs = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(memoizedTargetRefOrQuery);
          const results: ResultItemType[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
          setData(results);
          setError(null);
          setIsLoading(false);
          console.debug(`[useCollection] One-time fetch from path: '${path}' - Count: ${results.length}`);
        } catch (err: any) {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          });
          setError(contextualError);
          setData(null);
          setIsLoading(false);
          errorEmitter.emit('permission-error', contextualError);
        }
      };

      fetchDocs();
      return () => { };
    }
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
