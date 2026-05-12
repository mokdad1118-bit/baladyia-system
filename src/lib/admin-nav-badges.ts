/** أنواع الإشعارات التي تُظهر شارة «جديد» في قائمة الإدارة لكل قسم */
export const ADMIN_NAV_BADGE_NOTIFICATION_TYPES = {
  cityServiceRequests: ["REQUEST_SUBMIT"] as const,
  gas: ["GAS_SUBMITTED"] as const,
  social: ["SOCIAL_SERVICE_SUBMITTED", "RETURNEE_SUBMITTED"] as const,
  feedback: ["FEEDBACK_SUBMITTED"] as const,
} as const;

export type AdminNavBadgeCounts = {
  cityServiceRequests: number;
  gas: number;
  social: number;
  feedback: number;
};
