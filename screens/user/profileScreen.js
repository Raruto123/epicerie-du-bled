import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
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
//import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  getUserProfile,
  pickProfilePicture,
  updateProfileName,
  uploadPictureImage,
  updateProfilePhoto,
  replaceProfilePhoto,
  logout,
} from "../../services/profileService";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const uid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [pictureUri, setPictureUri] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const current = auth.currentUser;
        if (!current?.uid) {
          if (alive) {
            setProfile(null);
            setName("");
          }
          return;
        }

        const p = await getUserProfile(current.uid);
        if (!alive) return;

        setProfile(p);
        setPictureUri((p?.photoURL ?? "").toString());
        setName((p?.name ?? "").toString());
      } catch (e) {
        if (!alive) return;
        setProfile(null);
        setName("");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const goSellerSpace = () => {
    navigation.navigate("SellerBoard"); //à voir si je mets navigate ou replace;
  };

  const saveName = async () => {
    Keyboard.dismiss();
    if (!uid) return;

    const nextName = name.trim();
    if (!nextName) return;

    // Optimistic UI update
    const prevName = profile?.name ?? "";
    setProfile((prev) => (prev ? { ...prev, name: nextName } : prev));

    setSaving(true);
    try {
      await updateProfileName(uid, nextName);

      // Re-fetch from Firestore to confirm what was saved
      const fresh = await getUserProfile(uid);
      if (fresh) {
        setProfile(fresh);
        setName((fresh.name ?? "").toString());
      }

      console.log("✅ Name updated in Firestore:", nextName);
    } catch (e) {
      // Rollback UI if write fails
      setProfile((prev) => (prev ? { ...prev, name: prevName } : prev));
      setName(prevName);
      console.log("❌ Failed to update name in Firestore:", e);
    } finally {
      setSaving(false);
    }
  };

  const pickAndSavePhoto = async () => {
    Keyboard.dismiss();
    if (!uid) return;

    try {
      const picked = await pickProfilePicture();
      if (!picked?.uri) return;
      // ✅ 1) Afficher tout de suite l'image en local (optimistic UI)
      setPictureUri(picked.uri);
      // ✅ 2) Upload la photo pickée (PAS pictureUri)
      const finalURL = await replaceProfilePhoto(uid, picked.uri);
    // sync UI (afficher l’URL distante après)
    setPictureUri(finalURL);
    setProfile((p) => (p ? {...p, photoURL : finalURL} : p));

      console.log("✅ Photo de profile remplacé et sauvegardé dans Firebase : ", finalURL);
    } catch (e) {
      console.log("❌pick and saving profile photo error :", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("Auth"); 
    } catch (e) {
      console.log("❌ logout error :", e);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content"></StatusBar>
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
              <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
          )}
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.topTitle}>Mon Profil</Text>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {!!pictureUri && (
                  <Image
                    source={{ uri: pictureUri }}
                    style={styles.avatarImg}
                  ></Image>
                )}
              </View>
              <Pressable
                style={styles.cameraBtn}
                hitSlop={10}
                onPress={pickAndSavePhoto}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={18}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>

            <View style={styles.profileText}>
              <Text style={styles.name}>{profile?.name ?? ""}</Text>
              <Text style={styles.email}>{profile?.email ?? ""}</Text>
            </View>
          </View>

          {/* Seller card (ONLY IF seller) */}
          {profile?.isSeller && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerCardLeft}>
                <View style={styles.sellerKickerRow}>
                  <MaterialIcons
                    name="storefront"
                    size={18}
                    color={COLORS.primary}
                  ></MaterialIcons>
                  <Text style={styles.sellerKicker}>ESPACE VENDEUR</Text>
                </View>

                <Text style={styles.sellerTitle}>Gérez votre boutique</Text>
                <Text style={styles.sellerDesc}>
                  Ouvrer votre épicerie en ligne et toucher des milliers de
                  clients
                </Text>

                <Pressable onPress={goSellerSpace} style={styles.sellerBtn}>
                  <Text style={styles.sellerBtnText}>Accéder</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="white"
                  ></MaterialIcons>
                </Pressable>
              </View>

              <View style={styles.sellerCardRight}></View>
            </View>
          )}

          {/* Infos persos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
            <View style={styles.card}>
              <Text style={styles.labelSmall}>NOM D'AFFICHAGE</Text>

              <View style={styles.inputRow}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.nameInput}
                  placeholder="Votre nom"
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  placeholderTextColor={COLORS.muted}
                ></TextInput>
                <MaterialIcons
                  name="edit"
                  size={18}
                  color={COLORS.muted}
                ></MaterialIcons>
              </View>

              <Pressable
                onPress={saveName}
                disabled={saving}
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color="white"></ActivityIndicator>
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Préférences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Préférences</Text>
            <View style={styles.listCard}>
              <Pressable style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIcon}>
                    <MaterialIcons
                      name="language"
                      size={22}
                      color={COLORS.text}
                    ></MaterialIcons>
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Langue</Text>
                    <Text style={styles.rowSub}>Langue de l'interface</Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>Français (CA)</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={COLORS.muted}
                  ></MaterialIcons>
                </View>
              </Pressable>

              <View style={styles.divider}></View>

              <Pressable style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIcon}>
                    <MaterialIcons
                      name="notifications"
                      size={22}
                      color={COLORS.text}
                    ></MaterialIcons>
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>Notifications</Text>
                    <Text style={styles.rowSub}>Alertes de stock</Text>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={COLORS.muted}
                ></MaterialIcons>
              </Pressable>
            </View>
          </View>

          {/* Logout */}
          <View style={styles.footer}>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialIcons
                name="logout"
                size={20}
                color={COLORS.primary}
              ></MaterialIcons>
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </Pressable>

            <Text style={styles.version}>
              Version 0.0.1 ⚫️ AfroMarket Canada
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingHorizontal: 16 },
  topBar: { flexDirection: "row", paddingTop: 6, paddingBottom: 12 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "#EEF2EE",
    borderWidth: 4,
    borderColor: COLORS.surface,
    overflow:"hidden",
  },
  avatarImg:{
    width:"100%",
    height:"100%"
  },
  cameraBtn: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  profileText: { marginTop: 12, alignItems: "center" },
  name: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  email: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
  },
  sellerCard: {
    flexDirection: "row",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  sellerCardLeft: { flex: 1, padding: 16 },
  sellerCardRight: { width: 86, backgroundColor: "rgba(255,215,4,0.18)" },
  sellerKickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sellerKicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: COLORS.primary,
  },
  sellerTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  sellerDesc: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 18,
  },
  sellerBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  sellerBtnText: { color: "white", fontWeight: "900" },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 10,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.muted,
  },
  inputRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    paddingVertical: 8,
  },
  saveBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.8 },
  saveBtnText: { color: "white", fontWeight: "900" },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowItem: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(6,105,3,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  rowSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 12, fontWeight: "800", color: COLORS.muted },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  footer: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  logoutBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#fFF4CC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth:1,
    borderColor:"rgba(255,215,4,0.35)"
  },
  logoutText: { fontWeight: "800", color: COLORS.text },
  version: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
  },
});
