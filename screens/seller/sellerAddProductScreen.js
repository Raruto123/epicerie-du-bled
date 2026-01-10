import { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

export default function SellerAddProductScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const categories = useMemo(
    () => [
      { key: "Tubercules", icon: "agriculture" },
      { key: "Poissons", icon: "set-meal" },
      { key: "Épices", icon: "whatsnot" },
      { key: "Légumes", icon: "eco" },
    ],
    []
  );

  const [name, setName] = useState("");
  const [cat, setCat] = useState("Tubercules");
  const [price, setPrice] = useState("");
  const [insStock, setInStock] = useState(true);
  const [desc, setDesc] = useState("");

  const publish = () => {
    Keyboard.dismiss();
    //TODO : create product in Firestore later
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.wrap}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={10}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={18}
                color={COLORS.text}
              ></MaterialIcons>
            </Pressable>
            <Text style={styles.title}>Ajouter un produit</Text>
            <View style={styles.backBtnGhost}></View>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 110 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo upload (placeholder) */}
            <Pressable style={styles.photoBox}>
              <View style={styles.photoIcon}>
                <MaterialIcons
                  name="add-a-photo"
                  size={28}
                  color={COLORS.primary}
                ></MaterialIcons>
              </View>
              <Text style={styles.photoTitle}>Photo du produit</Text>
              <Text style={styles.photoSub}>Haute résolution recommandée</Text>
            </Pressable>

            {/* Details */}
            <Text style={styles.h3}>Détails de l'ingrédient</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Nom du produit</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Ex: Igname, Piment oiseau, Attieké..."
              ></TextInput>
            </View>

            {/* Category */}
            <Text style={styles.h3}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {categories.map((c) => {
                const active = c.key === cat;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCat(c.key)}
                    style={[
                      styles.catPill,
                      active ? styles.catPillActive : styles.catPillIdle,
                    ]}
                  >
                    <MaterialIcons
                      name={c.icon}
                      size={16}
                      color={active ? COLORS.primary : "#6b7280"}
                    ></MaterialIcons>
                    <Text
                      style={[
                        styles.catText,
                        active ? styles.catTextActive : styles.catTextIdle,
                      ]}
                    >
                      {c.key}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Price + stock */}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Prix (CAD $)</Text>
                <View style={styles.priceWrap}>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    style={[styles.input, { paddingRight: 36 }]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  ></TextInput>
                  <Text style={styles.priceSuffix}>$</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>État du stock</Text>
                <Pressable
                  onPress={() => setInStock((v) => !v)}
                  style={styles.stockBox}
                >
                  <Text style={styles.stockLabel}>
                    {insStock ? "En stock" : "Rupture"}
                  </Text>
                  <View style={[styles.switch, insStock && styles.switchOn]}>
                    <View
                      style={[
                        styles.switchKnob,
                        insStock && styles.switchKnobOn,
                      ]}
                    ></View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description (Optionnel)</Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                style={[styles.input, styles.textarea]}
                placeholder="Origine du produit, conseils de conservation..."
                multiline
                textAlignVertical="top"
              ></TextInput>
            </View>
          </ScrollView>

          {/* Footer fixed */}
          <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
            <Pressable onPress={publish} style={styles.publishBtn}>
              <MaterialIcons
                name="publish"
                size={20}
                color="white"
              ></MaterialIcons>
              <Text style={styles.publishText}>Publier le produit</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  wrap: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  backBtnGhost: { width: 40, height: 40 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  photoBox: {
    height: 170,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.18)",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(214,86,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  photoSub: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  h3: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  field: { marginTop: 10 },
  label: { fontSize: 13, fontWeight: "800", color: "#6b7280", marginBottom: 8 },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  textarea: { height: 130, paddingTop: 12 },
  catRow: { gap: 10, paddingRight: 16 },
  catPill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  catPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(214,86,31,0.10)",
  },
  catPillIdle: { borderColor: "rgba(0,0,0,0.08)", backgroundColor: "white" },
  catText: { fontSize: 13, fontWeight: "900" },
  catTextActive: { color: COLORS.primary },
  catTextIdle: { color: "#6b7280" },
  row2: { marginTop: 14, flexDirection: "row", gap: 12 },
  priceWrap: { position: "relative" },
  priceSuffix: {
    position: "absolute",
    right: 14,
    top: 16,
    fontWeight: "900",
    color: "#9ca3af",
  },
  stockBox: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    padding: 3,
    justifyContent: "center",
  },
  switchOn: {
    backgroundColor: COLORS.primary,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  switchKnobOn:{alignSelf:"flex-end"},
  footer:{
    position:"absolute",
    left:0,
    right:0,
    bottom:0,
    paddingHorizontal:16,
    paddingTop:10,
    backgroundColor:"rgba(255,255,255, 0.92)",
    borderTopWidth:1,
    borderTopColor:"rgba(0,0,0,0.06)"
  },
  publishBtn:{
    height:56,
    borderRadius:14,
    backgroundColor:COLORS.primary,
    alignItems:"center",
    flexDirection:'row',
    justifyContent:"center",
    gap:10
  },
  publishText:{color:"white", fontSize:15, fontWeight:'900'}
});
