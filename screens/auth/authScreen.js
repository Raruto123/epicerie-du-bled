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
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    form: "",
  });

  const [success, setSuccess] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Bienvenue !" : "Créer un compte"),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Connectez-vous pour découvrir les épiceries africaines près de chez vous."
        : "Créez votre compte pour acheter ou vendre des produits africains",
    [mode],
  );

  useEffect(() => {
    // When switching between login/signup, reset form and dismiss keyboard
    Keyboard.dismiss();
    setErrors({ name: "", email: "", password: "", form: "" });
    // setSuccess("");
    // setName("");
    // setEmail("");
    // setPassword("");

    if (mode === "login") setIsSeller(false);
    // Scroll back to top for a clean UX
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [mode]);

  const goLogin = () => {
    setMode("login");
    setSuccess("");
    setErrors({ name: "", email: "", password: "", form: "" });
    setName("");
    setPassword("");
  };

  const goSignup = () => {
    setMode("signup");
    setSuccess("");
    setErrors({ name: "", email: "", password: "", form: "" });

    setName("");
    setEmail("");
    setPassword("");
    setIsSeller(false);
  };

  const submit = async () => {
    setErrors({ name: "", email: "", password: "", form: "" });
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn({ email, password });
        navigation.replace("App");
        return;
      }
      // if (!name.trim()) throw new Error("Veuillez entrer votre nom");
      await signUpWithSellerFlag({
        name,
        email,
        password,
        isSeller,
      });

      //switch to login
      setSuccess("Compte crée ! Connectez-vous.");
      setPassword("");
      setName("");

      setTimeout(() => {
        setMode("login");
        setTimeout(() => {
          passwordRef.current?.focus?.();
        }, 150);
      }, 700);
    } catch (e) {
      if (e?.fields) {
        setErrors((prev) => ({ ...prev, ...e.fields }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: e?.message || "Une erreur est survenue",
        }));
      }
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
                {/* <Text style={styles.brandText}>MiFéré</Text> */}
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
              <Pressable style={styles.segmentBtn} onPress={goLogin}>
                <Text
                  style={[
                    styles.segmentText,
                    mode === "login" && styles.segmentTextActive,
                  ]}
                >
                  Se connecter
                </Text>
              </Pressable>
              <Pressable style={styles.segmentBtn} onPress={goSignup}>
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
                    placeholderTextColor={COLORS.muted}
                    onChangeText={(v) => {
                      setName(v);
                      setSuccess("");
                      setErrors((p) => ({ ...p, name: "", form: "" }));
                    }}
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Votre nom"
                  ></TextInput>
                  {!!errors.name && (
                    <Text style={styles.fieldError}>{errors.name}</Text>
                  )}
                </View>
              )}
              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  placeholderTextColor={COLORS.muted}
                  onChangeText={(v) => {
                    setEmail(v);
                    setSuccess("");
                    setErrors((p) => ({ ...p, email: "", form: "" }));
                  }}
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="exemple@email.com"
                  autoCapitalize="none"
                ></TextInput>
                {!!errors.email && (
                  <Text style={styles.fieldError}>{errors.email}</Text>
                )}
              </View>
              <View>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    ref={passwordRef}
                    placeholderTextColor={COLORS.muted}
                    style={[
                      styles.input,
                      { paddingRight: 44 },
                      errors.password && styles.inputError,
                    ]}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setSuccess("");
                      setErrors((p) => ({ ...p, password: "", form: "" }));
                    }}
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
                            true,
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
                {!!errors.password && (
                  <Text style={styles.fieldError}>{errors.password}</Text>
                )}
                {!!success && (
                  <Text style={styles.successBanner}>{success}</Text>
                )}
                {!!errors.form && (
                  <Text style={styles.formError}>{errors.form}</Text>
                )}
              </View>
              {mode === "signup" && (
                <View style={styles.roleSection}>
                  <Text style={styles.roleTitle}>Type de compte</Text>
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

                  {/* encadré explicatif */}
                  <View style={styles.roleInfoBox}>
                    <Text style={styles.roleInfoTitle}>
                      {isSeller ? "Compte Vendeur" : "Compte Acheteur"}
                    </Text>
                    <Text style={styles.roleInfoText}>
                      {isSeller
                        ? "Pour les propriétaires d'épiceries ou individus vendant des produits africains ! \nPubliez vos produits, gérez votre stock et augmentez votre visibilité."
                        : "Pour les amateurs d'épiceries ! \nDécouvrez les épiceries africaines les plus proches, comparez les prix et achetez vos produits favoris plus facilement."}
                    </Text>
                  </View>
                </View>
              )}
              <Pressable
                style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
                onPress={submit}
                disabled={busy}
              >
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
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: "#F1F5F1",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
    opacity: 0.8,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontWeight: "700",
  },
  passwordWrap: {
    position: "relative",
  },
  eye: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  roleSection: {
    marginTop: 6,
    gap: 10,
  },
  roleTitle: {
    fontWeight: "700",
    color: COLORS.text,
    opacity: 0.8,
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
    color: COLORS.primary,
  },
  roleInfoBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: `${COLORS.primary}0D`,
    padding: 12,
    borderRadius: 14,
  },
  roleInfoTitle: {
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 6,
  },
  roleInfoText: {
    color: COLORS.text,
    opacity: 0.85,
    lineHeight: 18,
    fontWeight: "600",
    fontSize: 12,
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
  inputError: {
    borderColor: "#b91c1c",
  },
  fieldError: {
    marginTop: 6,
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
  },
  formError: {
    color: "#b91c1c",
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  successBanner: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(34,197,94,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    color: "#166534",
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
});
