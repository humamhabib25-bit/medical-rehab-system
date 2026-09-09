import React, { useState } from 'react';
import { User, Phone, FileText, Plus, Activity, Search } from 'lucide-react';
import { Patient, TreatmentPlan, Session } from '../types';

interface PatientsViewProps {
  patients: Patient[];
  plans: TreatmentPlan[];
  sessions: Session[];
  onAddNewPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  onOpenNewPlanModal: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  plans,
  sessions,
  onAddNewPatient,
  onOpenNewPlanModal
}) => {
  const [search, setSearch] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.initialDiagnosis.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddNewPatient({
      fullName: name,
      phone,
      initialDiagnosis: diagnosis || 'تأهيل عام',
      notes
    });

    setName('');
    setPhone('');
    setDiagnosis('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      
      {/* شريط الإجراءات والبحث */}
      <div className="glass-panel p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث باسم المريض أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-control text-xs pr-9"
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn btn-primary text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'إغلاق النموذج' : 'تسجيل مريض جديد'}</span>
        </button>
      </div>

      {/* نموذج إضافة مريض جديد */}
      {isAdding && (
        <form onSubmit={handleCreate} className="glass-panel p-5 bg-white space-y-4 border-teal-200">
          <h3 className="text-sm font-bold text-slate-800">بيانات المريض الجديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الاسم الكامل:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-control text-xs"
                placeholder="مثال: عبد العزيز فهد الراجحي"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف الجوال:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-control text-xs"
                placeholder="05xxxxxxxx"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">التشخيص الأولي:</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input-control text-xs"
                placeholder="مثال: تمزق غضروف الركبة"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات طبية إضافية:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-control text-xs"
              placeholder="تاريخ الإصابة، أمراض مزمنة، تنبيهات خاصة"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn btn-secondary text-xs"
            >
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary text-xs font-bold">
              حفظ المريض
            </button>
          </div>
        </form>
      )}

      {/* قائمة بطاقات المرضى */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const patientPlans = plans.filter((p) => p.patientId === patient.id);
          const activePlan = patientPlans.find((p) => p.status === 'ACTIVE');

          return (
            <div
              key={patient.id}
              className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{patient.fullName}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{patient.phone}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {patientPlans.length} خطط
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <div className="font-bold text-slate-700">التشخيص:</div>
                <p className="text-slate-600 leading-relaxed">{patient.initialDiagnosis}</p>
                {patient.notes && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                    ملاحظة: {patient.notes}
                  </p>
                )}
              </div>

              {activePlan ? (
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-teal-700">خطة علاجية جارية</span>
                    <span className="text-slate-500 font-semibold">
                      {activePlan.completedSessions} / {activePlan.totalSessions} جلسات
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.round(
                          (activePlan.completedSessions / activePlan.totalSessions) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={onOpenNewPlanModal}
                    className="btn btn-secondary text-xs w-full py-1.5 font-bold text-teal-700 border-teal-200 hover:bg-teal-50"
                  >
                    + إنشاء خطة جديدة للمريض
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
