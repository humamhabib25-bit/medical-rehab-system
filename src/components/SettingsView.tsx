import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, RefreshCw, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  defaultCapacity: number;
  onSetDefaultCapacity: (capacity: number) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  defaultCapacity,
  onSetDefaultCapacity,
  onResetData
}) => {
  const [capacityInput, setCapacityInput] = useState<number>(defaultCapacity);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSetDefaultCapacity(capacityInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* إعدادات الطاقة الاستيعابية العامة */}
      <div className="glass-panel p-6 bg-white border border-slate-200 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              إعدادات الطاقة الاستيعابية الافتراضية (Default Daily Capacity)
            </h2>
            <p className="text-xs text-slate-500">
              تحديد السعة التشغيلية الافتراضية لجميع أيام عمل المركز الطبي
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-800">
                الحد الأقصى للجلسات اليومية الافتراضية:
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                القيمة الافتراضية المعتمدة هي 10 جلسات يومياً، ويمكن تخصيص استثناءات لأيام محددة من شاشة التقويم.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={capacityInput}
                onChange={(e) => setCapacityInput(Number(e.target.value))}
                className="input-control text-sm font-bold w-24 text-center"
                required
              />
              <span className="text-xs font-bold text-slate-600">جلسات/يوم</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ الإعدادات بنجاح!</span>
              </span>
            ) : <span />}

            <button type="submit" className="btn btn-primary text-xs font-bold">
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>

      {/* شروحات قواعد العمل والنظام */}
      <div className="glass-panel p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <span>قواعد العمل المطبقة في النظام (Business Rules Architecture):</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">1. منع الحجز الزائد (Overbooking Prevention):</div>
            <p className="leading-relaxed">
              يقوم محرك الجدولة تلقائياً برفض إدراج أي موعد إضافي في الأيام التي بلغت حد السعة القصوى ما لم يتم تفعيل خيار تجاوز المشرف (Supervisor Override).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">2. التخطي الذكي للأيام المكتملة (Smart Day Skipping):</div>
            <p className="leading-relaxed">
              عند حجز خطة، إذا صادف أحد الأيام اكتمال السعة أو عطلة، يقفز المحرك تلقائياً إلى اليوم التالي المتاح ضمن نفس نمط الأيام دون إلغاء الخطة.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">3. ترحيل السلسلة (Cascade Reschedule):</div>
            <p className="leading-relaxed">
              إمكانية ترحيل الجلسات المتبقية ابتداءً من جلسة محددة إلى تواريخ لاحقة شاغرة مع الحفاظ على سلامة الجلسات المنجزة سابقاً.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">4. استثناءات السعة المخصصة:</div>
            <p className="leading-relaxed">
              إمكانية رفع أو خفض الطاقة الاستيعابية لأيام معينة (مثلاً 12 جلسة عند توفر أخصائي إضافي) مباشرة من بطاقة اليوم في التقويم.
            </p>
          </div>
        </div>
      </div>

      {/* إدارة البيانات التجريبية */}
      <div className="glass-panel p-6 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span>البيانات التجريبية والتخزين المحلي</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            يمكنك إعادة تعيين النظام بالكامل إلى البيانات الافتراضية لاختبار الحالات المختلفة من البداية.
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟')) {
              onResetData();
            }
          }}
          className="btn btn-danger-outline text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة تعيين البيانات الافتراضية</span>
        </button>
      </div>

    </div>
  );
};
