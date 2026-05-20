# 🎩 سيف والعريس — نظام الإدارة الكامل

## الملفات
```
server.js          ← Backend (Node.js + Express)
package.json       ← إعدادات المشروع
public/
  index.html       ← Frontend (Store + Admin)
```

## الرفع على Railway

### 1. ارفع الملفات على GitHub
- ارفع: `server.js`, `package.json`, وفولدر `public/` كامل

### 2. على railway.app
1. اعمل حساب جديد على https://railway.app
2. اضغط **"New Project"**
3. اختار **"Deploy from GitHub repo"**
4. اختار الـ repo بتاعك

### 3. أضف PostgreSQL Database
1. في نفس المشروع اضغط **"+ New"**
2. اختار **"Database" → "PostgreSQL"**
3. بعد ما تتعمل، روح **Variables** في السيرفر
4. اضغط **"Add Variable Reference"** واختار `DATABASE_URL`

### 4. Environment Variables
في الـ Service بتاعك اضغط **Variables** وأضف:
```
ADMIN_PASSWORD = كلمة السر اللي عايزها
NODE_ENV = production
```

### 5. Deploy
Railway هيعمل deploy تلقائي — بعد دقيقتين الموقع شغال ✅

## الاستخدام
- **الرابط العادي** → صفحة الستور للعملاء
- **دبل كليك على 🎩** → بيفتح باسورد الإدارة
- **الباسورد الافتراضي** → `seif2024` (غيّره من Variables)
