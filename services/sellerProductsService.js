import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { deleteObject, ref as storageRef } from "firebase/storage";

export async function updateProductStock({ productId, inStock }) {
  if (!productId) throw new Error("Missing productId");
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    inStock: !!inStock,
    updatedAt: serverTimestamp(),
  });
}
/**
 * Extract "products/<uid>/<file>.jpg" from Firebase download URL:
 * https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<ENCODED_PATH>?alt=media&token=...
 */

function getStoragePathFromDownloadURL(url) {
  if (!url) return null;

  const match = String(url).match(/\/o\/([^?]+)/); //grab encoded path
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Delete product doc + its image if photoURL exists.
 * photoURL is a Firebase Storage download URL.
 */
export async function deleteProductWithImage({ productId, photoURL }) {
  if (!productId) throw new Error("Missing productId");

  // 1) Try delete storage file (best-effort)
  const path = getStoragePathFromDownloadURL(photoURL);
  if (path) {
    try {
      const imgRef = storageRef(storage, path); //storage path
      await deleteObject(imgRef);
    } catch (e) {
      // If image already deleted or url invalid, we still delete the doc
      console.log("⚠️ delete image failed (continuing) :", e?.message ?? e);
    }
  } else if (photoURL) {
    console.log("⚠️PhotoURL not parseable, skipping image delete");
  }
  //2) Delete Firestore doc
  const productRef = doc(db, "products", productId);
  await deleteDoc(productRef);
}
