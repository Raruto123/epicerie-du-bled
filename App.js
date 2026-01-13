import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import RootNavigator from "./navigation/rootNavigator";
import { getHasSeenOnboarding } from "./services/onboardingService";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Onboarding");

  useEffect(() => {
    let unsub = null;

    (async () => {
      const seen = await getHasSeenOnboarding();
      // ✅ On attend Firebase Auth (restaure session)
      unsub = onAuthStateChanged(auth, (user) => {
        if (!seen) {
          setInitialRoute("Onboarding");
        } else {
          // ✅ si déjà connecté -> App, sinon -> Auth
          setInitialRoute(user ? "App" : "Auth");
        }
        setReady(true);
      });
    })();

    return () => unsub?.();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator initialRouteName={initialRoute} />
    </NavigationContainer>
  );
}
