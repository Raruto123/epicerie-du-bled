import { MaterialIcons } from "@expo/vector-icons";
import { Platform, Pressable, Text } from "react-native";
import { Modal, View } from "react-native";
import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function FiltersModal({
  visible,
  onClose,
  sortBy,
  setSortBy,
  nearBy,
  setNearBy,
  onApply,
  hasActiveFilters,
  onReset,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle}></View>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={styles.sheetTitle}>Trier par</Text>
                  {hasActiveFilters && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Filtres actifs</Text>
                    </View>
                  )}
                </View>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Pressable
                  onPress={onReset}
                  disabled={!hasActiveFilters}
                  style={[
                    styles.resetBtn,
                    !hasActiveFilters && styles.resetBtnDisabled,
                  ]}
                  hitSlop={10}
                >
                  <MaterialIcons
                    name="restart-alt"
                    size={20}
                    color={!hasActiveFilters ? "#9ca3af" : COLORS.primary}
                  ></MaterialIcons>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={styles.sheetCloseBtn}
                  hitSlop={10}
                >
                  <MaterialIcons
                    name="close"
                    size={22}
                    color="#71717a"
                  ></MaterialIcons>
                </Pressable>
              </View>
            </View>
            {/* Prix */}
            <Text style={styles.sheetSectionKicker}>Prix</Text>
            <Pressable
              onPress={() => setSortBy("price_low")}
              style={[
                styles.choiceRow,
                sortBy === "price_low"
                  ? styles.choiceRowActive
                  : styles.choiceRowIdle,
              ]}
            >
              <View style={styles.choiceLeft}>
                <MaterialIcons
                  name="arrow-upward"
                  size={18}
                  color={sortBy === "price_low" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.choiceText,
                    sortBy === "price_low"
                      ? styles.choiceTextActive
                      : styles.choiceTextIdle,
                  ]}
                >
                  Prix le plus bas
                </Text>
              </View>
              {sortBy === "price_low" ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => setSortBy("price_high")}
              style={[
                styles.choiceRow,
                sortBy === "price_high"
                  ? styles.choiceRowActive
                  : styles.choiceRowIdle,
              ]}
            >
              <View style={styles.choiceLeft}>
                <MaterialIcons
                  name="arrow-downward"
                  size={18}
                  color={sortBy === "price_high" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.choiceText,
                    sortBy === "price_high"
                      ? styles.choiceTextActive
                      : styles.choiceTextIdle,
                  ]}
                >
                  Prix le plus haut
                </Text>
              </View>
              {sortBy === "price_high" ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.primary}
                ></MaterialIcons>
              ) : null}
            </Pressable>

            {/* Distance */}
            <Text style={[styles.sheetSectionKicker, { marginTop: 18 }]}>
              Distance
            </Text>
            <View style={styles.nearGrid}>
              <Pressable
                onPress={() => setNearBy("near")}
                style={[
                  styles.nearCard,
                  nearBy === "near"
                    ? styles.nearCardActive
                    : styles.nearCardIdle,
                ]}
              >
                <MaterialIcons
                  name="near-me"
                  size={20}
                  color={nearBy === "near" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.nearText,
                    nearBy === "near"
                      ? styles.nearTextActive
                      : styles.nearTextIdle,
                  ]}
                >
                  Plus proche
                </Text>
                {nearBy === "near" && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={COLORS.primary}
                  ></MaterialIcons>
                )}
              </Pressable>

              <Pressable
                onPress={() => setNearBy("far")}
                style={[
                  styles.nearCard,
                  nearBy === "far"
                    ? styles.nearCardActive
                    : styles.nearCardIdle,
                ]}
              >
                <MaterialIcons
                  name="social-distance"
                  size={20}
                  color={nearBy === "far" ? COLORS.primary : "#71717a"}
                ></MaterialIcons>
                <Text
                  style={[
                    styles.nearText,
                    nearBy === "far"
                      ? styles.nearTextActive
                      : styles.nearTextIdle,
                  ]}
                >
                  Plus loin
                </Text>
                {nearBy === "far" && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={COLORS.primary}
                  ></MaterialIcons>
                )}
              </Pressable>
            </View>
            {/* Apply */}
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                onApply?.();
                onClose?.();
              }}
            >
              <Text style={styles.applyBtnText}>Appliquer les filtres</Text>
            </Pressable>

            <View style={{ height: Platform.OS === "ios" ? 6 : 0 }}></View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.40)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    // shadow "modal"
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  sheetHandle: {
    width: 52,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetSectionKicker: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#71717a",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  choiceRow: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 2,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceRowActive: {
    backgroundColor: "rgba(6,105,3,0.08)",
    borderColor: "rgba(6,105,3,0.22)",
  },
  choiceRowIdle: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
  choiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  choiceText: { fontSize: 14 },
  choiceTextActive: { fontWeight: "900", color: COLORS.text },
  choiceTextIdle: { fontWeight: "800", color: COLORS.text },
  nearGrid: {
    flexDirection: "row",
    gap: 12,
  },
  nearCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nearCardActive: {
    backgroundColor: "rgba(6,105,3,0.08)",
    borderColor: "rgba(6,105,3,0.22)",
  },
  nearCardIdle: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
  nearText: { fontSize: 13 },
  nearTextActive: { fontWeight: "900", color: COLORS.text },
  nearTextIdle: { fontWeight: "800", color: COLORS.text },
  applyBtn: {
    marginTop: 18,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  applyBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,215,4,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.35)",
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,105,3,0.10)",
    borderWidth: 1,
    borderColor: "rgba(6,105,3,0.18)",
  },
  resetBtnDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: COLORS.border,
  },
});
