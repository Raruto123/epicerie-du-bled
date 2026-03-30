import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  Keyboard,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { ActivityIndicator } from "react-native";
import { fetchProductsBySellerId } from "../../services/sellerProductsService";
import { auth } from "../../lib/firebase";
import {
  subscribeUserFavorites,
  toggleFavoriteProduct,
} from "../../services/userService";
import { onAuthStateChanged } from "firebase/auth";
import FavButton from "../../components/favButton";
import GroceryStoreHeader from "../../components/groceryStoreHeader";
import NoLocationToast from "../../components/noLocationToast";
import { normalizeText } from "../../utils/normalizeText";
import { PRODUCT_FALLBACK_IMAGE } from "../../constants/fallbackImages";

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
  console.log(route.params);
  const insets = useSafeAreaInsets();
  const grocery = route?.params?.grocery ?? null;
  const userLocation = route?.params?.userLocation ?? null;

  const groceryId = grocery?.id ?? "g-0";
  const groceryName = grocery?.name ?? "Épicerie";
  const groceryAddress = grocery?.address ?? null;
  const groceryDistance =
    grocery?.distanceKm == null ? null : Number(grocery.distanceKm);
  const groceryDesc = grocery?.description ?? "Aucune description kgjgjg";

  const logoSource = useMemo(() => {
    return grocery?.photoURL ? { uri: grocery.photoURL } : null;
  }, [grocery?.photoURL]);

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);

  const [uid, setUid] = useState(null);

  const [favIdsSet, setFavIdsSet] = useState(new Set());

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const favIdsRef = useRef(new Set());

  const showToast = useCallback((message, type = "info") => {
    setToast({ visible: true, message, type });
  }, []);

  function openMapsForGrocery({ gps, address }) {
    const hasCoords =
      gps &&
      gps.latitude != null &&
      gps.longitude != null &&
      !Number.isNaN(Number(gps.latitude)) &&
      !Number.isNaN(Number(gps.longitude));

    let url = "";
    if (hasCoords) {
      const lat = Number(gps.latitude);
      const lng = Number(gps.longitude);

      url =
        Platform.OS === "ios"
          ? `https://maps.apple.com/?q=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (address?.trim()) {
      const q = encodeURIComponent(address.trim());
      url =
        Platform.OS === "ios"
          ? `https://maps.apple.com/?q=${q}`
          : `https://www.google.com/maps/search/?api=1&query=${q}`;
    } else {
      showToast(
        "L'épicier n'a spécifié aucune localisation. Impossible d'ouvrir la carte.",
        "error",
      );
      return;
    }
    Linking.openURL(url).catch((e) => {
      console.log("❌ openMapsForGrocery failed:", e?.message ?? e);
      showToast("Impossible d'ouvrir l'application de cartes.", "error")
    });
  }
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;

    const unsubFav = subscribeUserFavorites({
      uid,
      cb: ({ favIdsSet }) => {
        const nextSet =
          favIdsSet instanceof Set ? favIdsSet : new Set(favIdsSet || []);
        // ✅ IMPORTANT: clone pour éviter Set muté / référence identique
        favIdsRef.current = new Set(nextSet);

        console.log(
          "fav ids sample:",
          Array.from(favIdsRef.current).slice(0, 5),
        );

        // ✅ patch direct sur items -> pas de loading, pas de refetch
        setItems((prev) =>
          prev.map((p) => ({ ...p, isFav: favIdsRef.current.has(p.id) })),
        );
      },
    });

    return unsubFav;
  }, [uid]);

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

        console.log(
          "first items ids:",
          list.slice(0, 5).map((x) => x.id),
        );

        setItems(
          list.map((p) => ({ ...p, isFav: favIdsRef.current.has(p.id) })),
        );
      } catch (e) {
        console.log("❌ fetchProductsBySellerId failed:", e?.message ?? e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [groceryId, userLocation]); // ✅ pas de favIdsSet

  const onToggleFav = useCallback(
    async (item) => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.log("⚠️ user not logged in");
        return;
      }

      const prev = !!item.isFav;
      setItems((prevItems) =>
        prevItems.map((p) => (p.id === item.id ? { ...p, isFav: !prev } : p)),
      );

      const productSnapshot = {
        id: item.id,
        name: item.name ?? null,
        price: item.price ?? null,
        inStock: !!item.inStock,
        cat: item.cat ?? null,
        photoURL: item.photoURL ?? null,
        desc: item.desc ?? null,
        distanceKm: item.distanceKm ?? null,

        sellerId: groceryId,
        sellerName: groceryName,
        sellerAddress: groceryAddress,
        sellerLogoURL: grocery?.photoURL ?? null,
        sellerGps: grocery?.gps ?? null,

        createdAt: item.createdAt ?? null,
      };

      try {
        const res = await toggleFavoriteProduct({
          uid,
          product: productSnapshot,
        });
        setItems((prevItems) =>
          prevItems.map((p) =>
            p.id === item.id ? { ...p, isFav: !!res.isFav } : p,
          ),
        );
      } catch (e) {
        console.log(
          "❌ toggleFavorite from GroceryStore failed:",
          e?.message ?? e,
        );
        setItems((prevItems) =>
          prevItems.map((p) => (p.id === item.id ? { ...p, isFav: prev } : p)),
        );
      }
    },
    [groceryId, groceryName, groceryAddress, grocery, setItems],
  );

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
    const q = normalizeText(query);
    if (!q) return items;
    return items.filter((p) => {
      const name = normalizeText(p?.name);
      const cat = normalizeText(p?.cat);
      const price = String(p?.price ?? "");
      return (
        name.includes(q) || cat.includes(q) || price.includes(q)
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
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hRow}
          ItemSeparatorComponent={() => <View style={{ width: 12 }}></View>}
          renderItem={({ item }) => {
            const inStock = !!item.inStock;
            return (
              <Pressable
                style={[styles.hCard, !inStock && { opacity: 0.8 }]}
                onPress={() => openProduct(item)}
              >
                <View style={[styles.hImgWrap, !inStock && styles.pImgWrapOut]}>
                    <Image
                      source={item.photoURL ? { uri: item.photoURL } : PRODUCT_FALLBACK_IMAGE}
                      style={[styles.pImg, !inStock && styles.pImgOut]}
                    />

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
                  <FavButton
                    isFav={item.isFav}
                    onPress={() => onToggleFav(item)}
                  ></FavButton>
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
          ListHeaderComponent={
            <GroceryStoreHeader
              groceryAddress={groceryAddress}
              groceryDesc={groceryDesc}
              navigation={navigation}
              groceryId={groceryId}
              groceryName={groceryName}
              groceryDistance={groceryDistance}
              logoSource={logoSource}
              query={query}
              setQuery={setQuery}
              onPressMap={() =>
                openMapsForGrocery({
                  gps: grocery?.gps,
                  address: groceryAddress,
                })
              }
            ></GroceryStoreHeader>
          }
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
      <NoLocationToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        bottom={96 + insets.bottom}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      ></NoLocationToast>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

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
    backgroundColor: "rgba(255,215,4,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.35)",
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
  badgeGreen: { backgroundColor: COLORS.primary },
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
    borderColor: COLORS.border,
  },
  favBtnActive: {
    borderColor: "rgba(6,105,3,0.28)",
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
  hRow: {
    paddingRight: 16, // pour que le dernier item respire
  },

  hCard: {
    width: 170, // ajuste selon ton design
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  hImgWrap: {
    width: "100%",
    aspectRatio: 1, // carré comme avant
    backgroundColor: "#f3f4f6",
  },
});
