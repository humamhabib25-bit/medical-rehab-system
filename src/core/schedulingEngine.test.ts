import {
  autoDistributeSessions,
  calculateDayCapacity,
  shiftSubsequentSessions,
  DEFAULT_MAX_CAPACITY
} from './schedulingEngine';
import { Session, DailyCapacitySetting } from '../types';

function runTests() {
  console.log('--- بدء اختبارات محرك الجدولة والطاقة الاستيعابية ---');

  const mockSessions: Session[] = [];
  const capacitySettings: Record<string, DailyCapacitySetting> = {};

  // 1. اختبار حساب السعة الافتراضية
  const cap1 = calculateDayCapacity('2026-09-12', mockSessions, capacitySettings, DEFAULT_MAX_CAPACITY);
  console.assert(cap1.maxCapacity === 10, 'فشل: السعة الافتراضية يجب أن تكون 10');
  console.assert(cap1.bookedCount === 0, 'فشل: عدد الحجوزات يجب أن يكون 0');
  console.assert(cap1.status === 'available', 'فشل: الحالة يجب أن تكون متاحة');

  // 2. اختبار يوم ممتلئ (10 جلسات)
  for (let i = 1; i <= 10; i++) {
    mockSessions.push({
      id: `s-${i}`,
      planId: 'plan-1',
      patientId: 'pat-1',
      sessionNumber: i,
      sessionDate: '2026-09-12', // سبت
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    });
  }

  const capFull = calculateDayCapacity('2026-09-12', mockSessions, capacitySettings, 10);
  console.assert(capFull.bookedCount === 10, 'فشل: الحجوزات يجب أن تكون 10');
  console.assert(capFull.status === 'full', 'فشل: اليوم يجب أن يكون ممتلئاً');

  // 3. اختبار التوزيع التلقائي لخطة من 3 جلسات بنمط (سبت-إثنين-أربعاء) [6, 1, 3]
  // بما أن 2026-09-12 (سبت) ممتلئ، يجب أن يتخطاه ويبدأ من 2026-09-14 (إثنين)
  const resultWithoutOverride = autoDistributeSessions(
    '2026-09-12',
    3,
    [6, 1, 3],
    mockSessions,
    capacitySettings,
    false // لا يسمح بالتجاوز
  );

  console.assert(resultWithoutOverride.scheduledSessions.length === 3, 'فشل: يجب جدولة 3 جلسات');
  console.assert(resultWithoutOverride.scheduledSessions[0].date === '2026-09-14', 'فشل: يجب تخطي السبت الممتلئ والبدء من الإثنين 14');
  console.assert(resultWithoutOverride.skippedDates.length === 1, 'فشل: يجب تسجيل يوم واحد متخطى');
  console.assert(resultWithoutOverride.skippedDates[0].date === '2026-09-12', 'فشل: اليوم المتخطى يجب أن يكون السبت');

  // 4. اختبار التجاوز من قبل المشرف (allowOverride = true)
  const resultWithOverride = autoDistributeSessions(
    '2026-09-12',
    3,
    [6, 1, 3],
    mockSessions,
    capacitySettings,
    true // يسمح بالتجاوز
  );
  console.assert(resultWithOverride.scheduledSessions[0].date === '2026-09-12', 'فشل: عند تفعيل التجاوز، يجب الحجز بالسبت');
  console.assert(resultWithOverride.scheduledSessions[0].isOverrideNeeded === true, 'فشل: يجب وضع علامة تجاوز');

  // 5. اختبار ترحيل الجلسات المتبقية (Cascade Shift)
  const planSessions: Session[] = [
    { id: 'ps-1', planId: 'p1', patientId: 'pat-1', sessionNumber: 1, sessionDate: '2026-09-14', status: 'COMPLETED', createdAt: '' },
    { id: 'ps-2', planId: 'p1', patientId: 'pat-1', sessionNumber: 2, sessionDate: '2026-09-16', status: 'SCHEDULED', createdAt: '' },
    { id: 'ps-3', planId: 'p1', patientId: 'pat-1', sessionNumber: 3, sessionDate: '2026-09-19', status: 'SCHEDULED', createdAt: '' },
  ];

  // ترحيل من الجلسة رقم 2 لتاريخ جديد ابتداء من 2026-09-21
  const shifted = shiftSubsequentSessions(
    2,
    '2026-09-21',
    [6, 1, 3],
    planSessions,
    [...mockSessions, ...planSessions],
    capacitySettings,
    false
  );

  console.assert(shifted.updatedSessions.length === 2, 'فشل: يجب ترحيل جلستين (2 و 3)');
  console.assert(shifted.updatedSessions[0].newDate === '2026-09-21', 'فشل: الجلسة 2 يجب أن تصبح في 2026-09-21');

  console.log('✅ جميع اختبارات محرك الجدولة وتوزيع الطاقة الاستيعابية اجتازت بنجاح 100%!');
}

runTests();
