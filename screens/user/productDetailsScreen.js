import {
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
import { useMemo, useState } from "react";
import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
// Petit helper (MVP) : ouvrir Google Maps / Apple Maps
function openMapsWithAddress(address) {
  const q = encodeURIComponent(address ?? "");
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/Search/?api=1&query=${q}`;
  Linking.openURL(url).catch(() => {});
}
// mock “produits similaires”
function makeSimilarProducts(seed = "x") {
  const imgs = [
    "https://images.unsplash.com/photo-1603048297172-c92544798d3a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1548946526-f69e2424cf45?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604908176997-125b5bd7be3d?auto=format&fit=crop&w=800&q=80",
  ];
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `sim-${seed}-${i}`,
    name:
      i === 0
        ? "Gombo Découpé"
        : i === 1
          ? "Gombo Rouge"
          : i === 2
            ? "Gombo Bio"
            : i % 2 === 0
              ? "Piment Oiseau"
              : "Aubergine Africaine",
    price: Number((4.9 + i * 0.5).toFixed(2)),
    distanceKm: Number((0.8 + i * 0.6).toFixed(1)),
    photoURL: imgs[i % imgs.length],
  }));
}
export default function ProductDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  // ✅ on reçoit le produit depuis HomeScreen
  const product = route?.params.product ?? null;
  // fallback si jamais on arrive sans rien
  const data = useMemo(() => {
    const inStock = product?.inStock ?? true;
    return {
      id: product?.id ?? "p-0",
      name: product?.name ?? "Gombo Frais",
      cat: product?.cat ?? "Légumes",
      price: Number(product?.price ?? 4.99),
      inStock: !!inStock,
      photoURL:
        product?.photoURL ??
        "https://images.unsplash.com/photo-1604908176997-125b5bd7be3d?auto=format&fit=crop&w=1000&q=80",
      desc:
        product?.desc ??
        "Nos gombos sont sélectionnés à la main pour garantir leur fraîcheur et leur texture croquante. Idéal pour la préparation de sauces onctueuses ou fritures traditionnelles.",
      seller: {
        name: product?.sellerName ?? "Épicerie Mapouka",
        distanceKm: product?.sellerDistanceKm ?? 1.2,
        address:
          product?.sellerAddress ??
          "1234 Rue Saint-Hubert, Montréal, QC H2L 3Y7, Canada",
        logoURL:
          product?.sellerLogoURL ??
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
      },
      isFav: !!product?.isFav,
    };
  }, [product]);

  const [isFav, setIsFav] = useState(data.isFav);
  const similar = useMemo(() => makeSimilarProducts(data.id), [data.id]);

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
                <Text style={styles.sellerName} numberOfLines={1}>
                  {data.seller.name}
                </Text>
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
              <Pressable style={styles.secondaryBtn} onPress={() => {}}>
                <MaterialIcons
                  name="compare-arrows"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
                <Text style={styles.secondaryBtnText}>Comparer</Text>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.simRow}
          >
            {similar.map((p) => (
              <Pressable
                key={p.id}
                style={styles.simCard}
                onPress={() =>
                  navigation.push("ProductDetails", { product: p })
                }
              >
                <View style={styles.simImgWrap}>
                  {!!p.photoURL ? (
                    <Image source={{uri:p.photoURL}} style={styles.simImg}></Image>
                  ):(
                    <View style={styles.simImg}></View>
                  )}
                </View>
                <View style={styles.simBody}>
                  <Text style={styles.simTitle} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.simPrice}>
                    {p.price.toFixed(2).replace(".",",")} $
                  </Text>
                  <View style={styles.simMeta}>
                    <MaterialIcons name="near-me" size={12} color="#9ca3af"></MaterialIcons>
                    <Text style={styles.simMetaText}>
                      {Number(p.distanceKm ?? 0).toFixed(1)} km
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
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
});
