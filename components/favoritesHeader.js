import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../constants/colors";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";

export function FavoritesHeader({
  title,
  query,
  setQuery,
  count = 0,
}) {

  const {t} = useTranslation();

  const headerTitle = title ?? t("favorites.title");
  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
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
            placeholder={t("favorites.searchPlaceholder")}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            returnKeyType="search"
            onBlur={false}
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
        </View>
      </View>
      {/* Kicker */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionKicker}>{t("favorites.count", {count})}</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBox: {
    height: 50,
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
    color: COLORS.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
