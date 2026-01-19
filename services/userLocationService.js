/**
 * Save user location to Firestore.
 * Path: users/{uid}
 * Field: lastLocation { latitude, longitude, accuracy, timestamp }
 */

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import * as Location from "expo-location";

// ✅ important: latitude/longitude peuvent être 0 (ex: équateur), donc pas de "if (!lat)"
export function isValidCoords(location) {
  const lat = location?.latitude;
  const lng = location?.longitude;
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  );
}

export async function reverseGeocodeToAddress({ latitude, longitude }) {
  // expo-location reverse geocoding
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  const address = results?.[0] ?? null;
  if (!address) return null;

  const streetLine = [address.streetNumber, address.street]
    .filter(Boolean)
    .join(" ")
    .trim();
  const cityLine = [address.city || address.subregion, address.region]
    .filter(Boolean)
    .join(" ")
    .trim();

  const formatted = [streetLine, cityLine].filter(Boolean).join(", ").trim();

  return {
    formatted: formatted || "Adresse inconnue",
    street: streetLine || null,
    city: address.city || address.subregion || null,
    region: address.region || null,
    postalCode: address.postalCode || null,
    country: address.country || null,
  };
}

export async function saveUserLocation({ uid, location }) {
  if (!uid) throw new Error("Missing uid");
  if (!isValidCoords(location)) throw new Error("Invalide location");

  const coords = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy ?? null,
    timestamp: location.timestamp ?? Date.now(),
  };

  // ✅ on tente de récupérer l’adresse civique
  let address = null;
  try {
    address = await reverseGeocodeToAddress({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch (e) {
    // on ne bloque pas la sauvegarde si le reverse geo échoue
    console.log("⚠️ reverseGeocode failed:", e?.message ?? e);
    address = null;
  }

  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      lastLocation: coords,
      lastAddress: address,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {coords, address}
}

export async function getUserLastLocation({ uid }) {
  if (!uid) throw new Error("Missing uid");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    lastLocation: data?.lastLocation ?? null,
    lastAddress: data?.lastAddress ?? null,
  };
}
