import { Linking, Platform, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { StyleSheet } from "react-native";
import { Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useCallback, useState } from "react";
import NoLocationToast from "../../components/noLocationToast";
import { PRODUCT_FALLBACK_IMAGE } from "../../constants/fallbackImages";
import { useTranslation } from "react-i18next";
import { CATEGORY_LABEL_TO_KEY } from "../../constants/productCategories";

/** ---------- UI subcomponents ---------- */
function ImageCard({ uri }) {
  return (
    <View style={styles.imgCard}>
      <Image
        source={uri ? { uri } : PRODUCT_FALLBACK_IMAGE}
        style={styles.img}
      ></Image>
    </View>
  );
}

function CompareRow({ label, left, right, variant, t }) {
  const isHighlight = variant === "highlight";

  return (
    <View style={[styles.row, isHighlight && styles.rowHighlight]}>
      <View style={styles.rowLabelOverlay} pointerEvents="none">
        <View
          style={[
            styles.rowLabelPill,
            isHighlight && styles.rowLabelPillHighlight,
          ]}
        >
          <Text
            style={[styles.rowLabel, isHighlight && styles.rowLabelHighlight]}
          >
            {label}
          </Text>
        </View>
      </View>
      <View style={styles.cellLeft}>{left}</View>
      <View style={styles.cellRight}>{right}</View>
    </View>
  );
}

function StockPill({ inStock, t }) {
  const ok = !!inStock;
  return (
    <View style={styles.centerRow}>
      <View style={[styles.dot, ok ? styles.dotGreen : styles.dotRed]}></View>
      <Text
        style={[styles.stockText, ok ? styles.stockGreen : styles.stockRed]}
      >
        {ok ? t("common.inStock") : t("common.outOfStock")}
      </Text>
    </View>
  );
}

function DistancePill({ km, t }) {
  const hasDistance = km != null && !Number.isNaN(Number(km));
  return (
    <View style={styles.centerRow}>
      <MaterialIcons
        name="location-on"
        size={16}
        color={COLORS.muted}
      ></MaterialIcons>
      <Text style={styles.valueText}>
        {hasDistance
          ? t("compare.distanceValue", { distance: Number(km).toFixed(1) })
          : t("compare.unknownDistance")}
      </Text>
    </View>
  );
}

function SellerBlock({ name, address, t }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.sellerName} numberOfLines={1}>
        {name || t("compare.defaultStore")}
      </Text>
      <Text style={styles.sellerSub} numberOfLines={1}>
        {address || t("compare.addressNotProvided")}
      </Text>
    </View>
  );
}
export default function CompareScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const first = route?.params?.first ?? null;
  const second = route?.params?.second ?? null;

  const safeFirst = first ?? {};
  const safeSecond = second ?? {}

  console.log("first = ", first);
  console.log("second = ", second);

  const getLocalizedCategory = (label) => {
    if (!label) return t("categories.autres");
    const key = CATEGORY_LABEL_TO_KEY[label];
    return key ? t(`categories.${key}`) : label
  }

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((message, type = "info") => {
    setToast({ visible: true, message, type });
  }, []);

  function openMapsForCompare({ gps, address }) {
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

      // url =
      //   Platform.OS === "ios"
      //     ? `https://maps.apple.com/?q=${lat},${lng}`
      //     : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (address?.trim()) {
      const q = encodeURIComponent(address.trim());

      // url =
      //   Platform.OS === "ios"
      //     ? `https://maps.apple.com/?q=${q}`
      //     : `https://www.google.com/maps/search/?api=1&query=${q}`;
      url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    } else {
      showToast(
        t("compare.noLocationToast"),
        "error",
      );
      return;
    }

    Linking.openURL(url).catch((e) => {
      console.log("❌ openMapsForCompare failed:", e?.message ?? e);
      showToast(t("compare.openMapsError"), "error");
    });
  }

  if (!first || !second) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      <View style={[styles.center, { paddingHorizontal: 24 }]}>
        <Text style={styles.valueText}>{t("compare.missingProducts")}</Text>
      </View>
    </SafeAreaView>
  );
}
  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: 10 + insets.top }]}>
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
        <Text style={styles.topTitle} numberOfLines={1}>
          {t("compare.title")}
        </Text>
        {/* Spacer right to center title */}
        <View style={{ width: 40 }}></View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 26 + insets.bottom }}
      >
        {/* Image row */}
        <View style={styles.imagesGrid}>
          <ImageCard uri={safeFirst.photoURL}></ImageCard>
          <ImageCard uri={safeSecond.photoURL}></ImageCard>
        </View>
        {/* Secion header */}
        <View style={styles.sectionStrip}>
          <Text style={styles.sectionStripTitle}>{t("compare.analysis")}</Text>
        </View>
        {/* Rows */}
        <View style={styles.rowsWrap}>
          <CompareRow
            label={t("compare.labels.name")}
            left={<Text style={styles.valueText}>{safeFirst.name}</Text>}
            right={<Text style={styles.valueText}>{safeSecond.name}</Text>}
          ></CompareRow>
          <CompareRow
            label={t("compare.labels.price")}
            variant="highlight"
            left={
              <View style={styles.priceCell}>
                <Text style={[styles.priceText, { color: COLORS.primary }]}>
                  {t("compare.priceValue", { price: Number(safeFirst?.price ?? 0).toFixed(2) })}
                </Text>
              </View>
            }
            right={
              <View style={styles.priceCell}>
                <Text style={[styles.priceText, { color: COLORS.primary }]}>
                  {t("compare.priceValue", { price: Number(safeSecond?.price ?? 0).toFixed(2) })}
                </Text>
              </View>
            }
          ></CompareRow>
          <CompareRow
            label={t("compare.labels.stock")}
            left={<StockPill inStock={safeFirst.inStock} t={t}></StockPill>}
            right={<StockPill inStock={safeSecond.inStock} t={t}></StockPill>}
          ></CompareRow>
          <CompareRow
            label={t("compare.labels.distance")}
            left={<DistancePill km={safeFirst.distanceKm} t={t}></DistancePill>}
            right={<DistancePill km={safeSecond.distanceKm} t={t}></DistancePill>}
          ></CompareRow>
          <CompareRow
            label={t("compare.labels.store")}
            left={
              <SellerBlock
                name={safeFirst.sellerName}
                address={safeFirst.sellerAddress}
              t={t}></SellerBlock>
            }
            right={
              <SellerBlock
                name={safeSecond.sellerName}
                address={safeSecond.sellerAddress}
              t={t}></SellerBlock>
            }
          ></CompareRow>
          {/* Buttons row */}
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.routeBtnPressed,
              ]}
              onPress={() =>
                openMapsForCompare({
                  gps: safeFirst?.sellerGps,
                  address: safeFirst?.sellerAddress,
                })
              }
            >
              <MaterialIcons
                name="directions"
                size={20}
                color="white"
              ></MaterialIcons>
              <Text style={styles.primaryBtnText} numberOfLines={1}>
                {t("compare.itinerary")}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.routeBtnPressed,
              ]}
              onPress={() =>
                openMapsForCompare({
                  gps: safeSecond?.sellerGps,
                  address: safeSecond?.sellerAddress,
                })
              }
            >
              <MaterialIcons
                name="directions"
                size={20}
                color={COLORS.primary}
              ></MaterialIcons>
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                {t("compare.itinerary")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  center: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
},
  safe: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(248,250,248,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },

  imagesGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  imgCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  img: { width: "100%", height: "100%", backgroundColor: COLORS.bg },

  sectionStrip: {
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,215,4,0.12)",
  },
  sectionStripTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  rowsWrap: { paddingBottom: 10 },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: "relative",
    overflow: "visible",
  },
  rowHighlight: { backgroundColor: "rgba(255,215,4,0.12)" },

  rowLabelOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  rowLabelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.muted,
    letterSpacing: 1.2,
  },
  rowLabelPillHighlight: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.55)",
  },
  rowLabelHighlight: { color: COLORS.text },

  cellLeft: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 45,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  cellRight: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 45,
    alignItems: "center",
  },

  valueText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  priceCell: { alignItems: "center" },
  priceText: { fontSize: 20, fontWeight: "900" },
  miniMuted: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
  },

  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  dot: { width: 8, height: 8, borderRadius: 99 },
  dotGreen: { backgroundColor: COLORS.primary },
  dotRed: { backgroundColor: "#ef4444" },

  stockText: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  stockGreen: { color: COLORS.primary },
  stockRed: { color: "#ef4444" },

  sellerName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    maxWidth: 150,
  },
  sellerSub: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    fontStyle: "italic",
    textAlign: "center",
    maxWidth: 150,
  },

  btnRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryBtnText: { color: "white", fontSize: 13, fontWeight: "900" },

  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,215,4,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.55)",
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },
  routeBtnPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
