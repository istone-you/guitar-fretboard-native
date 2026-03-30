import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ja from "./locales/ja/common.json";
import en from "./locales/en/common.json";

const STORAGE_KEY = "guiter:locale";

void i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: "ja",
  fallbackLng: "ja",
  interpolation: {
    escapeValue: false,
  },
});

// Load persisted locale
AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
  if (stored === "ja" || stored === "en") {
    void i18n.changeLanguage(stored);
  }
});

export async function changeLocale(locale: "ja" | "en") {
  void i18n.changeLanguage(locale);
  await AsyncStorage.setItem(STORAGE_KEY, locale);
}

export default i18n;
