import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../lib/firebase";
import * as ImagePicker from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Alert, Linking } from "react-native";
import { signOut } from "firebase/auth";

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
      { merge: true },
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
        "Accès aux photos refusé",
        "Pour ajouter une photo de profil, autorise l'accès à ta galerie dans les réglages.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Ouvrir les réglages",
            onPress: () => Linking.openSettings(),
          },
        ],
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
  const filename = `usersPicture/${userUid}/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.jpg`;

  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob, {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return { downloadURL, filename };
}

// export async function updateProfilePhoto(uid, photoURL) {
//   if (!uid) throw new Error("Missing uid");

//   const userRef = doc(db, "users", uid);

//   await setDoc(
//     userRef,
//     {
//       photoURL: photoURL ?? null,
//       updatedAt: serverTimestamp(),
//     },
//     { merge: true }
//   );
// }

export async function replaceProfilePhoto(uid, localUri) {
  if (!uid) throw new Error("Missing uid");
  if (!localUri) throw new Error("Missing localUri");

  // 1) Lire l'ancienne photo (path) depuis Firestore
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  const prevFilename = snapshot.exists()
    ? (snapshot.data()?.photoPath ?? null)
    : null;
  // 2) Upload la nouvelle photo
  const { downloadURL, filename } = await uploadPictureImage({
    userUid: uid,
    localUri,
  });

  // 3) Sauver new photoURL + photoPath dans Firestore
  await setDoc(
    userRef,
    {
      photoURL: downloadURL,
      photoPath: filename,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // 4) Supprimer l'ancienne photo (best-effort)
  if (prevFilename && prevFilename !== filename) {
    try {
      await deleteObject(ref(storage, prevFilename));
      console.log("🗑️ Deleted previous photo:", prevFilename);
    } catch (e) {
      // on n'empêche pas l'utilisateur: c'est une optimisation
      console.log("⚠️ Delete previous photo failed:", {
        code: e?.code,
        message: e?.message,
        prevFilename,
      });
    }
  }
  return downloadURL;
}

export async function removeProfilePhoto(uid) {
  if (!uid) throw new Error("Missing uid");

  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return;

  const prevFilename = snapshot.data()?.photoPath ?? null;

  // 1) Retirer la photo du profil dans Firestore
  await setDoc(
    userRef,
    { photoURL: null, photoPath: null, updatedAt: serverTimestamp() },
    { merge: true },
  );

  // 2) Supprimer l'image dans Storage (best effort)
  if (prevFilename) {
    try {
      await deleteObject(ref(storage, prevFilename));
      console.log("🗑️ Profile photo deleted from storage:", prevFilename);
    } catch (e) {
      console.log("⚠️ Delete profile photo file failed:", {
        code: e?.code,
        message: e?.message,
        prevFilename,
      });
    }
  }
}

export async function logout() {
  await signOut(auth);
}
