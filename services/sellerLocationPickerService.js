import * as Location from "expo-location";
import { Alert, Linking } from "react-native";

export async function ensureLocationPermission() {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === "granted") return true;

  const asked = await Location.requestBackgroundPermissionsAsync();
  if (asked.status === "granted") return true;

  Alert.alert(
    "Location refusée",
    "Autorisez la localisation pour utiliser la position actuelle. Vous pouvez toujours choisir manuellement sur la carte.",
    [
      { text: "OK", style: "cancel" },
      { text: "Ouvrir les réglages", onPress: () => Linking.openSettings() },
    ]
  );
  return false;
}

export async function getDeviceLocation() {
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
    timestamp: pos.timestamp ?? Date.now(),
  };
}

export function clampLatLng({ latitude, longitude }) {
  // Sécurité (lat [-90,90], lng [-180,180])
  const lat = Math.max(-90, Math.min(90, latitude));
  const lng = Math.max(-180, Math.min(180, longitude));
  return { latitude: lat, longitude: lng };
}
