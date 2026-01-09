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

export default function SellerOverviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  //MVP data (plus tard : Firestore)
  const initial = useMemo(
    () => ({
      storeName: "Épicerie Mapouka Canada",
      description:
        "Importateur de produits frais de l'Afrique de l'Ouest. Plaintains, ignames et épices rares disponibles tous les mardis.",
      address: "7540 Boulevard Pie-IX, Montréal, QC",
      verified: true,
    }),
    []
  );

  const [storeName, setStoreName] = useState(initial.storeName);
  const [description, setDescription] = useState(initial.description);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);

  const goBack = () => navigation.goBack?.();

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    try {
      //TODO update : Firestore seller profile
    } finally {
      setSaving(false);
    }
  };

  const updateGps = () => {
    // TODO: ouvrir une logique GPS plus tard
    // Là on garde juste le design
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Top App Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={goBack} style={styles.topBtn} hitSlop={10}>
              <View style={styles.topBtnRow}>
                <MaterialIcons
                  name="arrow-back-ios"
                  size={18}
                  color={COLORS.text}
                ></MaterialIcons>
                <Text style={styles.topBtnText}>Annuler</Text>
              </View>
            </Pressable>

            <Text style={styles.topTitle}>Modifier le Profil</Text>

            <Pressable onPress={save} style={styles.saveLink} hitSlop={10}>
              <Text style={styles.saveLinkText}>Enregistrer</Text>
            </Pressable>
          </View>

          {/* Cover + Logo */}
          <View style={styles.visualWrap}>
            <View style={styles.cover}>
              <Pressable style={styles.coverCamBtn} hitSlop={10}>
                <MaterialIcons
                  name="photo-camera"
                  size={20}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>

            <View style={styles.logoWrap}>
              <View style={styles.logo}></View>
              <Pressable style={styles.logoEditBtn} hitSlop={10}>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color="white"
                ></MaterialIcons>
              </Pressable>
            </View>
          </View>

          <View style={styles.centerHeader}>
            <Text style={styles.storeTitle}>
              {storeName || "Votre boutique"}
            </Text>
            {initial.verified && (
                <Text style={styles.verified}>Vendeur vérifié</Text>
            )}
          </View>

          {/* Identité */}
          <Text style={styles.h3}>Identité du commerce</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nom commercial</Text>
            <TextInput value={storeName} onChangeText={setStoreName} style={styles.input} placeholder="Entrez le nom de votre commerce" returnKeyType="done"></TextInput>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
