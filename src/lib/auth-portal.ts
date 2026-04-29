/** صفحة الدخول: مواطن (/citizen/login) أو لوحة التحكم (/admin/login) — التحقق من الدور في الخادم */
export type LoginPageSurface = "citizen" | "staff";

/** @deprecated استخدم LoginPageSurface */
export type AuthPortal = LoginPageSurface;
