
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  collectionGroup,
  query,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from '@/firebase/provider';

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
  forceRefetch: () => void; // Function to manually trigger a refetch.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, and forceRefetch.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | (CollectionReference<DocumentData> | Query<DocumentData>)
    | null
    | undefined
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const forceRefetch = useCallback(() => {
    setRefetchKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (isCancelled) return;

        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));

        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        if (isCancelled) return;

        if (error.code === 'permission-denied') {
          const path =
            (memoizedTargetRefOrQuery as any)?.path ??
            (memoizedTargetRefOrQuery as any)?._query?.path?.canonicalString?.() ??
            'unknown-path';
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          });
          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.error('Firestore error in useCollection:', error);
          setError(error);
        }

        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery, refetchKey]);

  return { data, isLoading, error, forceRefetch };
}


/**
 * React hook to subscribe to a Firestore collection group in real-time.
 * This hook is a wrapper around `useCollection` that uses `collectionGroup`.
 * 
 * IMPORTANT! Memoize the dependencies (`firestore`, `collectionId`, `queryConstraints`)
 * to prevent re-renders and infinite loops.
 * 
 * @template T Type of the document data.
 * @param firestore The Firestore instance.
 * @param collectionId The ID of the collection group to query.
 * @param queryConstraints Optional query constraints (where, orderBy, limit).
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollectionGroup<T = any>(
  firestore: import('firebase/firestore').Firestore | null | undefined,
  collectionId: string,
  ...queryConstraints: any[] // e.g., where(), orderBy()
): UseCollectionResult<T> {
  const memoizedQuery = useMemoFirebase(() => {
    if (!firestore || !collectionId) return null;
    const group = collectionGroup(firestore, collectionId);
    return query(group, ...queryConstraints);
  }, [firestore, collectionId, ...queryConstraints]);

  return useCollection<T>(memoizedQuery);
}
