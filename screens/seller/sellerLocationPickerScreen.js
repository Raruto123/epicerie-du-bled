import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  clampLatLng,
  ensureLocationPermission,
  getDeviceLocation,
} from "../../services/sellerLocationPickerService";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

export default function SellerLocationPickerScreen({ navigation, route }) {
  const mapRef = useRef(null);

  const initial = route?.params?.initialLocation ?? null;

  const [busy, setBusy] = useState(true);
  const [marker, setMarker] = useState(
    initial
      ? { latitude: initial.latitude, longitude: initial.longitude }
      : { latitude: 45.5017, longitude: -73.5673 } //fallback Montréal
  );

  const [accuracy, setAccuracy] = useState(null);

  const region = useMemo(
    () => ({
      ...marker,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [marker]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Si on a déjà une location seller, on affiche direct
        if (initial?.latitude && initial?.longitude) {
          setBusy(false);
          return;
        }
        // Sinon, on essaye de centrer sur la position du device (si autorisé)
        const locationGranted = await ensureLocationPermission();
        if (!locationGranted) {
          if (alive) setBusy(false);
          return;
        }
        const loc = await getDeviceLocation();
        if (!alive || !loc) return;

        setMarker({ latitude: loc.latitude, longitude: loc.longitude });
        setAccuracy(loc.accuracy ?? null);

        //Anime la map
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            350
          );
        });
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onPickOnMap = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const clamp = clampLatLng({ latitude, longitude });
    setMarker(clamp);
    setAccuracy(null);
  };

  const useMyPosition = async () => {
    setBusy(true);
    try {
      const locationGranted = await ensureLocationPermission();
      if (!locationGranted) return;

      const loc = await getDeviceLocation();
      if (!loc) return;

      const clamp = clampLatLng({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setMarker(clamp);
      setAccuracy(loc.accuracy ?? null);

      mapRef.current?.animateToRegion(
        {
          ...clamp,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        350
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    const pickedLocation = {
      latitude: marker.latitude,
      longitude: marker.longitude,
      accuracy: accuracy ?? null,
      timestamp: Date.now(),
    };
    navigation.navigate(
      "SellerBoard",
      {
        screen: "SellerTabs",
        params: {
          screen: "APERÇU",
          params: { pickedLocation },
        },
        merge : true
      },
    );
    // navigation.navigate({
    //   name: "SellerBoard",
    //   screen: "SellerTabs",
    //   params: {
    //     screen: "APERÇU",
    //     pickedLocation: {
    //       latitude: marker.latitude,
    //       longitude: marker.longitude,
    //       accuracy: accuracy ?? null,
    //       timestamp: Date.now(),
    //     },
    //   },
    //   merge: true,
    // });
  };
  return (
    <SafeAreaView style={styles.safe} edges={["right", "left", "top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBtn}>
          <View style={styles.topBtnRow}>
            <MaterialIcons
              name="arrow-back-ios"
              size={18}
              color={COLORS.text}
            ></MaterialIcons>
            <Text style={styles.topBtnText}>Retour</Text>
          </View>
        </Pressable>

        <Text style={styles.title}>Position de l'épicerie</Text>

        <Pressable onPress={confirm} style={styles.validateBtn}>
          <Text style={styles.validateText}>Valider</Text>
        </Pressable>
      </View>
      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onPress={onPickOnMap}
          provider="google"
        >
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMarker(clampLatLng({ latitude, longitude }));
              setAccuracy(null);
            }}
          ></Marker>
        </MapView>

        {/* Floating button */}
        <View style={styles.floating}>
          <Pressable
            onPress={useMyPosition}
            disabled={busy}
            style={[styles.gpsBtn, busy && { opacity: 0.7 }]}
          >
            {busy ? (
              <ActivityIndicator color="white"></ActivityIndicator>
            ) : (
              <>
                <MaterialIcons
                  name="my-location"
                  size={18}
                  color="white"
                ></MaterialIcons>
                <Text style={styles.gpsBtnText}>Utiliser ma position</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.hint}>
            Touchez la carte pour placer le marqueur, ou déplacez-le
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  topBtn: { width: 90, height: 40, justifyContent: "center" },
  topBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  topBtnText: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  validateBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  validateText: { color: "white", fontWeight: "900" },

  mapWrap: { flex: 1 },
  map: { flex: 1 },

  floating: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    gap: 10,
  },
  gpsBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  gpsBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
  hint: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingVertical: 10,
    borderRadius: 14,
  },
});
