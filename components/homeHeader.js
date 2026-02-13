import { MaterialIcons } from "@expo/vector-icons";
import { Keyboard, Pressable, Text, TextInput } from "react-native";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../constants/colors";
import { FlatList } from "react-native";

export const HomeHeader = ({
  locationStatus,
  locationLabel,
  onPressLocation,
  query,
  setQuery,
  hasActiveFilters,
  setShowFilters,
  activeCat,
  setActiveCat,
  filteredCount,
  cats,
}) => {
  return (
    <View>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: 10 }]}>
        <Pressable
          style={styles.locationPill}
          onPress={onPressLocation}
          hitSlop={10}
        >
          <MaterialIcons
            name={
              locationStatus === "granted" ? "location-on" : "location-disabled"
            }
            size={18}
            color={locationStatus === "granted" ? COLORS.primary : "#9ca3af"}
          ></MaterialIcons>
          <Text
            style={[
              styles.locationText,
              locationStatus !== "granted" && { color: "#9ca3af" },
            ]}
            numberOfLines={1}
          >
            {locationStatus === "granted"
              ? locationLabel
              : "Aucune localisation"}
          </Text>
        </Pressable>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={20}
          color={COLORS.text}
        ></MaterialIcons>
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
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowFilters(true);
            }}
            style={[
              styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive,
            ]}
            hitSlop={10}
          >
            <MaterialIcons
              name="tune"
              size={18}
              color={hasActiveFilters ? COLORS.surface : COLORS.primary}
            ></MaterialIcons>
            {hasActiveFilters && <View style={styles.filterDot}></View>}
          </Pressable>
        </View>
      </View>
      {/* Categories */}
      <View style={styles.catsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={cats}
          keyExtractor={(x) => x.key}
          contentContainerStyle={styles.catsContent}
          keyboardShouldPersistTaps="always"
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
      {/* Section Title */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionKicker}>Produits ({filteredCount})</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  locationPill: {
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: "rgba(6,105,3,0.10)",
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#22c55e", // vert comme "actif"
    borderWidth: 2,
    borderColor: COLORS.surface,
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
  catPillIdle: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catEmoji: { fontSize: 16 },
  catText: { fontSize: 13, fontWeight: "900" },
  catTextActive: { color: COLORS.surface },
  catTextIdle: { color: COLORS.text },
  sectionRow: { paddingHorizontal: 16, paddingBottom: 10 },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9ca3af",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
