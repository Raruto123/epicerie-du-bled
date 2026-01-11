import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Fetch full user doc (use this to decide if you show "Espace vendeur")
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function updateProileName(uid, newName) {
  const userRef = doc(db, "users", uid);
  // Prefer updateDoc (fails if doc doesn't exist), but fallback to setDoc+merge.

  try {
    await updateDoc(userRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    await setDoc(
      userRef,
      {
        name: newName,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
