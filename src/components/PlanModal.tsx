import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Layers,
  User,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  CreditCard,
  DollarSign,
  Wallet
} from 'lucide-react';
import { Patient, SchedulePattern, Session, DailyCapacitySetting } from '../types';
import {
  autoDistributeSessions,
  PATTERN_DAYS_MAP,
  ARABIC_DAYS,
  DEFAULT_MAX_CAPACITY
} from '../core/schedulingEngine';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  sessions: Session[];
  capacitySettings: Record<string, DailyCapacitySetting>;
  defaultCapacity: number;
  onConfirmPlan: (params: {
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
  }) => void;
  onAddNewPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  patients,
  sessions,
  capacitySettings,
  defaultCapacity,
  onConfirmPlan,
  onAddNewPatient
}) => {
  if (!isOpen) return null;

  // حالة النموذج
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [isCreatingPatient, setIsCreatingPatient] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newPatientDiagnosis, setNewPatientDiagnosis] = useState<string>('');

  const [totalSessions, setTotalSessions] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('2026-09-06');
  const [pattern, setPattern] = useState<SchedulePattern>('SUN_TUE_THU');
  const [customDays, setCustomDays] = useState<number[]>([0, 2, 4]);
  const [therapistName, setTherapistName] = useState<string>('أ. د. سامي العتيبي');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  // حالة السعر والدفع
  const [pricePerSession, setPricePerSession] = useState<number>(150);
  const [totalPrice, setTotalPrice] = useState<number>(1500);
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [customPaidAmount, setCustomPaidAmount] = useState<number>(1500);

  // تحديث السعر تلقائياً عند تغيير الجلسات
  const handleTotalSessionsChange = (num: number) => {
    setTotalSessions(num);
    const total = pricePerSession * num;
    setTotalPrice(total);
    if (paymentOption === 'FULL') setCustomPaidAmount(total);
  };

  const handlePricePerSessionChange = (val: number) => {
    setPricePerSession(val);
    const total = val * totalSessions;
    setTotalPrice(total);
    if (paymentOption === 'FULL') setCustomPaidAmount(total);
  };

  // حساب الأيام المحددة
  const effectiveDays = useMemo(() => {
    if (pattern === 'CUSTOM') return customDays;
    return PATTERN_DAYS_MAP[pattern] || [0, 2, 4];
  }, [pattern, customDays]);

  // الحساب والمعاينة الحية لخوارزمية التوزيع الذكي
  const distributionPreview = useMemo(() => {
    try {
      if (!startDate || totalSessions <= 0 || effectiveDays.length === 0) return null;
      return autoDistributeSessions(
        startDate,
        totalSessions,
        effectiveDays,
        sessions,
        capacitySettings,
        allowOverride,
        defaultCapacity
      );
    } catch (err: any) {
      return { error: err.message || 'خطأ في معالجة الجدولة' };
    }
  }, [startDate, totalSessions, effectiveDays, sessions, capacitySettings, allowOverride, defaultCapacity]);

  // إنشاء مريض سريع إذا تم تفعيل الخيار
  const handleQuickCreatePatient = () => {
    if (!newPatientName.trim() || !newPatientPhone.trim()) {
      alert('يرجى كتابة اسم المريض ورقم الهاتف');
      return;
    }
    const created = onAddNewPatient({
      fullName: newPatientName,
      phone: newPatientPhone,
      initialDiagnosis: newPatientDiagnosis || 'تشخيص أولي تحت التقييم'
    });
    setSelectedPatientId(created.id);
    setIsCreatingPatient(false);
  };

  const handleDayToggle = (dayIdx: number) => {
    setCustomDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('يرجى اختيار المريض أولاً');
      return;
    }
    if (distributionPreview && 'error' in distributionPreview) {
      alert(distributionPreview.error);
      return;
    }

    let finalPaid = 0;
    if (paymentOption === 'FULL') finalPaid = totalPrice;
    else if (paymentOption === 'PARTIAL') finalPaid = Number(customPaidAmount) || 0;
    else finalPaid = 0;

    onConfirmPlan({
      patientId: selectedPatientId,
      totalSessions,
      startDate,
      preferredPattern: pattern,
      customDays: pattern === 'CUSTOM' ? customDays : undefined,
      therapistName,
      notes: clinicalNotes,
      allowOverride,
      pricePerSession,
      totalPrice,
      paidAmount: finalPaid
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-3xl">
        
        {/* رأس النافذة */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">حجز خطة علاجية متعددة الجلسات</h2>
              <p className="text-xs text-slate-500">
                توزيع تلقائي ذكي للجلسات مع فحص السعة اليومية وتخطي الأيام المكتملة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* قسم اختيار المريض */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>المريض المستفيد:</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingPatient(!isCreatingPatient)}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                {isCreatingPatient ? 'اختيار من المرضى المسجلين' : '+ إضافة مريض جديد'}
              </button>
            </div>

            {isCreatingPatient ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="اسم المريض الثلاثي"
                    className="input-control text-xs"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="رقم الهاتف (مثال: 05xxxxxxx)"
                    className="input-control text-xs"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="التشخيص الأولي أو المشكلة الطبية"
                  className="input-control text-xs"
                  value={newPatientDiagnosis}
                  onChange={(e) => setNewPatientDiagnosis(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleQuickCreatePatient}
                  className="btn btn-sm btn-primary w-full text-xs font-bold"
                >
                  حفظ واختيار المريض
                </button>
              </div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input-control text-xs font-semibold"
                required
              >
                <option value="" disabled>-- اختر المريض --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} - {p.initialDiagnosis} ({p.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* قسم عدد الجلسات ونمط الأيام */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* عدد الجلسات */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>إجمالي جلسات الخطة:</span>
              </label>

              {/* أزرار سريعة للأعداد الشائعة */}
              <div className="flex items-center gap-2">
                {[6, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleTotalSessionsChange(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      totalSessions === num
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {num} جلسات
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="50"
                value={totalSessions}
                onChange={(e) => handleTotalSessionsChange(Number(e.target.value))}
                className="input-control text-xs"
                placeholder="أو اكتب عدداً مخصصاً..."
              />
            </div>

            {/* تاريخ بدء الخطة */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>تاريخ بداية الخطة (الجلسة الأولى):</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-control text-xs font-bold"
                required
              />
            </div>
          </div>

          {/* نمط توزيع الأيام التلقائي */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">نمط التكرار الأسبوعي للجلسات:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPattern('SUN_TUE_THU')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                  pattern === 'SUN_TUE_THU'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>أحد - ثلاثاء - خميس</div>
                <div className="text-[10px] text-slate-400 mt-0.5">3 جلسات أسبوعياً</div>
              </button>

              <button
                type="button"
                onClick={() => setPattern('SAT_MON_WED')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                  pattern === 'SAT_MON_WED'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>سبت - إثنين - أربعاء</div>
                <div className="text-[10px] text-slate-400 mt-0.5">3 جلسات أسبوعياً</div>
              </button>

              <button
                type="button"
                onClick={() => setPattern('DAILY')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                  pattern === 'DAILY'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>يومياً (تأهيل مكثف)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">عدا أيام العطلات</div>
              </button>

              <button
                type="button"
                onClick={() => setPattern('CUSTOM')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                  pattern === 'CUSTOM'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>أيام مخصصة</div>
                <div className="text-[10px] text-slate-400 mt-0.5">تحديد يدوي للأيام</div>
              </button>
            </div>

            {/* منتقي الأيام المخصصة */}
            {pattern === 'CUSTOM' && (
              <div className="flex flex-wrap gap-2 pt-2">
                {ARABIC_DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDayToggle(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      customDays.includes(idx)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* الأخصائي المعالج والملاحظات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الأخصائي المشرف:</label>
              <input
                type="text"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                className="input-control text-xs"
                placeholder="اسم أخصائي العلاج الطبيعي"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات أو بروتوكول العلاج:</label>
              <input
                type="text"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="input-control text-xs"
                placeholder="مثال: تمارين ثبات الركبة، علاج بالتبريد"
              />
            </div>
          </div>

          {/* قسم التكلفة المالية والدفع */}
          <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-teal-100 pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-slate-800">
                  التكلفة المالية وحالة السداد (Pricing & Payment):
                </span>
              </div>
              <span className="text-xs font-extrabold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                {totalPrice} ر.س إجمالي الخطة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  سعر الجلسة الواحدة (ر.س):
                </label>
                <input
                  type="number"
                  min="0"
                  value={pricePerSession}
                  onChange={(e) => handlePricePerSessionChange(Number(e.target.value))}
                  className="input-control text-xs font-bold"
                  placeholder="150"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  إجمالي سعر الخطة / الباقة (ر.س):
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="input-control text-xs font-bold text-teal-800"
                  title="يمكن تعديل الإجمالي لتطبيق خصم للباقة"
                  required
                />
              </div>
            </div>

            {/* خيارات حالة السداد */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                حالة الدفع المبدئية:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentOption('FULL');
                    setCustomPaidAmount(totalPrice);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    paymentOption === 'FULL'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ✓ سداد كامل ({totalPrice} ر.س)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentOption('PARTIAL');
                    setCustomPaidAmount(Math.round(totalPrice / 2));
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    paymentOption === 'PARTIAL'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  دفعة جزئية (عربون)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentOption('UNPAID');
                    setCustomPaidAmount(0);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    paymentOption === 'UNPAID'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  سداد آجل (0 ر.س)
                </button>
              </div>

              {/* حقل إدخال المبلغ المدفوع في حال الدفع الجزئي */}
              {paymentOption === 'PARTIAL' && (
                <div className="mt-2.5 flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-200">
                  <span className="text-xs font-bold text-slate-600">المبلغ المدفوع حالياً:</span>
                  <input
                    type="number"
                    min="0"
                    max={totalPrice}
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(Number(e.target.value))}
                    className="input-control text-xs font-bold w-32"
                  />
                  <span className="text-xs font-bold text-slate-500">ر.س</span>
                  <span className="text-[11px] text-amber-700 mr-auto font-semibold">
                    (المتبقي: {Math.max(0, totalPrice - customPaidAmount)} ر.س)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* خيار صلاحية المشرف لتجاوز السعة (Override Option) */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">
                  صلاحية المشرف: فتح مقعد إضافي في الأيام المكتملة (Override)
                </div>
                <div className="text-[11px] text-slate-500">
                  عند التفعيل، سيتم حجز الجلسات حتى لو وصل اليوم للحد الأقصى (Overbooking) للحالات الطارئة.
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

          {/* المعاينة الحية لجدولة الخطة ونتائج الفحص الذكي */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  المعاينة الحية لجدولة الخطة
                </span>
              </div>
              {distributionPreview && !('error' in distributionPreview) && (
                <div className="text-xs text-slate-600">
                  تاريخ الانتهاء المتوقع:{' '}
                  <strong className="text-teal-700">{distributionPreview.endDate}</strong>
                </div>
              )}
            </div>

            {distributionPreview && 'error' in distributionPreview ? (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{distributionPreview.error}</span>
              </div>
            ) : distributionPreview ? (
              <>
                {/* تنبيهات الأيام التي تم تجاوزها تلقائياً نظراً للامتلاء أو العطلات */}
                {distributionPreview.skippedDates.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>أيام تم تجاوزها تلقائياً لعدم توفر السعة:</span>
                    </div>
                    {distributionPreview.skippedDates.map((item, idx) => (
                      <div key={idx} className="text-[11px] text-amber-700 flex items-center gap-2">
                        <span>• {item.dayNameAr} ({item.date}): {item.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* شريط الجلسات المجدولة */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {distributionPreview.scheduledSessions.map((s) => (
                    <div
                      key={s.sessionNumber}
                      className={`p-2 rounded-lg border text-right text-xs ${
                        s.isOverrideNeeded
                          ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-teal-700">جلسة {s.sessionNumber}</span>
                        {s.isOverrideNeeded && (
                          <span className="text-[9px] bg-amber-200 text-amber-800 px-1 rounded font-bold">
                            تجاوز
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">{s.date}</div>
                      <div className="text-[10px] text-slate-400">
                        {s.dayNameAr} • إشغال {s.dayBookedCount}/{s.dayCapacity}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs shadow-lg shadow-teal-700/20 font-bold flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تأكيد وجدولة الخطة ({totalSessions} جلسات)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
