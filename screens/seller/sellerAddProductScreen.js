import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import {
  createProduct,
  pickProductImage,
  uploadProductImage,
} from "../../services/sellerAddProductService";

export default function SellerAddProductScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const categories = useMemo(
    () => [
      { key: "Tubercules", icon: "agriculture" },
      { key: "Poissons", icon: "set-meal" },
      { key: "Épices", icon: "whatshot" },
      { key: "Légumes", icon: "eco" },
    ],
    [],
  );

  const scrollToField = (y) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 120);
  };

  const [name, setName] = useState("");
  const [cat, setCat] = useState("Tubercules");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [desc, setDesc] = useState("");
  const [pictureUri, setPictureUri] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    price: "",
  });
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  function validateForm() {
    const nextErrors = { name: "", price: "" };

    const productName = name.trim();
    const rawPrice = (price ?? "").toString().trim().replace(",", ".");
    const productPrice = Number(rawPrice);

    if (!productName) {
      nextErrors.name = "Le nom du produit est obligatoire.";
    }

    if (!rawPrice) {
      nextErrors.price = "Le prix est obligatoire.";
    } else if (!Number.isFinite(productPrice) || productPrice <= 0) {
      nextErrors.price = "Entrez un prix valide supérieur à 0.";
    }

    setErrors(nextErrors);

    return !nextErrors.name && !nextErrors.price;
  }

  const publish = async () => {
    Keyboard.dismiss();
    const sellerId = auth.currentUser?.uid;
    if (!sellerId) return;

    const isValid = validateForm();
    if (!isValid) return;

    const productName = name.trim();
    const productCat = (cat ?? "").toString();
    const productDesc = desc.trim();
    // const productPicture = pictureUri.trim();

    const rawPrice = (price ?? "").toString().trim().replace(",", ".");
    const productPrice = Number(rawPrice);

    // if (!productName) return;
    // if (!productCat) return;
    // if (!Number.isFinite(productPrice) || productPrice <= 0) return;

    setPublishing(true);
    try {
      let photoURL = null;

      if (pictureUri) {
        photoURL = await uploadProductImage({
          sellerId,
          localUri: pictureUri,
        });
      }
      await createProduct({
        sellerId,
        name: productName,
        cat: productCat,
        price: productPrice,
        inStock,
        desc: productDesc,
        photoURL,
      });

      //reset form
      setName("");
      setPrice("");
      setDesc("");
      setCat("Tubercules");
      setInStock(true);
      setPictureUri("");
      setErrors({ name: "", price: "" });
      navigation.goBack();
    } catch (e) {
      console.log("❌ Failed to create product : ", e);
    } finally {
      setPublishing(false);
    }
  };

  const pickPhoto = async () => {
    try {
      const picked = await pickProductImage();
      if (!picked?.uri) return;
      setPictureUri(picked.uri);
    } catch (e) {
      console.log("❌ pick photo error : ", e);
    }
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
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
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: (keyboardVisible ? 40:150) + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo upload (placeholder) */}
            <Pressable style={styles.photoBox} onPress={pickPhoto}>
              {pictureUri ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: pictureUri }}
                  style={styles.photoPreview}
                ></Image>
              ) : (
                <>
                  <View style={styles.photoIcon}>
                    <MaterialIcons
                      name="add-a-photo"
                      size={28}
                      color={COLORS.primary}
                    ></MaterialIcons>
                  </View>
                  <Text style={styles.photoTitle}>Photo du produit</Text>
                  <Text style={styles.photoSub}>
                    Haute résolution recommandée
                  </Text>
                </>
              )}
            </Pressable>

            {/* Details */}
            <Text style={styles.h3}>Détails de l'ingrédient</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Nom du produit</Text>
              <TextInput
                value={name}
                onFocus={() => scrollToField(120)}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Ex: Igname, Piment oiseau, Attieké..."
              ></TextInput>
              {!!errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
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
                    onFocus={() => scrollToField(260)}
                    onChangeText={(text) => {
                      setPrice(text);
                      if (errors.price) {
                        setErrors((prev) => ({ ...prev, price: "" }));
                      }
                    }}
                    style={[
                      styles.input,
                      { paddingRight: 36 },
                      errors.price && styles.inputError,
                    ]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  ></TextInput>
                  <Text style={styles.priceSuffix}>$</Text>
                </View>
                {!!errors.price && (
                  <Text style={styles.errorText}>{errors.price}</Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>État du stock</Text>

                <View style={styles.stockBox}>
                  <Text style={styles.stockLabel}>
                    {inStock ? "En stock" : "Rupture"}
                  </Text>
                  <Switch
                    style={{ alignSelf: "center" }}
                    value={inStock}
                    onValueChange={setInStock}
                    trackColor={{ false: "#e5e7eb", true: COLORS.primary }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="#e5e7eb"
                  ></Switch>
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description (Optionnel)</Text>
              <TextInput
                value={desc}
                onFocus={() => scrollToField(420)}
                onChangeText={setDesc}
                style={[styles.input, styles.textarea]}
                placeholder="Origine du produit, conseils de conservation..."
                multiline
                textAlignVertical="top"
              ></TextInput>
            </View>
          </ScrollView>

          {/* Footer */}
          {!keyboardVisible && (
            <View
              style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}
            >
              <Pressable
                onPress={publish}
                style={[styles.publishBtn, publishing && { opacity: 0.8 }]}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="white"></ActivityIndicator>
                ) : (
                  <>
                    <MaterialIcons
                      name="publish"
                      size={20}
                      color="white"
                    ></MaterialIcons>
                    <Text style={styles.publishText}>Publier le produit</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
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
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: "rgba(255,215,4,0.65)",
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,215,4,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  photoSub: { fontSize: 12, fontWeight: "700", color: COLORS.muted },
  h3: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  field: { marginTop: 10 },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.muted,
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    backgroundColor: "rgba(255,215,4,0.18)",
  },
  catPillIdle: { borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catText: { fontSize: 13, fontWeight: "900" },
  catTextActive: { color: COLORS.primary },
  catTextIdle: { color: COLORS.muted },
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
  publishBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  publishText: { color: "white", fontSize: 15, fontWeight: "900" },
  photoPreview: { width: "100%", height: "100%", borderRadius: 14 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },
});
