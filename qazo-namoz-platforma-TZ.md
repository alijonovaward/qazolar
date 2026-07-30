# QazoNamoz Platformasi — Texnik Topshiriq (TZ)

## 1. Loyiha haqida

**Nomi (ishchi variant):** QazoNamoz / QazoTracker

**Maqsad:** Foydalanuvchilarga qazo (o'qib bo'lmagan) namozlarini har bir vaqt bo'yicha alohida hisoblash, tizimli tarzda qazo qazosini yopib borishda yordam berish, oila a'zolarini (xotini, opa-singil, ota-ona) kuzatish/rag'batlantirish imkoniyati berish, hamda guruh yaratib do'stlar bilan musobaqa qilish orqali motivatsiyani oshirish.

**Platforma turi:** Responsive Web App (PWA) — telefon, planshet va kompyuterdan bir xil qulaylikda ishlaydi, alohida native ilova yozmasdan ham "ilova kabi" o'rnatiladi (Add to Home Screen).

---

## 2. Foydalanuvchi turlari

| Rol | Tavsif |
|---|---|
| **Oddiy foydalanuvchi** | O'z qazolarini kiritadi, kuzatadi, o'qiydi |
| **Oila a'zosi** | Boshqa foydalanuvchi tomonidan taklif qilingan, ruxsat asosida ko'rish huquqiga ega |
| **Guruh a'zosi** | Musobaqa/challenge guruhlariga qo'shilgan foydalanuvchi |
| **Admin** | Tizimni boshqaruvchi (kontent, statistikalar, murojaatlar) |

---

## 3. Funksional talablar (Bosqich 1 — MVP)

### 3.1. Ro'yxatdan o'tish va profil
- Email yoki telefon raqami orqali ro'yxatdan o'tish, OTP tasdiqlash
- Profilga jins, tug'ilgan sana (yoki balog'atga yetgan yosh) kiritish
- Ayollar uchun: hayz/nifos kunlarini hisobdan chiqarish imkoniyati (ixtiyoriy, maxfiy maydon)

### 3.2. Qazo hisob-kitob moduli (asosiy funksiya)
- **Har bir namoz vaqti (Bomdod, Peshin, Asr, Shom, Xufton) uchun alohida qazo hisoblanadi va saqlanadi** — umumiy bitta raqam emas
- Boshlang'ich sozlash: foydalanuvchi har bir vaqt uchun "qachondan beri muntazam o'qiyapsiz" sanasini alohida kiritadi (masalan Bomdod — 2 yildan beri qoldirmayapman, Peshin — hali qazosi bor)
- Tizim shu asosda har bir vaqt uchun qolgan qazo sonini avtomatik hisoblaydi
- Foydalanuvchi kuniga necha marta qazo o'qiganini kiritadi (masalan "bugun 3 ta Peshin qazo o'qidim") — mos counter kamayadi
- Har bir vaqt uchun alohida progress-bar va foiz ko'rsatkichi
- Umumiy progress (barcha vaqtlar yig'indisi asosida %)
- **Rakat soniga qarab og'irlik**: har bir namoz vaqtining farz rakatlari soni har xil (Bomdod — 2, Peshin — 4, Asr — 4, Shom — 3, Xufton — 4), shuning uchun vaqt/tezlik prognozi va "qancha vaqtda tugataman" hisobida shunchaki namoz sonini emas, balki **jami rakat sonini** asos qilib olish kerak (masalan 2 ta Bomdod ≈ 4 rakat, 2 ta Peshin ≈ 8 rakat — ikkinchisi ko'proq vaqt talab qiladi). Bu foydalanuvchining haqiqiy o'qish tezligiga (bir kunda necha rakat o'qiy oladi) asoslangan real prognoz beradi
- **Safar (qasr) holati**: har bir kunlik yozuvda (`DailyLog`) foydalanuvchi shu namozni safarda o'qiganini belgilashi mumkin (`is_safar`). Safar holatida Peshin, Asr, Xufton 4 emas 2 rakatga tushadi; Bomdod (har doim 2) va Shom (har doim 3) o'zgarmaydi. `PrayerType` jadvalida har bir namoz turi uchun ham hazar (`rakat_count`), ham qasr (`qasr_rakat_count`) qiymatlari doim to'liq saqlanadi (Bomdod/Shom uchun ikkalasi bir xil) — shunda hisoblashda maxsus shart-tekshiruv (if/else, null-check) kerak bo'lmaydi, faqat `is_safar` bayrog'iga qarab tegishli maydon tanlanadi

### 3.3. Kunlik reja va eslatmalar
- Kunlik maqsad qo'yish ("bugun N ta qazo o'qiyman")
- Push-notification orqali eslatmalar (browser push / PWA notification)
- Streak (ketma-ket kun) hisoblagichi

### 3.4. Statistika
- Haftalik/oylik/yillik grafiklar (har bir vaqt bo'yicha va umumiy)
- "Necha yilda tugataman" prognozi (joriy tezlik asosida, rakat sonini hisobga olgan holda — 3.2-bandga qarang)

### 3.5. Oila a'zolarini kuzatish
- Foydalanuvchi boshqa foydalanuvchini (xotini, opasi, otasi va h.k.) email/username orqali taklif qiladi
- Taklif qilingan tomon albatta **rozilik bildirishi shart** (avtomatik kuzatish yo'q)
- Rozilik berilgandan so'ng, kuzatuvchi tomon quyidagilarni tanlashi mumkin bo'lgan maxfiylik darajasini ko'radi:
  - **To'liq** — barcha raqamlar ko'rinadi
  - **Faqat foiz** — aniq son emas, faqat % progress
  - **Faqat faollik** — bugun o'qidimi/yo'qmi, raqamlarsiz
- Kuzatuvchi tomon rag'batlantiruvchi eslatma/xabar yubora oladi
- Oilaviy umumiy statistika (barcha a'zolarning jamlangan progressi)

### 3.6. Guruh va musobaqalar
- Guruh yaratish (nomi, tavsifi, taklif kodi orqali qo'shilish)
- Guruh ichida haftalik/oylik reyting jadvali (leaderboard)
- Challenge yaratish (masalan "30 kunlik challenge — kim ko'p qazo yopadi")
- Badge/yutuq tizimi (masalan "100 qazo yopildi", "7 kunlik streak")
- Guruh a'zolari bir-biriga rag'batlantiruvchi reaksiya/izoh qoldira oladi

---

## 4. Keyingi bosqich funksiyalari (Bosqich 2 — keyinroq qo'shiladi)

- Namoz vaqtlari integratsiyasi (joylashuv bo'yicha)
- Qibla yo'nalishi
- Motivatsion kontent, duo/oyat eslatmalari
- Offline rejim (internet bo'lmasa ham belgilash, keyin sinxronlash)

*(Bu bo'lim TZ'ning keyingi versiyasida batafsillashtiriladi)*

---

## 5. Texnologik yechim

### Backend
- **Django + Django REST Framework** — asosiy API
- **PostgreSQL** — ma'lumotlar bazasi
- **Celery + Redis** — rejalashtirilgan vazifalar (kunlik eslatmalar, statistika yangilash)
- **Django Channels** (ixtiyoriy, kelajakda) — real-time bildirishnomalar uchun

### Frontend (JS, responsive, mobile/tablet-friendly)
- **React (Next.js)** — SSR/SPA, tez yuklanish, SEO uchun ham qulay
- **Tailwind CSS** — responsive dizayn, mobile-first yondashuv
- **PWA (next-pwa yoki Workbox)** — telefon/planshetga "ilova sifatida" o'rnatish, push-notification
- Komponentlar kutubxonasi: shadcn/ui yoki shunga o'xshash — zamonaviy, chiroyli, tayyor UI komponentlari
- Grafiklar uchun: Recharts yoki Chart.js

### Infratuzilma
- Docker / docker-compose (dev va prod uchun)
- Nginx — reverse proxy
- CI/CD: GitHub Actions (kelajakda)

---

## 6. Ma'lumotlar bazasi sxemasi (asosiy jadvallar)

```
User
- id, email, phone, password_hash, gender, birth_date, created_at

PrayerType
- id, name (Bomdod, Peshin, Asr, Shom, Xufton), order
- rakat_count (hazar holatidagi farz rakat: 2, 4, 4, 3, 4)
- qasr_rakat_count (safar holatidagi rakat: 2, 2, 2, 3, 2 — Bomdod/Shom hazar bilan bir xil, chunki qasrlanmaydi)

QazoRecord
- id, user_id (FK), prayer_type_id (FK), total_missed, total_completed, updated_at
- unique(user, prayer_type)

DailyLog
- id, user_id (FK), prayer_type_id (FK), date, completed_count, is_safar (bool)
- unique(user, prayer_type, date)
- saqlanganda tegishli QazoRecord.total_completed avtomatik yangilanadi

FamilyRelation
- id, watcher_id (FK -> User), watched_id (FK -> User), status (pending/accepted/declined), privacy_level (full/percent_only/activity_only), created_at
- unique(watcher, watched)

Group
- id, name, description, invite_code, created_by (FK -> User), created_at

GroupMembership
- id, group_id (FK), user_id (FK), joined_at
- unique(group, user)

Challenge
- id, group_id (FK), title, start_date, end_date

Badge
- id, name, description, icon

UserBadge
- id, user_id (FK), badge_id (FK), earned_at
- unique(user, badge)
```

---

## 7. UI/UX talablari

- **Mobile-first dizayn**: asosiy foydalanish telefondan bo'ladi deb hisoblab loyihalash, keyin planshet/desktop uchun kengaytirish
- **Responsive breakpoint'lar**: telefon (≤480px), planshet (481–1024px), desktop (>1024px)
- Katta, bosish oson tugmalar (touch-friendly, kamida 44x44px)
- Har bir namoz vaqti uchun rangli, aniq ajratilgan progress-bar (masalan har biri o'z rangida)
- Tungi/kunduzgi rejim (dark/light mode)
- Minimalistik, tinch, "diniy-estetik" dizayn yo'nalishi (ortiqcha rangsiz, chiroyli tipografiya)
- Barcha asosiy amallar (qazo belgilash, statistikani ko'rish) 2 marta bosishdan oshmasligi kerak

---

## 8. Xavfsizlik va maxfiylik

- Oila/guruh kuzatish faqat ikki tomonlama rozilik bilan ishlaydi, hech qachon avtomatik emas
- Har bir foydalanuvchi istalgan vaqtda kuzatishni bekor qilish yoki maxfiylik darajasini o'zgartirish huquqiga ega
- Parollar hash qilinadi (bcrypt/argon2), JWT yoki session-based autentifikatsiya
- HTTPS majburiy

---

## 9. Rivojlanish bosqichlari (Roadmap)

| Bosqich | Mazmuni |
|---|---|
| **MVP** | Ro'yxatdan o'tish, har-vaqt-alohida qazo hisoblash, kunlik belgilash, asosiy statistika |
| **V1.1** | Oila a'zolarini kuzatish (rozilik tizimi bilan) |
| **V1.2** | Guruh yaratish va oddiy leaderboard |
| **V1.3** | Challenge, badge tizimi |
| **V2** | Bosqich 2 funksiyalari (qibla, namoz vaqtlari, offline rejim) |
