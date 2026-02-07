"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Supported locales
export const SUPPORTED_LOCALES = ["en", "fr", "es", "de", "it"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
};

type Translations = Record<string, string>;

interface I18nContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Detect language from cookie, localStorage, or browser
function detectLanguage(): Locale {
  if (typeof window === "undefined") return "en";

  // 1. Cookie
  const cookieMatch = document.cookie.match(/WINELOG_LANG=(\w+)/);
  if (cookieMatch && SUPPORTED_LOCALES.includes(cookieMatch[1] as Locale)) {
    return cookieMatch[1] as Locale;
  }

  // 2. localStorage
  const stored = localStorage.getItem("winelog_lang");
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  // 3. Browser language
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang && SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  return "en";
}

function persistLanguage(lang: Locale) {
  if (typeof window === "undefined") return;

  // Cookie — 1 year
  document.cookie = `WINELOG_LANG=${lang}; path=/; max-age=31536000; SameSite=Lax`;

  // localStorage
  localStorage.setItem("winelog_lang", lang);
}

// Translation cache to avoid re-importing
const translationCache: Partial<Record<Locale, Translations>> = {};

async function loadTranslations(lang: Locale): Promise<Translations> {
  if (translationCache[lang]) return translationCache[lang]!;

  try {
    // Dynamic import of locale JSON
    let module;
    switch (lang) {
      case "fr":
        module = await import("@/lib/i18n/locales/fr.json");
        break;
      case "es":
        module = await import("@/lib/i18n/locales/es.json");
        break;
      case "de":
        module = await import("@/lib/i18n/locales/de.json");
        break;
      case "it":
        module = await import("@/lib/i18n/locales/it.json");
        break;
      default:
        module = await import("@/lib/i18n/locales/en.json");
    }
    const translations = module.default || module;
    translationCache[lang] = translations;
    return translations;
  } catch (err) {
    console.warn(`Failed to load translations for "${lang}", falling back to English`, err);
    if (lang !== "en") return loadTranslations("en");
    return {};
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>("en");
  const [translations, setTranslations] = useState<Translations>({});
  const [isReady, setIsReady] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const detected = detectLanguage();
      const trans = await loadTranslations(detected);
      setLanguageState(detected);
      setTranslations(trans);
      setIsReady(true);
    };
    init();
  }, []);

  // Check for user preference from auth (synced via localStorage user object)
  useEffect(() => {
    if (!isReady) return;

    try {
      const storedUser = localStorage.getItem("winelog_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.preferredLanguage && SUPPORTED_LOCALES.includes(parsed.preferredLanguage)) {
          const userLang = parsed.preferredLanguage as Locale;
          if (userLang !== language) {
            loadTranslations(userLang).then((trans) => {
              setLanguageState(userLang);
              setTranslations(trans);
              persistLanguage(userLang);
            });
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback(async (lang: Locale) => {
    const trans = await loadTranslations(lang);
    setLanguageState(lang);
    setTranslations(trans);
    persistLanguage(lang);

    // Also update the html lang attribute
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let result = translations[key];

      if (!result) {
        if (isReady) {
          console.warn(`[i18n] Missing translation key: "${key}" for locale "${language}"`);
        }
        // Return the key part after the last dot as a readable fallback
        return key.split(".").pop() || key;
      }

      // Simple variable interpolation: {name} -> value
      if (vars) {
        Object.entries(vars).forEach(([varKey, varValue]) => {
          result = result.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(varValue));
        });
      }

      return result;
    },
    [translations, language, isReady]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isReady }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
