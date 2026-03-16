import { MaterialIcons } from "@expo/vector-icons";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";

export default function GroceryStoreHeader({
  navigation,
  groceryId,
  groceryName,
  groceryDesc,
  groceryAddress,
  groceryDistance,
  logoSource,
  query,
  setQuery,
  onPressMap,
}) {
  return (
    <View>
      <View style={styles.headerShell}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={10}
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={18}
              color={COLORS.primary}
            ></MaterialIcons>
          </Pressable>
        </View>
        <View style={styles.identityWrap}>
          <View style={styles.logoOuter}>
            {logoSource ? (
              <Image
                source={logoSource}
                style={styles.logoImg}
                fadeDuration={0}
              ></Image>
            ) : (
              <View style={styles.logoImg}></View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName} numberOfLines={2}>
              {groceryName}
            </Text>
          </View>
        </View>
        <Text style={styles.storeDesc}>{groceryDesc}</Text>
      </View>
      <View style={styles.infoWrap}>
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <MaterialIcons
              name="location-on"
              size={26}
              color={COLORS.primary}
            ></MaterialIcons>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationKicker}>Localisation</Text>
            <Text style={styles.locationAddr} numberOfLines={2}>
              {groceryAddress === null ? "Adresse non renseignée" : groceryAddress}
            </Text>
            <Text style={styles.locationSub}>
              {groceryDistance == null
                ? "Distance inconnue"
                : `À ${groceryDistance.toFixed(1)} km de votre position`}
            </Text>
          </View>

          <Pressable style={styles.mapBtn} onPress={onPressMap} hitSlop={10}>
            <MaterialIcons name="map" size={18} color="#71717a"></MaterialIcons>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <MaterialIcons
              name="search"
              size={18}
              color={COLORS.muted}
            ></MaterialIcons>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un produit de cette épicerie..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            ></TextInput>
            {!!query && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={COLORS.muted}
                ></MaterialIcons>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  identityWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoOuter: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },
  storeName: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    lineHeight: 26,
  },
  storeDesc: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
    fontWeight: "700",
  },
  infoWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  locationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,215,4,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.35)",
  },
  locationKicker: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  locationAddr: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },
  locationSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchWrap: { paddingTop: 12 },
  searchBox: {
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: "800", color: COLORS.text },
});
