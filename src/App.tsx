import React, { useState, useMemo } from 'react';
import { useClinicStore } from './data/store';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { PlansListView } from './components/PlansListView';
import { PatientsView } from './components/PatientsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { PlanModal } from './components/PlanModal';
import { ShiftModal } from './components/ShiftModal';
import { RescheduleModal } from './components/RescheduleModal';
import { TreatmentPlan, Session } from './types';
import { calculateDayCapacity } from './core/schedulingEngine';

export function App() {
  const {
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
  } = useClinicStore();

  const [activeTab, setActiveTab] = useState<'calendar' | 'plans' | 'patients' | 'analytics' | 'settings'>('calendar');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [shiftModalData, setShiftModalData] = useState<{ plan: TreatmentPlan; startNum: number } | null>(null);
  const [rescheduleModalSession, setRescheduleModalSession] = useState<Session | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // إحصائيات اليوم المباشرة
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayCap = useMemo(() => {
    return calculateDayCapacity(todayDateStr, sessions, capacitySettings, defaultCapacity);
  }, [todayDateStr, sessions, capacitySettings, defaultCapacity]);

  const activePlansCount = useMemo(() => {
    return plans.filter((p) => p.status === 'ACTIVE').length;
  }, [plans]);

  // معالجة تأكيد الخطة
  const handleConfirmPlan = (params: any) => {
    try {
      const res = createTreatmentPlan(params);
      showToast(`تم حجز وجدولة الخطة بنجاح (${res.sessions.length} جلسات)!`);
      setActiveTab('plans');
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الخطة');
    }
  };

  // معالجة ترحيل الجلسات
  const handleConfirmShift = (
    planId: string,
    fromSessionNum: number,
    newStartDate: string,
    allowOverride: boolean
  ) => {
    try {
      const res = shiftRemainingSessions(planId, fromSessionNum, newStartDate, allowOverride);
      showToast(`تم ترحيل ${res.updatedSessions.length} جلسة بنجاح إلى التواريخ الشاغرة!`);
    } catch (err: any) {
      alert(err.message || 'فشل ترحيل الجلسات');
    }
  };

  // معالجة إعادة الجدولة الفردية
  const handleConfirmReschedule = (sessionId: string, newDate: string, allowOverride: boolean) => {
    try {
      rescheduleSession(sessionId, newDate, allowOverride);
      showToast('تمت إعادة جدولة الجلسة بنجاح!');
    } catch (err: any) {
      alert(err.message || 'فشل إعادة الجدولة');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* التنبيه السريع (Toast Alert) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-sm font-bold animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* الشريط العلوي */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewPlanModal={() => setIsPlanModalOpen(true)}
        todayStats={{
          bookedCount: todayCap.bookedCount,
          maxCapacity: todayCap.maxCapacity,
          activePlansCount
        }}
      />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
        {activeTab === 'calendar' && (
          <CalendarView
            sessions={sessions}
            patients={patients}
            plans={plans}
            capacitySettings={capacitySettings}
            defaultCapacity={defaultCapacity}
            onUpdateSessionStatus={(id, status) => updateSessionStatus(id, status)}
            onSetDayCapacity={setDayCapacity}
            onOpenRescheduleModal={(session) => setRescheduleModalSession(session)}
          />
        )}

        {activeTab === 'plans' && (
          <PlansListView
            plans={plans}
            sessions={sessions}
            patients={patients}
            onUpdateSessionStatus={(id, status) => updateSessionStatus(id, status)}
            onOpenRescheduleModal={(session) => setRescheduleModalSession(session)}
            onOpenShiftModal={(plan, num) => setShiftModalData({ plan, startNum: num })}
            onOpenNewPlanModal={() => setIsPlanModalOpen(true)}
            onRecordPayment={recordPayment}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsView
            patients={patients}
            plans={plans}
            sessions={sessions}
            onAddNewPatient={addPatient}
            onOpenNewPlanModal={() => setIsPlanModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            plans={plans}
            sessions={sessions}
            patients={patients}
            defaultCapacity={defaultCapacity}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            defaultCapacity={defaultCapacity}
            onSetDefaultCapacity={setDefaultCapacity}
            onResetData={() => {
              resetToSampleData();
              showToast('تمت إعادة تعيين البيانات للافتراضية');
            }}
          />
        )}
      </main>

      {/* النوافذ المنبثقة (Modals) */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        patients={patients}
        sessions={sessions}
        capacitySettings={capacitySettings}
        defaultCapacity={defaultCapacity}
        onConfirmPlan={handleConfirmPlan}
        onAddNewPatient={addPatient}
      />

      <ShiftModal
        isOpen={shiftModalData !== null}
        onClose={() => setShiftModalData(null)}
        plan={shiftModalData?.plan || null}
        initialFromSessionNum={shiftModalData?.startNum || 1}
        allSessions={sessions}
        capacitySettings={capacitySettings}
        defaultCapacity={defaultCapacity}
        onConfirmShift={handleConfirmShift}
      />

      <RescheduleModal
        isOpen={rescheduleModalSession !== null}
        onClose={() => setRescheduleModalSession(null)}
        session={rescheduleModalSession}
        allSessions={sessions}
        capacitySettings={capacitySettings}
        defaultCapacity={defaultCapacity}
        onConfirmReschedule={handleConfirmReschedule}
      />

    </div>
  );
}

export default App;
