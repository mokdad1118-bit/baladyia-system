/**
 * يُعاد إنشاؤه عند كل تنقّل ضمن تطبيق المواطن، فيُحدَّث المحتوى الرئيسي
 * ولا تبقى حالة قديمة تُظهر الصفحة السابقة كأنها لم تتغيّر.
 */
export default function CitizenDashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-w-0">{children}</div>;
}
