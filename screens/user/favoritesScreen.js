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
import { auth } from "../../lib/firebase";
import {
  getUserFavorites,
  toggleFavoriteProduct,
} from "../../services/userService";
import { FavoritesHeader } from "../../components/favoritesHeader";
import FavButton from "../../components/favButton";

export default function FavoritesScreen({
  navigation,
  favorites = [],
  userLocation,
  locationStatus,
}) {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log("❌ getUserFavorites failed:", e?.message ?? e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [favorites, query]);

  // ✅ unfav (UI) — plus tard: Firestore
  const onUnfavorite = useCallback(async (product) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await toggleFavoriteProduct({ uid, product });
    } catch (e) {
      console.log("❌ unfavorite2 failed :", e?.message ?? e);
    }
  }, []);

  const headerEl = useMemo(() => {
    return (
      <FavoritesHeader
        query={query}
        setQuery={setQuery}
        count={filtered.length}
      ></FavoritesHeader>
    );
  }, [query, filtered.length]);

  const renderItem = ({ item }) => {
    const inStock = !!item.inStock;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetails", { product: item, userLocation })
        }
      >
        {/* Favorite (filled) */}
        <FavButton isFav={true} onPress={() => onUnfavorite(item)}></FavButton>
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
              color={COLORS.muted}
            ></MaterialIcons>
            <Text style={styles.metaText}>
              {Number(item.distanceKm ?? 0).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, !inStock && { color: COLORS.muted }]}>
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
            ListHeaderComponent={headerEl}
            contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialIcons
                  name="favorite-border"
                  size={28}
                  color={COLORS.muted}
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
  // grid
  colWrap: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  imgWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.bg,
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
  badgeGreen: { backgroundColor: COLORS.primary },
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
    color: COLORS.muted,
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
    color: COLORS.muted,
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
    color: COLORS.muted,
    textAlign: "center",
  },
});
