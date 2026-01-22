import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  fetchProductById,
  fetchSimilarProducts,
} from "../../services/sellerProductsService";
import { auth, db } from "../../lib/firebase";
import { toggleFavoriteProduct } from "../../services/userService";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  clearCompareProduct,
  getCompareProduct,
  setCompareProduct,
  subscribeCompareProduct,
} from "../../services/userCompareService";
import CompareBubble from "../../components/compareBubble";
// Petit helper (MVP) : ouvrir Google Maps / Apple Maps
function openMapsWithAddress(address) {
  const q = encodeURIComponent(address ?? "");
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/Search/?api=1&query=${q}`;
  Linking.openURL(url).catch(() => {});
}

export default function ProductDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  // ✅ on reçoit le produit depuis HomeScreen
  const productParam = route?.params.product ?? null;
  const userLocation = route?.params.userLocation ?? null;
  // console.log("product de productDetailsScreen :", productParam);

  const productId = productParam.id ?? null;

  const [product, setProduct] = useState(productParam);
  const [loadingProduct, setLoadingProduct] = useState(!productParam);

  const [similar, setSimilar] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState(null);

  const [compareProduct, setCompareProductState] = useState(null);
  useEffect(() => {
    const unsub = subscribeCompareProduct((p) => setCompareProductState(p));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!productId) return;
      if (!authReady) return;

      // ✅ si tu veux que le coeur reste correct, n'écrase pas isFav tant que uid inconnu
      if (!uid) return;

      setLoadingProduct(true);
      try {
        const full = await fetchProductById({ productId, userLocation, uid });
        if (!alive) return;

        if (full) {
          setProduct((prev) => {
            const prevFav = prev?.isFav;
            const nextFav =
              full?.isFav === undefined || full?.isFav === null
                ? prevFav
                : full.isFav;

            return {
              ...(prev ?? {}),
              ...full,
              isFav: nextFav, // ✅ protège le coeur
            };
          });
        }
        console.log("full.isFav =", full?.isFav);
      } catch (e) {
        console.log("❌ fetchProductById failed :", e?.message ?? e);
      } finally {
        if (alive) setLoadingProduct(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [productId, userLocation, authReady, uid]);

  // fallback si jamais on arrive sans rien
  const data = useMemo(() => {
    const p = product || {};
    const inStock = p?.inStock ?? true;
    return {
      id: p?.id ?? "p-0",
      name: p?.name ?? "Produit",
      cat: p?.cat ?? "Légumes",
      price: Number(p?.price ?? 4.99),
      inStock: !!inStock,
      photoURL:
        p?.photoURL ??
        "https://images.unsplash.com/photo-1604908176997-125b5bd7be3d?auto=format&fit=crop&w=1000&q=80",
      desc: p?.desc ?? "Aucune description bitch",
      seller: {
        id: p?.sellerId ?? null,
        name: p?.sellerName ?? "Épicerie",
        distanceKm: p?.distanceKm ?? 99.2,
        address:
          p?.sellerAddress ??
          "1234 Rue Saint-Hubert, Montréal, QC H2L 3Y7, Canada",
        logoURL:
          p?.sellerLogoURL ??
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
        description: p?.sellerDescription ?? null,
        gps: p?.sellerGps ?? null,
      },
      isFav: !!p?.isFav,
    };
  }, [product]);

  const isFav = !!data.isFav;

  //similar car
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!data?.cat) return;
      setLoadingSimilar(true);
      try {
        const list = await fetchSimilarProducts({
          cat: data.cat,
          excludeProductId: data.id,
          pageSize: 6,
          userLocation,
        });
        if (!alive) return;
        setSimilar(list);
      } catch (e) {
        console.log("❌ fetchSimilarProducts failed:", e?.message ?? e);
        if (alive) setSimilar([]);
      } finally {
        if (alive) setLoadingSimilar(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [data.cat, data.id, userLocation]);

  const onToggleFav = async () => {
    const uidNow = uid;
    if (!uidNow) {
      console.log("⚠️ user not logged in");
      return;
    }

    const productSnapshot = {
      id: data.id,
      name: data.name,
      price: data.price,
      inStock: data.inStock,
      cat: data.cat,
      photoURL: data.photoURL,
      desc: data.desc,
      distanceKm: data.seller.distanceKm ?? null,

      sellerId: data?.seller.id ?? null,
      sellerName: data?.seller?.name ?? null,
      sellerAddress: data?.seller?.address ?? null,
      sellerLogoURL: data?.seller?.logoURL ?? null,
      sellerGps: data?.seller?.gps ?? null,

      createdAt: product?.createdAt ?? null,
    };
    const prev = !!data.isFav;

    setProduct((p) => (p ? { ...p, isFav: !prev } : p));

    try {
      const res = await toggleFavoriteProduct({
        uid: uidNow,
        product: productSnapshot,
      });
      setProduct((p) => (p ? { ...p, isFav: !!res.isFav } : p));
    } catch (e) {
      console.log(
        "❌ toggleFavorite from ProductDetails failed:",
        e?.message ?? e,
      );
      setProduct((p) => (p ? { ...p, isFav: prev } : p));
    }
  };
  useEffect(() => {
    if (productParam?.isFav == null) return;
    setProduct((prev) => ({ ...(prev ?? {}), isFav: productParam.isFav }));
  }, [productParam?.id, productParam?.isFav]);
  useEffect(() => {
    console.log("ProductDetails params isFav =", route?.params?.product?.isFav);
  }, [route?.params?.product?.id]);

  const buildCompareSnapshot = () => ({
    id: data.id,
    name: data.name,
    price: data.price,
    inStock: data.inStock,
    cat: data.cat,
    photoURL: data.photoURL,
    desc: data.desc,
    distanceKm: data.seller?.distanceKm ?? null,

    sellerId: data?.seller?.id ?? null,
    sellerName: data?.seller?.name ?? null,
    sellerAddress: data?.seller?.address ?? null,
    sellerLogoURL: data?.seller?.logoURL ?? null,
    sellerGps: data?.seller?.gps ?? null,

    createdAt: product?.createdAt ?? null,
  });

  const onPressCompare = async () => {
    const snapshot = buildCompareSnapshot();
    const first = await getCompareProduct();
    // 1) pas de bulle -> on la crée
    if (!first) {
      await setCompareProduct(snapshot);
      return;
    }

    //  si même produit, on ignore
    if (first?.id === snapshot.id) {
      console.log("⚠️ ce produit est déjà sélectionné pour comparaison");
      return;
    }

    // 2) bulle déjà active -> on va vers écran comparaison (à faire après)
    // ⚠️ remplace "CompareScreen" par ton vrai nom de route quand tu le crées
    navigation.navigate("CompareScreen", {
      first,
      second: snapshot,
      userLocation,
    });
  };

  const compareActive = !!compareProduct;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      {/* <StatusBar */}
      {/* Top bar sticky */}
      <View style={[styles.nav, { paddingTop: 10 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.navBtn}
          hitSlop={10}
        >
          <MaterialIcons
            name="arrow-back-ios-new"
            size={18}
            color={COLORS.primary}
          ></MaterialIcons>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      >
        {/* Image hero */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            {!!data.photoURL ? (
              <Image
                source={{ uri: data.photoURL }}
                style={styles.heroImg}
              ></Image>
            ) : (
              <View style={styles.heroImg}></View>
            )}
            {/* Stock badge */}
            <View style={styles.stockPillWrap}>
              <View
                style={[
                  styles.stockPill,
                  data.inStock ? styles.stockPillGreen : styles.stockPillRed,
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    data.inStock ? styles.dotGreen : styles.dotRed,
                  ]}
                ></View>
                <Text
                  style={[
                    styles.stockPillText,
                    data.inStock ? { color: "#12b76a" } : { color: "#ef4444" },
                  ]}
                >
                  {data.inStock ? "En stock" : "Rupture"}
                </Text>
              </View>
            </View>
            {/* Fav button (top-right) */}
            <Pressable
              style={styles.heroFavBtn}
              onPress={onToggleFav}
              hitSlop={10}
            >
              <MaterialIcons
                name={isFav ? "favorite" : "favorite-border"}
                size={22}
                color={isFav ? COLORS.primary : "#71717a"}
              />
            </Pressable>
          </View>
        </View>
        {/* Title+CaT+price */}
        <View style={styles.titleSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1} numberOfLines={2}>
              {data.name}
            </Text>
            <View style={styles.catRow}>
              <View style={styles.catPill}>
                <Text style={styles.catPillText}>{data.cat}</Text>
              </View>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceText}>
              {data.price.toFixed(2).replace(".", ",")} $
            </Text>
          </View>
        </View>
        <View style={styles.divider}></View>
        {/* Seller */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Épicerie</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerTop}>
              <View style={styles.sellerLogo}>
                {!!data.seller.logoURL ? (
                  <Image
                    source={{ uri: data.seller.logoURL }}
                    style={styles.sellerLogoImg}
                  ></Image>
                ) : (
                  <View style={styles.sellerLogoImg}></View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() =>
                    navigation.navigate("GroceryStore", {
                      grocery: {
                        id: data.seller.id ?? `g-${data.id}`,
                        name: data.seller.name,
                        address: data.seller.address,
                        distanceKm: data.seller.distanceKm,
                        photoURL: data.seller.logoURL,
                        description: data.seller.description,
                        gps: data.seller.gps,
                      },
                      userLocation,
                    })
                  }
                  hitSlop={10}
                >
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {data.seller.name}
                  </Text>
                </Pressable>
                <View style={styles.sellerDistRow}>
                  <MaterialIcons
                    name="near-me"
                    size={14}
                    color={COLORS.primary}
                  ></MaterialIcons>
                  <Text style={styles.sellerDistText}>
                    À {Number(data.seller.distanceKm ?? 0).toFixed(1)} km de
                    vous
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.addrRow}>
              <MaterialIcons
                name="location-on"
                size={16}
                color="#6b7280"
              ></MaterialIcons>
              <Text style={styles.addrText}>{data.seller.address}</Text>
            </View>

            <View style={styles.sellerBtns}>
              <Pressable
                onPress={() => openMapsWithAddress(data.seller.address)}
                style={styles.primaryBtn}
              >
                <MaterialIcons
                  name="directions"
                  size={20}
                  color="white"
                ></MaterialIcons>
                <Text style={styles.primaryBtnText}>Itinéraire</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryBtn,
                  compareActive && styles.secondaryBtnActive,
                ]}
                onPress={onPressCompare}
              >
                <MaterialIcons
                  name="compare-arrows"
                  size={20}
                  color={compareActive ? "white" : COLORS.primary}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.secondaryBtnText,
                    compareActive && styles.secondaryBtnTextActive,
                  ]}
                >
                  Comparer
                </Text>
                {compareActive && <View style={styles.compareDot}></View>}
              </Pressable>
            </View>
          </View>
        </View>
        {/* DEscription */}
        <View style={[styles.section, { marginTop: 18 }]}>
          <Text style={styles.sectionKicker}>Description</Text>
          <Text style={styles.desc}>{data.desc}</Text>
        </View>
        {/* Similar products */}
        <View style={{ marginTop: 22 }}>
          <View style={styles.simHeader}>
            <Text style={styles.sectionKicker}>Produits similaires</Text>
            <Pressable onPress={() => {}} hitSlop={10}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </Pressable>
          </View>

          {loadingSimilar ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <ActivityIndicator size="small"></ActivityIndicator>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.simRow}
            >
              {similar.map((p) => {
                const inStock = !!p.inStock;
                return (
                  <Pressable
                    key={p.id}
                    style={styles.simCard}
                    onPress={() =>
                      navigation.push("ProductDetails", {
                        product: p,
                        userLocation,
                      })
                    }
                  >
                    <View style={styles.simImgWrap}>
                      {!!p.photoURL ? (
                        <Image
                          source={{ uri: p.photoURL }}
                          style={[styles.simImg, !inStock && { opacity: 0.8 }]}
                        ></Image>
                      ) : (
                        <View style={styles.simImg}></View>
                      )}
                      {/* Badge stock */}
                      <View
                        style={{ position: "absolute", left: 10, bottom: 10 }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: inStock ? "#22c55e" : "#ef4444",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 9,
                              fontWeight: "900",
                            }}
                          >
                            {inStock ? "En stock" : "Rupture"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.simBody}>
                      <Text style={styles.simTitle} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.simPrice}>
                        {Number(p.price ?? 0)
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        $
                      </Text>
                      <View style={styles.simMeta}>
                        <MaterialIcons
                          name="near-me"
                          size={12}
                          color="#9ca3af"
                        ></MaterialIcons>
                        <Text style={styles.simMetaText}>
                          {p.distanceKm == null
                            ? "-"
                            : `${Number(p.distanceKm).toFixed(1)} km`}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
      <CompareBubble
        product={compareProduct}
        topSafe={insets.top}
        tabBarHeight={80}
        onDropToTrash={async () => {
          await clearCompareProduct();
        }}
        onPress={() => {
          console.log("Bubble pressed");
        }}
      ></CompareBubble>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(248,247,246,0.90)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  navTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },

  heroWrap: { paddingHorizontal: 16, marginTop: 10 },
  heroCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroImg: { width: "100%", height: "100%" },

  stockPillWrap: { position: "absolute", left: 14, top: 14 },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
  },
  stockPillGreen: { borderColor: "rgba(18,183,106,0.25)" },
  stockPillRed: { borderColor: "rgba(239,68,68,0.25)" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: "#12b76a" },
  dotRed: { backgroundColor: "#ef4444" },
  stockPillText: { fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },

  titleSection: {
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  h1: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
    lineHeight: 34,
  },
  catRow: { flexDirection: "row", marginTop: 10 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(214,86,31,0.10)",
    borderWidth: 1,
    borderColor: "rgba(214,86,31,0.16)",
  },
  catPillText: { fontSize: 12, fontWeight: "900", color: COLORS.primary },

  priceBox: { alignItems: "flex-end" },
  priceText: { fontSize: 24, fontWeight: "900", color: COLORS.primary },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 16,
    marginTop: 18,
  },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionKicker: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  sellerCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sellerTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  sellerLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  sellerLogoImg: { width: "100%", height: "100%" },
  sellerName: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sellerDistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sellerDistText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    fontStyle: "italic",
  },

  addrRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  addrText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
    fontWeight: "700",
  },

  sellerBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "900", fontSize: 14 },

  desc: { color: "#374151", fontSize: 14, lineHeight: 21, fontWeight: "600" },

  simHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  simRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 10 },
  simCard: {
    width: 160,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  simImgWrap: { height: 128, backgroundColor: "#f3f4f6" },
  simImg: { width: "100%", height: "100%" },
  simBody: { padding: 12, gap: 6 },
  simTitle: { fontSize: 13, fontWeight: "900", color: COLORS.text },
  simPrice: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  simMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  simMetaText: { fontSize: 11, fontWeight: "800", color: "#9ca3af" },
  heroFavBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  secondaryBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondaryBtnTextActive: {
    color: "white",
  },
  compareDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#22c55e",
    position: "absolute",
    top: 10,
    right: 10,
    borderWidth: 2,
    borderColor: "white",
  },
});
