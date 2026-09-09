import { Patient, TreatmentPlan, Session, DailyCapacitySetting } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-101',
    fullName: 'أحمد عبد الله المنصور',
    phone: '0551234567',
    nationalId: '1098765432',
    initialDiagnosis: 'تأهيل ما بعد جراحة ترميم الرباط الصليبي الأمامي (ACL Reconstruction)',
    notes: 'تحسن في المدى الحركي لمفصل الركبة، التركيز على تقوية العضلة رباعية الرؤوس.',
    createdAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'p-102',
    fullName: 'سارة محمد الشمري',
    phone: '0569876543',
    nationalId: '1087654321',
    initialDiagnosis: 'انزلاق غضروفي قطني (L4-L5 Lumbar Disc Herniation) وعرق النسا',
    notes: 'تخفيف الضغط العصبي وتمارين الاستقرار الجذعي (Core Stability).',
    createdAt: '2026-08-25T11:30:00.000Z'
  },
  {
    id: 'p-103',
    fullName: 'خالد فهد الدوسري',
    phone: '0543219876',
    nationalId: '1076543210',
    initialDiagnosis: 'متلازمة الكتف المتجمد (Frozen Shoulder - Adhesive Capsulitis)',
    notes: 'جلسات تحريك يدوي مفاصل وعلاج بالموجات فوق الصوتية.',
    createdAt: '2026-08-28T09:15:00.000Z'
  },
  {
    id: 'p-104',
    fullName: 'منى إبراهيم الحربي',
    phone: '0505551234',
    nationalId: '1065432109',
    initialDiagnosis: 'إعادة تأهيل بعد فك جبيرة كسر عظم الكاحل (Post-Ankle Fracture)',
    notes: 'استعادة التوازن والتحميل التدريجي للمشي الطبيعي.',
    createdAt: '2026-09-01T14:00:00.000Z'
  }
];

export const INITIAL_PLANS: TreatmentPlan[] = [
  {
    id: 'plan-01',
    patientId: 'p-101',
    totalSessions: 10,
    completedSessions: 4,
    status: 'ACTIVE',
    startDate: '2026-08-29',
    preferredPattern: 'SAT_MON_WED',
    preferredDays: [6, 1, 3],
    pricePerSession: 150,
    totalPrice: 1500,
    paidAmount: 1500,
    paymentStatus: 'PAID',
    notes: 'بروتوكول التأهيل الرياضي المكثف - المرحلة الثانية',
    createdAt: '2026-08-20T10:15:00.000Z'
  },
  {
    id: 'plan-02',
    patientId: 'p-102',
    totalSessions: 6,
    completedSessions: 2,
    status: 'ACTIVE',
    startDate: '2026-08-30',
    preferredPattern: 'SUN_TUE_THU',
    preferredDays: [0, 2, 4],
    pricePerSession: 160,
    totalPrice: 960,
    paidAmount: 500,
    paymentStatus: 'PARTIALLY_PAID',
    notes: 'علاج فيزيائي مسكن ومطيل للفقرات القطنية',
    createdAt: '2026-08-25T12:00:00.000Z'
  },
  {
    id: 'plan-03',
    patientId: 'p-103',
    totalSessions: 12,
    completedSessions: 0,
    status: 'ACTIVE',
    startDate: '2026-09-06',
    preferredPattern: 'SUN_TUE_THU',
    preferredDays: [0, 2, 4],
    pricePerSession: 140,
    totalPrice: 1680,
    paidAmount: 0,
    paymentStatus: 'UNPAID',
    notes: 'خطة علاجية ممتدة لفك التلاصقات المفصلية',
    createdAt: '2026-09-02T08:30:00.000Z'
  }
];

export const INITIAL_SESSIONS: Session[] = [
  // خطة أحمد المنصور (10 جلسات)
  { id: 's-101-1', planId: 'plan-01', patientId: 'p-101', sessionNumber: 1, sessionDate: '2026-08-29', status: 'COMPLETED', therapistName: 'أ. د. سامي العتيبي', notes: 'تقييم أولي وبدء تمارين المدى الحركي السلبي.', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-2', planId: 'plan-01', patientId: 'p-101', sessionNumber: 2, sessionDate: '2026-08-31', status: 'COMPLETED', therapistName: 'أ. د. سامي العتيبي', notes: 'تحسن في ثني الركبة حتى 90 درجة.', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-3', planId: 'plan-01', patientId: 'p-101', sessionNumber: 3, sessionDate: '2026-09-02', status: 'COMPLETED', therapistName: 'أ. د. سامي العتيبي', notes: 'تمارين التحميل بالوزن الجزئي.', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-4', planId: 'plan-01', patientId: 'p-101', sessionNumber: 4, sessionDate: '2026-09-05', status: 'COMPLETED', therapistName: 'أ. د. سامي العتيبي', notes: 'ثني الركبة 110 درجات دون ألم حاد.', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-5', planId: 'plan-01', patientId: 'p-101', sessionNumber: 5, sessionDate: '2026-09-07', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: 'تمارين التوازن على لوح التمايل.', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-6', planId: 'plan-01', patientId: 'p-101', sessionNumber: 6, sessionDate: '2026-09-09', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: '', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-7', planId: 'plan-01', patientId: 'p-101', sessionNumber: 7, sessionDate: '2026-09-12', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: '', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-8', planId: 'plan-01', patientId: 'p-101', sessionNumber: 8, sessionDate: '2026-09-14', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: '', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-9', planId: 'plan-01', patientId: 'p-101', sessionNumber: 9, sessionDate: '2026-09-16', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: '', createdAt: '2026-08-20T10:15:00.000Z' },
  { id: 's-101-10', planId: 'plan-01', patientId: 'p-101', sessionNumber: 10, sessionDate: '2026-09-19', status: 'SCHEDULED', therapistName: 'أ. د. سامي العتيبي', notes: 'جلسة التقييم الختامي للخطة.', createdAt: '2026-08-20T10:15:00.000Z' },

  // خطة سارة الشمري (6 جلسات)
  { id: 's-102-1', planId: 'plan-02', patientId: 'p-102', sessionNumber: 1, sessionDate: '2026-08-30', status: 'COMPLETED', therapistName: 'أ. ريم الغامدي', notes: 'جلسة تخفيف التشنج العضلي وتطبيق الكمادات الحارة.', createdAt: '2026-08-25T12:00:00.000Z' },
  { id: 's-102-2', planId: 'plan-02', patientId: 'p-102', sessionNumber: 2, sessionDate: '2026-09-01', status: 'COMPLETED', therapistName: 'أ. ريم الغامدي', notes: 'سحب فقرات قطني خفيف وتمارين تمدد.', createdAt: '2026-08-25T12:00:00.000Z' },
  { id: 's-102-3', planId: 'plan-02', patientId: 'p-102', sessionNumber: 3, sessionDate: '2026-09-06', status: 'SCHEDULED', therapistName: 'أ. ريم الغامدي', notes: 'جلسة اليوم - متابعة تحسن الأعراض العصبية.', createdAt: '2026-08-25T12:00:00.000Z' },
  { id: 's-102-4', planId: 'plan-02', patientId: 'p-102', sessionNumber: 4, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. ريم الغامدي', notes: '', createdAt: '2026-08-25T12:00:00.000Z' },
  { id: 's-102-5', planId: 'plan-02', patientId: 'p-102', sessionNumber: 5, sessionDate: '2026-09-10', status: 'SCHEDULED', therapistName: 'أ. ريم الغامدي', notes: '', createdAt: '2026-08-25T12:00:00.000Z' },
  { id: 's-102-6', planId: 'plan-02', patientId: 'p-102', sessionNumber: 6, sessionDate: '2026-09-13', status: 'SCHEDULED', therapistName: 'أ. ريم الغامدي', notes: '', createdAt: '2026-08-25T12:00:00.000Z' },

  // نملأ يوماً معيناً (مثلاً 2026-09-08) بـ 10 جلسات لنوضح ميزة اليوم المكتمل (10/10) ومنع Overbooking
  { id: 'fill-1', planId: 'other', patientId: 'p-104', sessionNumber: 1, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-2', planId: 'other', patientId: 'p-104', sessionNumber: 2, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-3', planId: 'other', patientId: 'p-104', sessionNumber: 3, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-4', planId: 'other', patientId: 'p-104', sessionNumber: 4, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-5', planId: 'other', patientId: 'p-104', sessionNumber: 5, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-6', planId: 'other', patientId: 'p-104', sessionNumber: 6, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-7', planId: 'other', patientId: 'p-104', sessionNumber: 7, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-8', planId: 'other', patientId: 'p-104', sessionNumber: 8, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' },
  { id: 'fill-9', planId: 'other', patientId: 'p-104', sessionNumber: 9, sessionDate: '2026-09-08', status: 'SCHEDULED', therapistName: 'أ. فهد الزهراني', createdAt: '' }
];

export const INITIAL_CAPACITY_SETTINGS: Record<string, DailyCapacitySetting> = {
  '2026-09-23': {
    date: '2026-09-23',
    maxCapacity: 0,
    isWorkingDay: false,
    notes: 'إجازة اليوم الوطني السعودي'
  },
  '2026-09-07': {
    date: '2026-09-07',
    maxCapacity: 12, // سعة خاصة استثنائية
    isWorkingDay: true,
    notes: 'تمت زيادة السعة لوجود أخصائي إضافي بالفترة المسائية'
  }
};
