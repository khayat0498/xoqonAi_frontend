"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import uz from "./i18n/uz.json";
import ru from "./i18n/ru.json";

type Lang = "uz" | "ru";

const dictionaries = { uz, ru } as const;

type Dict = typeof uz;

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "uz",
  setLang: () => {},
  t: (path) => path,
});

const LANG_KEY = "xoqon_lang";

function resolve(dict: Dict, path: string): string {
  const parts = path.split(".");
  let current: unknown = dict;
  for (const p of parts) {
    if (current && typeof current === "object" && p in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "uz" || saved === "ru") {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (path: string) => resolve(dictionaries[lang] as Dict, path),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
