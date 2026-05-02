import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LANGUAGE_KEY } from "@/i18n";

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage === "ar" ? "ar" : "en";
  const nextLanguage = currentLanguage === "ar" ? "en" : "ar";

  const handleToggle = async () => {
    await i18n.changeLanguage(nextLanguage);
    document.documentElement.dir = nextLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLanguage;
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      aria-label={t("common.language")}
      title={t("common.language")}
      className="h-8 px-2 text-xs"
    >
      {nextLanguage.toUpperCase()}
    </Button>
  );
}
