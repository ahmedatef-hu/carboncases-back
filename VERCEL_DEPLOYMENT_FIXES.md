# إصلاح مشاكل Vercel Deployment

## المشكلة 1: الصور لا تظهر ❌

### السبب:
- الصور محفوظة في مجلد `backend/uploads` محليًا
- Vercel لا يدعم تخزين الملفات (Serverless)
- كل deployment جديد يحذف الملفات المرفوعة

### الحل: استخدام Supabase Storage ✅

#### خطوات الإعداد:

1. **إنشاء Storage Bucket في Supabase:**
   - افتح [Supabase Dashboard](https://supabase.com/dashboard)
   - اختر مشروعك
   - من القائمة الجانبية، اختر "Storage"
   - اضغط "Create a new bucket"
   - اسم الـ bucket: `product-images`
   - اجعله Public: ✅
   - اضغط "Create bucket"

2. **تعديل Backend لاستخدام Supabase Storage:**
   - سنستخدم Supabase Client لرفع الصور
   - الصور ستُحفظ في Supabase وليس محليًا
   - سنحصل على URL دائم للصورة

3. **تحديث Environment Variables في Vercel:**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

---

## المشكلة 2: Google OAuth Error (redirect_uri_mismatch) ❌

### السبب:
- الـ redirect URI في Google Console مضبوط على `http://localhost:5000`
- لكن الموقع على Vercel يستخدم `https://carboncases-back.vercel.app`

### الحل: تحديث Google OAuth Settings ✅

#### خطوات الإصلاح:

1. **افتح Google Cloud Console:**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - اختر مشروع "Carbon Cases"

2. **تعديل OAuth Client:**
   - من القائمة: "APIs & Services" > "Credentials"
   - اضغط على OAuth Client ID الموجود
   - في "Authorized JavaScript origins" أضف:
     ```
     https://carboncases-front.vercel.app
     https://carboncases-back.vercel.app
     http://localhost:3000
     http://localhost:5000
     ```
   
   - في "Authorized redirect URIs" أضف:
     ```
     https://carboncases-back.vercel.app/api/auth/google/callback
     http://localhost:5000/api/auth/google/callback
     ```
   
   - اضغط "SAVE"

3. **تحديث Environment Variables في Vercel Backend:**
   ```
   GOOGLE_CALLBACK_URL=https://carboncases-back.vercel.app/api/auth/google/callback
   FRONTEND_URL=https://carboncases-front.vercel.app
   ```

4. **تحديث Environment Variables في Vercel Frontend:**
   ```
   REACT_APP_API_URL=https://carboncases-back.vercel.app/api
   ```

---

## ملاحظات مهمة:

### للـ Backend على Vercel:
- تأكد من وجود ملف `vercel.json` مضبوط صح
- تأكد من Environment Variables كلها موجودة
- Database URL يجب أن يكون صحيح

### للـ Frontend على Vercel:
- تأكد من `REACT_APP_API_URL` مضبوط على backend URL
- تأكد من Build Command: `npm run build`
- تأكد من Output Directory: `build`

### للصور:
- بعد تطبيق Supabase Storage، كل الصور الجديدة ستُرفع على Supabase
- الصور القديمة المحلية لن تظهر (يجب إعادة رفعها)

---

## الخطوات التالية:

1. ✅ إصلاح Google OAuth (سأقوم به الآن)
2. ✅ تطبيق Supabase Storage للصور (سأقوم به الآن)
3. ⏳ تحديث Environment Variables في Vercel
4. ⏳ إعادة رفع الصور من خلال Admin Dashboard
