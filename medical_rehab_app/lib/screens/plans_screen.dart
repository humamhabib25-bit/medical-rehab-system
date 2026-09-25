import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/treatment_plan.dart';
import '../models/patient.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/plan_creation_dialog.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  String _selectedStatusFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();

    final plans = clinic.plans.where((p) {
      if (_selectedStatusFilter == 'ALL') return true;
      return p.status.toKey() == _selectedStatusFilter;
    }).toList();

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Action Bar
            Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('ALL', 'جميع الخطط (${clinic.plans.length})'),
                        const SizedBox(width: 8),
                        _buildFilterChip('ACTIVE', 'الخطط النشطة'),
                        const SizedBox(width: 8),
                        _buildFilterChip('COMPLETED', 'المكتملة'),
                        const SizedBox(width: 8),
                        _buildFilterChip('CANCELLED', 'الملغاة'),
                      ],
                    ),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => const PlanCreationDialog(),
                    );
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('خطة علاجية جديدة'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            Expanded(
              child: plans.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_outlined, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          const Text('لا توجد خطط علاجية مطابقة للفلتر', style: TextStyle(color: AppTheme.textMuted)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: plans.length,
                      itemBuilder: (ctx, i) {
                        final plan = plans[i];
                        final patient = clinic.patients.firstWhere(
                          (p) => p.id == plan.patientId,
                          orElse: () => Patient(
                            id: 'unknown',
                            fullName: 'مريض غير معروف',
                            phone: '',
                            initialDiagnosis: '',
                            createdAt: DateTime.now(),
                          ),
                        );
                        final planSessions = clinic.sessions.where((s) => s.planId == plan.id).toList();

                        return Card(
                          margin: const EdgeInsets.only(bottom: 14),
                          child: Padding(
                            padding: const EdgeInsets.all(18.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor: AppTheme.primaryLightTeal,
                                      child: const Icon(Icons.fitness_center, color: AppTheme.primaryDarkTeal, size: 20),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            patient.fullName,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'بدء الخطة: ${plan.startDate} | النمط: ${plan.preferredPattern.toArabic()}',
                                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                          ),
                                        ],
                                      ),
                                    ),
                                    _buildStatusBadge(plan.status),
                                    const SizedBox(width: 10),
                                    _buildPaymentBadge(plan.paymentStatus),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                // Progress bar
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'تقدم الجلسات: ${plan.completedSessions} من أصل ${plan.totalSessions} جلسة مكتملة',
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                        ),
                                        Text(
                                          '${(plan.progressPercentage * 100).toInt()}%',
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryTeal),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: LinearProgressIndicator(
                                        value: plan.progressPercentage,
                                        minHeight: 8,
                                        backgroundColor: Colors.grey.shade200,
                                        color: AppTheme.primaryTeal,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'الإجمالي: ${plan.totalPrice.toStringAsFixed(0)} ر.س | المدفوع: ${plan.paidAmount.toStringAsFixed(0)} ر.س | المتبقي: ${plan.remainingAmount.toStringAsFixed(0)} ر.س',
                                      style: const TextStyle(color: AppTheme.textDark, fontWeight: FontWeight.w500, fontSize: 12),
                                    ),
                                    Row(
                                      children: [
                                        TextButton.icon(
                                          onPressed: () {
                                            _showPlanSessionsSheet(context, plan, planSessions, patient);
                                          },
                                          icon: const Icon(Icons.list, size: 16),
                                          label: const Text('عرض الجلسات', style: TextStyle(fontSize: 12)),
                                        ),
                                        if (plan.status == PlanStatus.active)
                                          TextButton.icon(
                                            style: TextButton.styleFrom(foregroundColor: AppTheme.dangerRed),
                                            onPressed: () {
                                              clinic.cancelTreatmentPlan(plan.id);
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(content: Text('تم إلغاء الخطة العلاجية')),
                                              );
                                            },
                                            icon: const Icon(Icons.cancel, size: 16),
                                            label: const Text('إلغاء الخطة', style: TextStyle(fontSize: 12)),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String title) {
    final isSelected = _selectedStatusFilter == key;
    return ChoiceChip(
      label: Text(title),
      selected: isSelected,
      onSelected: (val) {
        if (val) setState(() => _selectedStatusFilter = key);
      },
    );
  }

  Widget _buildStatusBadge(PlanStatus status) {
    Color color;
    switch (status) {
      case PlanStatus.active:
        color = AppTheme.successGreen;
        break;
      case PlanStatus.completed:
        color = AppTheme.primaryTeal;
        break;
      case PlanStatus.suspended:
        color = AppTheme.warningOrange;
        break;
      case PlanStatus.cancelled:
        color = AppTheme.dangerRed;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status.toArabic(),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildPaymentBadge(PaymentStatus status) {
    Color color;
    switch (status) {
      case PaymentStatus.paid:
        color = AppTheme.successGreen;
        break;
      case PaymentStatus.partiallyPaid:
        color = AppTheme.warningOrange;
        break;
      case PaymentStatus.unpaid:
        color = AppTheme.dangerRed;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toArabic(),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }

  void _showPlanSessionsSheet(BuildContext context, TreatmentPlan plan, List<dynamic> planSessions, Patient patient) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (ctx, scroll) => Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('جلسات خطة: ${patient.fullName}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                ],
              ),
              const Divider(),
              Expanded(
                child: ListView.builder(
                  controller: scroll,
                  itemCount: planSessions.length,
                  itemBuilder: (ctx, idx) {
                    final s = planSessions[idx];
                    return ListTile(
                      leading: CircleAvatar(child: Text('${s.sessionNumber}')),
                      title: Text('التاريخ: ${s.sessionDate}'),
                      subtitle: Text('الحالة: ${s.status.toArabic()} ${s.therapistName != null ? "- ${s.therapistName}" : ""}'),
                      trailing: Text(s.status.toArabic()),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
