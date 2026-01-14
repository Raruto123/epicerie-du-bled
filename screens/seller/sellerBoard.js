import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SellerOverviewScreen from "./sellerOverviewScreen";
import SellerProductsScreen from "./sellerProductsScreen";
import SellerAddProductScreen from "./sellerAddProductScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === "APERÇU"
              ? "dashboard"
              : route.name === "PRODUITS"
              ? "inventory-2"
              : "dashboard";
          return (
            <MaterialIcons
              name={name}
              size={size ?? 22}
              color={color}
            ></MaterialIcons>
          );
        },
      })}
    >
      <Tab.Screen name="APERÇU" component={SellerOverviewScreen}></Tab.Screen>
      <Tab.Screen name="PRODUITS" component={SellerProductsScreen}></Tab.Screen>
    </Tab.Navigator>
  );
}

export default function SellerBoard({ }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SellerTabs" component={SellerTabs}></Stack.Screen>
        <Stack.Screen
          name="SellerAddProduct"
          component={SellerAddProductScreen}
        ></Stack.Screen>
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  tabBar: {
    height: 100,
    paddingBottom: 10,
    // paddingTop:8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "white",
    // paddingBottom: 10,
    // borderTopWidth: 1,
    // borderTopColor: "rgba(0,0,0,0.06)",
    // backgroundColor: "white",
  },
  tabLabel :{
    fontSize:11,
    fontWeight:"800"
  }
});
