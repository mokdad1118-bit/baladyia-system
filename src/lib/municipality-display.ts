export function municipalityCouncilName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("مجلس ")) return trimmed;
  if (trimmed.startsWith("مدينة ")) return `مجلس ${trimmed}`;
  return `مجلس مدينة ${trimmed}`;
}

