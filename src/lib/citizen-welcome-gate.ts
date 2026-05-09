/** يُسمح بتخطّي شاشة الترحيب أثناء الجلسة الحالية داخل التطبيق؛ يُمسح عند مغادرة الصفحة/التطبيق. */
export const CITIZEN_WELCOME_GATE_KEY = "citizen_ok_without_welcome_gate";

export function setCitizenWelcomeGatePassed(): void {
  try {
    sessionStorage.setItem(CITIZEN_WELCOME_GATE_KEY, "1");
  } catch {
    /* تعذّر الوصول للتخزين — لا نمنع التطبيق */
  }
}

export function clearCitizenWelcomeGate(): void {
  try {
    sessionStorage.removeItem(CITIZEN_WELCOME_GATE_KEY);
  } catch {
    /* noop */
  }
}

export function hasCitizenWelcomeGatePassed(): boolean {
  try {
    return sessionStorage.getItem(CITIZEN_WELCOME_GATE_KEY) === "1";
  } catch {
    return true;
  }
}

/** مسارات المواطن العامة — لا نفرض الترحيب عليها من بوابة اللوحة */
const PUBLIC_UNDER_CITIZEN = [
  "/citizen/welcome",
  "/citizen/login",
  "/citizen/register",
  "/citizen/forgot-password",
];

export function pathNeedsCitizenWelcomeGate(pathnameWithSearch: string): boolean {
  const pathOnly = pathnameWithSearch.split("?")[0] ?? pathnameWithSearch;
  if (!pathOnly.startsWith("/citizen")) return false;
  return !PUBLIC_UNDER_CITIZEN.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`));
}
