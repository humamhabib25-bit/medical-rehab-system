import React from 'react';
import { Calendar, Users, FileText, Settings, Plus, Activity, BarChart3 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'calendar' | 'plans' | 'patients' | 'analytics' | 'settings';
  setActiveTab: (tab: 'calendar' | 'plans' | 'patients' | 'analytics' | 'settings') => void;
  onOpenNewPlanModal: () => void;
  todayStats: {
    bookedCount: number;
    maxCapacity: number;
    activePlansCount: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPlanModal,
  todayStats
}) => {
  const isFull = todayStats.bookedCount >= todayStats.maxCapacity;

  return (
    <header className="glass-panel sticky top-0 z-40 mb-6 bg-white/95 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* الشعار واسم المركز الطبي */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20 shrink-0">
              <Activity className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-800 leading-tight truncate">
                مركز الأمل للتأهيل الطبي
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden xs:block sm:block">
                منظومة إدارة الخطط وضبط السعة
              </p>
            </div>
          </div>

          {/* مؤشر سعة اليوم السريع */}
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold">طاقة اليوم الاستيعابية</div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span className={isFull ? 'text-rose-600' : 'text-teal-700'}>
                  {todayStats.bookedCount}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-700">{todayStats.maxCapacity} جلسات</span>
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                isFull ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
              title={isFull ? 'اليوم ممتلئ' : 'اليوم متاح'}
            />
          </div>

          {/* زر إنشاء خطة جديدة */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewPlanModal}
              className="btn btn-primary shadow-lg shadow-teal-600/25 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2 font-bold cursor-pointer text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>خطة علاجية جديدة</span>
            </button>
          </div>
        </div>

        {/* شريط التنقل بين التبويبات */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-t border-slate-100 pt-2 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>التقويم وجدول السعة</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الخطط العلاجية والجلسات</span>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {todayStats.activePlansCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'patients'
                ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>سجل المرضى</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات والتقارير</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات الطاقة الاستيعابية</span>
          </button>
        </div>
      </div>
    </header>
  );
};
