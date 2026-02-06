import messages from "../locales/th.json";

export type TranslationKey = keyof typeof messages;

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const template = messages[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? "").toString());
}
