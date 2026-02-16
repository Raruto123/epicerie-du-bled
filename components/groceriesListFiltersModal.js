import { MaterialIcons } from "@expo/vector-icons";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";

export function GroceriesFiltersModal({
  visible,
  onClose,
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
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* Bottom sheet */}
        <Pressable style={styles.sheet} onPress={(e) => e?.stopPropagation?.()}>
          <View style={styles.sheetHandle}></View>

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
                  color={COLORS.muted}
                ></MaterialIcons>
              </Pressable>
            </View>
          </View>
          <Text style={[styles.sheetSectionKicker, { marginTop: 6 }]}>
            Distance
          </Text>
          <View style={styles.nearGrid}>
            <Pressable
              onPress={() => setNearBy("near")}
              style={[
                styles.nearCard,
                nearBy === "near" ? styles.nearCardActive : styles.nearCardIdle,
              ]}
            >
              <MaterialIcons
                name="near-me"
                size={20}
                color={nearBy === "near" ? COLORS.primary : COLORS.muted}
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
                nearBy === "far" ? styles.nearCardActive : styles.nearCardIdle,
              ]}
            >
              <MaterialIcons
                name="social-distance"
                size={20}
                color={nearBy === "far" ? COLORS.primary : COLORS.muted}
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
        </Pressable>
      </Pressable>
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
    backgroundColor: COLORS.border,
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
  sheetTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,215,4,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.35)",
  },
  activeBadgeText: { fontSize: 11, fontWeight: "900", color: COLORS.primary },
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
    color: COLORS.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  nearGrid: { flexDirection: "row", gap: 12 },
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
  nearCardIdle: { backgroundColor: COLORS.bg, borderColor: "transparent" },
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
  applyBtnText: { color: "white", fontSize: 15, fontWeight: "900" },
});
