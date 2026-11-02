# Gigverse Studio — الفرونت (الموقع)

صفحات ثابتة (HTML + CSS + JavaScript) من غير أي أدوات بناء. بتكلّم الباك اند (ريبو `gigverse-studio-backend`) عن طريق عنوان واحد.

## الإعداد الوحيد المطلوب
في `js/config.js` حط عنوان الباك اند (من غير `/` في الآخر):
```js
window.STUDIO_CONFIG = { apiBase: "https://<رابط-الباك>.vercel.app" };
```

## النشر (GitHub Pages — تلقائي)
- أي `push` على `main` بيشغّل `.github/workflows/pages.yml` وينشر الموقع.
- أول مرة بس: Settings ← Pages ← Source: **GitHub Actions**.
- الدومين: ملف `CNAME` فيه `gigversestudio.click`، وبيتأكد كمان من Settings ← Pages ← Custom domain.
- الريبو ده **Public** عشان Pages مجانية. مفيش فيه أي سر (الـ `apiBase` عنوان عام أصلًا).

## اختبارات الواجهة (اختيارية)
```
npm install
npm test
```
