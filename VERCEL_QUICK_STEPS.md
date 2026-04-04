# خطوات سريعة لإصلاح Vercel 🚀

## 🎯 المشاكل:
1. ❌ الصور لا تظهر
2. ❌ Google OAuth Error: redirect_uri_mismatch

---

## ✅ الحل السريع:

### 1. إعداد Supabase Storage (5 دقائق)

```
1. افتح https://supabase.com/dashboard
2. اختر مشروعك
3. Storage > Create bucket
4. اسم: product-images
5. Public: ✅
6. Settings > API > انسخ anon key
```

### 2. تحديث Google OAuth (3 دقائق)

```
1. افتح https://console.cloud.google.com/
2. APIs & Services > Credentials
3. اضغط على OAuth Client
4. أضف في Authorized redirect URIs:
   https://carboncases-back.vercel.app/api/auth/google/callback
5. Save
```

### 3. تحديث Vercel Backend Environment Variables

```
اذهب إلى: Vercel Dashboard > carboncases-back > Settings > Environment Variables

أضف/حدث:
✅ FRONTEND_URL=https://carboncases-front.vercel.app
✅ GOOGLE_CALLBACK_URL=https://carboncases-back.vercel.app/api/auth/google/callback
✅ SUPABASE_URL=<من Supabase>
✅ SUPABASE_ANON_KEY=<من Supabase>
```

### 4. إعادة Deploy

```
Vercel Dashboard > carboncases-back > Deployments > Redeploy
```

---

## 🧪 اختبار:

1. افتح الموقع
2. جرب Google Login
3. سجل دخول كـ Admin
4. أضف منتج جديد مع صورة
5. تأكد من ظهور الصورة

---

## ⚠️ ملاحظة مهمة:

الصور القديمة (المحلية) لن تظهر. يجب إعادة رفعها من Admin Dashboard.

---

**تم! 🎉**
