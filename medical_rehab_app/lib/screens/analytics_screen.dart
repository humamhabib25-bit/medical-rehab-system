import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/treatment_plan.dart';
import '../models/session.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();

    final totalPatients = clinic.patients.length;
    final totalPlans = clinic.plans.length;
    final activePlans = clinic.plans.where((p) => p.status == PlanStatus.active).length;
    final totalSessions = clinic.sessions.length;
    final completedSessions = clinic.sessions.where((s) => s.status == SessionStatus.completed).length;
    final scheduledSessions = clinic.sessions.where((s) => s.status == SessionStatus.scheduled).length;
    final rescheduledSessions = clinic.sessions.where((s) => s.status == SessionStatus.rescheduled).length;
    final cancelledSessions = clinic.sessions.where((s) => s.status == SessionStatus.cancelled).length;
    final noShowSessions = clinic.sessions.where((s) => s.status == SessionStatus.noShow).length;

    final totalExpectedRevenue = clinic.plans.fold(0.0, (acc, p) => acc + p.totalPrice);
    final totalCollectedRevenue = clinic.plans.fold(0.0, (acc, p) => acc + p.paidAmount);
    final totalPendingRevenue = (totalExpectedRevenue - totalCollectedRevenue).clamp(0.0, double.infinity);

    final completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).round() : 0;

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'لوحة التحليلات والإحصائيات الطبية',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Metrics KPI Grid
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _buildMetricCard(
                  title: 'إجمالي المرضى المسجلين',
                  value: '$totalPatients',
                  subtitle: 'مريض في قاعدة البيانات',
                  icon: Icons.people,
                  color: AppTheme.primaryTeal,
                ),
                _buildMetricCard(
                  title: 'الخطط العلاجية النشطة',
                  value: '$activePlans',
                  subtitle: 'من أصل $totalPlans خطة إجمالية',
                  icon: Icons.playlist_add_check,
                  color: AppTheme.accentCyan,
                ),
                _buildMetricCard(
                  title: 'نسبة إنجاز الجلسات',
                  value: '$completionRate%',
                  subtitle: '$completedSessions مكتملة من $totalSessions جلسة',
                  icon: Icons.check_circle,
                  color: AppTheme.successGreen,
                ),
                _buildMetricCard(
                  title: 'الإيرادات المحصلة',
                  value: '${totalCollectedRevenue.toStringAsFixed(0)} ر.س',
                  subtitle: 'المتبقي: ${totalPendingRevenue.toStringAsFixed(0)} ر.س',
                  icon: Icons.account_balance_wallet,
                  color: AppTheme.warningOrange,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Breakdown Cards
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Sessions Breakdown
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('توزيع حالات الجلسات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 16),
                          _buildDistributionRow('مكتملة بنجاح', completedSessions, totalSessions, AppTheme.successGreen),
                          const SizedBox(height: 10),
                          _buildDistributionRow('مجدولة قادمة', scheduledSessions, totalSessions, AppTheme.infoBlue),
                          const SizedBox(height: 10),
                          _buildDistributionRow('مؤجلة (Rescheduled)', rescheduledSessions, totalSessions, AppTheme.warningOrange),
                          const SizedBox(height: 10),
                          _buildDistributionRow('لم يحضر (No Show)', noShowSessions, totalSessions, Colors.purple),
                          const SizedBox(height: 10),
                          _buildDistributionRow('ملغاة', cancelledSessions, totalSessions, AppTheme.dangerRed),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Financial Breakdown
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('المؤشرات المالية والدفعات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 16),
                          _buildFinancialStatRow('إجمالي المبالغ المستحقة:', '${totalExpectedRevenue.toStringAsFixed(0)} ر.س'),
                          const Divider(height: 20),
                          _buildFinancialStatRow('المبالغ المحصلة فعلياً:', '${totalCollectedRevenue.toStringAsFixed(0)} ر.س', color: AppTheme.successGreen),
                          const Divider(height: 20),
                          _buildFinancialStatRow('المبالغ المعلقة المتبقية:', '${totalPendingRevenue.toStringAsFixed(0)} ر.س', color: AppTheme.warningOrange),
                          const Divider(height: 20),
                          _buildFinancialStatRow(
                            'متوسط سعر الجلسة العلاجية:',
                            totalSessions > 0 ? '${(totalExpectedRevenue / totalSessions).toStringAsFixed(0)} ر.س' : '0 ر.س',
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return SizedBox(
      width: 260,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, size: 20, color: color),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDistributionRow(String title, int count, int total, Color color) {
    final double pct = total > 0 ? count / total : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 13)),
            Text('$count (${(pct * 100).toInt()}%)', style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: Colors.grey.shade200,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialStatRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14)),
        Text(
          value,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color ?? AppTheme.textDark),
        ),
      ],
    );
  }
}
