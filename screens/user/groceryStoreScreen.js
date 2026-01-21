import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  Keyboard,
  TextInput,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { ActivityIndicator } from "react-native";
import { fetchProductsBySellerId } from "../../services/sellerProductsService";

// ✅ Catégories style "sections"
const SECTION_ORDER = [
  "Tubercules",
  "Épices & Condiments",
  "Légumes",
  "Poissons",
];

function formatPrice(x) {
  const n = Number(x ?? 0);
  return n.toFixed(2).replace(".00", ".00");
}

export default function GroceryStoreScreen({ navigation, route }) {
  console.log(route.params)
  const insets = useSafeAreaInsets();
  const grocery = route?.params?.grocery ?? null;
  const userLocation = route?.params?.userLocation ?? null;

  const groceryId = grocery?.id ?? "g-0";
  const groceryName = grocery?.name ?? "Épicerie";
  const groceryAddress = grocery?.address ?? "Adresse inconnue";
  const groceryDistance =
    grocery?.distanceKm == null ? null : Number(grocery.distanceKm);
  const groceryDesc = grocery?.description ?? "Aucune description kgjgjg";

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchProductsBySellerId({
          sellerId: groceryId,
          userLocation,
        });
        if (!alive) return;
        setItems(list.map((p) => ({ ...p })));
      } catch (e) {
        console.log("❌ fetchProductsBySellerId failed:", e?.message ?? e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
  }, [groceryId]);

  const toggleFav = useCallback((id) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFav: !p.isFav } : p)),
    );
  }, []);

  const openProduct = useCallback(
    (p) => {
      navigation.navigate("ProductDetails", {
        product: p,
        userLocation,
      });
    },
    [navigation, userLocation],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const name = (p?.name ?? "").toLowerCase();
      const cat = (p?.cat ?? "").toLowerCase();
      return (
        name.includes(q) || cat.includes(q) || String(p.price ?? "").includes(q)
      );
    });
  }, [items, query]);

  // ✅ group by category into sections
  const sections = useMemo(() => {
    const map = new Map();
    for (const product of filtered) {
      const k = product.cat || "Autres";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(product);
    }

    const orderedKeys = [
      ...SECTION_ORDER.filter((k) => map.has(k)),
      ...Array.from(map.keys()).filter((k) => !SECTION_ORDER.includes(k)),
    ];

    return orderedKeys.map((k) => ({ key: k, items: map.get(k) || [] }));
  }, [filtered]);

  const ListHeader = () => (
    <View>
      {/* Header top white */}
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
              color={COLORS.text}
            ></MaterialIcons>
          </Pressable>
        </View>
        {/* Store identity */}
        <View style={styles.identityWrap}>
          <View style={styles.logoOuter}>
            {!!grocery?.photoURL ? (
              <Image
                source={{ uri: grocery.photoURL }}
                style={styles.logoImg}
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

      {/* Main content spacing */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
        {/* Location card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <MaterialIcons
              name="location-on"
              size={26}
              color={COLORS.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.locationKicker}>Localisation</Text>
            <Text style={styles.locationAddr} numberOfLines={2}>
              {groceryAddress}
            </Text>
            <Text style={styles.locationSub}>
              {groceryDistance == null
                ? "Distance inconnue"
                : `À ${groceryDistance.toFixed(1)} km de votre position`}{" "}
            </Text>
          </View>

          <Pressable
            style={styles.mapBtn}
            onPress={() => {
              // ✅ plus tard: ouvrir maps
              console.log("open map for grocery:", groceryId);
            }}
            hitSlop={10}
          >
            <MaterialIcons name="map" size={18} color="#71717a" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un produit dans cette boutique..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <MaterialIcons name="close" size={18} color="#71717a" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  const renderSection = ({ item: section }) => {
    const data = section.items || [];
    if (!data.length) return null;

    return (
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.key}</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{data.length} articles</Text>
          </View>
        </View>

        {/* Grid 2 colonnes */}
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          numColumns={2}
          scrollEnabled={false} // important: c'est la liste parent qui scroll
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => {
            const inStock = !!item.inStock;
            return (
              <Pressable
                style={[styles.pCard, !inStock && { opacity: 0.8 }]}
                onPress={() => openProduct(item)}
              >
                <View style={[styles.pImgWrap, !inStock && styles.pImgWrapOut]}>
                  {!!item.photoURL ? (
                    <Image
                      source={{ uri: item.photoURL }}
                      style={[styles.pImg, !inStock && styles.pImgOut]}
                    />
                  ) : (
                    <View style={styles.pImg} />
                  )}

                  {/* Badge stock */}
                  <View style={styles.badgeWrap}>
                    <View
                      style={[
                        styles.badge,
                        inStock ? styles.badgeGreen : styles.badgeRed,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {inStock ? "En stock" : "Rupture"}
                      </Text>
                    </View>
                  </View>

                  {/* Fav btn */}
                  <Pressable
                    style={[styles.favBtn, item.isFav && styles.favBtnActive]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFav(item.id);
                    }}
                    hitSlop={10}
                  >
                    <MaterialIcons
                      name={item.isFav ? "favorite" : "favorite-border"}
                      size={16}
                      color={item.isFav ? COLORS.primary : "#71717a"}
                    />
                  </Pressable>
                </View>

                <View style={styles.pBody}>
                  <Text style={styles.pTitle} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.pBottomRow}>
                    <Text style={styles.pPrice}>
                      {formatPrice(item.price)}${" "}
                      <Text style={styles.pUnit}>{item.unit || ""}</Text>
                    </Text>
                    <Text style={styles.pDist}>
                      {item.distanceKm == null
                        ? "-"
                        : `${Number(item.distanceKm).toFixed(1)} km`}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          renderItem={renderSection}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="inventory-2" size={28} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Aucun produit</Text>
              <Text style={styles.emptySub}>Essaie une autre recherche</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header block
  headerShell: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  identityWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoOuter: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: "white",
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
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
    color: "#71717a",
    fontWeight: "700",
  },

  // Location card
  locationCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(214,86,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(214,86,31,0.12)",
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
    color: "#71717a",
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  // Search
  searchBox: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: "800", color: COLORS.text },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(214,86,31,0.10)",
    borderWidth: 1,
    borderColor: "rgba(214,86,31,0.16)",
  },
  countPillText: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },

  // Grid
  gridRow: { gap: 12 },
  pCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  pImgWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#f3f4f6" },
  pImgWrapOut: { opacity: 0.92 },
  pImg: { width: "100%", height: "100%" },
  pImgOut: { opacity: 0.78 },

  badgeWrap: { position: "absolute", left: 10, bottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeGreen: { backgroundColor: "#22c55e" },
  badgeRed: { backgroundColor: "#ef4444" },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  favBtnActive: {
    borderColor: "rgba(214,86,31,0.22)",
  },

  pBody: { padding: 12, gap: 6 },
  pTitle: { fontSize: 13, fontWeight: "900", color: COLORS.text },
  pBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  pPrice: { color: COLORS.primary, fontSize: 14, fontWeight: "900" },
  pUnit: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  pDist: { fontSize: 10, fontWeight: "800", color: "#9ca3af" },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 44,
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
