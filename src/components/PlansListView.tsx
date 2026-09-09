import React, { useState } from 'react';
import {
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  FastForward,
  AlertCircle,
  Activity,
  Plus
} from 'lucide-react';
import { TreatmentPlan, Session, Patient, SessionStatus } from '../types';
import { getArabicDayName } from '../core/schedulingEngine';

interface PlansListViewProps {
  plans: TreatmentPlan[];
  sessions: Session[];
  patients: Patient[];
  onUpdateSessionStatus: (sessionId: string, status: SessionStatus, notes?: string) => void;
  onOpenRescheduleModal: (session: Session) => void;
  onOpenShiftModal: (plan: TreatmentPlan, startFromSessionNum: number) => void;
  onOpenNewPlanModal: () => void;
  onRecordPayment?: (planId: string, amount: number) => void;
}

export const PlansListView: React.FC<PlansListViewProps> = ({
  plans,
  sessions,
  patients,
  onUpdateSessionStatus,
  onOpenRescheduleModal,
  onOpenShiftModal,
  onOpenNewPlanModal,
  onRecordPayment
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const patientsMap = new Map(patients.map((p) => [p.id, p]));

  // تصفية الخطط
  const filteredPlans = plans.filter((plan) => {
    const patient = patientsMap.get(plan.patientId);
    const matchesStatus = filterStatus === 'ALL' || plan.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      (patient && patient.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (patient && patient.initialDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* شريط التصفية والبحث */}
      <div className="glass-panel p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="البحث باسم المريض أو التشخيص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control text-xs w-full md:w-72"
          />

          <div className="flex items-center gap-1">
            {['ALL', 'ACTIVE', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterStatus === st
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'النشطة' : 'المكتملة'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenNewPlanModal}
          className="btn btn-primary text-xs font-bold w-full md:w-auto flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>خطة علاجية جديدة</span>
        </button>

      </div>

      {/* بطاقات الخطط العلاجية */}
      {filteredPlans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">لا توجد خطط علاجية مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 mt-1">ابدأ بإنشاء خطة جديدة للمريض بضغطة زر</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPlans.map((plan) => {
            const patient = patientsMap.get(plan.patientId);
            const planSessions = sessions
              .filter((s) => s.planId === plan.id)
              .sort((a, b) => a.sessionNumber - b.sessionNumber);

            const completedCount = planSessions.filter((s) => s.status === 'COMPLETED').length;
            const progressPercent = Math.round((completedCount / plan.totalSessions) * 100);

            // أول جلسة قادمة غير مكتملة لتسهيل الترحيل منها
            const nextUpcomingSession = planSessions.find(
              (s) => s.status === 'SCHEDULED' || s.status === 'RESCHEDULED'
            );

            const remainingAmount = Math.max(0, (plan.totalPrice || 0) - (plan.paidAmount || 0));

            return (
              <div
                key={plan.id}
                className="glass-panel bg-white border border-slate-200 rounded-2xl p-6 space-y-5 hover:border-teal-300 transition-all shadow-sm"
              >
                {/* رأس بطاقة الخطة */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200/60 shrink-0">
                      {completedCount}/{plan.totalSessions}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-800">
                          {patient?.fullName || 'مريض غير مسجل'}
                        </h3>
                        <span
                          className={`badge text-[10px] ${
                            plan.status === 'COMPLETED' ? 'badge-completed' : 'badge-scheduled'
                          }`}
                        >
                          {plan.status === 'COMPLETED' ? 'خطة مكتملة' : 'خطة نشطة'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {patient?.initialDiagnosis || 'تشخيص أولي'} • هاتف: {patient?.phone}
                      </p>
                      {plan.notes && (
                        <p className="text-xs text-teal-800 bg-teal-50/70 px-2.5 py-1 rounded-md mt-1.5 inline-block font-medium">
                          📌 {plan.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* التفاصيل المالية والإجراءات */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* بطاقة السعر وحالة السداد */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">قيمة الخطة:</div>
                        <div className="font-extrabold text-slate-800 text-sm">
                          {plan.totalPrice || 0} ر.س
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">حالة الدفع:</div>
                        <div className="mt-0.5">
                          {plan.paymentStatus === 'PAID' ? (
                            <span className="badge badge-completed text-[10px]">
                              مسددة بالكامل
                            </span>
                          ) : plan.paymentStatus === 'PARTIALLY_PAID' ? (
                            <span className="badge badge-rescheduled text-[10px]">
                              مسدد {plan.paidAmount} ر.س (متبقي {remainingAmount})
                            </span>
                          ) : (
                            <span className="badge badge-noshow text-[10px]">
                              غير مسددة (متبقي {remainingAmount} ر.س)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* زر تسجيل دفعة إذا تبقى مبلغ */}
                      {remainingAmount > 0 && onRecordPayment && (
                        <button
                          onClick={() => {
                            const val = prompt(
                              `تسجيل دفعة للمريض ${patient?.fullName || ''}\nالمبلغ المتبقي: ${remainingAmount} ر.س\n\nأدخل قيمة الدفعة:`,
                              String(remainingAmount)
                            );
                            if (val && Number(val) > 0) {
                              onRecordPayment(plan.id, Number(val));
                            }
                          }}
                          className="btn btn-sm btn-secondary text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 py-1 px-2"
                          title="تسجيل دفعة نقدية أو تحويل"
                        >
                          + دفعة
                        </button>
                      )}
                    </div>

                    {/* زر الترحيل السريع */}
                    {nextUpcomingSession && plan.status === 'ACTIVE' && (
                      <button
                        onClick={() => onOpenShiftModal(plan, nextUpcomingSession.sessionNumber)}
                        className="btn btn-secondary text-xs font-bold text-teal-700 border-teal-200 hover:bg-teal-50 flex items-center gap-1.5"
                        title="ترحيل باقي الجلسات لتفادي الغياب وتجاوز الأيام المكتملة"
                      >
                        <FastForward className="w-4 h-4 text-teal-600" />
                        <span>ترحيل باقي الجلسات (من جلسة {nextUpcomingSession.sessionNumber})</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* شريط التقدم ونسبة الإنجاز */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">نسبة إنجاز الخطة:</span>
                    <span className="text-teal-700 font-extrabold">{progressPercent}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* جدول وتتبع الجلسات الفردية */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>جدول جلسات الخطة العلاجية:</span>
                    <span className="text-slate-400 font-normal text-[11px]">
                      إجمالي {planSessions.length} جلسة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {planSessions.map((s) => (
                      <div
                        key={s.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : s.status === 'NO_SHOW'
                            ? 'bg-rose-50/40 border-rose-200'
                            : s.status === 'RESCHEDULED'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">الجلسة #{s.sessionNumber}</span>
                          <div>
                            {s.status === 'COMPLETED' && (
                              <span className="badge badge-completed text-[10px]">مكتملة</span>
                            )}
                            {s.status === 'SCHEDULED' && (
                              <span className="badge badge-scheduled text-[10px]">مجدولة</span>
                            )}
                            {s.status === 'RESCHEDULED' && (
                              <span className="badge badge-rescheduled text-[10px]">مؤجلة</span>
                            )}
                            {s.status === 'NO_SHOW' && (
                              <span className="badge badge-noshow text-[10px]">غياب</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-slate-700">{s.sessionDate}</div>
                          <div className="text-[11px] text-slate-400">
                            يوم {getArabicDayName(s.sessionDate)}
                          </div>
                          {s.rescheduledFromDate && (
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              مرحلة من: {s.rescheduledFromDate}
                            </div>
                          )}
                        </div>

                        {/* أزرار الإجراءات لكل جلسة */}
                        <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60">
                          {s.status !== 'COMPLETED' && (
                            <button
                              onClick={() => onUpdateSessionStatus(s.id, 'COMPLETED')}
                              className="btn btn-sm bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200 flex-1 py-1 text-[10px] font-bold"
                              title="تسجيل إتمام الجلسة"
                            >
                              إنجاز
                            </button>
                          )}
                          {s.status !== 'NO_SHOW' && s.status !== 'COMPLETED' && (
                            <button
                              onClick={() => onUpdateSessionStatus(s.id, 'NO_SHOW')}
                              className="btn btn-sm bg-rose-100/70 text-rose-800 hover:bg-rose-200 py-1 text-[10px] font-bold"
                              title="تسجيل غياب المريض"
                            >
                              غياب
                            </button>
                          )}
                          {s.status !== 'COMPLETED' && (
                            <button
                              onClick={() => onOpenRescheduleModal(s)}
                              className="btn btn-sm bg-amber-100/70 text-amber-800 hover:bg-amber-200 py-1 text-[10px] font-bold"
                              title="إعادة جدولة هذه الجلسة"
                            >
                              تأجيل
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
