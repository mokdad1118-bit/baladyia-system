# نشر التطبيق على الإنترنت

المشروع يضم **تطبيق المواطن** (الجذر `/`) و**لوحة التحكم** (`/admin`) في نفس تطبيق Next.js واحد. للنشر تحتاج:

1. **متغيرات بيئة** (راجع `.env.example`)
2. **قاعدة بيانات** SQLite ملفية أو **Turso** (LibSQL)
3. **تخزين مرفقات الطلبات** — حالياً تُحفظ في `public/uploads` (مناسب لخادم أو Docker مع volume؛ غير مناسب لنمط Serverless بدون تعديل)

---

## الطريقة الموصى بها: Docker على VPS أو خادم خاص

مناسبة لأن رفع الملفات وقاعدة SQLite تعملان على قرص دائم.

### 1) على الجهاز أو الخادم

```bash
cp .env.example .env
# عدّل AUTH_SECRET و AUTH_URL (رابط الموقع الحقيقي بـ https)
```

أنشئ `AUTH_SECRET` قوياً، مثلاً:

```bash
openssl rand -base64 32
```

### 2) البناء والتشغيل

```bash
docker compose up -d --build
```

- الموقع: `http://SERVER_IP:3000`  
- لوحة التحكم: `http://SERVER_IP:3000/admin`  
- جلسات تسجيل الدخول تعتمد على `AUTH_URL`؛ يجب أن يطابق عنوان الموقع الذي يصل إليه المستخدم (بما في ذلك `https` والنطاق).

### 3) البيانات الأولية (مستخدم إداري + خدمات)

داخل الحاوية (أو على نفس البيئة مع `DATABASE_URL` نفسه):

```bash
docker compose exec eportal npx prisma db seed
```

يستخدم `prisma/seed.ts` ويُنشئ حسابات تجريبية (غيّر كلمات المرور فوراً في الإنتاج):

| الدور | الدخول | كلمة المرور الافتراضية |
|--------|--------|-------------------------|
| Admin | `admin@bosra.local` | `Admin123` |
| Employee | `employee@bosra.local` | `Employee123` |
| Citizen | واتساب `963900000001` أو البريد `citizen@example.com` | `Citizen123` |

### 4) HTTPS أمام التطبيق

ضع **Nginx** أو **Caddy** أمام المنفذ 3000 مع شهادة TLS، ووجّه البروكسي إلى الحاوية. حدّث `AUTH_URL` إلى `https://اسم-النطاق`.

---

## بديل: Turso + استضافة Node (Railway / Render / VPS)

1. أنشئ قاعدة في [Turso](https://turso.tech/) وانسخ `libsql://...` و`TURSO_AUTH_TOKEN`.
2. عيّن في البيئة:

   - `DATABASE_URL=libsql://...`
   - `TURSO_AUTH_TOKEN=...`
   - `AUTH_SECRET` و `AUTH_URL`

3. على الخادم بعد السحب من Git:

   ```bash
   npm ci --include=dev
   npx prisma migrate deploy
   npm run build
   npm run start
   ```

**ملاحظة:** رفع الملفات ما زال إلى `public/uploads` على القرص؛ على منصات بدون قرص دائم تحتاج لاحقاً تخزين كائنات (S3 / Cloudflare R2 / Vercel Blob) وتعديل `request-citizen.ts`.

---

## Vercel (سريع للواجهة فقط)

يمكن ربط المستودع بـ Vercel، لكن **بدون** حل لتخزين المرفقات وملف SQLite على القرص لن يعمل النظام كاملاً كما هو اليوم. الخيار العملي: **Turso** للقاعدة + لاحقاً تخزين سحابي للملفات، أو الاكتفاء بـ **Docker على VPS**.

---

## قائمة تحقق سريعة قبل الإطلاق

| البند | وصف |
|--------|-----|
| `AUTH_SECRET` | قيمة عشوائية طويلة، لا تُشارك |
| `AUTH_URL` | نفس عنوان الموقع العلني (مثلاً `https://domain.com`) |
| `DATABASE_URL` | ملف `file://...` مع نسخ احتياطي، أو Turso |
| الجدار الناري | فتح 80/443 (والوصول إلى 3000 داخلياً فقط إن أمكن) |
| النسخ الاحتياطي | نسخ volume قاعدة SQLite ومجلد `public/uploads` دورياً |
