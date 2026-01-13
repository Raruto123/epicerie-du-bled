import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Alert, Linking } from "react-native";

// Fetch full user doc (use this to decide if you show "Espace vendeur")
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function updateProfileName(uid, newName) {
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

export async function pickProfilePicture() {
  // 1) Vérifie l’état actuel
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  console.log("Media permission for profile picture : ", current);

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

async function uriToBlob(uri) {
  const resp = await fetch(uri);
  return await resp.blob();
}


export async function uploadPictureImage({ userUid, localUri }) {
  if (!userUid) throw new Error("Missing sellerId");
  if (!localUri) throw new Error("Missing localUri");

  const blob = await uriToBlob(localUri);

  //nom de fichier unique
  const filename = `products/${userUid}/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.jpg`;

  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob, {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
