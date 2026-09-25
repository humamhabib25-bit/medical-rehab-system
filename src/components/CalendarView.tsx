import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Activity,
  PlusCircle,
  MinusCircle,
  Coffee
} from 'lucide-react';
import { Session, DailyCapacitySetting, Patient, TreatmentPlan } from '../types';
import { calculateDayCapacity, formatDate, ARABIC_DAYS } from '../core/schedulingEngine';

interface CalendarViewProps {
  sessions: Session[];
  patients: Patient[];
  plans: TreatmentPlan[];
  capacitySettings: Record<string, DailyCapacitySetting>;
  defaultCapacity: number;
  onUpdateSessionStatus: (sessionId: string, status: any) => void;
  onSetDayCapacity: (date: string, maxCap: number, isWorking: boolean, notes?: string) => void;
  onOpenRescheduleModal: (session: Session) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  patients,
  plans,
  capacitySettings,
  defaultCapacity,
  onUpdateSessionStatus,
  onSetDayCapacity,
  onOpenRescheduleModal
}) => {
  // التاريخ الحالي الديناميكي
  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [currentYearMonth, setCurrentYearMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayFormatted);

  // حساب أيام الشهر
  const daysInMonth = new Date(currentYearMonth.year, currentYearMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYearMonth.year, currentYearMonth.month, 1).getDay();

  const SHORT_ARABIC_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handlePrevMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // تفاصيل اليوم المحدد
  const selectedDayCapacity = calculateDayCapacity(
    selectedDateStr,
    sessions,
    capacitySettings,
    defaultCapacity
  );

  const selectedDaySessions = sessions.filter(
    (s) => s.sessionDate === selectedDateStr && s.status !== 'CANCELLED'
  );

  // خريطة المرضى للوصول السريع
  const patientsMap = new Map(patients.map((p) => [p.id, p]));
  const plansMap = new Map(plans.map((p) => [p.id, p]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* شبكة التقويم الرئيسي (8 أعمدة من 12) */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* شريط أدوات الشهر والتنقل */}
        <div className="glass-panel p-3 sm:p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-teal-50 text-teal-700 rounded-xl shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {monthNamesAr[currentYearMonth.month]} {currentYearMonth.year}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                انقر على أي يوم لاستعراض الجلسات وإدارة الطاقة الاستيعابية
              </p>
            </div>
          </div>

          {/* مفاتيح التنقل بين الشهور */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentYearMonth({ year: today.getFullYear(), month: today.getMonth() });
                setSelectedDateStr(todayFormatted);
              }}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            >
              اليوم الحالي
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* دليل دلالات الألوان */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 py-2 bg-white rounded-xl border border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>شاغر ومتاح (0 - 79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 inline-block shrink-0" />
            <span>شبه ممتلئ (80 - 99%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 inline-block shrink-0" />
            <span>مكتمل (100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-300 inline-block shrink-0" />
            <span>عطلة للمركز</span>
          </div>
        </div>

        {/* شبكة أيام الأسبوع والتقويم */}
        <div className="glass-panel p-2 sm:p-4 bg-white">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold text-slate-500">
            {ARABIC_DAYS.map((dayName, idx) => (
              <div key={idx} className="py-1">
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{SHORT_ARABIC_DAYS[idx]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* خانات فارغة لأيام الشهر السابق */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[66px] sm:min-h-[95px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200" />
            ))}

            {/* أيام الشهر الحالي */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYearMonth.year}-${String(currentYearMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayCap = calculateDayCapacity(dateStr, sessions, capacitySettings, defaultCapacity);
              const isSelected = dateStr === selectedDateStr;

              // كلاسات حالة السعة
              let badgeClass = 'cap-badge-available';
              let borderClass = 'border-slate-200';

              if (!dayCap.isWorkingDay) {
                badgeClass = 'cap-badge-holiday';
                borderClass = 'border-slate-200 bg-slate-50/70';
              } else if (dayCap.status === 'full') {
                badgeClass = 'cap-badge-full';
                borderClass = 'border-rose-300 bg-rose-50/30';
              } else if (dayCap.status === 'near_full') {
                badgeClass = 'cap-badge-near_full';
                borderClass = 'border-amber-300 bg-amber-50/30';
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[66px] sm:min-h-[95px] p-1 sm:p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${borderClass} ${
                    isSelected
                      ? 'ring-2 ring-teal-600 shadow-md bg-teal-50/40 border-teal-500'
                      : 'hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-0.5">
                    <span className={`text-[11px] sm:text-sm font-bold ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                      {dayNum}
                    </span>
                    {dayCap.isWorkingDay ? (
                      <span className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full ${badgeClass}`}>
                        {dayCap.bookedCount}/{dayCap.maxCapacity}
                      </span>
                    ) : (
                      <span className="text-[7px] sm:text-[10px] font-bold px-1 py-0.2 rounded-full bg-slate-200 text-slate-600">
                        عطلة
                      </span>
                    )}
                  </div>

                  {/* شريط الإشغال البصري */}
                  {dayCap.isWorkingDay && (
                    <div className="mt-0.5 sm:mt-1">
                      <div className="w-full bg-slate-200 rounded-full h-1 sm:h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            dayCap.status === 'full'
                              ? 'bg-rose-500'
                              : dayCap.status === 'near_full'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(dayCap.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="hidden sm:block text-[10px] text-slate-500 mt-1 font-medium text-left">
                        {dayCap.bookedCount > 0 ? `${dayCap.bookedCount} جلسات` : 'شاغر'}
                      </div>
                    </div>
                  )}

                  {dayCap.notes && (
                    <p className="text-[8px] sm:text-[9px] text-slate-500 truncate mt-0.5 font-medium" title={dayCap.notes}>
                      {dayCap.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* لوحة تفاصيل اليوم المحدد (4 أعمدة من 12) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="glass-panel p-5 bg-white space-y-4 sticky top-28">
          
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">
                {selectedDayCapacity.dayNameAr}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {selectedDateStr}
              </span>
            </div>

            {/* حالة السعة اليومية وأزرار التعديل السريع */}
            <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">إجمالي الحجوزات:</span>
                <span className="font-bold text-slate-800">
                  {selectedDayCapacity.bookedCount} جلسة
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">الطاقة القصوى:</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>{selectedDayCapacity.maxCapacity}</span>
                  {/* أزرار زيادة / إنقاص السعة لليوم المحدد */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onSetDayCapacity(
                          selectedDateStr,
                          Math.max(0, selectedDayCapacity.maxCapacity - 1),
                          selectedDayCapacity.isWorkingDay,
                          'تعديل سعة مخصص'
                        )
                      }
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="إنقاص السعة مقعد واحد"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onSetDayCapacity(
                          selectedDateStr,
                          selectedDayCapacity.maxCapacity + 1,
                          selectedDayCapacity.isWorkingDay,
                          'تعديل سعة مخصص'
                        )
                      }
                      className="text-teal-600 hover:text-teal-800 p-0.5"
                      title="زيادة السعة مقعد إضافي استثنائي"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* زر تحويل اليوم إلى عطلة أو تفعيله */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-200 text-xs">
                <span className="text-slate-500">حالة اليوم:</span>
                <button
                  onClick={() =>
                    onSetDayCapacity(
                      selectedDateStr,
                      selectedDayCapacity.maxCapacity,
                      !selectedDayCapacity.isWorkingDay,
                      !selectedDayCapacity.isWorkingDay ? '' : 'تم تعيينه كعطلة يدوياً'
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedDayCapacity.isWorkingDay
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {selectedDayCapacity.isWorkingDay ? 'تعيين كعطلة' : 'إتاحة كيوم عمل'}
                </button>
              </div>
            </div>
          </div>

          {/* قائمة جلسات اليوم المحدد */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>جلسات هذا اليوم ({selectedDaySessions.length})</span>
              </h3>
            </div>

            {selectedDaySessions.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">لا توجد جلسات محجوزة في هذا اليوم.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {selectedDaySessions.map((session) => {
                  const patient = patientsMap.get(session.patientId);
                  const plan = plansMap.get(session.planId);

                  return (
                    <div
                      key={session.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                            {session.sessionNumber}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {patient ? patient.fullName : 'مريض غير مسجل'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              الجلسة {session.sessionNumber} من {plan?.totalSessions || '-'}
                            </div>
                          </div>
                        </div>

                        {/* شارة حالة الجلسة */}
                        <div>
                          {session.status === 'COMPLETED' && (
                            <span className="badge badge-completed text-[10px]">مكتملة</span>
                          )}
                          {session.status === 'SCHEDULED' && (
                            <span className="badge badge-scheduled text-[10px]">مجدولة</span>
                          )}
                          {session.status === 'RESCHEDULED' && (
                            <span className="badge badge-rescheduled text-[10px]">مؤجلة</span>
                          )}
                          {session.status === 'NO_SHOW' && (
                            <span className="badge badge-noshow text-[10px]">غياب</span>
                          )}
                        </div>
                      </div>

                      {session.therapistName && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{session.therapistName}</span>
                        </div>
                      )}

                      {/* أزرار الإجراء السريع للجلسة */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        {session.status !== 'COMPLETED' && (
                          <button
                            onClick={() => onUpdateSessionStatus(session.id, 'COMPLETED')}
                            className="btn btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex-1 py-1 text-[11px] font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>اكتمال</span>
                          </button>
                        )}
                        {session.status !== 'NO_SHOW' && session.status !== 'COMPLETED' && (
                          <button
                            onClick={() => onUpdateSessionStatus(session.id, 'NO_SHOW')}
                            className="btn btn-sm bg-rose-50 text-rose-700 hover:bg-rose-100 py-1 text-[11px] font-bold"
                            title="تسجيل غياب المريض"
                          >
                            غياب
                          </button>
                        )}
                        {session.status !== 'COMPLETED' && (
                          <button
                            onClick={() => onOpenRescheduleModal(session)}
                            className="btn btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100 py-1 text-[11px] font-bold"
                          >
                            تأجيل
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
