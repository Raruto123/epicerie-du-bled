import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import RootNavigator from "./navigation/rootNavigator";
import { getHasSeenOnboarding } from "./services/onboardingService";

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Onboarding");

  useEffect(() => {
    (async () => {
      const seen = await getHasSeenOnboarding();
      setInitialRoute(seen ? "Auth" : "Onboarding");
      setReady(true);
    }) ();
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