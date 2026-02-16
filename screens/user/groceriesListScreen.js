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
import { useFocusEffect } from "@react-navigation/native";
import { GroceriesHeader } from "../../components/groceriesListHeader";
import { GroceriesFiltersModal } from "../../components/groceriesListFiltersModal";

export default function GroceriesListScreen({
  navigation,
  userLocation,
  locationStatus,
}) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [query, setQuery] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [nearBy, setNearBy] = useState(null);
  const DEFAULT_NEAR = null;

  const loadGroceries = useCallback(
    async ({ soft = false } = {}) => {
      if (locationStatus !== "granted" || !userLocation) {
        if (!soft) setLoading(false);
        return;
      }

      // ✅ 1ère fois = loader plein écran
      // ✅ soft = on ne touche pas loading, on garde l’UI
      if (groceries.length === 0 && !soft) setLoading(true);
      else if (soft) setRefreshing(true);

      try {
        const list = await fetchGroceriesList({
          pageSize: 50,
          userLocation,
        });
        setGroceries(list);
      } catch (e) {
        console.log("❌ fetchGroceriesList failed :", e?.message ?? e);
        if (groceries.length === 0) setGroceries([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userLocation, locationStatus, groceries.length],
  );

  useEffect(() => {
    //initial
    loadGroceries({ soft: false });
  }, [loadGroceries]);

  useFocusEffect(
    useCallback(() => {
      //à chaque retour sur l'écran
      loadGroceries({ soft: true });
      return () => {};
    }, [loadGroceries]),
  );

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
      console.log("voici g =", g);
    },
    [navigation, userLocation],
  );

  const headerEl = useMemo(() => {
    return (
      <GroceriesHeader
        query={query}
        setQuery={setQuery}
        hasActiveFilters={hasActiveFilters}
        onOpenFilters={() => setShowFilters(true)}
      ></GroceriesHeader>
    );
  });

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
          <MaterialIcons
            name="map"
            size={12}
            color={COLORS.muted}
          ></MaterialIcons>
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
            ListHeaderComponent={headerEl}
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
        <GroceriesFiltersModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          nearBy={nearBy}
          setNearBy={setNearBy}
          hasActiveFilters={hasActiveFilters}
          onReset={() => setNearBy(DEFAULT_NEAR)}
          onApply={() => {
            console.log("apply filters:", { nearBy });
          }}
        ></GroceriesFiltersModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  locWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontSize: 12, fontWeight: "800", color: "#71717a" },
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
});
