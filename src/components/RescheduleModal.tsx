import React, { useState, useMemo } from 'react';
import { X, Calendar, ShieldAlert, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Session, DailyCapacitySetting } from '../types';
import { calculateDayCapacity, getArabicDayName } from '../core/schedulingEngine';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  allSessions: Session[];
  capacitySettings: Record<string, DailyCapacitySetting>;
  defaultCapacity: number;
  onConfirmReschedule: (sessionId: string, newDate: string, allowOverride: boolean) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  session,
  allSessions,
  capacitySettings,
  defaultCapacity,
  onConfirmReschedule
}) => {
  if (!isOpen || !session) return null;

  const [targetDate, setTargetDate] = useState<string>(session.sessionDate || new Date().toISOString().split('T')[0]);
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  // فحص سعة اليوم المستهدف
  const targetDayCapacity = useMemo(() => {
    if (!targetDate) return null;
    const otherSessions = allSessions.filter((s) => s.id !== session.id);
    return calculateDayCapacity(targetDate, otherSessions, capacitySettings, defaultCapacity);
  }, [targetDate, allSessions, session, capacitySettings, defaultCapacity]);

  const isTargetFull = targetDayCapacity ? targetDayCapacity.bookedCount >= targetDayCapacity.maxCapacity : false;
  const isTargetHoliday = targetDayCapacity ? !targetDayCapacity.isWorkingDay : false;

  const canSubmit = !isTargetHoliday && (!isTargetFull || allowOverride);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      alert('لا يمكن الجدولة في هذا التاريخ لعدم توفر السعة أو لكونه عطلة');
      return;
    }

    onConfirmReschedule(session.id, targetDate, allowOverride);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              إعادة جدولة الجلسة #{session.sessionNumber}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="text-xs text-slate-600 bg-teal-50/70 p-3 rounded-xl border border-teal-100">
            <div>التاريخ الحالي للجلسة: <strong>{session.sessionDate} ({getArabicDayName(session.sessionDate)})</strong></div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              اختر التاريخ البديل المطلوب:
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-control text-xs font-bold"
              required
            />
          </div>

          {/* فحص سعة اليوم المستهدف مباشرة */}
          {targetDayCapacity && (
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              isTargetHoliday
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : isTargetFull
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>حالة اليوم المستهدف ({targetDayCapacity.dayNameAr}):</span>
                <span>
                  {isTargetHoliday ? 'عطلة رسمية' : `${targetDayCapacity.bookedCount} / ${targetDayCapacity.maxCapacity} جلسات`}
                </span>
              </div>

              {isTargetHoliday && (
                <div className="text-[11px] text-slate-500">
                  اليوم غير متاح للجدولة (عطلة المركز).
                </div>
              )}

              {isTargetFull && !isTargetHoliday && (
                <div className="text-[11px] text-rose-600">
                  ⚠️ هذا اليوم مكتمل بالكامل (10/10). يتطلب تفعيل صلاحية المشرف للتجاوز.
                </div>
              )}

              {!isTargetFull && !isTargetHoliday && (
                <div className="text-[11px] text-emerald-600">
                  ✓ يتوفر مقعد شاغر في هذا اليوم.
                </div>
              )}
            </div>
          )}

          {/* مفتاح صلاحية المشرف */}
          {isTargetFull && !isTargetHoliday && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <div className="text-xs font-bold text-slate-800">
                  فتح مقعد استثنائي (Override)
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
          )}

          {/* أزرار الإجراء */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn btn-primary text-xs font-bold flex items-center gap-1.5 ${
                !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>تأكيد إعادة الجدولة</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
