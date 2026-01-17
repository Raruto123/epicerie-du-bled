import { act, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [localtionLabel] = useState("Montréal, QC");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Tout");

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  //Simulation now but Later with Firestore
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      //simulate network
      await new Promise((r) => setTimeout(r, 450));
      const next = makeMockProducts(page, 10);

      //example : stop after 8 pages
      const nextPage = page + 1;
      if (nextPage >= 8) setHasMore(false);

      setItems((prev) => [...prev, ...next]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  useEffect(() => {
    //first load
    (async () => {
      setInitialLoading(true);
      setItems([]);
      setPage(0);
      setHasMore(true);

      await new Promise((r) => setTimeout(r, 400));
      setItems(makeMockProducts(0, 10));
      setPage(1);
      setInitialLoading(false);
    })();
  }, []);

  //filter locally with cat + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((p) => {
      const matchCat = activeCat === "Tout" ? true : true; //set up real cat later
      const matchQuery =
        !q ||
        (p.name ?? "").toLowerCase().includes(q) ||
        String(p.price ?? "").includes(q);

      return matchCat && matchQuery;
    });
  }, [items, activeCat, query]);

  const renderHeader = () => {
    return (
      <View>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <Pressable style={styles.locationRow} onPress={() => {}}>
            <MaterialIcons
              name="location-on"
              size={18}
              color={COLORS.primary}
            ></MaterialIcons>
            <Text style={styles.locationText} numberOfLines={1}>
              {localtionLabel}
            </Text>
          </Pressable>
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
            <Pressable onPress={() => {}} style={styles.filterBtn} hitSlop={10}>
              <MaterialIcons
                name="tune"
                size={18}
                color={COLORS.primary}
              ></MaterialIcons>
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
      <Pressable style={styles.card} onPress={() => {}}>
        {/* Favorite button (UI only pour l'instant) */}
        <Pressable style={styles.favBtn} onPress={() => {}} hitSlop={10}>
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
              {Number(item.distanceKm ?? 0).toFixed(1)} km
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
            // IMPORTANT: en prod, on déclenche sur la liste "items" (pas filtered)
            // Ici on garde simple.
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  locationRow: {
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
  center:{flex:1, alignItems:"center", justifyContent:"center"},
  footerLoading:{paddingVertical:16, alignItems:"center"},
  footerEnd:{paddingVertical:16, alignItems:"center"},
  footerEndText:{
    fontSize:12,
    fontWeight:"800",
    color:"#9ca3af"
  }
});
