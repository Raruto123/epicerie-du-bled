import { act, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { Pressable, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "react-native";
import { fetchProductsPage } from "../../services/sellerProductsService";
import { auth } from "../../lib/firebase";
import { toggleFavoriteProduct } from "../../services/userService";

//mock categories
const cats = [
  { key: "Tout", emoji: null },
  { key: "Épices", emoji: "🌶️" },
  { key: "Céréales", emoji: "🌾" },
  { key: "Tubercules", emoji: "🍠" },
  { key: "Légumes", emoji: "🍆" },
  { key: "Poissons", emoji: "🐟" },
];

//mock data
function makeMockProducts(page = 0, size = 10) {
  const base = page * size;
  const samples = [
    {
      name: "Plantain Mûr",
      price: 1.99,
      distanceKm: 1.2,
      inStock: true,
      cat: "Poissons",
      photoURL:
        "https://images.unsplash.com/photo-1603048297172-c92544798d3a?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Attiéké Premium",
      price: 5.5,
      distanceKm: 2.5,
      inStock: true,
      photoURL:
        "https://images.unsplash.com/photo-1604909053196-6f1e8b9e3c7f?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Poisson Fumé",
      price: 12.0,
      distanceKm: 0.8,
      inStock: false,
      photoURL:
        "https://images.unsplash.com/photo-1548946526-f69e2424cf45?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Huile de Palme",
      price: 8.99,
      distanceKm: 3.1,
      inStock: true,
      photoURL:
        "https://images.unsplash.com/photo-1604908176997-125b5bd7be3d?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return Array.from({ length: size }).map((_, i) => {
    const s = samples[(base + i) % samples.length];
    return {
      id: `mock-${base + i}`,
      ...s,
      //pseudo variations
      price: Number((s.price + ((base + i) % 3) * 0.3).toFixed(2)),
    };
  });
}
export default function HomeScreen({
  navigation,
  locationStatus,
  locationLabel,
  onPressLocation,
  userLocation,
  favIds,
  refreshKey,
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Tout");

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("price_low"); //price_low||price_high
  const [nearBy, setNearBy] = useState(null); //null|near|far
  const DEFAULT_SORT = "price_low";
  const DEFAULT_NEAR = null;

  const [refreshing, setRefreshing] = useState(false);
  const didLoadOnceRef = useRef(false);
  const blockEndReachedRef = useRef(true)

  //Simulation now but Later with Firestore
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const res = await fetchProductsPage({
        pageSize: 10,
        cursor,
        cat: activeCat,
        userLocation: locationStatus === "granted" ? userLocation : null,
      });

      const mapped = res.items.map((p) => ({ ...p, isFav: favIds?.has(p.id) }));
      setItems((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const p of mapped) map.set(p.id, p);
        return Array.from(map.values())
      });
      setCursor(res.cursor);
      setHasMore(res.hasMore);
    } catch (e) {
      console.log("❌ fetchNextPage failed :", e?.message ?? e);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    cursor,
    activeCat,
    userLocation,
    locationStatus,
    favIds,
  ]);

  // useEffect(() => {
  //   //first load
  //   (async () => {
  //     setInitialLoading(true);
  //     setItems([]);
  //     setCursor(null);
  //     setHasMore(true);

  //     try {
  //       const res = await fetchProductsPage({
  //         pageSize: 10,
  //         cursor: null,
  //         cat: activeCat,
  //         userLocation: locationStatus === "granted" ? userLocation : null,
  //       });
  //       const mapped = res.items.map((p) => ({
  //         ...p,
  //         isFav: favIds?.has(p.id),
  //       }));
  //       setItems(mapped);
  //       setCursor(res.cursor);
  //       setHasMore(res.hasMore);
  //     } catch (e) {
  //       console.log("❌ fetchProductsPage failed :", e?.message ?? e);
  //       setItems([]);
  //       setHasMore(false);
  //     } finally {
  //       setInitialLoading(false);
  //     }
  //   })();
  // }, [activeCat, userLocation, locationStatus, favIds]);

  //filter locally with cat + search+ filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = items.filter((p) => {
      const matchCat = activeCat === "Tout" ? true : true;
      const matchQuery =
        !q ||
        (p.name ?? "").toLowerCase().includes(q) ||
        String(p.price ?? "").includes(q);
      return matchCat && matchQuery;
    });

    const sorted = [...base];

    if (sortBy === "price_low")
      sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === "price_high")
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (nearBy === "near")
      sorted.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    if (nearBy === "far")
      sorted.sort((a, b) => (b.distanceKm ?? 0) - (a.distanceKm ?? 0));

    return sorted;
  }, [items, activeCat, query, sortBy, nearBy]);

  const onOpenProduct = useCallback(
    (product) => {
      navigation.navigate("ProductDetails", { product });
    },
    [navigation],
  );

  const onToggleFav = useCallback(async (product) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.log("⚠️ user not logged in");
      return;
    }

    const productId = product.id;

    //optimistic UI
    setItems((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isFav: !p.isFav } : p)),
    );

    try {
      const res = await toggleFavoriteProduct({ uid, product });
      //sync favIds
      // setFavIds((prevSet) => {
      //   const next = new Set(prevSet);
      //   if (res.isFav) next.add(productId);
      //   else next.delete(productId);
      //   return next;
      // });
    } catch (e) {
      console.log("❌ toggleFavorite failed :", e?.message ?? e);
      //rollback
      setItems((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isFav: !p.isFav } : p)),
      );
    }
  }, []);

  const hasActiveFilters = useMemo(() => {
    return sortBy !== DEFAULT_SORT || nearBy !== DEFAULT_NEAR;
  }, [sortBy, nearBy]);

  useEffect(() => {
    if (!favIds) return;
    setItems((prev) => prev.map((p) => ({ ...p, isFav: favIds.has(p.id) })));
  }, [favIds]);

  const refreshProducts = useCallback(
    async ({ soft = false } = {}) => {
      const first = !didLoadOnceRef.current;
      blockEndReachedRef.current = true;
      if (first) {
        setInitialLoading(true);
        setItems([]);
      } else {
        if (!soft) setRefreshing(true);
      }

      setCursor(null);
      setHasMore(true);

      try {
        const res = await fetchProductsPage({
          pageSize: 10,
          cursor: null,
          cat: activeCat,
          userLocation: locationStatus === "granted" ? userLocation : null,
        });

        const mapped = res.items.map((p) => ({
          ...p,
          isFav: false,
        }));
        setItems(mapped);
        setCursor(res.cursor);
        setHasMore(res.hasMore);

        didLoadOnceRef.current = true;
      } catch (e) {
        console.log("❌ refreshProducts failed :", e?.message ?? e);
        if (first) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
        setTimeout(() => {
          blockEndReachedRef.current = false
        }, 0)
      }
    },
    [activeCat, locationStatus, userLocation],
  );

  useEffect(() => {
    refreshProducts({soft : true});
  }, [activeCat, locationStatus, userLocation, refreshKey, refreshProducts]);

  const onPullRefresh = useCallback(() => {
    refreshProducts();
  }, [refreshProducts])

  const renderHeader = () => {
    return (
      <View>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <Pressable
            style={styles.locationPill}
            onPress={onPressLocation}
            hitSlop={10}
          >
            <MaterialIcons
              name={
                locationStatus === "granted"
                  ? "location-on"
                  : "location-disabled"
              }
              size={18}
              color={locationStatus === "granted" ? COLORS.primary : "#9ca3af"}
            ></MaterialIcons>
            <Text
              style={[
                styles.locationText,
                locationStatus !== "granted" && { color: "#9ca3af" },
              ]}
              numberOfLines={1}
            >
              {locationStatus === "granted"
                ? locationLabel
                : "Aucune localisation"}
            </Text>
          </Pressable>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={20}
            color={COLORS.text}
          ></MaterialIcons>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <MaterialIcons
              name="search"
              size={18}
              color="#71717a"
            ></MaterialIcons>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Attiéké, igname, épices..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              returnKeyType="search"
            ></TextInput>
            {!!query && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color="#71717a"
                ></MaterialIcons>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setShowFilters(true);
              }}
              style={[
                styles.filterBtn,
                hasActiveFilters && styles.filterBtnActive,
              ]}
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

        {/* Categories horizontal */}
        <View style={styles.catsWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={cats}
            keyExtractor={(x) => x.key}
            contentContainerStyle={styles.catsContent}
            renderItem={({ item }) => {
              const active = item.key === activeCat;
              return (
                <Pressable
                  onPress={() => setActiveCat(item.key)}
                  style={[
                    styles.catPill,
                    active ? styles.catPillActive : styles.catPillIdle,
                  ]}
                >
                  {!!item.emoji && (
                    <Text style={styles.catEmoji}>{item.emoji}</Text>
                  )}
                  <Text
                    style={[
                      styles.catText,
                      active ? styles.catTextActive : styles.catTextIdle,
                    ]}
                  >
                    {item.key}
                  </Text>
                </Pressable>
              );
            }}
          ></FlatList>
        </View>

        {/* Section title */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionKicker}>Produits ({filtered.length})</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const inStock = !!item.inStock;
    return (
      <Pressable style={styles.card} onPress={() => onOpenProduct(item)}>
        {/* ✅ Favorite button : bloque le clic carte */}
        <Pressable
          style={styles.favBtn}
          onPress={(e) => {
            e?.stopPropagation?.();
            onToggleFav(item);
          }}
          hitSlop={10}
        >
          <MaterialIcons
            name={item.isFav ? "favorite" : "favorite-border"}
            size={18}
            color={item.isFav ? COLORS.primary : "#71717a"}
          ></MaterialIcons>
        </Pressable>
        {/* Image */}
        <View style={styles.imgWrap}>
          {!!item.photoURL ? (
            <Image
              source={{ uri: item.photoURL }}
              style={[styles.img, !inStock && styles.imgOut]}
            ></Image>
          ) : (
            <View style={styles.img}></View>
          )}
          <View style={styles.stockBadgeWrap}>
            <View
              style={[
                styles.stockBadge,
                inStock ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text style={styles.stockBadgeText}>
                {inStock ? "En stock" : "Rupture"}
              </Text>
            </View>
          </View>
        </View>
        {/* Content */}
        <View style={[styles.cardBody, !inStock && { opacity: 0.65 }]}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <MaterialIcons
              name="location-on"
              size={12}
              color="#71717a"
            ></MaterialIcons>
            <Text style={styles.metaText}>
              {item.distanceKm == null
                ? "-"
                : `${Number(item.distanceKm).toFixed(1)} km`}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, !inStock && { color: "#71717a" }]}>
              ${Number(item.price ?? 0).toFixed(2)}{" "}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  function FiltersModal({
    visible,
    onClose,
    sortBy,
    setSortBy,
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
        {/* OVerlay */}
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          {/* Bottom sheet */}
          <Pressable
            style={styles.sheet}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {/* Handle */}
            <View style={styles.sheetHandle}></View>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
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
                  <MaterialIcons name="close" size={22} color="#71717a" />
                </Pressable>
              </View>
            </View>
            {/* Prix */}
            <Text style={styles.sheetSectionKicker}>Prix</Text>
            <Pressable
              onPress={() => setSortBy("price_low")}
              style={[
                styles.choiceRow,
                sortBy === "price_low"
                  ? styles.choiceRowActive
                  : styles.choiceRowIdle,
              ]}
            >
              <View style={styles.choiceLeft}>
                <MaterialIcons
                  name="arrow-upward"
                  size={18}
                  color={sortBy === "price_low" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.choiceText,
                    sortBy === "price_low"
                      ? styles.choiceTextActive
                      : styles.choiceTextIdle,
                  ]}
                >
                  Prix le plus bas
                </Text>
              </View>
              {sortBy === "price_low" ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => setSortBy("price_high")}
              style={[
                styles.choiceRow,
                sortBy === "price_high"
                  ? styles.choiceRowActive
                  : styles.choiceRowIdle,
              ]}
            >
              <View style={styles.choiceLeft}>
                <MaterialIcons
                  name="arrow-downward"
                  size={18}
                  color={sortBy === "price_high" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.choiceText,
                    sortBy === "price_high"
                      ? styles.choiceTextActive
                      : styles.choiceTextIdle,
                  ]}
                >
                  Prix le plus haut
                </Text>
              </View>
              {sortBy === "price_high" ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
              ) : null}
            </Pressable>

            {/* Proximity */}
            <Text style={[styles.sheetSectionKicker, { marginTop: 18 }]}>
              Proximité
            </Text>

            <View style={styles.nearGrid}>
              <Pressable
                onPress={() => setNearBy("near")}
                style={[
                  styles.nearCard,
                  nearBy === "near"
                    ? styles.nearCardActive
                    : styles.nearCardIdle,
                ]}
              >
                <MaterialIcons
                  name="near-me"
                  size={20}
                  color={nearBy === "near" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
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
                  nearBy === "far"
                    ? styles.nearCardActive
                    : styles.nearCardIdle,
                ]}
              >
                <MaterialIcons
                  name="social-distance"
                  size={20}
                  color={nearBy === "far" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
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
                {nearBy === "near" && (
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

            {/* Petit padding IOS */}
            <View style={{ height: Platform.OS === "ios" ? 6 : 0 }}></View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      {/* FlatList 2 columns + infinite scroll */}
      {initialLoading ? (
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
          contentContainerStyle={{ paddingBottom: 18 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
              console.log("onEndReached", { initialLoading, refreshing, block: blockEndReachedRef.current });
            if (initialLoading || refreshing) return;
            if (blockEndReachedRef.current) return;
            fetchNextPage();
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small"></ActivityIndicator>
              </View>
            ) : !hasMore ? (
              <View style={styles.footerEnd}>
                <Text style={styles.footerEndText}>Fin des produits</Text>
              </View>
            ) : (
              <View style={{ height: 10 }}></View>
            )
          }
        ></FlatList>
      )}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        nearBy={nearBy}
        setNearBy={setNearBy}
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setSortBy(DEFAULT_SORT);
          setNearBy(DEFAULT_NEAR);
        }}
        onApply={() => {
          refreshProducts();
          // MVP: on ne fait que log, mais tu peux déclencher un tri réel ici
          console.log("apply filters:", { sortBy, nearBy });
        }}
      ></FiltersModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 240,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    maxWidth: 180,
  },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(214,86,31,0.10)",
  },
  catsWrap: { paddingTop: 4, paddingBottom: 10 },
  catsContent: { paddingHorizontal: 16, gap: 10, paddingRight: 16 },
  catPill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillIdle: { backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" },
  catEmoji: { fontSize: 16 },
  catText: { fontSize: 13, fontWeight: "900" },
  catTextActive: { color: "white" },
  catTextIdle: { color: COLORS.text },
  sectionRow: { paddingHorizontal: 16, paddingBottom: 10 },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  colWrap: { paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  imgWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#f3f4f6" },
  img: { width: "100%", height: "100%" },
  imgOut: { opacity: 0.75 },
  stockBadgeWrap: { position: "absolute", left: 10, bottom: 10 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeGreen: { backgroundColor: "#22c55e" },
  badgeRed: { backgroundColor: "#ef4444" },
  stockBadgeText: { color: "white", fontSize: 10, fontWeight: "900" },
  cardBody: { padding: 12, gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: "900", color: COLORS.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10, fontWeight: "800", color: "#71717a" },
  priceRow: { marginTop: 2 },
  price: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  footerLoading: { paddingVertical: 16, alignItems: "center" },
  footerEnd: { paddingVertical: 16, alignItems: "center" },
  footerEndText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9ca3af",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    // shadow "modal"
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
    backgroundColor: "#d1d5db",
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
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sheetSectionKicker: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#71717a",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  choiceRow: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 2,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceRowActive: {
    backgroundColor: "rgba(249,115,22,0.10)",
    borderColor: "rgba(249,115,22,0.22)",
  },
  choiceRowIdle: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
  choiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  choiceText: { fontSize: 14 },
  choiceTextActive: { fontWeight: "900", color: COLORS.text },
  choiceTextIdle: { fontWeight: "800", color: COLORS.text },

  nearGrid: {
    flexDirection: "row",
    gap: 12,
  },
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
    backgroundColor: "rgba(249,115,22,0.10)",
    borderColor: "rgba(249,115,22,0.22)",
  },
  nearCardIdle: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
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
  applyBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  // Active filterS
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#22c55e", // vert comme "actif"
    borderWidth: 2,
    borderColor: "white",
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#16a34a",
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
  },
  resetBtnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "rgba(0,0,0,0.06)",
  },
});
