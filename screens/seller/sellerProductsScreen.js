import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

export default function SellerProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const [activeCat, setActiveCat] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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

    return products.filter((p) => {
      const matchCat = activeCat === "Tous" || p.cat === activeCat;

      if (!aQuery) return matchCat;

      const name = (p?.name ?? "").toString().toLowerCase();
      const cat = (p?.cat ?? "").toString().toLowerCase();
      const desc = (p?.desc ?? "").toString().toLowerCase();

      const matchQuery =
        name.includes(aQuery) || cat.includes(aQuery) || desc.includes(aQuery);

      return matchCat && matchQuery;
    });
  }, [activeCat, products, query]);

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
          <Pressable style={styles.iconBtn} hitSlop={10}>
            <MaterialIcons
              name="tune"
              size={22}
              color={COLORS.text}
            ></MaterialIcons>
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
            renderItem={({ item }) => (
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
                    </Text>
                  </View>
                  {/* Toggle mock */}
                  <View style={styles.toggle}>
                    <View
                      style={[styles.knob, item.inStock && styles.knobOn]}
                    ></View>
                  </View>
                </View>
              </View>
            )}
          ></FlatList>
        )}
      </View>

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
});
