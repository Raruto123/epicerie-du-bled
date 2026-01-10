import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Update seller fields (storeName/description/logoURL/coverURL/addressText/addressSource)
export async function updateSellerProfile(uid, patch) {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      seller: {
        ...patch,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Save GPS coords (you can call this after your LocationGateModal)
export async function updateSellerGpsLocation(
  uid,
  { latitude, longitude, accuracy, timestamp }
) {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      seller: {
        gps: {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          timestamp: timestamp ?? Date.now(),
        },
        addressSource: "gps",
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// If you want the user to be able to type an address manually
export async function updateSellerManualAddress(uid, addressText) {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      seller: {
        addressText: addressText ?? "",
        addressSource: "manual",
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
