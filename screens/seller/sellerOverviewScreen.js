import { useMemo, useState } from "react";
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

export default function SellerOverviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  //MVP data (plus tard : Firestore)
  const initial = useMemo(
    () => ({
      storeName: "Épicerie Mapouka Canada",
      description:
        "Importateur de produits frais de l'Afrique de l'Ouest. Plaintains, ignames et épices rares disponibles tous les mardis.",
      address: "7540 Boulevard Pie-IX, Montréal, QC",
      verified: true,
    }),
    []
  );

  const [storeName, setStoreName] = useState(initial.storeName);
  const [description, setDescription] = useState(initial.description);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);

  const goBack = () => navigation.goBack?.();

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      //TODO update : Firestore seller profile
    } finally {
      setSaving(false);
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

            <Pressable onPress={save} style={styles.saveLink} hitSlop={10}>
              <Text style={styles.saveLinkText}>Enregistrer</Text>
            </Pressable>
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
            {initial.verified && (
              <Text style={styles.verified}>Vendeur vérifié</Text>
            )}
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
            ></TextInput>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Description de la boutique</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textarea]}
              placeholder="Parlez-nous de vos spécialités africaines"
              multiline
              textAlignVertical="top"
            ></TextInput>
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
                  value={address}
                  onChangeText={setAddress}
                  style={styles.addressInput}
                  placeholder="Numéro, Rue, Ville"
                ></TextInput>
              </View>
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

          {/* Save Button */}
          <Pressable onPress={save} style={styles.bigSaveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white"></ActivityIndicator>
            ) : (
              <Text style={styles.bigSaveText}>
                Enregistrer les modifications
              </Text>
            )}
          </Pressable>

          <Text style={styles.lastUpdate}>
            Dernière mise à jour : 12 Octobre 2023
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
});
