import {
  ActivityIndicator,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { signUpWithSellerFlag, signIn } from "../../services/authService";
import { LogoMark } from "../onboarding/onboardingScreen";
import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";

export default function AuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);

  const [mode, setMode] = useState("login"); //login|signup
  const [isSeller, setIsSeller] = useState(false); //buyer|seller

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Bienvenue !" : "Créer un compte"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Connectez-vous pour découvrir les épiceries africaines près de chez vous."
        : "Créez votre compte pour acheter ou vendre des produits africains",
    [mode]
  );

  useEffect(() => {
    // When switching between login/signup, reset form and dismiss keyboard
    Keyboard.dismiss();
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    if (mode === "login") setIsSeller(false);
    // Scroll back to top for a clean UX
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [mode]);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn({ email, password });
        navigation.replace("App");
      } else {
        if (!name.trim()) throw new Error("Veuillez entrer votre nom");
        await signUpWithSellerFlag({
          name: name.trim(),
          email,
          password,
          isSeller,
        });
      }
    } catch (e) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle={"dark-content"}></StatusBar>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.container,
              { paddingBottom: 24 + insets.bottom, flexGrow: 1 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.replace("Onboarding")}
                style={styles.backBtn}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={22}
                  color={COLORS.text}
                ></MaterialIcons>
              </Pressable>
              <View style={styles.brand}>
                <LogoMark></LogoMark>
                <Text style={styles.brandText}>AfroMarket CA</Text>
              </View>
              <View style={styles.spacer}></View>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.h1}>{title}</Text>
              <Text style={styles.p}>{subtitle}</Text>
            </View>

            {/* Segmented control */}
            <View style={styles.segment}>
              <View
                style={[
                  styles.segmentPill,
                  { left: mode === "login" ? 4 : "50%" },
                ]}
              ></View>
              <Pressable
                style={styles.segmentBtn}
                onPress={() => setMode("login")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "login" && styles.segmentTextActive,
                  ]}
                >
                  Se connecter
                </Text>
              </Pressable>
              <Pressable
                style={styles.segmentBtn}
                onPress={() => setMode("signup")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "signup" && styles.segmentTextActive,
                  ]}
                >
                  S'inscrire
                </Text>
              </Pressable>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === "signup" && (
                <View>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholder="Votre nom"
                  ></TextInput>
                </View>
              )}
              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="exemple@email.com"
                  autoCapitalize="none"
                ></TextInput>
              </View>
              <View>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mot de passe"
                    secureTextEntry={secure}
                    onFocus={() => {
                      // Ensure the password field is visible above the Keyboard (Android & iOS)
                      setTimeout(() => {
                        const node = findNodeHandle(passwordRef.current);
                        const responder =
                          scrollRef.current?.getScrollResponder?.();
                        if (
                          node &&
                          responder?.scrollResponderScrollNativeHandleToKeyboard
                        ) {
                          responder.scrollResponderScrollNativeHandleToKeyboard(
                            node,
                            90,
                            true
                          );
                        } else {
                          //Fallback
                          scrollRef.current?.scrollToEnd({ animated: true });
                        }
                      }, 50);
                    }}
                  ></TextInput>
                  <Pressable
                    style={styles.eye}
                    onPress={() => setSecure(!secure)}
                  >
                    <MaterialIcons
                      name={secure ? "visibility-off" : "visibility"}
                      size={20}
                      color={COLORS.muted}
                    ></MaterialIcons>
                  </Pressable>
                </View>
              </View>

              {mode === "signup" && (
                <View style={styles.roleRow}>
                  <Pressable
                    onPress={() => setIsSeller(false)}
                    style={[
                      styles.roleChip,
                      isSeller === false && styles.roleChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        isSeller === false && styles.roleTextActive,
                      ]}
                    >
                      Acheteur
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIsSeller(true)}
                    style={[
                      styles.roleChip,
                      isSeller === true && styles.roleChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        isSeller === true && styles.roleTextActive,
                      ]}
                    >
                      Vendeur
                    </Text>
                  </Pressable>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable style={styles.primaryBtn} onPress={submit}>
                {busy ? (
                  <ActivityIndicator color="white"></ActivityIndicator>
                ) : (
                  <Text style={styles.primaryText}>
                    {mode === "login" ? "Se connecter" : "Créer le compte"}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// const COLORS = {
//   primary: "#d6561f",
//   bg: "#f8f6f6",
//   surface: "#ffffff",
//   text: "#171311",
//   muted: "#876e64",
//   border: "#e7e1de",
// };

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLORS.primary,
  },
  spacer: {
    width: 40,
  },
  hero: {
    marginVertical: 20,
    alignItems: "center",
  },
  h1: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
  },
  p: {
    marginTop: 6,
    textAlign: "center",
    color: COLORS.muted,
  },
  segment: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e9e4e2",
    padding: 4,
    flexDirection: "row",
    marginBottom: 20,
  },
  segmentPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: "50%",
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontWeight: "800",
    color: COLORS.muted,
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  form: {
    gap: 14,
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
  },
  passwordWrap: {
    position: "relative",
  },
  eye: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  roleChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  roleChipActive: {
    backgroundColor: `${COLORS.primary}22`,
    borderColor: COLORS.primary,
  },
  roleText: {
    fontWeight: "800",
    color: COLORS.muted,
  },
  roleTextActive: {
    color: COLORS.text,
  },
  primaryBtn: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  error: {
    color: "#b91c1c",
    fontWeight: "700",
  },
});
