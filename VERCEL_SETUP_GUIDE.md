# دليل إعداد Vercel - Carbon Cases

## 🚀 خطوات النشر على Vercel

### 1️⃣ إعداد Supabase Storage (للصور)

#### أ. إنشاء Storage Bucket:
1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. من القائمة الجانبية: **Storage**
4. اضغط **"Create a new bucket"**
5. اسم الـ bucket: `product-images`
6. اجعله **Public** ✅
7. اضغط **"Create bucket"**

#### ب. الحصول على Supabase Keys:
1. من القائمة الجانبية: **Settings** > **API**
2. انسخ:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 2️⃣ إعداد Google OAuth للإنتاج

#### أ. تحديث Google Cloud Console:
1. افتح [Google Cloud Console](https://console.cloud.google.com/)
2. اختر مشروع "Carbon Cases"
3. من القائمة: **APIs & Services** > **Credentials**
4. اضغط على OAuth Client ID الموجود

#### ب. إضافة Production URLs:

**Authorized JavaScript origins:**
```
https://carboncases-front.vercel.app
https://carboncases-back.vercel.app
http://localhost:3000
http://localhost:5000
```

**Authorized redirect URIs:**
```
https://carboncases-back.vercel.app/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

5. اضغط **"SAVE"**

---

### 3️⃣ نشر Backend على Vercel

#### أ. رفع Backend على GitHub:
```bash
cd backend
git add .
git commit -m "Add Supabase Storage support and production config"
git push
```

#### ب. إعداد Vercel Project:
1. افتح [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط **"Add New Project"**
3. اختر repository: `carboncases-back`
4. **Root Directory**: اتركه فارغ (أو `backend` إذا كان في مجلد فرعي)
5. **Framework Preset**: Other
6. **Build Command**: اتركه فارغ
7. **Output Directory**: اتركه فارغ

#### ج. إضافة Environment Variables:

في Vercel Dashboard > Settings > Environment Variables، أضف:

```env
DATABASE_URL=<من Supabase Dashboard>

JWT_SECRET=<اختر secret قوي>

NODE_ENV=production

FRONTEND_URL=https://carboncases-front.vercel.app

EMAIL_USER=<بريدك الإلكتروني>
EMAIL_APP_PASSWORD=<App Password من Gmail>

GOOGLE_CLIENT_ID=<من Google Cloud Console>
GOOGLE_CLIENT_SECRET=<من Google Cloud Console>
GOOGLE_CALLBACK_URL=https://carboncases-back.vercel.app/api/auth/google/callback

SUPABASE_URL=<من Supabase Dashboard>
SUPABASE_ANON_KEY=<من Supabase Dashboard>
```

8. اضغط **"Deploy"**

---

### 4️⃣ نشر Frontend على Vercel

#### أ. رفع Frontend على GitHub:
```bash
cd frontend
git add .
git commit -m "Update API URL for production"
git push
```

#### ب. إعداد Vercel Project:
1. في Vercel Dashboard، اضغط **"Add New Project"**
2. اختر repository: `carboncases-front`
3. **Root Directory**: اتركه فارغ (أو `frontend` إذا كان في مجلد فرعي)
4. **Framework Preset**: Create React App
5. **Build Command**: `npm run build`
6. **Output Directory**: `build`

#### ج. إضافة Environment Variables:

```env
REACT_APP_API_URL=https://carboncases-back.vercel.app/api
GENERATE_SOURCEMAP=false
CI=false
```

7. اضغط **"Deploy"**

---

### 5️⃣ التحقق من النشر

#### أ. اختبار Backend:
1. افتح: `https://carboncases-back.vercel.app/api/products`
2. يجب أن ترى قائمة المنتجات

#### ب. اختبار Frontend:
1. افتح: `https://carboncases-front.vercel.app`
2. تأكد من ظهور الموقع بشكل صحيح

#### ج. اختبار Google OAuth:
1. اذهب إلى صفحة Login
2. اضغط "Continue with Google"
3. يجب أن يعمل التسجيل بدون أخطاء

#### د. اختبار رفع الصور:
1. سجل دخول كـ Admin
2. اذهب إلى Products Management
3. أضف منتج جديد مع صورة
4. يجب أن تُرفع الصورة على Supabase وتظهر بشكل صحيح

---

## 🔧 حل المشاكل الشائعة

### المشكلة: الصور لا تظهر
**الحل:**
- تأكد من أن `SUPABASE_ANON_KEY` موجود في Environment Variables
- تأكد من أن bucket `product-images` موجود وهو Public
- أعد رفع الصور من خلال Admin Dashboard

### المشكلة: Google OAuth Error
**الحل:**
- تأكد من إضافة Production URLs في Google Console
- تأكد من `GOOGLE_CALLBACK_URL` صحيح في Vercel
- تأكد من `FRONTEND_URL` صحيح في Vercel

### المشكلة: Database Connection Error
**الحل:**
- تأكد من `DATABASE_URL` صحيح
- تأكد من أن `?` في password مشفر كـ `%3F`
- تأكد من أن Supabase Database يعمل

### المشكلة: CORS Error
**الحل:**
- تأكد من `FRONTEND_URL` في Backend Environment Variables
- تأكد من middleware CORS مضبوط صح في `backend/server.js`

---

## 📝 ملاحظات مهمة

1. **الصور القديمة**: الصور المرفوعة محليًا لن تظهر على Vercel. يجب إعادة رفعها.

2. **Environment Variables**: أي تغيير في Environment Variables يتطلب إعادة Deploy.

3. **Database**: استخدم Supabase Pooler URL (port 6543) وليس Direct URL (port 5432).

4. **Logs**: لمشاهدة الأخطاء، اذهب إلى Vercel Dashboard > Project > Deployments > View Function Logs.

5. **Custom Domain**: يمكنك ربط domain خاص من Vercel Dashboard > Settings > Domains.

---

## ✅ Checklist قبل النشر

- [ ] Supabase Storage Bucket جاهز
- [ ] Google OAuth URLs محدثة
- [ ] Backend Environment Variables كاملة
- [ ] Frontend Environment Variables كاملة
- [ ] Backend deployed بنجاح
- [ ] Frontend deployed بنجاح
- [ ] اختبار Login/Register
- [ ] اختبار Google OAuth
- [ ] اختبار رفع الصور
- [ ] اختبار إضافة منتج
- [ ] اختبار الطلبات

---

## 🆘 الدعم

إذا واجهت أي مشكلة:
1. تحقق من Logs في Vercel Dashboard
2. تحقق من Browser Console للأخطاء
3. تحقق من Network Tab في Developer Tools
4. راجع هذا الدليل مرة أخرى

---

**تم إنشاء هذا الدليل بواسطة Kiro AI** 🤖
