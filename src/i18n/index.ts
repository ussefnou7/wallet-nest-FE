import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import ar from "./locales/ar/common.json";

const LANGUAGE_KEY = "app_language";
const supportedLanguages = ["en", "ar"] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];

const applyDocumentLanguage = (language: string) => {
  const normalized = language.split("-")[0] as SupportedLanguage;
  const isArabic = normalized === "ar";

  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.documentElement.lang = supportedLanguages.includes(normalized) ? normalized : "en";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ar: { common: ar },
    },
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ["localStorage"],
    },
    supportedLngs: supportedLanguages,
  });

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language || "en");

i18n.on("languageChanged", (language) => {
  localStorage.setItem(LANGUAGE_KEY, language);
  applyDocumentLanguage(language);
});

export { LANGUAGE_KEY };
export default i18n;
