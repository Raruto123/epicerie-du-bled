import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/onboarding/onboardingScreen";
import AuthScreen from "../screens/auth/authScreen";
import UserApp from "../screens/user/userApp";
import SellerBoard from "../screens/seller/sellerBoard";
import SellerLocationPickerScreen from "../screens/seller/sellerLocationPickerScreen";
import ProductDetailsScreen from "../screens/user/productDetailsScreen";
import GroceryStoreScreen from "../screens/user/groceryStoreScreen";
import CompareScreen from "../screens/user/compareScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
      ></Stack.Screen>
      <Stack.Screen name="Auth" component={AuthScreen}></Stack.Screen>
      <Stack.Screen name="App" component={UserApp}></Stack.Screen>
      <Stack.Screen name="SellerBoard" component={SellerBoard}></Stack.Screen>
      <Stack.Screen
        name="SellerLocationPicker"
        component={SellerLocationPickerScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="GroceryStore"
        component={GroceryStoreScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="CompareScreen"
        component={CompareScreen}
      ></Stack.Screen>
    </Stack.Navigator>
  );
}
