import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../../lib/firebase";
import { listenSellerProducts } from "../../services/sellerAddProductService";
import {
  deleteProductWithImage,
  updateProductStock,
} from "../../services/sellerProductsService";

export default function SellerProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  //categories
  const [activeCat, setActiveCat] = useState("Tous");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  //search
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  //filter
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterTab, setFilterTab] = useState("price"); //"price" | "stock"

  const [priceMode, setPriceMode] = useState("none"); //"none" |"range"|"min"|"max"
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [priceGte, setPriceGte] = useState("");
  const [priceLte, setPriceLte] = useState("");

  const [stockMode, setStockMode] = useState("all"); //"all" |"in"|"out"

  const [updatingStock, setUpdatingStock] = useState({}); //{[productId] : true}

  const [deleting, setDeleting] = useState({}); // ✅ {[productId]: true}

  // ✅ mêmes catégories que ton écran d'ajout (tu peux en ajouter d'autres)
  const categories = useMemo(
    () => [
      "Tous",
      "Épices",
      "Tubercules",
      "Surgelés",
      "Céréales",
      "Légumes",
      "Poissons",
    ],
    []
  );

  //observe si le seller a des produits si oui il affiche sinon il affiche rien
  useEffect(() => {
    if (!uid) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenSellerProducts(uid, (next) => {
      setProducts(next);
      setLoading(false);
    });

    return () => unsub?.();
  }, [uid]);

  const filtered = useMemo(() => {
    const aQuery = query.trim().toLowerCase();

    //helpers prix
    const toNum = (v) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim().replace(",", ".");
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const min = toNum(priceMin);
    const max = toNum(priceMax);
    const gte = toNum(priceGte);
    const lte = toNum(priceLte);

    return products.filter((p) => {
      //categories
      const matchCat = activeCat === "Tous" || p.cat === activeCat;

      //search
      const name = (p?.name ?? "").toString().toLowerCase();
      const cat = (p?.cat ?? "").toString().toLowerCase();
      const desc = (p?.desc ?? "").toString().toLowerCase();

      const matchQuery =
        name.includes(aQuery) || cat.includes(aQuery) || desc.includes(aQuery);

      //filter by stock
      const isInStock = !!p.inStock;
      const matchStock =
        stockMode === "all" ||
        (stockMode === "in" && isInStock) ||
        (stockMode === "out" && !isInStock);

      //filter by price
      const pPrice = Number(p?.price ?? NaN);
      const hasPrice = Number.isFinite(pPrice);

      let matchPrice = true;

      if (priceMode === "range") {
        if (min !== null && (!hasPrice || pPrice < min)) matchPrice = false;
        if (max !== null && (!hasPrice || pPrice > max)) matchPrice = false;
      } else if (priceMode === "min") {
        if (gte !== null && (!hasPrice || pPrice < gte)) matchPrice = false;
      } else if (priceMode === "max") {
        if (lte !== null && (!hasPrice || pPrice > lte)) matchPrice = false;
      } else {
        matchPrice = true;
      }
      return matchCat && matchQuery && matchStock && matchPrice;
    });
  }, [
    activeCat,
    products,
    query,
    stockMode,
    priceMode,
    priceMin,
    priceMax,
    priceGte,
    priceLte,
  ]);

  const hasActiveFilters = useMemo(() => {
    const hasStock = stockMode !== "all";

    const hasPrice =
      priceMode !== "none" &&
      ((priceMode === "range" && (priceMin.trim() || priceMax.trim())) ||
        (priceMode === "min" && priceGte.trim()) ||
        (priceMode === "max" && priceLte.trim()));

    return hasStock || hasPrice;
  }, [stockMode, priceMode, priceMax, priceMin, priceGte, priceLte]);

  //SWITCH HANDLER
  const onToggleStock = async (item, nextValue) => {
    const productId = item?.id;
    if (!productId) return;

    //avoid spam
    if (updatingStock[productId]) return;
    const prevValue = !!item?.inStock;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: !!nextValue } : p))
    );

    setUpdatingStock((m) => ({ ...m, [productId]: true }));

    try {
      await updateProductStock({ productId, inStock: !!nextValue });
    } catch (e) {
      console.log("❌update stock failed :", e);

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, inStock: prevValue } : p))
      );
    } finally {
      setUpdatingStock((m) => {
        const copy = { ...m };
        delete copy[productId];
        return copy;
      });
    }
  };

  const onDeleteProduct = (item) => {
    const productId = item?.id;
    if (!productId) return;

    Alert.alert("Supprimer ce produit ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          //avoid double click
          if (deleting[productId] || updatingStock[productId]) return;

          const snapshot = [...products];
          setProducts((prev) => prev.filter((p) => p.id !== productId));
          setDeleting((m) => ({ ...m, [productId]: true }));

          try {
            await deleteProductWithImage({
              productId: productId,
              photoURL: item?.photoURL ?? null,
            });
          } catch (e) {
            console.log("❌ delete product failed :", e);
            setProducts(snapshot);
          } finally {
            setDeleting((m) => {
              const copy = { ...m };
              delete copy[productId];
              return copy;
            });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name="storefront"
            size={28}
            color={COLORS.primary}
          ></MaterialIcons>
          <Text style={styles.headerTitle}>Mes produits</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            hitSlop={10}
            onPress={() => {
              setSearchOpen((v) => {
                const next = !v;
                if (!next) setQuery(""); //si on ferme, on reset
                return next;
              });
            }}
          >
            <MaterialIcons
              name="search"
              size={22}
              color={COLORS.text}
            ></MaterialIcons>
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            hitSlop={10}
            onPress={() => {
              Keyboard.dismiss();
              setFiltersOpen(true);
            }}
          >
            <MaterialIcons
              name="tune"
              size={22}
              color={COLORS.text}
            ></MaterialIcons>
            {hasActiveFilters && <View style={styles.filterBadge}></View>}
          </Pressable>
        </View>
      </View>
      {searchOpen && (
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <MaterialIcons
              name="search"
              size={18}
              color="#6b7280"
            ></MaterialIcons>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un produit..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus
              onSubmitEditing={() => Keyboard.dismiss()}
            ></TextInput>
            {!!query && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color="#6b7280"
                ></MaterialIcons>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.catRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(x) => x}
          contentContainerStyle={styles.catContent}
          renderItem={({ item }) => {
            const active = item === activeCat;
            return (
              <Pressable
                onPress={() => setActiveCat(item)}
                style={[
                  styles.catPill,
                  active ? styles.catPillActive : styles.catPillIdle,
                ]}
              >
                <Text
                  style={[
                    styles.catText,
                    active ? styles.catTextActive : styles.catTextIdle,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        ></FlatList>
      </View>

      {/* List */}
      <View style={styles.listWrap}>
        <Text style={styles.listKicker}>
          Inventaire actuel ({filtered.length})
        </Text>
        {!loading && filtered.length === 0 ? (
          <View style={styles.loadingRow}>
            {/* <ActivityIndicator size="small"></ActivityIndicator> */}
            <Text style={styles.loadingText}>Aucun produit trouvé</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }}></View>}
            renderItem={({ item }) => {
              const isUpdating = !!updatingStock[item.id];
              const isInStock = !!item.inStock;

              return (
                <View style={styles.productCard}>
                  <View style={styles.productTop}>
                    {item.photoURL ? (
                      <Image
                        source={{ uri: item.photoURL }}
                        style={styles.thumb}
                      ></Image>
                    ) : (
                      <View style={styles.thumb}></View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.productTitleRow}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Pressable
                          hitSlop={10}
                          onPress={() =>
                            navigation.navigate("SellerEditProduct", {
                              product: item,
                            })
                          }
                        >
                          <MaterialIcons
                            name="edit-note"
                            size={22}
                            color="#9ca3af"
                          ></MaterialIcons>
                        </Pressable>
                      </View>
                      <Text style={styles.price}>
                        ${Number(item.price ?? 0).toFixed(2)}
                      </Text>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.cat}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.productBottom}>
                    <View style={styles.stockRow}>
                      <View
                        style={[
                          styles.dot,
                          item.inStock ? styles.dotGreen : styles.dotGray,
                        ]}
                      ></View>
                      <Text
                        style={[
                          styles.stockText,
                          item.inStock
                            ? styles.stockTextGreen
                            : styles.stockTextGray,
                        ]}
                      >
                        {item.inStock ? "En stock" : "Rupture de stock"}
                        {isUpdating ? "..." : ""}
                      </Text>
                    </View>

                    <View style={styles.actionsRight}>
                      <Pressable
                        onPress={() => onDeleteProduct(item)}
                        hitSlop={10}
                        disabled={isUpdating || !!deleting[item.id]}
                        style={({ pressed }) => [
                          styles.trashBtn,
                          (isUpdating || !!deleting[item.id]) &&
                            styles.trashBtnDisabled,
                          pressed &&
                            !(
                              isUpdating ||
                              (!!deleting[item.id] && { opacity: 0.7 })
                            ),
                        ]}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={22}
                          color="#ef4444"
                        ></MaterialIcons>
                      </Pressable>
                      {/* SWITCH */}
                      <Switch
                        value={isInStock}
                        onValueChange={(val) => onToggleStock(item, val)}
                        disabled={isUpdating || deleting[item.id]}
                        trackColor={{ false: "#e5e7eb", true: COLORS.primary }}
                        thumbColor={"#ffffff"}
                        ios_backgroundColor="#e5e7eb"
                      ></Switch>
                    </View>
                  </View>
                </View>
              );
            }}
          ></FlatList>
        )}
      </View>

      {/* Filter modal */}
      <Modal
        visible={filtersOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFiltersOpen(false)}>
          <View style={styles.sheetOverlay}></View>
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandle}></View>
            </View>
            {/* Title+close */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtrer par</Text>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={styles.sheetCloseBtn}
                hitSlop={10}
              >
                <MaterialIcons
                  name="close"
                  size={18}
                  color="#9ca3af"
                ></MaterialIcons>
              </Pressable>
            </View>
            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <Pressable
                onPress={() => setFilterTab("price")}
                style={[
                  styles.tabBtn,
                  filterTab === "price"
                    ? styles.tabBtnActive
                    : styles.tabBtnIdle,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    filterTab === "price"
                      ? styles.tabTextActive
                      : styles.tabTextIdle,
                  ]}
                >
                  Prix
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterTab("stock")}
                style={[
                  styles.tabBtn,
                  filterTab === "stock"
                    ? styles.tabBtnActive
                    : styles.tabBtnIdle,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    filterTab === "stock"
                      ? styles.tabTextActive
                      : styles.tabTextIdle,
                  ]}
                >
                  Stock
                </Text>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 18 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Price Tab */}
              {filterTab === "price" && (
                <View style={{ gap: 16 }}>
                  {/* Mode selector */}
                  <View style={styles.segmentRow}>
                    <Pressable
                      onPress={() => {
                        setPriceMode("range");
                        setPriceGte("");
                        setPriceLte("");
                      }}
                      style={[
                        styles.segmentBtn,
                        priceMode === "range" && styles.segmentBtnOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          priceMode === "range" && styles.segmentTextOn,
                        ]}
                      >
                        Entre
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setPriceMode("min");
                        setPriceMin("");
                        setPriceGte("");
                      }}
                      style={[
                        styles.segmentBtn,
                        priceMode === "min" && styles.segmentBtnOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          priceMode === "min" && styles.segmentTextOn,
                        ]}
                      >
                        ≥
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setPriceMode("max");
                        setPriceMin("");
                        setPriceMax("");
                      }}
                      style={[
                        styles.segmentBtn,
                        priceMode === "max" && styles.segmentBtnOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          priceMode === "max" && styles.segmentTextOn,
                        ]}
                      >
                        ≤
                      </Text>
                    </Pressable>
                  </View>

                  {/* Range */}
                  {priceMode === "range" && (
                    <View>
                      <Text style={styles.sheetLabel}>
                        Fourchette de prix (CAD $)
                      </Text>
                      <View style={styles.rangeRow}>
                        <View style={styles.inputCard}>
                          <TextInput
                            value={priceMin}
                            onChangeText={setPriceMin}
                            placeholder="Min"
                            keyboardType="decimal-pad"
                            style={styles.sheetInput}
                            placeholderTextColor="#9ca3af"
                          ></TextInput>
                        </View>
                        <View style={styles.rangeDash}></View>
                        <View style={styles.inputCard}>
                          <TextInput
                            value={priceMax}
                            onChangeText={setPriceMax}
                            placeholder="Max"
                            keyboardType="decimal-pad"
                            style={styles.sheetInput}
                            placeholderTextColor="#9ca3af"
                          ></TextInput>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* >= */}
                  {priceMode === "min" && (
                    <View>
                      <Text style={styles.sheetLabel}>
                        Prix supérieur ou égal à (CAD $)
                      </Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          value={priceGte}
                          onChangeText={setPriceGte}
                          placeholder="Entrez un montant"
                          keyboardType="decimal-pad"
                          style={styles.sheetInput}
                          placeholderTextColor="#9ca3af"
                        ></TextInput>
                      </View>
                    </View>
                  )}

                  {/* <= */}
                  {priceMode === "max" && (
                    <View>
                      <Text style={styles.sheetLabel}>
                        Prix inférieur ou égal à (CAD $)
                      </Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          value={priceLte}
                          onChangeText={setPriceLte}
                          placeholder="Entrez un montant"
                          keyboardType="decimal-pad"
                          style={styles.sheetInput}
                          placeholderTextColor="#9ca3af"
                        ></TextInput>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Stock Tab */}
              {filterTab === "stock" && (
                <View style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => setStockMode("all")}
                    style={[
                      styles.stockOption,
                      stockMode === "all" && styles.stockOptionActive,
                    ]}
                  >
                    <View style={styles.stockLeft}>
                      <MaterialIcons
                        name="list"
                        size={18}
                        color={stockMode === "all" ? COLORS.primary : "#9ca3af"}
                      ></MaterialIcons>
                      <Text style={styles.stockText}>Tous les articles</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        stockMode === "all" && styles.radioOuterOn,
                      ]}
                    >
                      {stockMode === "all" && (
                        <View style={styles.radioInner}></View>
                      )}
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setStockMode("in")}
                    style={[
                      styles.stockOption,
                      stockMode === "in" && styles.stockOptionActive,
                    ]}
                  >
                    <View style={styles.stockLeft}>
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color={stockMode === "in" ? "#16a34a" : "#9ca3af"}
                      ></MaterialIcons>
                      <Text style={styles.stockText}>En stock</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        stockMode === "in" && styles.radioOuterOn,
                      ]}
                    >
                      {stockMode === "in" && (
                        <View style={styles.radioInner}></View>
                      )}
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setStockMode("out")}
                    style={[
                      styles.stockOption,
                      stockMode === "out" && styles.stockOptionActive,
                    ]}
                  >
                    <View style={styles.stockLeft}>
                      <MaterialIcons
                        name="block"
                        size={18}
                        color={stockMode === "out" ? "#6b7280" : "#9ca3af"}
                      ></MaterialIcons>
                      <Text style={styles.stockText}>En rupture de stock</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        stockMode === "out" && styles.radioOuterOn,
                      ]}
                    >
                      {stockMode === "out" && (
                        <View style={styles.radioInner}></View>
                      )}
                    </View>
                  </Pressable>
                </View>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => {
                  setPriceMode("none");
                  setPriceMin("");
                  setPriceMax("");
                  setPriceGte("");
                  setPriceLte("");
                  setStockMode("all");
                }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetText}>Réinitialiser</Text>
              </Pressable>

              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={styles.applyBtn}
              >
                <Text style={styles.applyText}>Appliquer</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* FAB */}
      <Pressable
        onPress={() => navigation.navigate("SellerAddProduct")}
        style={[styles.fab, { bottom: 18 + insets.bottom }]}
        hitSlop={10}
      >
        <MaterialIcons name="add" size={30} color="white"></MaterialIcons>
      </Pressable>
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
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  catRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  catContent: { gap: 10, paddingRight: 16 },
  catPill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillIdle: { backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" },
  catText: { fontSize: 13, fontWeight: "900" },
  catTextActive: { color: "white" },
  catTextIdle: { color: COLORS.text },
  listWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  listKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
    paddingLeft: 2,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
  },
  productTop: { flexDirection: "row", gap: 12 },
  thumb: {
    width: 76,
    height: 76,
    backgroundColor: "#e5dfdc",
    borderRadius: 12,
  },
  productTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  productName: { flex: 1, fontSize: 16, fontWeight: "900", color: COLORS.text },
  price: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  tagText: { fontSize: 10, fontWeight: "900", color: "#6b7280" },
  productBottom: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  dotGreen: { backgroundColor: "#22c55e" },
  dotGray: { backgroundColor: "#d1d5db" },
  stockText: { fontSize: 13, fontWeight: "800" },
  stockTextGreen: { color: "#16a34a" },
  stockTextGray: { color: "#6b7280" },

  toggle: {
    width: 52,
    height: 30,
    backgroundColor: "#e5e7eb",
    padding: 3,
    justifyContent: "center",
    borderRadius: 999,
  },
  knob: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  knobOn: { alignSelf: "flex-end", backgroundColor: "white" },
  fab: {
    position: "absolute",
    right: 16,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBox: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  sheetOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sheetHandleRow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#e5e7eb",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  tabsWrap: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  tabBtnIdle: { backgroundColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "900" },
  tabTextActive: { color: COLORS.primary },
  tabTextIdle: { color: "#6b7280" },
  sheetLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  segmentBtnOn: {
    backgroundColor: "rgba(214,86,31,0.10)",
    borderColor: COLORS.primary,
  },
  segmentText: { fontSize: 14, fontWeight: "900", color: "#6b7280" },
  segmentTextOn: { color: COLORS.primary },
  rangeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rangeDash: { width: 14, height: 2, backgroundColor: "#e5e7eb" },
  inputCard: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  sheetInput: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  stockOption: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stockOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(214,86,31,0.06)",
  },
  stockLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  stockText: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterOn: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  resetBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { fontSize: 14, fontWeight: "900", color: "#6b7280" },
  applyBtn: {
    flex: 2,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontSize: 14, fontWeight: "900", color: "white" },
  filterBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "white",
  },
  actionsRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  trashBtnDisabled: { opacity: 0.4 },
});
