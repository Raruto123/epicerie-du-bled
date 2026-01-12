/**
 * Shape doc: products/{productId}
 * {
 *   sellerId: string,
 *   name: string,
 *   cat: string,
 *   price: number,
 *   inStock: boolean,
 *   desc: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Alert, Linking } from "react-native";

/** ---------------------------
 *  1) Pick image (gallery)
 * --------------------------- */
export async function pickProductImage() {
  // 1) Vérifie l’état actuel
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  console.log("Media permission : ", current)

  // 2) Si pas accordé → on demande
  if (!current.granted) {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      // 3) Refusé → proposer d’ouvrir les réglages
      Alert.alert(
        "Accès aux photos",
        "Pour ajouter une photo produit, autorise l'accès à ta galerie dans les réglages.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Ouvrir les réglages",
            onPress: () => Linking.openSettings(),
          },
        ]
      );

      // IMPORTANT : on renvoie null (pas throw)
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.85,
    aspect: [1, 1],
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  return { uri: asset.uri };
}

/** ---------------------------
 *  2) Upload image -> Storage
 * --------------------------- */

async function uriToBlob(uri) {
  const resp = await fetch(uri);
  return await resp.blob();
}

export async function uploadProductImage({ sellerId, localUri }) {
  if (!sellerId) throw new Error("Missing sellerId");
  if (!localUri) throw new Error("Missing localUri");

  const blob = await uriToBlob(localUri);

  //nom de fichier unique
  const filename = `products/${sellerId}/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.jpg`;

  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob, {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function createProduct({
  sellerId,
  name,
  cat,
  price,
  inStock,
  desc,
  photoURL,
}) {
  if (!sellerId) throw new Error("Missing sellerId");
  if (!name?.trim()) throw new Error("Missing product name");
  if (!cat?.trim()) throw new Error("Missing category");
  if (!Number.isFinite(price)) throw new Error("Invalid price");

  const docRef = await addDoc(collection(db, "products"), {
    sellerId,
    name: name.trim(),
    cat: cat.trim(),
    price,
    inStock: !!inStock,
    desc: (desc ?? "").toString().trim(),
    photoURL: photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Real-time listener: all products for this seller.
 * callback receives [{ id, ...data }]
 */

export function listenSellerProducts(sellerId, callback) {
  if (!sellerId) return () => {};

  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      console.log("❌ listenSellerProducts error : ", err);
      callback([]);
    }
  );
  return unsub;
}
