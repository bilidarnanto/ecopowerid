"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, id, type Dict } from "./dictionaries";
import { COOKIE, getCookieLang, getDict, type Lang } from "./index";

export { COOKIE, getCookieLang, getDict, type Lang };

const I18nContext = createContext<{
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
} | null>(null);

export function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const toggleLang = useCallback(
    () => setLang(lang === "id" ? "en" : "id"),
    [lang, setLang]
  );

  const value = useMemo(
    () => ({ lang, t: lang === "id" ? id : en, setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
