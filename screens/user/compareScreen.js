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

function openMapsWithAddress(address) {
  const q = encodeURIComponent(address ?? "");
  const url =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/Search/?api=1&query=${q}`;
  Linking.openURL(url).catch(() => {});
}

/** ---------- UI subcomponents ---------- */
function ImageCard({ uri }) {
  return (
    <View style={styles.imgCard}>
      {uri ? (
        <Image source={{ uri }} style={styles.img}></Image>
      ) : (
        <View style={styles.img}></View>
      )}
    </View>
  );
}

function CompareRow({ label, left, right, variant }) {
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

function StockPill({ inStock }) {
  const ok = !!inStock;
  return (
    <View style={styles.centerRow}>
      <View style={[styles.dot, ok ? styles.dotGreen : styles.dotRed]}></View>
      <Text
        style={[styles.stockText, ok ? styles.stockGreen : styles.stockRed]}
      >
        {ok ? "En stock" : "Rupture"}
      </Text>
    </View>
  );
}

function DistancePill({ km }) {
  const val = km;
  return (
    <View style={styles.centerRow}>
      <MaterialIcons
        name="location-on"
        size={16}
        color="#9ca3af"
      ></MaterialIcons>
      <Text style={styles.valueText}>{val} km</Text>
    </View>
  );
}

function SellerBlock({ name, address }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.sellerName} numberOfLines={1}>
        {name || "Épicerie"}
      </Text>
      <Text style={styles.sellerSub} numberOfLines={1}>
        {address}
      </Text>
    </View>
  );
}
export default function CompareScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const first = route?.params?.first ?? null;
  const second = route?.params?.second ?? null;

  console.log("first = ", first);
  console.log("second = ", second);

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
          Comparaison de Produits
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
          <ImageCard uri={first.photoURL}></ImageCard>
          <ImageCard uri={second.photoURL}></ImageCard>
        </View>
        {/* Secion header */}
        <View style={styles.sectionStrip}>
          <Text style={styles.sectionStripTitle}>Analyse Comparative</Text>
        </View>
        {/* Rows */}
        <View style={styles.rowsWrap}>
          <CompareRow
            label="NOM"
            left={<Text style={styles.valueText}>{first.name}</Text>}
            right={<Text style={styles.valueText}>{second.name}</Text>}
          ></CompareRow>
          <CompareRow
            label="PRIX"
            variant="highlight"
            left={
              <View style={styles.priceCell}>
                <Text style={[styles.priceText, { color: COLORS.primary }]}>
                  {first.price} $
                </Text>
              </View>
            }
            right={
              <View style={styles.priceCell}>
                <Text style={[styles.priceText, { color: COLORS.primary }]}>
                  {second.price} $
                </Text>
              </View>
            }
          ></CompareRow>
          <CompareRow
            label="STOCK"
            left={<StockPill inStock={first.inStock}></StockPill>}
            right={<StockPill inStock={second.inStock}></StockPill>}
          ></CompareRow>
          <CompareRow
            label="DISTANCE"
            left={<DistancePill km={first.distanceKm}></DistancePill>}
            right={<DistancePill km={second.distanceKm}></DistancePill>}
          ></CompareRow>
          <CompareRow
            label="ÉPICERIE"
            left={
              <SellerBlock
                name={first.sellerName}
                address={first.sellerAddress}
              ></SellerBlock>
            }
            right={
              <SellerBlock
                name={second.sellerName}
                address={second.sellerAddress}
              ></SellerBlock>
            }
          ></CompareRow>
          {/* Buttons row */}
          <View style={styles.btnRow}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => openMapsWithAddress(first.sellerAddress)}
            >
              <MaterialIcons
                name="directions"
                size={20}
                color="white"
              ></MaterialIcons>
              <Text style={styles.primaryBtnText} numberOfLines={1}>
                Itinéraire
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => openMapsWithAddress(second.sellerAddress)}
            >
              <MaterialIcons
                name="directions"
                size={20}
                color={COLORS.primary}
              ></MaterialIcons>
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Itinéraire
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fdfdfc" },

  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(253,253,252,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: "#181410",
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
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  img: { width: "100%", height: "100%", backgroundColor: "#f3f4f6" },

  sectionStrip: {
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  sectionStripTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "900",
    color: "#181410",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  rowsWrap: { paddingBottom: 10 },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    position: "relative",
    overflow:"visible"
  },
  rowHighlight: { backgroundColor: "rgba(255,132,31,0.05)" },

  rowLabelOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right:0,
    bottom:0,
    alignItems:"center",
    justifyContent:"center",
    zIndex: 10,
  },
  rowLabelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#fdfdfc",
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.2,
  },
  rowLabelPillHighlight: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(255,132,31,0.20)",
  },
  rowLabelHighlight: { color: COLORS.primary },

  cellLeft: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 30,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.06)",
  },
  cellRight: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 30,
    alignItems: "center",
  },

  valueText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181410",
    textAlign: "center",
  },

  priceCell: { alignItems: "center" },
  priceText: { fontSize: 20, fontWeight: "900" },
  miniMuted: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
  },

  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  dot: { width: 8, height: 8, borderRadius: 99 },
  dotGreen: { backgroundColor: "#22c55e" },
  dotRed: { backgroundColor: "#ef4444" },

  stockText: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  stockGreen: { color: "#16a34a" },
  stockRed: { color: "#ef4444" },

  sellerName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8d735e",
    textAlign: "center",
    maxWidth: 150,
  },
  sellerSub: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
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
    backgroundColor: "rgba(255,132,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,132,31,0.20)",
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },
});
