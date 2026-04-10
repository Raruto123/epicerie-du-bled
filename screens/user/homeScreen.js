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
import FavButton from "../../components/favButton";
import { HomeHeader } from "../../components/homeHeader";
import FiltersModal from "../../components/homeScreenFiltersModal";
import { normalizeText } from "../../utils/normalizeText";
import { PRODUCT_FALLBACK_IMAGE } from "../../constants/fallbackImages";
import { CATEGORY_LABEL_TO_KEY, HOME_CATEGORIES } from "../../constants/productCategories";
import { useTranslation } from "react-i18next";

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
  const [activeCat, setActiveCat] = useState("all");

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(null); //null || price_low||price_high
  const [nearBy, setNearBy] = useState(null); //null|near|far
  const DEFAULT_SORT = null;
  const DEFAULT_NEAR = null;

  const [refreshing, setRefreshing] = useState(false);
  const didLoadOnceRef = useRef(false);
  const blockEndReachedRef = useRef(true);
  const mainListRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const favIdsRef = useRef(favIds ?? new Set());



  const { t } = useTranslation();

const localizedHomeCategories = useMemo(() => {
  return HOME_CATEGORIES.map((cat) => ({
    ...cat,
    label:
      cat.key === "all"
        ? t("home.categories.all")
        : t(`categories.${cat.key}`),
  }));
}, [t]);

useEffect(() => {
  favIdsRef.current = favIds ?? new Set();
}, [favIds])

  //Simulation now but Later with Firestore
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const res = await fetchProductsPage({
        pageSize: 10,
        cursor,
        cat: activeCat === "all" ? "Tout" : CATEGORY_LABEL_TO_KEY[activeCat],
        userLocation: locationStatus === "granted" ? userLocation : null,
      });

      const mapped = res.items.map((p) => ({
        ...p,
        isFav: favIdsRef.current ? favIdsRef.current.has(p.id) : false,
      }));
      setItems((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const p of mapped) map.set(p.id, p);
        return Array.from(map.values());
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

  //filter locally with cat + search+ filters
  const filtered = useMemo(() => {
    const q = normalizeText(query);

    const base = items.filter((p) => {
      const normalizedName = normalizeText(p.name);
      const normalizedPrice = normalizeText(p.price);
      const matchCat = activeCat === "all" ? true : p.cat === CATEGORY_LABEL_TO_KEY[activeCat];
      const matchQuery =
        !q || normalizedName.includes(q) || normalizedPrice.includes(q);
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
      navigation.push("ProductDetails", {
        product,
        userLocation: locationStatus === "granted" ? userLocation : null,
        favIdsArray: Array.from(favIds ?? []),
      });
      // console.log("voici product =", product);
    },
    [navigation, userLocation, locationStatus, favIds],
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
      const prevY = lastScrollYRef.current;

      try {
        const res = await fetchProductsPage({
          pageSize: 10,
          cursor: null,
          cat: activeCat === "all" ? "Tout" : CATEGORY_LABEL_TO_KEY[activeCat],
          userLocation: locationStatus === "granted" ? userLocation : null,
        });

        const mapped = res.items.map((p) => ({
          ...p,
          isFav: favIdsRef.current ? favIdsRef.current.has(p.id) : false,
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
        // ✅ Restore scroll position after data refresh (avoid jumping to top)
        requestAnimationFrame(() => {
          if (prevY > 0) {
            mainListRef.current?.scrollToOffset({
              offset: prevY,
              animated: false,
            });
          }
        });
        setRefreshing(false);
        setTimeout(() => {
          blockEndReachedRef.current = false;
        }, 0);
      }
    },
    [activeCat, locationStatus, userLocation],
  );

  useEffect(() => {
    refreshProducts({ soft: true });
  }, [activeCat, locationStatus, userLocation, refreshKey, refreshProducts]);

  const onPullRefresh = useCallback(() => {
    refreshProducts();
  }, [refreshProducts]);

  const renderItem = ({ item }) => {
    const inStock = !!item.inStock;
    return (
      <Pressable style={styles.card} onPress={() => onOpenProduct(item)}>
        {/* ✅ Favorite button : bloque le clic carte */}
        <FavButton
          isFav={item.isFav}
          onPress={() => onToggleFav(item)}
        ></FavButton>
        {/* Image */}
        <View style={styles.imgWrap}>
          <Image
            source={
              item.photoURL ? { uri: item.photoURL } : PRODUCT_FALLBACK_IMAGE
            }
            style={[styles.img, !inStock && styles.imgOut]}
          ></Image>
          <View style={styles.stockBadgeWrap}>
            <View
              style={[
                styles.stockBadge,
                inStock ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text style={styles.stockBadgeText}>
                {inStock ? t("common.inStock") : t("common.outOfStock")}
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      {/* FlatList 2 columns + infinite scroll */}
      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small"></ActivityIndicator>
        </View>
      ) : (
        <FlatList
          ref={mainListRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={(e) => {
            lastScrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          data={filtered}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.colWrap}
          ListHeaderComponent={
            <HomeHeader
              locationStatus={locationStatus}
              locationLabel={locationLabel}
              onPressLocation={onPressLocation}
              query={query}
              setQuery={setQuery}
              hasActiveFilters={hasActiveFilters}
              setShowFilters={setShowFilters}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              filteredCount={filtered.length}
              cats={localizedHomeCategories}
            ></HomeHeader>
          }
          contentContainerStyle={{ paddingBottom: 18 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            console.log("onEndReached", {
              initialLoading,
              refreshing,
              block: blockEndReachedRef.current,
            });
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
                <Text style={styles.footerEndText}>{t("home.endOfProducts")}</Text>
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
  colWrap: { paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  imgWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#f3f4f6" },
  img: { width: "100%", height: "100%" },
  imgOut: { opacity: 0.75 },
  stockBadgeWrap: { position: "absolute", left: 10, bottom: 10 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeGreen: { backgroundColor: COLORS.primary },
  badgeRed: { backgroundColor: "#ef4444" },
  stockBadgeText: { color: COLORS.surface, fontSize: 10, fontWeight: "900" },
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
});
