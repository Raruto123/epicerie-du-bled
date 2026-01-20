import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useRef } from "react";
import { db } from "../lib/firebase";

/**
 * Toggle favorite:
 * - if already in favorites => remove
 * - else => add full product snapshot
 *
 * Stores in: users/{uid}.favorites.{productId} = { ...product, id, favAt }
 */
export async function toggleFavoriteProduct({ uid, product }) {
  if (!uid) throw new Error("Missing uid");
  if (!product?.id) throw new Error("Missing product.id");

  const userRef = doc(db, "users", uid);

  //check if already favorited
  const snap = await getDoc(userRef);
  const data = snap.data() || {};
  const favorites = data.favorites || {};
  const exists = !!favorites[product.id];

  if (exists) {
    //remove favorite
    await updateDoc(userRef, {
      [`favorites.${product.id}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    return { isFav: false };
  } else {
    // add favorite (store full snapshot)
    const payload = {
      ...product,
      id: product.id,
      favAt: Date.now(),
    };

    await updateDoc(userRef, {
      [`favorites.${product.id}`]: payload,
      updatedAt: serverTimestamp(),
    });
    return { isFav: true };
  }
}

/**
 * Real-time favorites listener for a user:
 * cb({ favoritesArray, favIdsSet })
 * Returns unsubscribe()
 */
export function subscribeUserFavorites({ uid, cb }) {
  if (!uid) return () => {};

  const userRef = doc(db, "users", uid);

  const unsub = onSnapshot(
    userRef,
    (snap) => {
      const data = snap.data() || {};
      const favMap = data.favorites || {};
      const favoritesArray = Object.values(favMap);

      const favIdsSet = new Set(favoritesArray.map((p) => p?.id).filter(Boolean));
      cb?.({ favoritesArray, favIdsSet });
    },
    (err) => {
      console.log("❌ subscribeUserFavorites error :", err?.message ?? err);
      cb?.({ favoritesArray: [], favIdsSet: new Set() });
    },
  );
  return unsub;
}
