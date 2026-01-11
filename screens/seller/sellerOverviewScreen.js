import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../../lib/firebase";
import { updateSellerProfile } from "../../services/sellerOverviewService";
import { getUserProfile } from "../../services/profileService";
import { formatDateFr } from "../../utils/dateFormat";

export default function SellerOverviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [profile, setProfile] = useState(null);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [addressText, setAddressText] = useState("");

  const lastUpdated = profile?.seller?.updatedAt ?? null;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const current = auth.currentUser;
        if (!current?.uid) {
          if (alive) {
            setProfile(null);
            setStoreName("");
            setDescription("");
            setAddressText("");
          }
          return;
        }

        const p = await getUserProfile(current.uid);
        if (!alive) return;

        setProfile(p);
        // ⚠️ seller peut ne pas exister au début
        setStoreName((p?.seller?.storeName ?? "").toString());
        setDescription((p?.seller?.description ?? "").toString());
        setAddressText((p?.seller?.addressText ?? "").toString());
      } catch (e) {
        if (!alive) return;
        setProfile(null);
        setStoreName("");
        setDescription("");
        setAddressText("");
        console.log("❌ Failed to load seller profile:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const goBack = () => navigation.goBack?.();

  const saveField = async (field) => {
    Keyboard.dismiss();
    if (!uid) return;

    let nextValue = "";
    if (field === "storeName") nextValue = storeName.trim();
    if (field === "description") nextValue = description.trim();
    if (field === "addressText") nextValue = addressText.trim();

    if (!nextValue) return;

    // Optimistic UI (on garde une copie pour rollback)
    const prev = {
      storeName,
      description,
      addressText,
      profile,
    };

    // optionnel: sync profile local direct
    setProfile((p) => {
      if (!p) return p;
      return {
        ...p,
        seller: {
          ...(p.seller ?? {}),
          [field]: nextValue,
        },
      };
    });

    setSavingField(field);

    try {
      if (field === "storeName")
        await updateSellerProfile(uid, { storeName: nextValue });
      if (field === "description")
        await updateSellerProfile(uid, { description: nextValue });
      if (field === "addressText")
        await updateSellerProfile(uid, { addressText: nextValue });
      // Re-fetch pour être sûr (et récupérer updatedAt etc.)
      const fresh = await getUserProfile(uid);
      if (fresh) {
        setProfile(fresh);
        setStoreName((fresh?.seller?.storeName ?? "").toString());
        setDescription((fresh?.seller?.description ?? "").toString());
        setAddressText((fresh?.seller?.addressText ?? "").toString());
      }

      console.log(`✅${field} updated in Firestore`);
    } catch (e) {
      // Rollback UI
      setStoreName(prev.storeName);
      setDescription(prev.description);
      setAddressText(prev.addressText);
      setProfile(prev.profile);
      console.log(`❌ Failed to update ${field} in Firestore`, e);
    } finally {
      setSavingField(null);
    }
  };

  const updateGps = () => {
    // TODO: ouvrir une logique GPS plus tard
    // Là on garde juste le design
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small"></ActivityIndicator>
              <Text style={styles.loadingText}>
                Chargement du profil vendeur...
              </Text>
            </View>
          )}
          {/* Top App Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={goBack} style={styles.topBtn} hitSlop={10}>
              <View style={styles.topBtnRow}>
                <MaterialIcons
                  name="arrow-back-ios"
                  size={18}
                  color={COLORS.text}
                ></MaterialIcons>
                <Text style={styles.topBtnText}>Annuler</Text>
              </View>
            </Pressable>

            <Text style={styles.topTitle}>Modifier le Profil</Text>
            <View style={{ width: 110 }}></View>
          </View>

          {/* Cover + Logo */}
          <View style={styles.visualWrap}>
            <View style={styles.cover}>
              <Pressable style={styles.coverCamBtn} hitSlop={10}>
                <MaterialIcons
                  name="photo-camera"
                  size={20}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>

            <View style={styles.logoWrap}>
              <View style={styles.logo}></View>
              <Pressable style={styles.logoEditBtn} hitSlop={10}>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>
          </View>

          <View style={styles.centerHeader}>
            <Text style={styles.storeTitle}>
              {storeName || "Votre boutique"}
            </Text>
          </View>

          {/* Identité */}
          <Text style={styles.h3}>Identité du commerce</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nom commercial</Text>
            <TextInput
              value={storeName}
              onChangeText={setStoreName}
              style={styles.input}
              placeholder="Entrez le nom de votre commerce"
              returnKeyType="done"
              onSubmitEditing={() => saveField("storeName")}
            ></TextInput>
            <Pressable
              onPress={() => saveField("storeName")}
              disabled={savingField === "storeName"}
              style={[
                styles.smallSaveBtn,
                saveField === "storeName" && { opacity: 0.7 },
              ]}
            >
              {savingField === "storeName" ? (
                <ActivityIndicator color="white"></ActivityIndicator>
              ) : (
                <Text style={styles.smallSaveText}>Enregistrer</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Description de la boutique</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textarea]}
              onSubmitEditing={() => saveField("description")}
              placeholder="Parlez-nous de vos spécialités africaines"
              multiline
              textAlignVertical="top"
            ></TextInput>
            <Pressable
              onPress={() => saveField("description")}
              disabled={savingField === "description"}
              style={[
                styles.smallSaveBtn,
                savingField === "description" && { opacity: 0.7 },
              ]}
            >
              {savingField === "description" ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.smallSaveText}>Enregistrer</Text>
              )}
            </Pressable>
          </View>
          {/* Localisation */}
          <Text style={styles.h3}>Localisation</Text>

          <View style={styles.cardNoPad}>
            <View style={styles.addressRow}>
              <Text style={styles.label}>Adresse civique</Text>
              <View style={styles.addressInputRow}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
                <TextInput
                  value={addressText}
                  onChangeText={setAddressText}
                  style={styles.addressInput}
                  onSubmitEditing={() => saveField("addressText")}
                  placeholder="Numéro, Rue, Ville"
                ></TextInput>
              </View>
              <Pressable
                onPress={() => saveField("addressText")}
                disabled={savingField === "addressText"}
                style={[
                  styles.smallSaveBtn,
                  savingField === "addressText" && { opacity: 0.7 },
                ]}
              >
                {savingField === "addressText" ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.smallSaveText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>

            <Pressable onPress={updateGps} style={styles.gpsRow}>
              <View style={styles.gpsLeft}>
                <MaterialIcons
                  name="my-location"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
                <View>
                  <Text style={styles.gpsTitle}>Mettre à jour via GPS</Text>
                  <Text style={styles.gpsSub}>
                    Utiliser votre position actuelle
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={COLORS.primary}
              ></MaterialIcons>
            </Pressable>
          </View>

          {/* Map preview placeholder */}
          <View style={styles.mapPreview}></View>

          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialIcons
              name="info"
              size={18}
              color={COLORS.muted}
            ></MaterialIcons>
            <Text style={styles.infoText}>
              Les modifications apportées à votre nom commercial et à votre
              adresse seront visibles immédiatement par vos clients
            </Text>
          </View>

          <Text style={styles.lastUpdate}>
            {lastUpdated ? `Dernière mise à jour : ${formatDateFr(lastUpdated)}`: "Dernière mise à jour : -"}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: { paddingHorizontal: 16, paddingBottom: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 10,
  },
  topBtn: { width: 110, height: 40, justifyContent: "center" },
  topBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  topBtnText: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  saveLink: {
    width: 110,
    alignItems: "flex-end",
    justifyContent: "center",
    height: 40,
  },
  saveLinkText: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
  visualWrap: { marginTop: 6, marginBottom: 54 },
  cover: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#e5dfdc",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCamBtn: {
    width: 46,
    height: 46,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    position: "absolute",
    bottom: -52,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logo: {
    width: 128,
    height: 128,
    backgroundColor: "#d9d4d0",
    borderWidth: 4,
    borderColor: COLORS.bg,
    borderRadius: 999,
  },
  logoEditBtn: {
    position: "absolute",
    right: 16,
    bottom: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  centerHeader: { alignItems: "center", marginTop: 8, marginTop: 16 },
  storeTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },
  verified: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
  },
  h3: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    marginBottom: 12,
  },
  cardNoPad: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 8,
  },
  input: {
    height: 48, //48
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "white",
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  textarea: { height: 110, paddingTop: 12 },
  addressRow: { padding: 24 },
  addressInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressInput: {
    flex: 1,
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    paddingVertical: 8,
  },
  gpsRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(214,86,31,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  gpsTitle: { fontSize: 13, fontWeight: "900", color: COLORS.primary },
  gpsSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },

  mapPreview: {
    height: 130,
    borderRadius: 14,
    backgroundColor: "#e5dfdc",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginTop: 4,
  },

  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#f4f1f0",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.muted,
  },
  bigSaveBtn: {
    marginTop: 16,
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bigSaveText: { color: "white", fontWeight: "900", fontSize: 16 },
  lastUpdate: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  smallSaveBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  smallSaveText: { color: "white", fontWeight: "900" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 12, fontWeight: "800", color: COLORS.muted },
});
