import { en, id, type Dict } from "./dictionaries";

export type Lang = "id" | "en";

export const COOKIE = "ecopower_lang";

export function getCookieLang(cookieHeader?: string | null): Lang {
  if (!cookieHeader) return "id";
  const match = cookieHeader.match(/(?:^|;\s*)ecopower_lang=([a-z]{2})/);
  return match && (match[1] === "en" || match[1] === "id") ? match[1] : "id";
}

export function getDict(lang: Lang): Dict {
  return lang === "id" ? id : en;
}
