"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePantryStore } from "@/store/pantry";
import type { DetectedIngredient } from "@/types";

/**
 * Keeps the local pantry (Zustand + localStorage) in sync with Firestore so the
 * Dispensa is shared across devices. The pantry lives as a `pantry` array on the
 * user document (users/{uid}), already covered by the existing security rules.
 *
 * - Firestore is the source of truth: remote changes replace the local store.
 * - Local changes are debounced and written back.
 * - `lastSyncedRef` + `applyingRemoteRef` prevent write/snapshot echo loops.
 */
export function PantrySync() {
  const { user, loading } = useAuth();
  const lastSyncedRef = useRef<string | null>(null);
  const applyingRemoteRef = useRef(false);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Definitive logout → clear local pantry to avoid cross-account leak.
    if (!loading && !user) {
      lastSyncedRef.current = null;
      usePantryStore.getState().setItems([]);
      return;
    }
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    // 1. Subscribe to remote changes.
    const unsub = onSnapshot(ref, (snap) => {
      const remote = snap.data()?.pantry as DetectedIngredient[] | undefined;

      if (Array.isArray(remote)) {
        const json = JSON.stringify(remote);
        if (json !== lastSyncedRef.current) {
          lastSyncedRef.current = json;
          applyingRemoteRef.current = true;
          usePantryStore.getState().setItems(remote);
          applyingRemoteRef.current = false;
        }
      } else {
        // No pantry on the server yet → seed it with whatever we have locally.
        const local = usePantryStore.getState().items;
        lastSyncedRef.current = JSON.stringify(local);
        void setDoc(ref, { pantry: local }, { merge: true }).catch(() => {});
      }
    });

    // 2. Push local changes up (debounced).
    const unsubStore = usePantryStore.subscribe((state) => {
      if (applyingRemoteRef.current) return;
      const json = JSON.stringify(state.items);
      if (json === lastSyncedRef.current) return;

      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      writeTimerRef.current = setTimeout(() => {
        lastSyncedRef.current = json;
        void setDoc(ref, { pantry: state.items }, { merge: true }).catch(() => {});
      }, 700);
    });

    return () => {
      unsub();
      unsubStore();
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [user, loading]);

  return null;
}
