import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storageKeys";

export async function getHasSeenOnboarding() {
    const seen = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
    return seen === "true"
}

export async function setHasSeenOnboarding() {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, "true");
}
 
export async function resetOnboardingForTest() {
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING)
}