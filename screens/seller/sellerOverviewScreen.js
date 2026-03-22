import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  pickSellerLogo,
  removeSellerAddress,
  removeSellerGpsLocation,
  removeSellerLogo,
  replaceSellerLogo,
  updateSellerGpsLocation,
  updateSellerProfile,
} from "../../services/sellerOverviewService";
import { getUserProfile } from "../../services/profileService";
import { formatDateFr } from "../../utils/dateFormat";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import {
  clearPickedSellerLocation,
  getPickedSellerLocation,
} from "../../services/sellerLocationPickerService";
import SellerRulesModal from "../../components/sellerRulesModal";

export default function SellerOverviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [profile, setProfile] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [addressText, setAddressText] = useState("");
  const [logoUri, setLogoUri] = useState("");
  const [savingLogo, setSavingLogo] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);

  const lastUpdated = profile?.seller?.updatedAt ?? null;
  const route = useRoute();
  const gps = profile?.seller?.gps ?? null;

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
            setLogoUri("");
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
        setLogoUri((p?.seller?.logoURL ?? "").toString());
      } catch (e) {
        if (!alive) return;
        setProfile(null);
        setStoreName("");
        setDescription("");
        setAddressText("");
        setLogoUri("");
        console.log("❌ Failed to load seller profile:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  //pour la localisation
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        const picked = getPickedSellerLocation();
        if (!picked || !uid) return;

        try {
          await updateSellerGpsLocation(uid, picked);
          const fresh = await getUserProfile(uid);

          if (active && fresh) {
            setProfile(fresh);
          }

          clearPickedSellerLocation();
          console.log("📍 Position boutique enregistrée :", picked);
        } catch (e) {
          console.log("❌ Failed to save seller GPS location", e);
        }
      })();

      return () => {
        active = false;
      };
    }, [uid]),
  );

  const mapCoord = useMemo(() => {
    if (gps?.latitude == null || gps?.longitude == null) return null;
    return {
      latitude: Number(gps.latitude),
      longitude: Number(gps.longitude),
    };
  }, [gps?.latitude, gps?.longitude]);

  const mapRegion = useMemo(() => {
    if (!mapCoord) {
      //fallback Montréal
      return {
        latitude: 45.5017,
        longitude: -73.5673,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return {
      ...mapCoord,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [mapCoord]);

  const goBack = () => {
    // SellerOverviewScreen -> Tab (SellerTabs) -> Stack (SellerBoard) -> Root Stack
    navigation.goBack();
  };

  const saveField = async (field) => {
    Keyboard.dismiss();
    if (!uid) return;

    let nextValue = "";
    if (field === "storeName") nextValue = storeName.trim();
    if (field === "description") nextValue = description.trim();
    if (field === "addressText") nextValue = addressText.trim();

    if (field === "storeName" && !nextValue) return;
    if (field === "addressText" && !nextValue) return;

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

  const pickAndSaveLogo = async () => {
    Keyboard.dismiss();
    if (!uid || savingLogo) return;

    const prevLogo = logoUri;

    try {
      const picked = await pickSellerLogo();
      if (!picked?.uri) return;

      //show local image imediately
      setLogoUri(picked.uri);
      setSavingLogo(true);

      //upload + replace and delete previous in Firebase Storage
      const newLogoURl = await replaceSellerLogo(uid, picked.uri);

      //update local UI to the remote URL
      setLogoUri(newLogoURl);

      //re-fetch to keep local state aligned
      const fresh = await getUserProfile(uid);
      if (fresh) {
        setProfile(fresh);
        setLogoUri((fresh?.seller?.logoURL ?? newLogoURl ?? "").toString());
      }
      console.log("✅ Seller logo replaced and saved :", newLogoURl);
    } catch (e) {
      setLogoUri(prevLogo);
      console.log("❌ Failed to pick/upload seller logo :", e);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleRemovePhoto = async () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller?.logoURL || savingLogo) return;

    const prevLogo = logoUri;

    setLogoUri("");
    setProfile((p) =>
      p
        ? {
            ...p,
            seller: { ...(p.seller ?? {}), logoURL: null, logoPath: null },
          }
        : p,
    );

    try {
      setSavingLogo(true);
      await removeSellerLogo(uid);

      const fresh = await getUserProfile(uid);
      if (fresh) {
        setProfile(fresh);
        setLogoUri((fresh?.seller?.logoURL ?? "").toString());
      }
      console.log("✅ Seller logo removed");
    } catch (e) {
      setLogoUri(prevLogo);
      setProfile((p) =>
        p ? { ...p, seller: { ...(p.seller ?? {}), logoURL: prevLogo } } : p,
      );
      console.log("❌ Failed to remove seller logo:", e);
    } finally {
      setSavingLogo(false);
    }
  };

  const confirmRemoveLogo = () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller?.logoURL || savingLogo) return;

    Alert.alert(
      "Supprimer le logo ?",
      "Cette action supprimera le logo actuel de votre boutique.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: handleRemovePhoto },
      ],
      { cancelable: true },
    );
  };

  const handleRemoveAddress = async () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller?.addressText || savingField === "addressText")
      return;

    const prevAddress = addressText;
    const prevProfile = profile;

    setAddressText("");
    setProfile((p) =>
      p ? { ...p, seller: { ...(p.seller ?? {}), addressText: null } } : p,
    );

    try {
      setSavingField("addressText");
      await removeSellerAddress(uid);

      const fresh = await getUserProfile(uid);
      if (fresh) {
        setProfile(fresh);
        setAddressText((fresh?.seller?.addressText ?? "").toString());
      }

      console.log("✅ Seller address removed");
    } catch (e) {
      setAddressText(prevAddress);
      setProfile(prevProfile);
      console.log("❌ Failed to remove seller address:", e);
    } finally {
      setSavingField(null);
    }
  };

  const confirmRemoveAddress = () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller?.addressText || savingField === "addressText")
      return;

    Alert.alert(
      "Supprimer l'adresse ?",
      "Cette action supprimera l'adresse civique actuelle de votre épicerie.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: handleRemoveAddress,
        },
      ],
      { cancelable: true },
    );
  };

  const handleRemoveGps = async () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller.gps || savingField === "gps") return;

    const prevProfile = profile;

    setProfile((p) =>
      p ? { ...p, seller: { ...(p.seller ?? {}), gps: null } } : p,
    );

    try {
      setSavingField("gps");
      const fresh = await removeSellerGpsLocation(uid);
      if (fresh) {
        setProfile(fresh);
      }
      console.log("✅ Seller GPS removed");
    } catch (e) {
      setProfile(prevProfile);
      console.log("❌ Failed to remove seller GPS:", e);
    } finally {
      setSavingField(null);
    }
  };

  const confirmRemoveGps = () => {
    Keyboard.dismiss();
    if (!uid || !profile?.seller?.gps || savingField === "gps") return;

    Alert.alert(
      "Supprimer la position GPS ?",
      "Cette action supprimera la position GPS actuelle de votre épicerie",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: handleRemoveGps },
      ],
      { cancelable: true },
    );
  };
  const updateGps = () => {
    navigation.navigate("SellerLocationPicker", {
      initialLocation: profile?.seller?.gps ?? null,
    });
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

          {/*Logo */}
          <View style={styles.visualWrap}>
            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                {!!logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.logoImg}
                  ></Image>
                ) : (
                  <View style={styles.logoFallback}>
                    <MaterialIcons
                      name="storefront"
                      size={42}
                      color={COLORS.primary}
                    ></MaterialIcons>
                  </View>
                )}
                {savingLogo && (
                  <View style={styles.logoLoadingOverlay}>
                    <ActivityIndicator size="small"></ActivityIndicator>
                  </View>
                )}
              </View>
              <Pressable
                style={[styles.logoEditBtn, savingLogo && { opacity: 0.7 }]}
                hitSlop={10}
                onPress={pickAndSaveLogo}
                disabled={savingLogo}
              >
                <MaterialIcons
                  name="edit"
                  size={16}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>
            {!!logoUri && (
              <Pressable
                style={styles.removeLogoBtn}
                onPress={confirmRemoveLogo}
                hitSlop={10}
                disabled={savingLogo}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={16}
                  color="#ef4444"
                ></MaterialIcons>
                <Text style={styles.removeLogoText}>Supprimer le logo</Text>
              </Pressable>
            )}
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
                savingField === "storeName" && { opacity: 0.7 },
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
                  placeholder="Numéro, Rue, Ville. Ex : 4605 Avenue Walkley"
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

              {!!profile?.seller?.addressText && (
                <Pressable
                  style={styles.removeAddressBtn}
                  onPress={confirmRemoveAddress}
                  hitSlop={10}
                  disabled={savingField === "addressText"}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={16}
                    color="#ef4444"
                  ></MaterialIcons>
                  <Text style={styles.removeAddressText}>
                    Supprimer l'adresse
                  </Text>
                </Pressable>
              )}
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

            {!!profile?.seller?.gps && (
              <View style={styles.gpsRemoveWrap}>
                <Pressable
                  style={styles.removeGpsBtn}
                  onPress={confirmRemoveGps}
                  hitSlop={10}
                  disabled={savingField === "gps"}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={16}
                    color="#ef4444"
                  ></MaterialIcons>
                  <Text style={styles.removeGpsText}>
                    {savingField === "gps"
                      ? "Suppression..."
                      : "Supprimer la position GPS"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Map preview */}
          <View style={styles.mapPreview}>
            <MapView
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              region={mapRegion}
              provider="google"
            >
              {!!mapCoord && <Marker coordinate={mapCoord}></Marker>}
            </MapView>
            {!mapCoord && (
              <View style={styles.mapEmptyOverlay}>
                <MaterialIcons
                  name="location-off"
                  size={22}
                  color={COLORS.text}
                ></MaterialIcons>
                <Text style={styles.mapEmptyText}>
                  Aucune position GPS enregistrée
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <Pressable
            style={styles.rulesCard}
            onPress={() => setRulesVisible(true)}
          >
            <View style={styles.rulesCardLeft}>
              <View style={styles.rulesIconWrap}>
                <MaterialIcons
                  name="info-outline"
                  size={22}
                  color={COLORS.primary}
                ></MaterialIcons>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rulesTitle}>Règles et consignes</Text>
                <Text style={styles.rulesSub}>
                  Lire les bonnes pratiques pour maximiser votre visibilité
                  auprès des clients
                </Text>
              </View>
            </View>
          </Pressable>

          <Text style={styles.lastUpdate}>
            {lastUpdated
              ? `Dernière mise à jour : ${formatDateFr(lastUpdated)}`
              : "Dernière mise à jour : -"}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <SellerRulesModal
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
      ></SellerRulesModal>
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
  visualWrap: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
  },
  logoWrap: {
    position: "relative",
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.bg,
    borderWidth: 4,
    borderColor: COLORS.bg,
    borderRadius: 999,
    overflow: "hidden",
  },
  logoEditBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  logoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  centerHeader: { alignItems: "center", marginTop: 16 },
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
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardNoPad: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.surface,
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
    borderTopColor: COLORS.border,
    backgroundColor: "rgba(255,215,4,0.14)",
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
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    overflow: "hidden",
  },
  mapEmptyOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  mapEmptyText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
  removeLogoBtn: {
    marginTop: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },
  removeLogoText: { fontSize: 12, fontWeight: "800", color: "#ef4444" },
  logoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 148, 5, 0.1)",
  },
  removeAddressBtn: {
    marginTop: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },
  removeAddressText: { fontSize: 12, fontWeight: "800", color: "#ef4444" },
  gpsRemoveWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  removeGpsBtn: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },
  removeGpsText: { fontSize: 12, fontWeight: "800", color: "#ef4444" },
  rulesCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rulesCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rulesIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,4,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },
  rulesSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: COLORS.muted,
  },
});
