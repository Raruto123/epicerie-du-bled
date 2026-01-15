import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  pickProductImage,
  uploadProductImage,
} from "./sellerAddProductService";

export async function updateProduct({ productId, patch }) {
  if (!productId) throw new Error("Missing sellerId/productId");

  const ref = doc(db, "products", productId);

  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export { pickProductImage, uploadProductImage };
