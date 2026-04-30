/** صفحات الدخول على نفس الدومين — التحقق من الدور في الخادم */
export type LoginPageSurface = "citizen" | "staff" | "admin";

/** @deprecated استخدم LoginPageSurface */
export type AuthPortal = LoginPageSurface;
