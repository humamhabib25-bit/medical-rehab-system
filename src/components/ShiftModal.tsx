import React, { useState, useMemo } from 'react';
import { X, FastForward, Calendar, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import { TreatmentPlan, Session, DailyCapacitySetting } from '../types';
import { shiftSubsequentSessions, getArabicDayName } from '../core/schedulingEngine';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan | null;
  initialFromSessionNum: number;
  allSessions: Session[];
  capacitySettings: Record<string, DailyCapacitySetting>;
  defaultCapacity: number;
  onConfirmShift: (
    planId: string,
    fromSessionNum: number,
    newStartDate: string,
    allowOverride: boolean
  ) => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  plan,
  initialFromSessionNum,
  allSessions,
  capacitySettings,
  defaultCapacity,
  onConfirmShift
}) => {
  if (!isOpen || !plan) return null;

  const planSessions = allSessions.filter((s) => s.planId === plan.id);
  const eligibleSessions = planSessions
    .filter((s) => s.status !== 'COMPLETED')
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  const [fromSessionNum, setFromSessionNum] = useState<number>(initialFromSessionNum);
  const [newStartDate, setNewStartDate] = useState<string>(() => {
    const match = eligibleSessions.find((s) => s.sessionNumber === initialFromSessionNum);
    return match?.sessionDate || new Date().toISOString().split('T')[0];
  });
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  // المعاينة الحية للترحيل
  const shiftPreview = useMemo(() => {
    try {
      if (!newStartDate || !plan) return null;
      return shiftSubsequentSessions(
        fromSessionNum,
        newStartDate,
        plan.preferredDays,
        planSessions,
        allSessions,
        capacitySettings,
        allowOverride,
        defaultCapacity
      );
    } catch (err: any) {
      return { error: err.message || 'تعذر حساب ترحيل الجلسات' };
    }
  }, [fromSessionNum, newStartDate, plan, planSessions, allSessions, capacitySettings, allowOverride, defaultCapacity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shiftPreview && 'error' in shiftPreview) {
      alert(shiftPreview.error);
      return;
    }

    onConfirmShift(plan.id, fromSessionNum, newStartDate, allowOverride);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-xl">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <FastForward className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ترحيل الجلسات المتبقية (Cascade Shift)
              </h2>
              <p className="text-xs text-slate-500">
                إعادة جدولة الجلسات القادمة تلقائياً على الأيام الشاغرة دون التأثير على السابقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* رقم الجلسة المراد البدء بالترحيل منها */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                بدء الترحيل من الجلسة رقم:
              </label>
              <select
                value={fromSessionNum}
                onChange={(e) => setFromSessionNum(Number(e.target.value))}
                className="input-control text-xs font-semibold"
              >
                {eligibleSessions.map((s) => (
                  <option key={s.id} value={s.sessionNumber}>
                    الجلسة #{s.sessionNumber} (تاريخها الحالي: {s.sessionDate})
                  </option>
                ))}
              </select>
            </div>

            {/* تاريخ البداية الجديد */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                التاريخ الجديد للجلسة المرحّلة:
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="input-control text-xs font-bold"
                required
              />
            </div>
          </div>

          {/* خيار صلاحية المشرف للتجاوز */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">صلاحية المشرف (Override)</div>
                <div className="text-[11px] text-slate-500">
                  السماح بالحجز حتى في حال امتلاء السعة اليومية
                </div>
              </div>
            </div>
            <label className="switch" title="تفعيل / تعطيل صلاحية المشرف">
              <input
                type="checkbox"
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* نتائج المعاينة */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-700">معاينة التواريخ الجديدة بعد الترحيل:</div>

            {shiftPreview && 'error' in shiftPreview ? (
              <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{shiftPreview.error}</span>
              </div>
            ) : shiftPreview ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {shiftPreview.updatedSessions.map((u, i) => {
                  const sess = planSessions.find((s) => s.id === u.sessionId);
                  return (
                    <div
                      key={u.sessionId}
                      className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">
                        الجلسة #{sess?.sessionNumber}:
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="line-through text-slate-400">{u.oldDate}</span>
                        <span>←</span>
                        <span className="font-bold text-teal-700">
                          {u.newDate} ({getArabicDayName(u.newDate)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* أزرار الحفظ */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs font-bold bg-amber-600 hover:bg-amber-700 border-none flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تأكيد ترحيل الجلسات</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
