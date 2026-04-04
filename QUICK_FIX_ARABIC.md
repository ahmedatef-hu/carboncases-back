# حل سريع لمشاكل Vercel 🚀

## المشكلة 1: الصور لا تظهر ❌

### السبب:
الصور محفوظة محليًا في `backend/uploads` لكن Vercel لا يدعم تخزين الملفات.

### الحل: ✅
استخدام Supabase Storage لتخزين الصور في السحابة.

### الخطوات:

#### 1. إنشاء Storage Bucket في Supabase:
```
1. افتح https://supabase.com/dashboard
2. اختر مشروعك
3. اضغط Storage من القائمة
4. اضغط "Create a new bucket"
5. اسم الـ bucket: product-images
6. اجعله Public ✅
7. اضغط Create
```

#### 2. الحصول على Supabase Anon Key:
```
1. في Supabase Dashboard
2. اضغط Settings > API
3. انسخ "anon/public" key
4. انسخ "Project URL"
```

#### 3. إضافة Keys في Vercel Backend:
```
اذهب إلى Vercel Dashboard > carboncases-back > Settings > Environment Variables

أضف:
SUPABASE_URL=https://pbnbbtxugtoedovgvqst.supabase.co
SUPABASE_ANON_KEY=<الـ key اللي نسخته>
```

#### 4. إعادة Deploy:
```
Vercel Dashboard > carboncases-back > Deployments > Redeploy
```

---

## المشكلة 2: Google OAuth Error ❌

### الخطأ:
```
Error 400: redirect_uri_mismatch
```

### السبب:
Google Console مضبوط على localhost فقط، لكن الموقع على Vercel.

### الحل: ✅

#### 1. افتح Google Cloud Console:
```
https://console.cloud.google.com/
```

#### 2. اختر مشروع Carbon Cases

#### 3. اذهب إلى:
```
APIs & Services > Credentials
```

#### 4. اضغط على OAuth Client ID الموجود

#### 5. في "Authorized JavaScript origins" أضف:
```
https://carboncases-front.vercel.app
https://carboncases-back.vercel.app
http://localhost:3000
http://localhost:5000
```

#### 6. في "Authorized redirect URIs" أضف:
```
https://carboncases-back.vercel.app/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

#### 7. اضغط SAVE

#### 8. تحديث Environment Variables في Vercel Backend:
```
GOOGLE_CALLBACK_URL=https://carboncases-back.vercel.app/api/auth/google/callback
FRONTEND_URL=https://carboncases-front.vercel.app
```

#### 9. إعادة Deploy:
```
Vercel Dashboard > carboncases-back > Deployments > Redeploy
```

---

## Environment Variables الكاملة للـ Backend على Vercel:

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

---

## Environment Variables الكاملة للـ Frontend على Vercel:

```env
REACT_APP_API_URL=https://carboncases-back.vercel.app/api
GENERATE_SOURCEMAP=false
CI=false
```

---

## ملاحظات مهمة: ⚠️

1. **الصور القديمة**: لن تظهر على Vercel. يجب إعادة رفعها من Admin Dashboard.

2. **بعد أي تغيير في Environment Variables**: يجب إعادة Deploy.

3. **للحصول على Supabase Anon Key**:
   - Supabase Dashboard > Settings > API > anon/public key

4. **اختبار الموقع**:
   - بعد Deploy، جرب تسجيل الدخول بـ Google
   - جرب رفع صورة منتج جديد
   - تأكد من ظهور الصور

---

## الخطوات التالية: 📋

- [ ] إنشاء Storage Bucket في Supabase
- [ ] نسخ Supabase Keys
- [ ] تحديث Google OAuth URLs
- [ ] إضافة Environment Variables في Vercel Backend
- [ ] إضافة Environment Variables في Vercel Frontend
- [ ] إعادة Deploy للـ Backend
- [ ] إعادة Deploy للـ Frontend
- [ ] اختبار Google Login
- [ ] اختبار رفع الصور
- [ ] إعادة رفع صور المنتجات

---

**تم! الموقع يجب أن يعمل الآن بشكل صحيح** ✅
