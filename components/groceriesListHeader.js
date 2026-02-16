import { MaterialIcons } from "@expo/vector-icons";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../constants/colors";
import { Pressable } from "react-native";

export function GroceriesHeader({
  title = "Liste des épiceries",
  query,
  setQuery,
  hasActiveFilters,
  onOpenFilters,
}) {
  return (
    <View style={styles.header}>
      {/* Title row */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialIcons
            name="search"
            size={18}
            color={COLORS.muted}
          ></MaterialIcons>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une épicerie..."
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
                color={COLORS.muted}
              ></MaterialIcons>
            </Pressable>
          )}
          {/* tune icon */}
          <Pressable
            style={[styles.tuneBtn, hasActiveFilters && styles.tuneBtnActive]}
            onPress={() => {
              Keyboard.dismiss();
              onOpenFilters?.();
            }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  searchWrap: { paddingBottom: 2 },
  searchBox: {
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 12,
    paddingRight: 8,
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
  tuneBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,105,3,0.10)",
  },
  tuneBtnActive: { backgroundColor: COLORS.primary },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "white",
  },
});
