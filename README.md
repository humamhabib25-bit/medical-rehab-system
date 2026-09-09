# نظام إدارة حجوزات مركز التأهيل الطبي والعلاج الطبيعي 🏥
### Comprehensive Physical Therapy & Rehabilitation Management System

منظومة برمجية متكاملة مصممة خصيصاً لمراكز التأهيل الطبي والعلاج الطبيعي، مبنية لمعالجة تعقيدات **"الخطط العلاجية متعددة الجلسات (Multi-session Treatment Plans)"** وضبط **"الطاقة الاستيعابية اليومية (Capacity Management)"** لمنع الحجز الزائد (Overbooking Prevention).

---

## 🌟 أبرز المزايا ومنطق العمل (Business Logic)

### 1. بنية الحجز والخطط العلاجية (Multi-session Protocol):
* **حجز خطة متكاملة بضغطة زر:** يدعم المركز حجز بروتوكولات علاجية مكونة من (6، 10، 12 جلسة أو عدد مخصص).
* **التوزيع التلقائي الذكي:** توزيع الجلسات على أنماط أسبوعية محددة:
  * (سبت - إثنين - أربعاء).
  * (أحد - ثلاثاء - خميس).
  * يومياً (بروتوكول التأهيل المكثف).
  * تحديد يدوي مخصص للأيام.
* **تتبع دقيق لحالة كل جلسة:** (`مجدولة Scheduled`، `مكتملة Completed`، `غياب No-show`، `مؤجلة Rescheduled`، `ملغاة Cancelled`).
* **شريط تقدم المريض (Progress Tracker):** مؤشر بصري بنسبة إنجاز الخطة والجلسات المتبقية.
* **إعادة الجدولة الفردية أو الترحيل الكامل (Cascade Shift):** إمكانية ترحيل الجلسات المتبقية ابتداءً من أي جلسة محددة إلى تواريخ لاحقة شاغرة دون المساس بالجلسات السابقة.

### 2. إدارة الطاقة الاستيعابية ومنع الحجز الزائد (Capacity Management):
* **سعة يومية ديناميكية:** القيمة الافتراضية 10 جلسات يومياً، مع إمكانية تعديل السعة العامة من الإعدادات.
* **استثناءات وتخصيص الأيام:** إمكانية زيادة أو خفض سعة يوم محدد (مثلاً 12 جلسة عند توفر كادر إضافي) أو تعيين اليوم كعطلة مباشرة من التقويم.
* **التخطي التلقائي للأيام المكتملة:** عند الوصول للحد الأقصى (10/10) أو في العطلات، يتخطى محرك الجدولة ذلك اليوم تلقائياً ويبحث عن أقرب موعد شاغر يطابق نمط المريض.
* **صلاحية المشرف (Supervisor Override):** إمكانية فتح مقعد إضافي وتجاوز السعة القصوى للحالات الطارئة بموافقة الإدارة.

### 3. تقويم تفاعلي بمؤشرات ألوان ذكية (Color-coded Calendar):
* 🟢 **أخضر (0 - 79%):** يوم شاغر ومتاح.
* 🟡 **برتقالي (80 - 99%):** أوشك على الامتلاء.
* 🔴 **أحمر (100%):** ممتلئ بالكامل (ممنوع الحجز بدون Override).
* ⚪ **رمادي:** عطلة رسمية أو أسبوعية للمركز.

---

## 🗄️ المخطط الهيكلي لقاعدة البيانات (Database Schema)

```sql
-- 1. جدول المرضى (Patients)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    initial_diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول إعدادات السعة اليومية والاستثناءات (Daily Capacity)
CREATE TABLE daily_capacity (
    date DATE PRIMARY KEY,
    max_capacity INT NOT NULL DEFAULT 10,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(255),
    CONSTRAINT positive_capacity CHECK (max_capacity >= 0)
);

-- 3. جدول الخطط العلاجية (Treatment Plans)
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    total_sessions INT NOT NULL CHECK (total_sessions > 0),
    completed_sessions INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED')),
    start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول الجلسات الفردية (Sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_number INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' 
        CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED')),
    therapist_name VARCHAR(100),
    notes TEXT,
    is_override BOOLEAN NOT NULL DEFAULT FALSE,
    rescheduled_from_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_per_plan UNIQUE (plan_id, session_number)
);

CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_plan ON sessions(plan_id);
```

---

## 🔌 مسارات الـ API (Endpoints Specification)

| المسار (Endpoint) | الطريقة (Method) | الوظيفة |
| :--- | :--- | :--- |
| `/api/v1/patients` | `GET`, `POST` | استعراض وإضافة المرضى والملفات الطبية. |
| `/api/v1/treatment-plans` | `POST` | **إنشاء خطة وتوزيع جلساتها تلقائياً** عبر محرك الجدولة. |
| `/api/v1/treatment-plans/:id` | `GET` | تفاصيل الخطة ونسبة الإنجاز وجدول الجلسات. |
| `/api/v1/treatment-plans/:id/shift` | `POST` | **ترحيل الجلسات المتبقية (Cascade Shift)** إلى تواريخ شاغرة. |
| `/api/v1/sessions/:id` | `PATCH` | تحديث حالة الجلسة (`COMPLETED`, `NO_SHOW`, إلخ). |
| `/api/v1/sessions/:id/reschedule` | `POST` | إعادة جدولة جلسة فردية مع التحقق من السعة. |
| `/api/v1/capacity` | `GET` | استعلام عن سعة ونسبة إشغال الأيام للتقويم. |
| `/api/v1/capacity/:date` | `PUT` | تعديل سعة يوم محدد أو تعيينه كعطلة استثنائية. |

---

## 🚀 التشغيل السريع (Quickstart)

### 1. تشغيل خادم التطوير (Frontend & Core Engine):
```bash
# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```
افتح المتصفح على: `http://localhost:5173`

### 2. تشغيل اختبارات محرك الجدولة والطاقة الاستيعابية:
```bash
npm test
```

### 3. بناء النسخة الإنتاجية (Production Build):
```bash
npm run build
```

---

## 📁 هيكلية المشروع (Project Architecture)

```
├── src/
│   ├── core/
│   │   ├── schedulingEngine.ts       # محرك الجدولة وحساب السعة والتوزيع الذكي والترحيل
│   │   └── schedulingEngine.test.ts  # حزمة الاختبارات الآلية لقواعد العمل
│   ├── types/
│   │   └── index.ts                  # تعريفات الأنواع (Patients, Plans, Sessions, Capacity)
│   ├── data/
│   │   ├── mockData.ts               # بيانات سريرية أولية تحاكي واقع مراكز التأهيل
│   │   └── store.ts                  # إدارة الحالة وتخزين البيانات
│   ├── components/
│   │   ├── Navbar.tsx                # الشريط العلوي والتنقل ومؤشر سعة اليوم
│   │   ├── CalendarView.tsx          # التقويم التفاعلي بمؤشرات السعة بالألوان
│   │   ├── PlanModal.tsx             # شاشة حجز الخطة والمعاينة الحية لتخطي الأيام
│   │   ├── PlansListView.tsx         # تتبع الخطط العلاجية وأشرطة التقدم
│   │   ├── ShiftModal.tsx            # نافذة ترحيل باقي الجلسات
│   │   ├── RescheduleModal.tsx       # نافذة إعادة جدولة الجلسة الفردية
│   │   ├── PatientsView.tsx          # سجل وبطاقات المرضى
│   │   └── SettingsView.tsx          # إعدادات السعة العامة وقواعد العمل
│   ├── App.tsx                       # المكون الرئيسي للربط والتوجيه
│   └── index.css                     # نظام التصميم والألوان والسمة الطبية
```
