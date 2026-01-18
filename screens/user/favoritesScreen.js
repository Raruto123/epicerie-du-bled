import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
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
import { Keyboard } from "react-native";
import { KeyboardAvoidingView } from "react-native";

//Mock data à remplacer par Firestore plus tard
function makeMockFavs() {
  return [
    {
      id: "fav-1",
      name: "Plantain Mûr",
      price: 1.99,
      distanceKm: 1.2,
      inStock: true,
      photoURL:
        "https://images.unsplash.com/photo-1603048297172-c92544798d3a?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "fav-2",
      name: "Huile de Palme",
      price: 8.99,
      distanceKm: 3.1,
      inStock: true,
      photoURL:
        "https://images.unsplash.com/photo-1604908176997-125b5bd7be3d?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "fav-3",
      name: "Poisson Fumé",
      price: 12.0,
      distanceKm: 0.8,
      inStock: false,
      photoURL:
        "https://images.unsplash.com/photo-1548946526-f69e2424cf45?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "fav-4",
      name: "Attiéké Premium",
      price: 5.5,
      distanceKm: 2.5,
      inStock: true,
      photoURL:
        "https://images.unsplash.com/photo-1604909053196-6f1e8b9e3c7f?auto=format&fit=crop&w=800&q=80",
    },
  ];
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ en vrai: tu vas écouter la collection favorites de l’utilisateur
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 350));
      setFavorites(makeMockFavs());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [favorites, query]);
  // ✅ unfav (UI) — plus tard: Firestore
  const onUnfavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const renderHeader = () => (
    <View>
      {/* Header sticky style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
      </View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#7171a"></MaterialIcons>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher dans mes favoris..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
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
        </View>
      </View>
      {/* Kicker */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionKicker}>Favoris ({filtered.length})</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const inStock = !!item.inStock;

    return (
      <Pressable style={styles.card} onPress={() => {}}>
        {/* Favorite (filled) */}
        <Pressable
          style={styles.favBtn}
          onPress={() => onUnfavorite(item.id)}
          hitSlop={10}
        >
          <MaterialIcons
            name="favorite"
            size={18}
            color={COLORS.primary}
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Clavier on garde l'input accessible */}
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? (
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
            contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialIcons
                  name="favorite-border"
                  size={28}
                  color="#9ca3af"
                ></MaterialIcons>
                <Text style={styles.emptyTitle}>Aucun favori</Text>
                <Text style={styles.emptySub}>
                  Ajoute des produits en favoris pour les retrouver ici
                </Text>
              </View>
            }
          ></FlatList>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  // header
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },

  // search
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBox: {
    height: 50,
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
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // grid
  colWrap: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
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

  imgWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f3f4f6",
  },
  img: { width: "100%", height: "100%" },
  imgOut: { opacity: 0.75 },

  stockBadgeWrap: {
    position: "absolute",
    left: 10,
    bottom: 10,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeGreen: { backgroundColor: "#22c55e" },
  badgeRed: { backgroundColor: "#ef4444" },
  stockBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },

  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#71717a",
  },
  priceRow: { marginTop: 2 },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  unit: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
  },

  // states
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
});
