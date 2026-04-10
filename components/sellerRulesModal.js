import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { Modal } from "react-native";
import { useTranslation } from "react-i18next";

function RuleSection({ title, items }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.rulesList}>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.ruleRow}>
            <MaterialIcons
              name="fiber-manual-record"
              size={10}
              color={COLORS.primary}
              style={{ marginTop: 6 }}
            ></MaterialIcons>
            <Text style={styles.ruleText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SellerRulesModal({ visible, onClose }) {
  const {t} = useTranslation();
  const sections = [
    // {
    //   title: "Logo",
    //   items: [
    //     "Utilisez un logo clair, centré et facilement reconnaissable.",
    //     "Évitez les images floues, coupées ou trop sombres.",
    //     "Le logo de votre boutique sera visible par les clients dans plusieurs écrans.",
    //   ],
    // },
    // {
    //   title: "Description",
    //   items: [
    //     "La description peut être vide, mais une description claire inspire davantage confiance.",
    //     "Présentez brièvement vos spécialités, produits ou particularités.",
    //     "Évitez les textes trop longs ou les informations trompeuses.",
    //   ],
    // },
        {
    title: t("sellerRules.sections.privateSeller.title"),
    items: [
      t("sellerRules.sections.privateSeller.items.0"),
      t("sellerRules.sections.privateSeller.items.1"),
      t("sellerRules.sections.privateSeller.items.2"),
    ],
  },
  {
    title: t("sellerRules.sections.address.title"),
    items: [
      t("sellerRules.sections.address.items.0"),
      t("sellerRules.sections.address.items.1"),
      t("sellerRules.sections.address.items.2"),
    ],
  },
  {
    title: t("sellerRules.sections.gps.title"),
    items: [
      t("sellerRules.sections.gps.items.0"),
      t("sellerRules.sections.gps.items.1"),
      t("sellerRules.sections.gps.items.2"),
    ],
  },
  {
    title: t("sellerRules.sections.visibility.title"),
    items: [
      t("sellerRules.sections.visibility.items.0"),
      t("sellerRules.sections.visibility.items.1"),
    ],
  },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        ></Pressable>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name="info-outline"
                  size={22}
                  color={COLORS.primary}
                ></MaterialIcons>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t("sellerRules.title")}</Text>
                <Text style={styles.subtitle}>
                  {t("sellerRules.subtitle")}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <MaterialIcons
                name="close"
                size={20}
                color={COLORS.text}
              ></MaterialIcons>
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {sections.map((section) => (
              <RuleSection
                key={section.title}
                title={section.title}
                items={section.items}
              ></RuleSection>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    maxHeight: "42%",
    maxWidth: 350,
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,4,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,215,4,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 1,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    lineHeight: 20,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 14,
    paddingBottom: 18,
  },
  section: {
    marginBottom: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  rulesList: { gap: 8 },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.muted,
  },
});
