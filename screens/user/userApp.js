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

const Tab = createBottomTabNavigator();

function CenterScreen({ title }) {
  return (
    <SafeAreaView style={styles.screenSafe} edges={["top", "left", "right"]}>
      <View style={styles.center}>
        <Text style={styles.screenTitle}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen() {
  return <CenterScreen title="ACCUEIL"></CenterScreen>;
}
function SearchScreen() {
  return <CenterScreen title="RECHERCHE"></CenterScreen>;
}
function FavoritesScreen() {
  return <CenterScreen title="FAVORIS"></CenterScreen>;
}
// function ProfileScreen() {
//   return <CenterScreen title="PROFIL"></CenterScreen>;
// }

// Modal simple (MVP) :
// - step "ask" : ton popup qui demande
// - step "granted" : ton popup qui valide
// - step "denied" : ton popup qui refuse

// IMPORTANT : même si "denied" on permet de continuer vers ACCUEIL

function LocationGateModal({ visible, onDone, onLocation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState("ask");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep("ask");
      setBusy(false);
    }
  }, [visible]);

  const close = () => onDone?.();

  const request = async () => {
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStep("denied");
        setBusy(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      onLocation?.({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        timestamp: position.timestamp ?? Date.now(),
      });

      console.log(
        `voici la position de l'utilisateur = ${position.coords.accuracy}`
      );

      setStep("granted");
      setBusy(false);
    } catch (e) {
      setStep("denied");
      setBusy(false);
    }
  };

  const title = useMemo(() => {
    if (step === "granted") return "C'est tout bon !";
    if (step === "denied") return "Localisation nécessaire";
    return "Découvrez les épiceries à proximité";
  }, [step]);

  const body = useMemo(() => {
    if (step === "granted")
      return "Localisation obtenue. Nous trouvons les meilleures épiceries africaines autour de vous.";
    if (step === "denied")
      return "Vous avez refusé la localisation. L'app marchera quand même, mais les distances et la proximité seront moins précises";
    return "Pour afficher les en stock et calculer les distances vers les meilleures épiceries africaines, nous avons besoin de votre position.";
  }, [step]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <StatusBar barStyle="light-content"></StatusBar>
        <View
          style={[
            styles.modalCard,
            { marginBottom: Math.max(16, insets.bottom) },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.headerBlobRight}></View>
            <View style={styles.headerBlobLeft}></View>

            <View style={styles.headerIconWrap}>
              {step === "granted" ? (
                <View style={styles.headerCheck}>
                  <MaterialIcons
                    name="check"
                    size={22}
                    color="#16a34a"
                  ></MaterialIcons>
                </View>
              ) : step === "denied" ? (
                <MaterialIcons
                  name="location-disabled"
                  size={42}
                  color={COLORS.primary}
                ></MaterialIcons>
              ) : (
                <MaterialIcons
                  name="location-on"
                  size={42}
                  color={COLORS.primary}
                ></MaterialIcons>
              )}

              {step === "ask" && (
                <View style={styles.headerBadge}>
                  <MaterialIcons
                    name="storefront"
                    size={16}
                    color="white"
                  ></MaterialIcons>
                </View>
              )}
            </View>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalText}>{body}</Text>

            {step === "ask" && (
              <View style={styles.modalActions}>
                <Pressable
                  onPress={request}
                  disabled={busy}
                  style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
                >
                  {busy ? (
                    <ActivityIndicator color="white"></ActivityIndicator>
                  ) : (
                    <View style={styles.primaryBtn}>
                      <MaterialIcons
                        name="near-me"
                        size={20}
                        color="white"
                      ></MaterialIcons>
                      <Text style={styles.primaryBtnText}>
                        Autoriser la localisation
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Pressable onPress={close} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>
                    Continuer sans localisation
                  </Text>
                </Pressable>

                <Text style={styles.reassure}>
                  Vous pourrez modifier ce choix dans les réglages.
                </Text>
              </View>
            )}

            {step === "granted" && (
              <View style={styles.modalActions}>
                <Pressable onPress={close} style={styles.primaryBtn}>
                  <View style={styles.primaryBtnRow}>
                    <Text style={styles.primaryBtnText}>Voir les produits</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="white"
                    ></MaterialIcons>
                  </View>
                </Pressable>

                <Pressable onPress={close} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>
                    Modifier ma position manuellement
                  </Text>
                </Pressable>
              </View>
            )}

            {step === "denied" && (
              <View style={styles.modalActions}>
                <Pressable onPress={close} style={styles.primaryBtn}>
                  <View style={styles.primaryBtnRow}>
                    <Text style={styles.primaryBtnText}>
                      Continuer sans localisation
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="white"
                    ></MaterialIcons>
                  </View>
                </Pressable>

                <Pressable onPress={close} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>
                    Ouvrir les réglages
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UserApp() {
  const [showLocationGate, setShowLocationGate] = useState(true);
  const [location, setLocation] = useState(null);

  return (
    <View style={styles.appWrap}>
      <StatusBar barStyle="dark-content"></StatusBar>
      <LocationGateModal
        visible={showLocationGate}
        onDone={() => setShowLocationGate(false)}
        onLocation={(loc) => setLocation(loc)}
      ></LocationGateModal>
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
              if (route.name === "RECHERCHE") return "search";
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
        <Tab.Screen name="ACCUEIL" component={HomeScreen}></Tab.Screen>
        <Tab.Screen name="RECHERCHE" component={SearchScreen}></Tab.Screen>
        <Tab.Screen name="FAVORIS" component={FavoritesScreen}></Tab.Screen>
        <Tab.Screen name="PROFIL" component={ProfileScreen}></Tab.Screen>
      </Tab.Navigator>
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
