/** اسم الجهة المعروض في الواجهات الرسمية (الرأس، الشعارات النصية). */
export const ENTITY_NAME_AR = "محافظة درعا";

/** الاسم الظاهر في خانة «من» لرسائل رمز التحقق (OTP) المرسلة للمواطن عبر البريد */
export const CITIZEN_OTP_EMAIL_SENDER_NAME_AR = "البوابة الموحدة لبلديات محافظة درعا";

/**
 * اسم التطبيق كما يظهر تحت أيقونة PWA وفي عنوان التبويب ورسائل البريد ونصوص «البلدية».
 * النظام يمثل محافظة درعا كاملة ولا يُنسب إلى بلدية واحدة.
 */
export const APP_NAME_AR = "بوابة محافظة درعا";

export const CITIZEN_PORTAL_NAME_AR = "بوابة محافظة درعا";

export const PORTAL_SUBTITLE = "منصة الخدمات الإلكترونية الموحدة";

export const GOVERNORATE_NAME_AR = "محافظة درعا";

export const SUPERVISING_AUTHORITY_AR = "بإشراف وزارة الإدارة المحلية والبيئة السورية";

export const OFFICIAL_SCOPE_AR = "نظام رسمي لبلديات محافظة درعا";

/**
 * مسارات شعارات الهوية الرسمية. نُبقي الشعار الحالي كما هو، مع تجهيز مكان مستقل
 * لشعار المحافظة وشعارات البلديات عند توفر ملفاتها لاحقاً.
 */
export const BRAND_ASSETS = {
  stateEmblemPng: "/brand/state-emblem.png",
  stateEmblemSvg: "/brand/state-emblem.svg",
  governorateEmblemPng: "/brand/daraa-governorate-emblem.png",
  municipalityLogosBase: "/brand/municipalities",
} as const;
