/**
 * يُعاد إنشاؤه عند كل تنقّل ضمن لوحة التحكم حتى يتحدّث عمود المحتوى
 * مع كل مسار (الطلبات، الخدمات، المستخدمين، …).
 */
export default function AdminPanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
