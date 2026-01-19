// components/LocationGateModal.js
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StatusBar,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
  AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { COLORS } from "../constants/colors";

export default function LocationGateModal({
  visible,
  onDone,
  onLocation,

  // ✅ nouveaux props (optionnels)
  currentStatus = "unknown", // unknown | granted | denied
  currentLabel = "",
}) {
  const insets = useSafeAreaInsets();

  // ask | granted | denied
  const [step, setStep] = useState("ask");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setBusy(false);
    setRefreshing(false);
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === "granted") setStep("granted");
        else if (perm.status === "denied") setStep("denied");
        else setStep("ask");
      } catch {
        setStep("ask")
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === "granted") {
          setStep("granted");
          // ✅ optionnel: on auto-récupère la position dès le retour des réglages
          // (comme ça l'adresse se met à jour sans que l'utilisateur clique)

          await refresh();
        } else {
          setStep("denied");
        }
      } catch (e) {}
    });

    return () => sub.remove();
  }, [visible]);

  const close = async () => await onDone?.();

  const buildLoc = (position) => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    timestamp: position.timestamp ?? Date.now(),
  });

  // ✅ Ouvre les réglages de l’app (permissions localisation)
  const openLocationSettings = async () => {
    try {
      // Expo (ouvre la page réglages de l'app)
      if (Location.openSettings) {
        await Location.openSettings();
        return;
      }
    } catch (e) {}

    try {
      // React Native (fallback)
      await Linking.openSettings();
    } catch (e) {
      console.log("⚠️ open settings failed : ", e?.message ?? e);
    }
  };

  // ✅ Demander permission + récupérer position
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

      onLocation?.(buildLoc(position));
      setStep("granted");
    } catch (e) {
      setStep("denied");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Refresh (si déjà granted)
  const refresh = async () => {
    setRefreshing(true);
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setStep("denied");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      onLocation?.(buildLoc(position));
      setStep("granted");
    } catch (e) {
      // si refresh échoue, on reste sur granted mais sans casser l’UI
    } finally {
      setRefreshing(false);
    }
  };

  const title = useMemo(() => {
    if (step === "granted") return "Localisation activée";
    if (step === "denied") return "Localisation refusée";
    return "Découvrez les épiceries à proximité";
  }, [step]);

  const body = useMemo(() => {
    if (step === "granted") {
      return currentLabel
        ? `Actuel : ${currentLabel}`
        : "Localisation déjà activée. Vous pouvez actualiser votre position.";
    }
    if (step === "denied")
      return "La localisation est désactivée. Ouvrez les réglages pour l’autoriser (Localisation > Autoriser).";
    return "Pour calculer les distances et afficher les épiceries proches, nous avons besoin de votre position.";
  }, [step, currentLabel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.modalOverlay}>
        <StatusBar barStyle="light-content" />
        <View
          style={[
            styles.modalCard,
            { marginBottom: Math.max(16, insets.bottom) },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.headerBlobRight} />
            <View style={styles.headerBlobLeft} />

            <View style={styles.headerIconWrap}>
              {step === "granted" ? (
                <View style={styles.headerCheck}>
                  <MaterialIcons name="check" size={22} color="#16a34a" />
                </View>
              ) : step === "denied" ? (
                <MaterialIcons
                  name="location-disabled"
                  size={42}
                  color={COLORS.primary}
                />
              ) : (
                <MaterialIcons
                  name="location-on"
                  size={42}
                  color={COLORS.primary}
                />
              )}
            </View>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalText}>{body}</Text>

            {/* ASK */}
            {step === "ask" && (
              <View style={styles.modalActions}>
                <Pressable
                  onPress={request}
                  disabled={busy}
                  style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
                >
                  {busy ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.primaryBtnRow}>
                      <MaterialIcons name="near-me" size={20} color="white" />
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
                  Vous pourrez modifier ce choix plus tard.
                </Text>
              </View>
            )}

            {/* GRANTED */}
            {step === "granted" && (
              <View style={styles.modalActions}>
                <Pressable
                  onPress={refresh}
                  disabled={refreshing}
                  style={[
                    styles.secondaryBtnFilled,
                    refreshing && { opacity: 0.8 },
                  ]}
                >
                  {refreshing ? (
                    <ActivityIndicator />
                  ) : (
                    <View style={styles.secondaryBtnRow}>
                      <MaterialIcons
                        name="my-location"
                        size={20}
                        color={COLORS.text}
                      />
                      <Text style={styles.secondaryBtnFilledText}>
                        Actualiser ma position
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Pressable onPress={close} style={styles.primaryBtn}>
                  <View style={styles.primaryBtnRow}>
                    <Text style={styles.primaryBtnText}>Continuer</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="white"
                    />
                  </View>
                </Pressable>
              </View>
            )}

            {/* DENIED */}
            {step === "denied" && (
              <View style={styles.modalActions}>
                <Pressable
                  onPress={openLocationSettings}
                  style={styles.secondaryBtnFilled}
                >
                  <View style={styles.secondaryBtnRow}>
                    <MaterialIcons
                      name="settings"
                      size={20}
                      color={COLORS.text}
                    />
                    <Text style={styles.secondaryBtnFilledText}>
                      Réessayer d’autoriser
                    </Text>
                  </View>
                </Pressable>

                <Pressable onPress={close} style={styles.primaryBtn}>
                  <View style={styles.primaryBtnRow}>
                    <Text style={styles.primaryBtnText}>
                      Continuer sans localisation
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="white"
                    />
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.8 },
  primaryBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: { color: "white", fontSize: 15, fontWeight: "900" },

  secondaryBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "800", color: "#6b7280" },

  // ✅ bouton “gris rempli” (refresh / retry)
  secondaryBtnFilled: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  secondaryBtnFilledText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },

  reassure: {
    marginTop: 2,
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
