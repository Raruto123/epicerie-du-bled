import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native";
import { fetchGroceriesList } from "../../services/userService";

function FiltersModal({
  visible,
  onClose,
  nearBy,
  setNearBy,
  onApply,
  hasActiveFilters,
  onReset,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* Bottom sheet */}
        <Pressable style={styles.sheet} onPress={(e) => e?.stopPropagation?.()}>
          {/* Handle */}
          <View style={styles.sheetHandle}></View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text style={styles.sheetTitle}>Trier par</Text>

                {hasActiveFilters && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Filtres actifs</Text>
                  </View>
                )}
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Pressable
                onPress={onReset}
                disabled={!hasActiveFilters}
                style={[
                  styles.resetBtn,
                  !hasActiveFilters && styles.resetBtnDisabled,
                ]}
                hitSlop={10}
              >
                <MaterialIcons
                  name="restart-alt"
                  size={20}
                  color={!hasActiveFilters ? "#9ca3af" : COLORS.primary}
                />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={styles.sheetCloseBtn}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={22} color={COLORS.muted} />
              </Pressable>
            </View>
          </View>

          {/* Proximity only */}
          <Text style={[styles.sheetSectionKicker, { marginTop: 6 }]}>
            Distance
          </Text>

          <View style={styles.nearGrid}>
            <Pressable
              onPress={() => setNearBy("near")}
              style={[
                styles.nearCard,
                nearBy === "near" ? styles.nearCardActive : styles.nearCardIdle,
              ]}
            >
              <MaterialIcons
                name="near-me"
                size={20}
                color={nearBy === "near" ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={[
                  styles.nearText,
                  nearBy === "near"
                    ? styles.nearTextActive
                    : styles.nearTextIdle,
                ]}
              >
                Plus proche
              </Text>
              {nearBy === "near" && (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={COLORS.primary}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => setNearBy("far")}
              style={[
                styles.nearCard,
                nearBy === "far" ? styles.nearCardActive : styles.nearCardIdle,
              ]}
            >
              <MaterialIcons
                name="social-distance"
                size={20}
                color={nearBy === "far" ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={[
                  styles.nearText,
                  nearBy === "far"
                    ? styles.nearTextActive
                    : styles.nearTextIdle,
                ]}
              >
                Plus loin
              </Text>
              {nearBy === "far" && (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={COLORS.primary}
                />
              )}
            </Pressable>
          </View>

          {/* Apply */}
          <Pressable
            style={styles.applyBtn}
            onPress={() => {
              onApply?.();
              onClose?.();
            }}
          >
            <Text style={styles.applyBtnText}>Appliquer les filtres</Text>
          </Pressable>

          <View style={{ height: Platform.OS === "ios" ? 6 : 0 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
export default function GroceriesListScreen({ navigation, userLocation, locationStatus }) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [groceries, setGroceries] = useState([]);
  const [query, setQuery] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [nearBy, setNearBy] = useState(null);
  const DEFAULT_NEAR = null;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchGroceriesList({
          pageSize: 50,
          userLocation
        });
        if (!alive) return;
        setGroceries(list);
      } catch (e) {
        console.log("❌ fetchGroceriesList failed:", e?.message ?? e);
        if (alive) setGroceries([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const hasActiveFilters = useMemo(() => nearBy !== DEFAULT_NEAR, [nearBy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = groceries.filter((g) => {
      if (!q) return true;
      const name = (g?.name ?? "").toLowerCase();
      const address = (g?.address ?? "").toLowerCase();
      return name.includes(q) || address.includes(q);
    });

    const sorted = [...base];
    if (nearBy === "near")
      sorted.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    if (nearBy === "far")
      sorted.sort((a, b) => (b.distanceKm ?? 0) - (a.distanceKm ?? 0));

    return sorted;
  }, [groceries, query, nearBy]);

  const onOpenGrocery = useCallback(
    (g) => {
      navigation.navigate("GroceryStore", { grocery: g, userLocation });
      console.log("open grocery:", g?.id);
      console.log('voici g =', g)
    },
    [navigation, userLocation],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title row */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Liste des épiceries</Text>
      </View>
      {/* Search */}
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
            placeholder="Chercher une épicerie..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
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
          {/* tune icon */}
          <Pressable
            style={[styles.tuneBtn, hasActiveFilters && styles.filterBtnActive]}
            onPress={() => {
              Keyboard.dismiss();
              setShowFilters(true);
              // ✅ plus tard: ouvrir modal filtres
            }}
            hitSlop={10}
          >
            <MaterialIcons
              name="tune"
              size={18}
              color={hasActiveFilters ? "white" : COLORS.primary}
            ></MaterialIcons>
            {hasActiveFilters && <View style={styles.filterDot}></View>}
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <Pressable style={styles.card} onPress={() => onOpenGrocery(item)}>
      <View style={styles.cardImgWrap}>
        {!!item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.cardImg}></Image>
        ) : (
          <View style={styles.cardImg}></View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.addrRow}>
          <MaterialIcons name="map" size={12} color={COLORS.muted}></MaterialIcons>
          <Text style={styles.addrText} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
        <View style={styles.distRow}>
          <MaterialIcons
            name="near-me"
            size={12}
            color={COLORS.primary}
          ></MaterialIcons>
          <Text style={styles.distText}>
            {Number(item.distanceKm ?? 0).toFixed(1)} km
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small"></ActivityIndicator>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(x) => x.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.colWrap}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              // ✅ plus tard: pagination / infinite scroll Firestore
              console.log("load more groceries…");
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialIcons
                  name="storefront"
                  size={28}
                  color={COLORS.muted}
                ></MaterialIcons>
                <Text style={styles.emptyTitle}>Aucune épicerie trouvée</Text>
                <Text style={styles.emptySub}>
                  Essaie avec un autre mot-clé
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }}></View>}
          ></FlatList>
        )}
        <FiltersModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          nearBy={nearBy}
          setNearBy={setNearBy}
          hasActiveFilters={hasActiveFilters}
          onReset={() => setNearBy(DEFAULT_NEAR)}
          onApply={() => {
            console.log("apply filters:", { nearBy });
          }}
        ></FiltersModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  locWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontSize: 12, fontWeight: "800", color: "#71717a" },

  searchWrap: { paddingBottom: 2 },
  searchBox: {
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  tuneBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,105,3,0.10)",
  },

  colWrap: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 0,
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardImgWrap: {
    width: "100%",
    height: 112, // ~ h-28
    backgroundColor: COLORS.bg,
  },
  cardImg: { width: "100%", height: "100%" },

  cardBody: { padding: 12, flex: 1, gap: 6 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },
  addrRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  addrText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 14,
  },
  distRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distText: { fontSize: 10, fontWeight: "900", color: COLORS.primary },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 22,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    textAlign: "center",
  },
  // ✅ Modal (copié de HomeScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  sheetHandle: {
    width: 52,
    height: 6,
    borderRadius: 99,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetSectionKicker: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  nearGrid: { flexDirection: "row", gap: 12 },
  nearCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nearCardActive: {
    backgroundColor: "rgba(6,105,3,0.08)",
    borderColor: "rgba(6,105,3,0.22)",
  },
  nearCardIdle: { backgroundColor: COLORS.bg, borderColor: "transparent" },
  nearText: { fontSize: 13 },
  nearTextActive: { fontWeight: "900", color: COLORS.text },
  nearTextIdle: { fontWeight: "800", color: COLORS.text },

  applyBtn: {
    marginTop: 18,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  applyBtnText: { color: "white", fontSize: 15, fontWeight: "900" },

  // ✅ indicateur filtre actif sur le bouton tune
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "white",
  },

  // ✅ badge + reset
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,215,4,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.35)",
  },
  activeBadgeText: { fontSize: 11, fontWeight: "900", color: COLORS.primary},
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,105,3,0.10)",
    borderWidth: 1,
    borderColor: "rgba(6,105,3,0.18)",
  },
  resetBtnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: COLORS.border,
  },
});
