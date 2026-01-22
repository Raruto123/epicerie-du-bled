import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileScreen from "./profileScreen";
import HomeScreen from "./homeScreen";
import FavoritesScreen from "./favoritesScreen";
import GroceriesListScreen from "./groceriesListScreen";
import LocationGateModal from "../../components/locationGateModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCATION_GATE_KEY } from "../../constants/locationGateKeys";
import { auth } from "../../lib/firebase";
import {
  getUserLastLocation,
  saveUserLocation,
} from "../../services/userLocationService";
import { subscribeUserFavorites } from "../../services/userService";
import { onAuthStateChanged } from "firebase/auth";

const Tab = createBottomTabNavigator();
export default function UserApp() {
  const [showLocationGate, setShowLocationGate] = useState(false);
  const [ready, setReady] = useState(false);

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("unknown"); //unknown|granted|denied
  const [locationLabel, setLocationLabel] = useState("Chargement...");

  const [favorites, setFavorites] = useState([]);
  const [favIds, setFavIds] = useState(new Set());

  const [uid, setUid] = useState(null)

  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(LOCATION_GATE_KEY.HAS_SEEN_GATE);
      // default UI pendant chargement
      setLocationStatus("unknown");
      setLocationLabel("Chargement...");

      const uid = auth.currentUser?.uid;
      // ✅ si déjà vu, on essaie de récupérer la dernière adresse enregistrée
      if (done && uid) {
        try {
          const last = await getUserLastLocation({ uid });
          const lastLoc = last?.lastLocation;
          if (lastLoc?.latitude !== null && lastLoc?.longitude !== null) {
            setLocation({
              latitude: Number(lastLoc.latitude),
              longitude: Number(lastLoc.longitude),
              accuracy: lastLoc.accuracy ?? null,
              timestamp: lastLoc.timestamp ?? Date.now(),
            });
          }

          const formatted = last?.lastAddress.formatted;
          if (formatted) {
            setLocationStatus("granted");
            setLocationLabel(formatted);
          } else {
            // pas d'adresse enregistrée => on ne sait pas
            setLocationStatus("denied");
            setLocationLabel("Aucune localisation");
          }
        } catch (e) {
          console.log("⚠️ getUserLastLocation failed:", e?.message ?? e);
          setLocationStatus("denied");
          setLocationLabel("Aucune localisation");
        }
        setShowLocationGate(false);
        setReady(true);
        return;
      }
      // ✅ si pas encore vu => on affiche le modal
      if (!done) {
        setShowLocationGate(true);
        setLocationStatus("unknown");
        setLocationLabel("Localisation...");
        setReady(true);
        return;
      }
      // ✅ déjà vu MAIS pas de uid (pas connecté)
      setLocationStatus("denied");
      setLocationLabel("Aucune localisation");
      setShowLocationGate(false);
      setReady(true);
    })();
  }, []);


useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    setUid(user?.uid ?? null);
  });
  return unsub;
}, []);

useEffect(() => {
  if (!uid) {
    setFavorites([]);
    setFavIds(new Set());
    return;
  }

  const unsub = subscribeUserFavorites({
    uid,
    cb: ({ favoritesArray, favIdsSet }) => {
      setFavorites(favoritesArray);
      setFavIds(favIdsSet);
    },
  });

  return () => unsub?.();
}, [uid]);

  const markGateDone = async () => {
    await AsyncStorage.setItem(LOCATION_GATE_KEY.HAS_SEEN_GATE, "true");
  };

  return (
    <View style={styles.appWrap}>
      <StatusBar barStyle="dark-content"></StatusBar>
      {ready && (
        <LocationGateModal
          visible={showLocationGate}
          currentLabel={locationLabel}
          currentStatus={locationStatus}
          onDone={async () => {
            setShowLocationGate(false);
            await AsyncStorage.setItem(LOCATION_GATE_KEY.HAS_SEEN_GATE, "1");
            // si aucune location n'a été récupérée => on considère "refus / pas dispo"
            if (!location) {
              setLocationStatus("denied");
              setLocationLabel("Aucune localisation");
            }
          }}
          onLocation={async (loc) => {
            setLocation(loc);
            setShowLocationGate(false); // ✅ ferme direct
            await AsyncStorage.setItem(LOCATION_GATE_KEY.HAS_SEEN_GATE, "1");
            //save in Firestore
            const uid = auth.currentUser?.uid;
            if (!uid) {
              console.log("⚠️ No auth user, location not saved to Firestore.");
              // mais on peut quand même afficher localement :
              setLocationStatus("granted");
              setLocationLabel("Position détectée");
              return;
            }
            try {
              const result = await saveUserLocation({ uid, location: loc });
              const formatted =
                result?.address?.formatted || "Localisation enregistrée";

              setLocationStatus("granted");
              setLocationLabel(formatted);
              console.log("✅Location saved to Firestore");
            } catch (e) {
              console.log("❌saveUserLocation failed :", e.message ?? e);
              //fallback
              setLocationStatus("denied");
              setLocationLabel("Aucune localisation");
            }
          }}
        ></LocationGateModal>
      )}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size }) => {
            const name = (() => {
              if (route.name === "ACCUEIL") return "home";
              if (route.name === "EPICERIES") return "local-grocery-store";
              if (route.name === "FAVORIS") return "favorite";
              return "person";
            })();
            return (
              <MaterialIcons
                name={name}
                size={size ?? 22}
                color={color}
              ></MaterialIcons>
            );
          },
        })}
      >
        <Tab.Screen
          name="ACCUEIL"
          listeners={{
            tabPress: (e) => {
              setHomeRefreshKey((x) => x + 1);
            },
          }}
        >
          {(props) => (
            <HomeScreen
              {...props}
              locationStatus={locationStatus}
              locationLabel={locationLabel}
              onPressLocation={() => setShowLocationGate(true)} //pour relancer manuellement le modal
              userLocation={location}
              favIds={favIds}
              refreshKey={homeRefreshKey}
            ></HomeScreen>
          )}
        </Tab.Screen>
        <Tab.Screen name="EPICERIES">
          {(props) => (
            <GroceriesListScreen
              {...props}
              userLocation={location}
              locationStatus={locationStatus}
            ></GroceriesListScreen>
          )}
        </Tab.Screen>
        <Tab.Screen name="FAVORIS">
          {(props) => (
            <FavoritesScreen
              {...props}
              favorites={favorites}
              userLocation={location}
              locationStatus={locationStatus}
            ></FavoritesScreen>
          )}
        </Tab.Screen>
        <Tab.Screen name="PROFIL" component={ProfileScreen}></Tab.Screen>
      </Tab.Navigator>
      {/* Pour relancer manuellement plus tard: setShowLocationGate(true) */}
      {console.log(location)}
    </View>
  );
}

const styles = StyleSheet.create({
  appWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenSafe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  tabBar: {
    height: 100,
    paddingBottom: 10,
    // paddingTop:8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "white",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.6)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.65)",
  },
  modalHeader: {
    height: 170,
    backgroundColor: "rgba(214,86,31,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBlobRight: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(214, 86, 31, 0.10)",
  },
  headerBlobLeft: {
    position: "absolute",
    left: -30,
    bottom: 30,
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(84,180,145,0.16)",
  },
  headerIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  headerBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#54B491",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  headerCheck: {
    backgroundColor: "rgba(22,163,74,0.12)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 8,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6b7280",
    textAlign: "center",
  },
  modalActions: {
    width: "100%",
    marginTop: 12,
    gap: 10,
  },
  primaryBtn: {
    height: 52,
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.8,
  },
  primaryBtnRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6b7280",
  },
  reassure: {
    marginTop: 2,
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
