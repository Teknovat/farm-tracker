"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setStoredLocale } from "@/lib/i18n/preferences";
import { Select } from "./Select";

const languageNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export function LanguageSelector() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    const targetLocale = newLocale as Locale;

    // Store the preference
    setStoredLocale(targetLocale);

    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    // Navigate to the new locale
    const newPath = targetLocale === "fr" ? pathWithoutLocale : `/${targetLocale}${pathWithoutLocale}`;
    router.push(newPath);
    router.refresh(); // Refresh to apply new locale
  };

  const options = locales.map((loc) => ({
    value: loc,
    label: languageNames[loc],
  }));

  return (
    <Select
      value={locale}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="w-auto min-w-[120px]"
      options={options}
    />
  );
}
