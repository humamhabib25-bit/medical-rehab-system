import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Calendar,
  Layers,
  BarChart2,
  PieChart,
  Flame,
  Check,
  Clock,
  ArrowDownLeft,
  ChevronDown
} from 'lucide-react';
import { TreatmentPlan, Session, Patient } from '../types';
import { ARABIC_DAYS } from '../core/schedulingEngine';

interface AnalyticsViewProps {
  plans: TreatmentPlan[];
  sessions: Session[];
  patients: Patient[];
  defaultCapacity: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  plans,
  sessions,
  patients,
  defaultCapacity
}) => {
  const [chartViewMode, setChartViewMode] = useState<'vertical' | 'list'>('vertical');

  // 1. الحسابات المالية المفصلة وحالات السداد
  const paymentStats = useMemo(() => {
    const totalRevenue = plans.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const totalCollected = plans.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalRevenue - totalCollected);

    // المسددة بالكامل
    const paidPlans = plans.filter((p) => p.paymentStatus === 'PAID');
    const paidAmount = paidPlans.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const paidPct = totalRevenue > 0 ? Math.round((paidAmount / totalRevenue) * 100) : 0;

    // المسددة جزئياً
    const partialPlans = plans.filter((p) => p.paymentStatus === 'PARTIALLY_PAID');
    const partialTotal = partialPlans.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const partialCollected = partialPlans.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const partialRemaining = Math.max(0, partialTotal - partialCollected);
    const partialCollectedPct = totalRevenue > 0 ? Math.round((partialCollected / totalRevenue) * 100) : 0;

    // غير المسددة / الآجلة
    const unpaidPlans = plans.filter((p) => p.paymentStatus === 'UNPAID');
    const unpaidDebt = unpaidPlans.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const unpaidPct = totalRevenue > 0 ? Math.round((unpaidDebt / totalRevenue) * 100) : 0;

    const collectionEfficiency = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalCollected,
      totalOutstanding,
      collectionEfficiency,
      paid: {
        count: paidPlans.length,
        total: paidAmount,
        pct: paidPct
      },
      partial: {
        count: partialPlans.length,
        total: partialTotal,
        collected: partialCollected,
        remaining: partialRemaining,
        pct: partialCollectedPct
      },
      unpaid: {
        count: unpaidPlans.length,
        debt: unpaidDebt,
        pct: unpaidPct
      }
    };
  }, [plans]);

  // 2. حسابات الجلسات وأيام الذروة (Peak Days Analysis)
  const peakDaysData = useMemo(() => {
    // ترتيب الأيام: السبت (6)، الأحد (0)، الإثنين (1)، الثلاثاء (2)، الأربعاء (3)، الخميس (4)، الجمعة (5)
    const weekOrder = [6, 0, 1, 2, 3, 4, 5];
    const dayStats: Record<
      number,
      { total: number; completed: number; scheduled: number; noShow: number }
    > = {
      0: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      1: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      2: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      3: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      4: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      5: { total: 0, completed: 0, scheduled: 0, noShow: 0 },
      6: { total: 0, completed: 0, scheduled: 0, noShow: 0 }
    };

    sessions.forEach((s) => {
      if (s.status !== 'CANCELLED') {
        const d = new Date(s.sessionDate + 'T00:00:00');
        const dayIdx = d.getDay();
        if (dayStats[dayIdx]) {
          dayStats[dayIdx].total++;
          if (s.status === 'COMPLETED') dayStats[dayIdx].completed++;
          if (s.status === 'SCHEDULED' || s.status === 'RESCHEDULED') dayStats[dayIdx].scheduled++;
          if (s.status === 'NO_SHOW') dayStats[dayIdx].noShow++;
        }
      }
    });

    // أعلى يوم تسجيلاً للجلسات (استثناء الجمعة لأنها عطلة)
    let peakDayIdx = 6;
    let maxSessions = 0;
    Object.entries(dayStats).forEach(([day, stat]) => {
      const idx = Number(day);
      if (idx !== 5 && stat.total > maxSessions) {
        maxSessions = stat.total;
        peakDayIdx = idx;
      }
    });

    const maxChartValue = Math.max(...Object.values(dayStats).map((d) => d.total), 1);

    const items = weekOrder.map((dayIdx) => {
      const isFriday = dayIdx === 5;
      const data = dayStats[dayIdx];
      const isPeak = dayIdx === peakDayIdx && data.total > 0;
      const percentOfMax = Math.round((data.total / maxChartValue) * 100);

      let demandBadge = 'طلب معتدل';
      let badgeClass = 'bg-teal-50 text-teal-700 border-teal-200';

      if (isFriday) {
        demandBadge = 'عطلة أسبوعية';
        badgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
      } else if (isPeak || percentOfMax >= 80) {
        demandBadge = 'ذروة مرتفعة 🔥';
        badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
      } else if (data.total === 0) {
        demandBadge = 'شاغر بالكامل';
        badgeClass = 'bg-slate-50 text-slate-500 border-slate-200';
      }

      return {
        dayIdx,
        dayName: ARABIC_DAYS[dayIdx],
        total: data.total,
        completed: data.completed,
        scheduled: data.scheduled,
        noShow: data.noShow,
        isFriday,
        isPeak,
        percentOfMax,
        demandBadge,
        badgeClass
      };
    });

    return {
      items,
      peakDayName: ARABIC_DAYS[peakDayIdx],
      peakDaySessionsCount: maxSessions
    };
  }, [sessions]);

  // مؤشرات الأداء التشغيلي
  const operationalStats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
    const scheduled = sessions.filter((s) => s.status === 'SCHEDULED').length;
    const rescheduled = sessions.filter((s) => s.status === 'RESCHEDULED').length;
    const noShow = sessions.filter((s) => s.status === 'NO_SHOW').length;

    const evaluated = completed + noShow;
    const attendanceRate = evaluated > 0 ? Math.round((completed / evaluated) * 100) : 100;
    const noShowRate = evaluated > 0 ? Math.round((noShow / evaluated) * 100) : 0;

    return {
      total,
      completed,
      scheduled,
      rescheduled,
      noShow,
      attendanceRate,
      noShowRate
    };
  }, [sessions]);

  // التشخيصات الأكثر مراجعة
  const topDiagnoses = useMemo(() => {
    const map = new Map<string, number>();
    patients.forEach((p) => {
      const diag = p.initialDiagnosis.trim();
      if (diag) map.set(diag, (map.get(diag) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [patients]);

  return (
    <div className="space-y-6">
      
      {/* رأس الصفحة والمقدمة */}
      <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
            <BarChart2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              لوحة الإحصائيات ومؤشرات الأداء (Clinic Analytics & KPIs)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              متابعة دقيقة للإيرادات المحصلة، إشغال أيام الأسبوع، ونسب الالتزام بالحضور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>تحديث حي وتفاعلي للبيانات</span>
        </div>
      </div>

      {/* 1. المؤشرات المالية الرئيسية (Financial KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>إجمالي المبيعات</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">
            {paymentStats.totalRevenue.toLocaleString()}{' '}
            <span className="text-xs font-bold text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-teal-700 font-medium">
            إجمالي قيمة {plans.length} خطط علاجية
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>الإيرادات المحصلة فعلياً</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {paymentStats.totalCollected.toLocaleString()}{' '}
            <span className="text-xs font-bold text-emerald-600">ر.س</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>كفاءة التحصيل:</span>
            <strong className="text-emerald-700">{paymentStats.collectionEfficiency}%</strong>
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>المستحقات غير المحصلة</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {paymentStats.totalOutstanding.toLocaleString()}{' '}
            <span className="text-xs font-bold text-rose-600">ر.س</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium">
            مبالغ مؤجلة ومتبقية بذمة المرضى
          </div>
        </div>

        <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>نسبة الالتزام بالحضور</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-teal-700">
            {operationalStats.attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            معدل الغياب: {operationalStats.noShowRate}%
          </div>
        </div>

      </div>

      {/* 2. قسمان رئيسيان: أيام الذروة + توزيع حالات الدفع */}
      <div className="analytics-section-grid">
        
        {/* =========================================================================
            القسم الأول: توزيع إشغال الجلسات على أيام الأسبوع (أيام الذروة)
           ========================================================================= */}
        <div className="glass-panel p-6 bg-white border border-slate-200 rounded-2xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  توزيع إشغال الجلسات على أيام الأسبوع (أيام الذروة)
                </h3>
                <p className="text-[11px] text-slate-500">
                  تحليل حجم الحجوزات والضغط التشغيلي لكل يوم لتوزيع الأخصائيين
                </p>
              </div>
            </div>

            {/* أزرار نمط العرض (أعمدة بيانية / بطاقات أفقية) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setChartViewMode('vertical')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  chartViewMode === 'vertical'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                أعمدة بيانية
              </button>
              <button
                onClick={() => setChartViewMode('list')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  chartViewMode === 'list'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                قائمة مفصلة
              </button>
            </div>
          </div>

          {/* بطاقة ملخص يوم الذروة الأعلى */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔥</span>
              <div>
                <div className="text-xs font-bold text-amber-900">
                  يوم الذروة الأعلى في المركز: {peakDaysData.peakDayName}
                </div>
                <div className="text-[11px] text-amber-700">
                  تم تسجيل <strong>{peakDaysData.peakDaySessionsCount} جلسات</strong> في هذا اليوم
                  (السعة الافتراضية: {defaultCapacity} جلسات/يوم).
                </div>
              </div>
            </div>
            <span className="badge bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold">
              أعلى طلب
            </span>
          </div>

          {/* العرض الرأسي بالأعمدة البيانية (Vertical Columns Chart) */}
          {chartViewMode === 'vertical' ? (
            <div className="peak-chart-stage">
              <div className="peak-chart-columns">
                {peakDaysData.items.map((item) => (
                  <div key={item.dayIdx} className="peak-column-item">
                    
                    {/* عدد الجلسات والشارة فوق العمود */}
                    <div className="text-center mb-1.5">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        {item.total}
                      </span>
                      {item.isPeak && (
                        <span className="text-[9px] text-amber-800 font-bold block bg-amber-100 px-1 rounded">
                          ذروة
                        </span>
                      )}
                    </div>

                    {/* العمود البياني */}
                    <div className="peak-column-track">
                      <div
                        className="peak-column-fill"
                        style={{
                          height: `${Math.max(item.percentOfMax, item.total > 0 ? 15 : 6)}%`,
                          backgroundColor: item.isFriday
                            ? '#cbd5e1'
                            : item.isPeak
                            ? '#d97706'
                            : item.total >= 6
                            ? '#0d9488'
                            : '#14b8a6'
                        }}
                      />
                    </div>

                    {/* اسم اليوم أسفل العمود */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs block font-bold ${
                          item.isPeak
                            ? 'text-amber-900 font-extrabold'
                            : item.isFriday
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.dayName}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {item.isFriday ? 'عطلة' : `${item.total} جلسة`}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* العرض الأفقي المفصل */
            <div className="space-y-2.5 pt-1">
              {peakDaysData.items.map((item) => (
                <div
                  key={item.dayIdx}
                  className={`p-3 rounded-xl border transition-all ${
                    item.isPeak
                      ? 'bg-amber-50/50 border-amber-300'
                      : item.isFriday
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800">{item.dayName}</span>
                      <span className={`badge text-[10px] py-0.5 px-2 ${item.badgeClass}`}>
                        {item.demandBadge}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-700 font-bold">{item.completed} مكتملة</span>
                      <span className="text-blue-700 font-bold">{item.scheduled} مجدولة</span>
                      <span className="text-slate-800 font-extrabold text-xs">
                        {item.total} جلسة إجمالاً
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-bg h-2">
                    <div
                      className="progress-bar-fill h-full"
                      style={{
                        width: `${item.percentOfMax}%`,
                        backgroundColor: item.isFriday
                          ? '#94a3b8'
                          : item.isPeak
                          ? '#d97706'
                          : '#0d9488'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* دليل دلالات ألوان الأعمدة */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                <span>أيام الذروة والطلب العالي</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                <span>إشغال تشغيلي طبيعي</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                <span>عطلة المركز</span>
              </span>
            </div>
            <span>السعة القصوى لليوم: {defaultCapacity}</span>
          </div>

        </div>

        {/* =========================================================================
            القسم الثاني: توزيع الخطط العلاجية حسب حالة الدفع (Financial Status)
           ========================================================================= */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 bg-white border border-slate-200 rounded-2xl space-y-5">
            
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      توزيع الخطط العلاجية حسب حالة الدفع
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      تحليل المحفظة المالية ونسب المبالغ المسددة والمؤجلة
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {paymentStats.totalRevenue.toLocaleString()} ر.س
                </span>
              </div>

              {/* شريط بياني متقدم مكدّس (Stacked Distribution Bar) */}
              <div className="mt-4">
                <div className="text-[11px] text-slate-500 font-semibold mb-1.5 flex items-center justify-between">
                  <span>توزيع المبالغ المالية:</span>
                  <span className="text-emerald-700 font-bold">نسبة السداد: {paymentStats.collectionEfficiency}%</span>
                </div>
                <div className="payment-stacked-track">
                  {paymentStats.paid.pct > 0 && (
                    <div
                      className="h-full"
                      style={{ width: `${paymentStats.paid.pct}%`, backgroundColor: '#10b981' }}
                      title={`مسدد بالكامل: ${paymentStats.paid.total} ر.س (${paymentStats.paid.pct}%)`}
                    />
                  )}
                  {paymentStats.partial.pct > 0 && (
                    <div
                      className="h-full"
                      style={{ width: `${paymentStats.partial.pct}%`, backgroundColor: '#f59e0b' }}
                      title={`مسدد جزئياً: ${paymentStats.partial.collected} ر.س (${paymentStats.partial.pct}%)`}
                    />
                  )}
                  {paymentStats.unpaid.pct > 0 && (
                    <div
                      className="h-full"
                      style={{ width: `${paymentStats.unpaid.pct}%`, backgroundColor: '#f43f5e' }}
                      title={`سداد آجل: ${paymentStats.unpaid.debt} ر.س (${paymentStats.unpaid.pct}%)`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* البطاقات التفصيلية الثلاث لكل حالة دفع */}
            <div className="space-y-3">
              
              {/* 1. مسددة بالكامل */}
              <div className="payment-card-block bg-emerald-50/70 border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-xs font-bold text-emerald-900">خطط مسددة بالكامل</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {paymentStats.paid.count} خطط
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {paymentStats.paid.total.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>تم تحصيلها بالكامل وإغلاق الحساب</span>
                  <span className="font-bold">{paymentStats.paid.pct}% من إجمالي المبيعات</span>
                </div>
              </div>

              {/* 2. مسددة جزئياً (عربون) */}
              <div className="payment-card-block bg-amber-50/70 border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="text-xs font-bold text-amber-900">خطط مسددة جزئياً (عربون)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {paymentStats.partial.count} خطط
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-900">
                    {paymentStats.partial.total.toLocaleString()} ر.س
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-amber-200/60 mt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">المحصل فعلياً:</span>
                    <strong className="text-emerald-700">
                      {paymentStats.partial.collected.toLocaleString()} ر.س
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">المتبقي كدين:</span>
                    <strong className="text-rose-600">
                      {paymentStats.partial.remaining.toLocaleString()} ر.س
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. سداد آجل / غير مسددة */}
              <div className="payment-card-block bg-rose-50/70 border-rose-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="text-xs font-bold text-rose-900">خطط مؤجلة / غير مسددة</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                      {paymentStats.unpaid.count} خطط
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-700">
                    {paymentStats.unpaid.debt.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-rose-700">
                  <span>مستحقات بانتظار سداد المرضى</span>
                  <span className="font-bold">{paymentStats.unpaid.pct}% من إجمالي المبيعات</span>
                </div>
              </div>

            </div>

          </div>

          {/* التشخيصات الأكثر شيوعاً */}
          <div className="glass-panel p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-800">
              <Users className="w-4 h-4 text-teal-600" />
              <span>أكثر الحالات الطبية مراجعة للمركز</span>
            </div>

            <div className="space-y-2">
              {topDiagnoses.map((diag, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/70"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={diag.name}>
                    {diag.name}
                  </span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {diag.count} مرضى
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
