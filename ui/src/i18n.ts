export type Locale = "en" | "es";

const strings: Record<Locale, Record<string, string>> = {
  en: {
    title: "Muppet MiniChat",
    inputLabel: "Your message",
    placeholder: "Type a message…",
    send: "Send",
    typing: "Bot is typing…",
    tenantLabel: "Tenant",
    language: "Language",
    en: "English",
    es: "Spanish"
  },
  es: {
    title: "Muppet MiniChat",
    inputLabel: "Tu mensaje",
    placeholder: "Escribe un mensaje…",
    send: "Enviar",
    typing: "El bot está escribiendo…",
    tenantLabel: "Tenant",
    language: "Idioma",
    en: "Inglés",
    es: "Español"
  }
};

export function createTranslator(locale: Locale) {
  return (key: string) => strings[locale][key] ?? key;
}
