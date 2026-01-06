import { useState } from "react";
import { signUpWithSellerFlag, signIn } from "../../services/authService";
import { Button, StyleSheet, TextInput, View, Text, Pressable } from "react-native";
import { resetOnboardingForTest } from "../../services/onboardingService";

export default function AuthScreen({navigation}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [mode, setMode] = useState("login"); // "login" | "signup"

    //rôle à l'inscription
    const [isSeller, setIsSeller] = useState(false);

    const submit = async () => {
        if (mode === "signup") {
            await signUpWithSellerFlag({name, email, password, isSeller});
        } else {
            await signIn({email, password});
        }
    }

    console.log(isSeller);

    return (
        <View style={styles.authView}>
            <Text style={styles.loginOrSignUpText}>
                {mode === "signup" ? "Créer un compte" : "Se connecter"}
            </Text>
            {mode === "signup" && (
                            <TextInput 
            placeholder="Nom"
            autoCapitalize="none"
            value={name}
            onChangeText={setName}
            style={styles.textInput}>
            </TextInput>
            )}
            <TextInput 
            placeholder="E-mail"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.textInput}>
            </TextInput>
            <TextInput 
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.textInput}>
            </TextInput>

            {mode === "signup" && (
                <View style={styles.signUpView}>
                    <Text style={styles.signUpChoiceText}>Tu es :</Text>
                    <View style={styles.signUpButtonsView}>
                        <Button 
                        title={isSeller ? "Acheteur" : "Acheteur ✅"}
                        onPress={() => setIsSeller(false)}
                        ></Button>
                        <Button 
                        title={isSeller ? "Vendeur ✅" : "Vendeur"}
                        onPress={() => setIsSeller(true)}
                        ></Button>
                    </View>
                    <Text style={styles.signUpDisclaimerText}>
                        Tu pourras acheter comme tout le monde. "Vendeur" ajoute juste l'accès à l'Espace Vendeur.
                    </Text>
                </View>
            )}

            <Button title={mode === "signup" ? "Créer" : "Connexion"} onPress={submit}></Button>
            <Button title={mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"} onPress={() => setMode((m) => (m === "signup" ? "login" : "signup"))}></Button>
            <Pressable onPress={async () => {
                await resetOnboardingForTest();
                navigation.replace("Onboarding");
            }}>
                <Text style={{textAlign : "center", opacity: 0.7, marginTop : 12}}>
                    Revoir l'onboarding
                </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    authView : {
        padding : 24,
        gap : 12,
        justifyContent : "center",
        flex : 1
    },
    loginOrSignUpText : {
        fontSize : 26,
        fontWeight : "700"
    },
    textInput : {
        borderWidth : 1,
        padding : 12,
        borderRadius : 8
    },
    signUpView : {
        gap : 8,
    },
    signUpChoiceText : {
        fontWeight : "600"
    },
    signUpButtonsView : {
        flexDirection : "row",
        gap : 10
    },
    signUpDisclaimerText : {
        opacity : 0.2,
        fontStyle : "italic"
    }
})