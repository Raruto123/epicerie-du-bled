import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Update seller fields (storeName/description/logoURL/coverURL/addressText/addressSource)
export async function updateSellerProfile(uid, patch) {
  const userRef = doc(db, "users", uid);

  const payload = {
    updatedAt: serverTimestamp(),
    "seller.updatedAt": serverTimestamp(),
  };

  if (patch.storeName !== undefined)
    payload["seller.storeName"] = patch.storeName;
  if (patch.description !== undefined)
    payload["seller.description"] = patch.description;
  if (patch.addressText !== undefined) {
    payload["seller.addressText"] = patch.addressText;
    payload["seller.addressSource"] = "manual"; //utile + propre
  }

  await updateDoc(userRef, payload);
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

// // If you want the user to be able to type an address manually
// export async function updateSellerManualAddress(uid, addressText) {
//   const userRef = doc(db, "users", uid);

//   await setDoc(
//     userRef,
//     {
//       seller: {
//         addressText: addressText ?? "",
//         addressSource: "manual",
//         updatedAt: serverTimestamp(),
//       },
//       updatedAt: serverTimestamp(),
//     },
//     { merge: true }
//   );
// }
