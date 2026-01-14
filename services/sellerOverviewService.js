import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

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

  if (patch.logoURL !== undefined) payload["seller.logoURL"] = patch.logoURL;
  if (patch.logoPath !== undefined) payload["seller.logoPath"] = patch.logoPath;

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

export async function pickSellerLogo() {
  //Check current permission state
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();

  //Ask if not granted
  if (!current.granted) {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert(
        "Accès aux photos",
        "Pour ajouter un logo, autorise l'accès à ta galerie dans les réglages.",
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
  if (!asset.uri) return null;

  return { uri: asset.uri };
}

async function uriToBlob(uri) {
  const resp = await fetch(uri);
  return await resp.blob();
}

async function uploadSellerLogoImage({ uid, localUri }) {
  if (!uid) throw new Error("Missing uid");
  if (!localUri) throw new Error("Missing localUri");

  const blob = await uriToBlob(localUri);

  //unique file name
  const filename = `sellerLogos/${uid}/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob, {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return { downloadURL, filename };
}

//Replace seller logo : upload new one, save URL+path, delete previous
export async function replaceSellerLogo(uid, localUri) {
  if (!uid) throw new Error("Missing uid");
  if (!localUri) throw new Error("Missing localUri");

  const userRef = doc(db, "users", uid);

  //1) Read previous path from Firestore
  const snapshot = await getDoc(userRef);
  const prevFilename = snapshot.exists()
    ? snapshot.data()?.seller?.logoPath ?? null
    : null;

  //2) Upload new logo
  const { downloadURL, filename } = await uploadSellerLogoImage({
    uid,
    localUri,
  });

  //3) save new logoURL + logoPath in Firestore
  await setDoc(
    userRef,
    {
      seller: {
        logoURL: downloadURL,
        logoPath: filename,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  //4) delete previous logo
  if (prevFilename && prevFilename !== filename) {
    try {
      await deleteObject(ref(storage, prevFilename));
      console.log("🗑️ deleted previous seller logo :", prevFilename);
    } catch (e) {
      console.log("⚠️ delete previous seller logo failed : ", {
        code: e?.code,
        message: e?.message,
        prevFilename,
      });
    }
  }
}
