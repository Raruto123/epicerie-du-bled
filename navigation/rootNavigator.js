import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/onboarding/onboardingScreen";
import AuthScreen from "../screens/auth/authScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator ({initialRouteName}) {
    return(
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown : false}}>
                    <Stack.Screen name="Onboarding" component={OnboardingScreen}></Stack.Screen>
                    <Stack.Screen name="Auth" component={AuthScreen}></Stack.Screen>
                    {/* Plus Tard : <stack.Screen name="App" component={UserTabs}*/}
        </Stack.Navigator>
    )
}