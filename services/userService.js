import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
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

      const favIdsSet = new Set(
        favoritesArray.map((p) => p?.id).filter(Boolean),
      );
      cb?.({ favoritesArray, favIdsSet });
    },
    (err) => {
      console.log("❌ subscribeUserFavorites error :", err?.message ?? err);
      cb?.({ favoritesArray: [], favIdsSet: new Set() });
    },
  );
  return unsub;
}

function distanceKmBetween(a, b) {
  if (!a || !b) return null;
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const aa = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return Number((R * c).toFixed(2));
}

export async function fetchGroceriesList({
  pageSize = 50,
  userLocation = null,
} = {}) {
  const colRef = collection(db, "users");

  //taking only sellers
  const q = query(
    colRef,
    where("isSeller", "==", true),
    orderBy("updatedAt", "desc"),
    limit(pageSize),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const u = d.data() || {};
    const seller = u.seller || {};
    const gps = seller.gps ?? null;

    const distanceKm =
      userLocation && gps ? distanceKmBetween(userLocation, gps) : null;
    return {
      id: d.id,
      name: seller.storeName ?? u.name ?? "Épicerie",
      address:
        seller.addressText ?? u?.lastAddress?.formatted ?? "Adresse inconnue",
      photoURL: seller.logoURL ?? null,
      gps,
      distanceKm,
      description : seller.description
    };
  });
}
