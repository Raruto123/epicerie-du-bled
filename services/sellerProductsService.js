import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function updateProductStock({ productId, inStock }) {
  if (!productId) throw new Error("Missing productId");
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    inStock: !!inStock,
    updatedAt: serverTimestamp(),
  });
}
