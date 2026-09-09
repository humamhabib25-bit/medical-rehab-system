import {
  AutoScheduleResult,
  AutoSchedulePreviewItem,
  SkippedDateItem,
  DayCapacitySummary,
  DailyCapacitySetting,
  Session,
  SchedulePattern
} from '../types';

export const DEFAULT_MAX_CAPACITY = 10;

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

export const PATTERN_DAYS_MAP: Record<SchedulePattern, number[]> = {
  SAT_MON_WED: [6, 1, 3], // السبت، الإثنين، الأربعاء
  SUN_TUE_THU: [0, 2, 4], // الأحد، الثلاثاء، الخميس
  DAILY: [0, 1, 2, 3, 4, 6], // يومياً عدا الجمعة
  CUSTOM: []
};

/**
 * دالة مساعدة لتنسيق التاريخ بصيغة YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * دالة مساعدة للحصول على اسم اليوم بالعربية
 */
export function getArabicDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ARABIC_DAYS[d.getDay()];
}

/**
 * فحص وتجميع سعة يوم محدد
 */
export function calculateDayCapacity(
  dateStr: string,
  sessions: Session[],
  capacitySettings: Record<string, DailyCapacitySetting>,
  defaultCapacity: number = DEFAULT_MAX_CAPACITY
): DayCapacitySummary {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const setting = capacitySettings[dateStr];

  // الجمعة عطلة افتراضية إلا إذا حُدد خلاف ذلك
  const isDefaultWorkingDay = dayOfWeek !== 5; // 5 = الجمعة
  const isWorkingDay = setting !== undefined ? setting.isWorkingDay : isDefaultWorkingDay;
  const maxCapacity = setting !== undefined ? setting.maxCapacity : defaultCapacity;

  // الجلسات المحجوزة التي تستهلك طاقة استيعابية (المجدولة، المكتملة، المؤجلة إلى هذا اليوم)
  // لا نحتسب الجلسات الملغاة (CANCELLED)
  const bookedCount = sessions.filter(
    (s) => s.sessionDate === dateStr && s.status !== 'CANCELLED'
  ).length;

  const percentage = maxCapacity > 0 ? Math.round((bookedCount / maxCapacity) * 100) : 100;

  let status: DayCapacitySummary['status'] = 'available';
  if (!isWorkingDay) {
    status = 'holiday';
  } else if (bookedCount >= maxCapacity) {
    status = 'full';
  } else if (bookedCount >= maxCapacity * 0.8) {
    status = 'near_full';
  }

  return {
    date: dateStr,
    dayNameAr: ARABIC_DAYS[dayOfWeek],
    dayOfWeek,
    bookedCount,
    maxCapacity,
    isWorkingDay,
    percentage,
    status,
    notes: setting?.notes
  };
}

/**
 * محرك التوزيع التلقائي الذكي للجلسات على الأيام الشاغرة
 */
export function autoDistributeSessions(
  startDateStr: string,
  totalSessions: number,
  preferredDays: number[],
  existingSessions: Session[],
  capacitySettings: Record<string, DailyCapacitySetting>,
  allowOverride: boolean = false,
  defaultCapacity: number = DEFAULT_MAX_CAPACITY
): AutoScheduleResult {
  if (totalSessions <= 0) {
    throw new Error('عدد الجلسات يجب أن يكون أكبر من الصفر');
  }

  if (preferredDays.length === 0) {
    throw new Error('يجب تحديد يوم واحد على الأقل في نمط الجدولة');
  }

  const scheduledSessions: AutoSchedulePreviewItem[] = [];
  const skippedDates: SkippedDateItem[] = [];
  
  // نسخة محلية من الجلسات لمحاكاة الحجز المؤقت أثناء التوزيع
  const simulatedSessions = [...existingSessions];

  let currentDate = new Date(startDateStr + 'T00:00:00');
  const MAX_DAYS_LOOKAHEAD = 180; // فحص حتى 6 أشهر كحد أقصى
  let daysScanned = 0;

  while (scheduledSessions.length < totalSessions && daysScanned < MAX_DAYS_LOOKAHEAD) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatDate(currentDate);
    const dayNameAr = ARABIC_DAYS[dayOfWeek];

    // هل يطابق النمط المفضل للمريض؟
    if (preferredDays.includes(dayOfWeek)) {
      const cap = calculateDayCapacity(dateStr, simulatedSessions, capacitySettings, defaultCapacity);

      if (!cap.isWorkingDay) {
        skippedDates.push({
          date: dateStr,
          dayNameAr,
          reason: cap.notes ? `عطلة: ${cap.notes}` : 'عطلة أسبوعية أو رسمية'
        });
      } else if (cap.bookedCount >= cap.maxCapacity && !allowOverride) {
        skippedDates.push({
          date: dateStr,
          dayNameAr,
          reason: `اليوم ممتلئ بالكامل (${cap.bookedCount}/${cap.maxCapacity})`
        });
      } else {
        // حجز الجلسة بنجاح
        const isOverrideNeeded = cap.bookedCount >= cap.maxCapacity;
        const sessionNum = scheduledSessions.length + 1;

        scheduledSessions.push({
          sessionNumber: sessionNum,
          date: dateStr,
          dayNameAr,
          dayCapacity: cap.maxCapacity,
          dayBookedCount: cap.bookedCount + 1,
          isOverrideNeeded
        });

        // إضافة جلسة محاكاة لليوم حتى يتأثر الفحص للجلسات اللاحقة في حال كان التكرار في نفس اليوم
        simulatedSessions.push({
          id: `sim-${sessionNum}`,
          planId: 'sim-plan',
          patientId: 'sim-patient',
          sessionNumber: sessionNum,
          sessionDate: dateStr,
          status: 'SCHEDULED',
          createdAt: new Date().toISOString()
        });
      }
    }

    // الانتقال إلى اليوم التالي
    currentDate.setDate(currentDate.getDate() + 1);
    daysScanned++;
  }

  if (scheduledSessions.length < totalSessions) {
    throw new Error(`لم نتمكن من جدولة جميع الجلسات. تم جدولة ${scheduledSessions.length} من أصل ${totalSessions} جلسة.`);
  }

  const endDate = scheduledSessions[scheduledSessions.length - 1].date;

  return {
    scheduledSessions,
    skippedDates,
    endDate
  };
}

/**
 * خوارزمية ترحيل الجلسات المتبقية (Cascade Shift)
 * تقوم بإعادة جدولة الجلسات من جلسة معينة فصاعداً إلى تواريخ شاغرة جديدة
 */
export function shiftSubsequentSessions(
  fromSessionNumber: number,
  newStartDateStr: string,
  preferredDays: number[],
  allPlanSessions: Session[],
  allCenterSessions: Session[],
  capacitySettings: Record<string, DailyCapacitySetting>,
  allowOverride: boolean = false,
  defaultCapacity: number = DEFAULT_MAX_CAPACITY
): { updatedSessions: { sessionId: string; oldDate: string; newDate: string }[]; skippedDates: SkippedDateItem[] } {
  // تصفية الجلسات المستهدفة بالترحيل
  const targetSessions = allPlanSessions
    .filter((s) => s.sessionNumber >= fromSessionNumber && s.status !== 'COMPLETED')
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  if (targetSessions.length === 0) {
    return { updatedSessions: [], skippedDates: [] };
  }

  // استبعاد الجلسات المراد ترحيلها من مصفوفة الجلسات الحالية لتفريغ خاناتها السابقة
  const targetIds = new Set(targetSessions.map((s) => s.id));
  const otherCenterSessions = allCenterSessions.filter((s) => !targetIds.has(s.id));

  // توزيع التواريخ الجديدة للجلسات المتبقية
  const result = autoDistributeSessions(
    newStartDateStr,
    targetSessions.length,
    preferredDays,
    otherCenterSessions,
    capacitySettings,
    allowOverride,
    defaultCapacity
  );

  const updatedSessions = targetSessions.map((session, index) => {
    return {
      sessionId: session.id,
      oldDate: session.sessionDate,
      newDate: result.scheduledSessions[index].date
    };
  });

  return {
    updatedSessions,
    skippedDates: result.skippedDates
  };
}
