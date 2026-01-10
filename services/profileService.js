import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Fetch full user doc (use this to decide if you show "Espace vendeur")
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}
