import * as Localization from "expo-localization";

import fr from "./locales/fr";
import en from "./locales/en";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

console.log("EN Categories =", en.categories);


export const LANGUAGE_STORAGE_KEY = "app_language";

export function getDeviceLanguage() {
  try {
    const locales = Localization.getLocales() ?? [];
    const code =
      locales[0].languageCode || locales[0].languageTag.split("-")[0] || "en";

    if (String(code).toLowerCase().startsWith("fr")) return "fr";
    if (String(code).toLowerCase().startsWith("en")) return "en";

    return "en";
  } catch (e) {
    return "en";
  }
}

export async function initI18n() {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const lng = savedLanguage || getDeviceLanguage();

  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      compatibilityJSON: "v4",
      lng,
      fallbackLng: "en",
      resources: {
        fr: { translation: fr },
        en: { translation: en },
      },
      interpolation: {
        escapeValue: false,
      },
    });
  } else {
    await i18next.changeLanguage(lng);
  }

  return i18next;
}

export async function setAppLanguage(lang) {
  const nextLang = lang === "fr" ? "fr" : "en";
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
  await i18next.changeLanguage(nextLang);
}

export default i18next;
