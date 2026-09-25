import { useState, useEffect } from 'react';
import {
  Patient,
  TreatmentPlan,
  Session,
  DailyCapacitySetting,
  SessionStatus,
  SchedulePattern
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_PLANS,
  INITIAL_SESSIONS,
  INITIAL_CAPACITY_SETTINGS
} from './mockData';
import {
  autoDistributeSessions,
  shiftSubsequentSessions,
  calculateDayCapacity,
  DEFAULT_MAX_CAPACITY,
  PATTERN_DAYS_MAP
} from '../core/schedulingEngine';

const STORAGE_KEYS = {
  PATIENTS: 'rehab_clinic_patients_v2',
  PLANS: 'rehab_clinic_plans_v2',
  SESSIONS: 'rehab_clinic_sessions_v2',
  CAPACITY: 'rehab_clinic_capacity_v2',
  DEFAULT_CAP: 'rehab_clinic_default_cap_v2'
};

export function useClinicStore() {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [plans, setPlans] = useState<TreatmentPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [capacitySettings, setCapacitySettings] = useState<Record<string, DailyCapacitySetting>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAPACITY);
    return saved ? JSON.parse(saved) : INITIAL_CAPACITY_SETTINGS;
  });

  const [defaultCapacity, setDefaultCapacity] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEFAULT_CAP);
    return saved ? Number(saved) : DEFAULT_MAX_CAPACITY;
  });

  // حفظ التغييرات في التخزين المحلي تلقائياً
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPACITY, JSON.stringify(capacitySettings));
  }, [capacitySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_CAP, String(defaultCapacity));
  }, [defaultCapacity]);

  // إضافة مريض جديد
  const addPatient = (newPatient: Omit<Patient, 'id' | 'createdAt'>) => {
    const patient: Patient = {
      ...newPatient,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setPatients((prev) => [patient, ...prev]);
    return patient;
  };

  // إنشاء خطة علاجية وجدولة جلساتها تلقائياً
  const createTreatmentPlan = (params: {
    patientId: string;
    totalSessions: number;
    startDate: string;
    preferredPattern: SchedulePattern;
    customDays?: number[];
    notes?: string;
    therapistName?: string;
    allowOverride?: boolean;
    pricePerSession?: number;
    totalPrice?: number;
    paidAmount?: number;
  }) => {
    const days = params.preferredPattern === 'CUSTOM' && params.customDays
      ? params.customDays
      : PATTERN_DAYS_MAP[params.preferredPattern];

    // تشغيل خوارزمية التوزيع
    const scheduleResult = autoDistributeSessions(
      params.startDate,
      params.totalSessions,
      days,
      sessions,
      capacitySettings,
      params.allowOverride,
      defaultCapacity
    );

    const pricePerSession = params.pricePerSession ?? 150;
    const totalPrice = params.totalPrice ?? (pricePerSession * params.totalSessions);
    const paidAmount = params.paidAmount ?? 0;
    
    let paymentStatus: TreatmentPlan['paymentStatus'] = 'UNPAID';
    if (paidAmount >= totalPrice && totalPrice > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const planId = `plan-${Date.now()}`;
    const newPlan: TreatmentPlan = {
      id: planId,
      patientId: params.patientId,
      totalSessions: params.totalSessions,
      completedSessions: 0,
      status: 'ACTIVE',
      startDate: params.startDate,
      preferredPattern: params.preferredPattern,
      preferredDays: days,
      pricePerSession,
      totalPrice,
      paidAmount,
      paymentStatus,
      notes: params.notes,
      createdAt: new Date().toISOString()
    };

    const newSessions: Session[] = scheduleResult.scheduledSessions.map((item) => ({
      id: `sess-${Date.now()}-${item.sessionNumber}`,
      planId: planId,
      patientId: params.patientId,
      sessionNumber: item.sessionNumber,
      sessionDate: item.date,
      status: 'SCHEDULED',
      therapistName: params.therapistName || 'أخصائي العلاج الطبيعي',
      isOverride: item.isOverrideNeeded,
      createdAt: new Date().toISOString()
    }));

    setPlans((prev) => [newPlan, ...prev]);
    setSessions((prev) => [...prev, ...newSessions]);

    return { plan: newPlan, sessions: newSessions, skippedDates: scheduleResult.skippedDates };
  };

  // تحديث حالة جلسة فردية
  const updateSessionStatus = (sessionId: string, newStatus: SessionStatus, notes?: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            status: newStatus,
            notes: notes !== undefined ? notes : s.notes
          };
        }
        return s;
      });

      // إعادة احتساب الجلسات المنجزة للخطة المرتبطة
      const targetSession = prev.find((s) => s.id === sessionId);
      if (targetSession) {
        const planSessions = updated.filter((s) => s.planId === targetSession.planId);
        const completedCount = planSessions.filter((s) => s.status === 'COMPLETED').length;
        
        setPlans((planList) =>
          planList.map((p) => {
            if (p.id === targetSession.planId) {
              const allDone = completedCount === p.totalSessions;
              return {
                ...p,
                completedSessions: completedCount,
                status: allDone ? 'COMPLETED' : p.status
              };
            }
            return p;
          })
        );
      }

      return updated;
    });
  };

  // إعادة جدولة جلسة فردية إلى تاريخ محدد
  const rescheduleSession = (
    sessionId: string,
    newDate: string,
    allowOverride: boolean = false
  ) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('الجلسة غير موجودة');

    // فحص سعة اليوم المستهدف (نستثني الجلسة نفسها إذا كانت في نفس اليوم)
    const otherSessions = sessions.filter((s) => s.id !== sessionId);
    const dayCap = calculateDayCapacity(newDate, otherSessions, capacitySettings, defaultCapacity);

    if (!dayCap.isWorkingDay) {
      throw new Error('لا يمكن الجدولة في هذا اليوم نظراً لكونه عطلة رسمية');
    }

    if (dayCap.bookedCount >= dayCap.maxCapacity && !allowOverride) {
      throw new Error(`اليوم المطلوب ممتلئ بالكامل (${dayCap.bookedCount}/${dayCap.maxCapacity}). يتطلب صلاحية المشرف للتجاوز.`);
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            sessionDate: newDate,
            rescheduledFromDate: s.sessionDate,
            status: 'RESCHEDULED',
            isOverride: dayCap.bookedCount >= dayCap.maxCapacity
          };
        }
        return s;
      })
    );
  };

  // ترحيل باقي الجلسات بالكامل (Cascade Shift)
  const shiftRemainingSessions = (
    planId: string,
    fromSessionNumber: number,
    newStartDate: string,
    allowOverride: boolean = false
  ) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw new Error('الخطة العلاجية غير موجودة');

    const planSessions = sessions.filter((s) => s.planId === planId);

    const shiftResult = shiftSubsequentSessions(
      fromSessionNumber,
      newStartDate,
      plan.preferredDays,
      planSessions,
      sessions,
      capacitySettings,
      allowOverride,
      defaultCapacity
    );

    const updateMap = new Map(shiftResult.updatedSessions.map((u) => [u.sessionId, u.newDate]));

    setSessions((prev) =>
      prev.map((s) => {
        if (updateMap.has(s.id)) {
          return {
            ...s,
            rescheduledFromDate: s.sessionDate,
            sessionDate: updateMap.get(s.id)!,
            status: 'RESCHEDULED'
          };
        }
        return s;
      })
    );

    return shiftResult;
  };

  // تحديث سعة يوم معين أو تعيينه كعطلة
  const setDayCapacity = (
    date: string,
    maxCapacity: number,
    isWorkingDay: boolean,
    notes?: string
  ) => {
    setCapacitySettings((prev) => ({
      ...prev,
      [date]: {
        date,
        maxCapacity,
        isWorkingDay,
        notes
      }
    }));
  };

  // تسجيل دفعة مالية لخطة علاجية
  const recordPayment = (planId: string, amount: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const newPaid = Math.min(p.totalPrice, p.paidAmount + amount);
          const newStatus = newPaid >= p.totalPrice ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
          return {
            ...p,
            paidAmount: newPaid,
            paymentStatus: newStatus
          };
        }
        return p;
      })
    );
  };

  // إعادة تعيين البيانات للافتراضية لأغراض التجربة
  const resetToSampleData = () => {
    setPatients(INITIAL_PATIENTS);
    setPlans(INITIAL_PLANS);
    setSessions(INITIAL_SESSIONS);
    setCapacitySettings(INITIAL_CAPACITY_SETTINGS);
    setDefaultCapacity(DEFAULT_MAX_CAPACITY);
    localStorage.clear();
  };

  return {
    patients,
    plans,
    sessions,
    capacitySettings,
    defaultCapacity,
    setDefaultCapacity,
    addPatient,
    createTreatmentPlan,
    updateSessionStatus,
    rescheduleSession,
    shiftRemainingSessions,
    setDayCapacity,
    recordPayment,
    resetToSampleData
  };
}
