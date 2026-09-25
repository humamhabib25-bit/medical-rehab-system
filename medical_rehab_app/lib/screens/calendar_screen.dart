import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/session.dart';
import '../models/patient.dart';
import '../models/treatment_plan.dart';
import '../core/scheduling_engine.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/session_reschedule_dialog.dart';
import '../widgets/session_shift_dialog.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();
    final selectedDateStr = formatDate(_selectedDate);

    final cap = calculateDayCapacity(
      selectedDateStr,
      clinic.sessions,
      clinic.capacitySettings,
      clinic.defaultCapacity,
    );

    final daySessions = clinic.sessions.where((s) => s.sessionDate == selectedDateStr).toList();

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Date Navigator
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_right),
                          tooltip: 'اليوم السابق',
                          onPressed: () {
                            setState(() {
                              _selectedDate = _selectedDate.subtract(const Duration(days: 1));
                            });
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_left),
                          tooltip: 'اليوم التالي',
                          onPressed: () {
                            setState(() {
                              _selectedDate = _selectedDate.add(const Duration(days: 1));
                            });
                          },
                        ),
                        const SizedBox(width: 4),
                        InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime(2025),
                              lastDate: DateTime(2030),
                            );
                            if (picked != null) {
                              setState(() => _selectedDate = picked);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryLightTeal.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.primaryTeal.withValues(alpha: 0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.calendar_today, size: 16, color: AppTheme.primaryTeal),
                                const SizedBox(width: 6),
                                Text(
                                  '${cap.dayNameAr} - ${DateFormat('yyyy/MM/dd').format(_selectedDate)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDarkTeal, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: () {
                        setState(() => _selectedDate = DateTime.now());
                      },
                      child: const Text('اليوم الحالي', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Capacity indicator bar
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'الطاقة الاستيعابية: ${cap.bookedCount} / ${cap.maxCapacity} (${cap.status.toArabic()})',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${cap.percentage}%',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: cap.percentage >= 100
                                    ? AppTheme.dangerRed
                                    : (cap.percentage >= 80 ? AppTheme.warningOrange : AppTheme.successGreen),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: cap.maxCapacity > 0 ? (cap.bookedCount / cap.maxCapacity).clamp(0.0, 1.0) : 0,
                            minHeight: 10,
                            backgroundColor: Colors.grey.shade200,
                            color: cap.percentage >= 100
                                ? AppTheme.dangerRed
                                : (cap.percentage >= 80 ? AppTheme.warningOrange : AppTheme.primaryTeal),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (cap.notes != null) ...[
                    const SizedBox(width: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.warningOrange.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info, size: 14, color: AppTheme.warningOrange),
                          const SizedBox(width: 6),
                          Text(cap.notes!, style: const TextStyle(color: AppTheme.warningOrange, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Sessions List
            Text(
              'جلسات اليوم (${daySessions.length})',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 10),

            Expanded(
              child: daySessions.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.event_available, size: 56, color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          const Text(
                            'لا توجد جلسات مجدولة في هذا اليوم',
                            style: TextStyle(color: AppTheme.textMuted, fontSize: 15),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: daySessions.length,
                      itemBuilder: (ctx, i) {
                        final session = daySessions[i];
                        final patient = clinic.patients.firstWhere(
                          (p) => p.id == session.patientId,
                          orElse: () => Patient(
                            id: 'unknown',
                            fullName: 'مريض غير معروف',
                            phone: '',
                            initialDiagnosis: '',
                            createdAt: DateTime.now(),
                          ),
                        );
                        final plan = clinic.plans.firstWhere(
                          (pl) => pl.id == session.planId,
                          orElse: () => TreatmentPlan(
                            id: 'unknown',
                            patientId: session.patientId,
                            totalSessions: 1,
                            completedSessions: 0,
                            status: PlanStatus.active,
                            startDate: session.sessionDate,
                            preferredPattern: SchedulePattern.custom,
                            preferredDays: [],
                            totalPrice: 0,
                            paidAmount: 0,
                            paymentStatus: PaymentStatus.unpaid,
                            createdAt: DateTime.now(),
                          ),
                        );

                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: AppTheme.primaryLightTeal,
                                  child: Text(
                                    '#${session.sessionNumber}',
                                    style: const TextStyle(
                                      color: AppTheme.primaryDarkTeal,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        patient.fullName,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'الهاتف: ${patient.phone} | الأخصائي: ${session.therapistName ?? "غير محدد"}',
                                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                      ),
                                      if (session.notes != null && session.notes!.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          session.notes!,
                                          style: const TextStyle(color: AppTheme.primaryTeal, fontSize: 11),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                // Session Status Dropdown
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppTheme.borderLight),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: DropdownButton<SessionStatus>(
                                    value: session.status,
                                    underline: const SizedBox(),
                                    items: SessionStatus.values.map((st) {
                                      return DropdownMenuItem(
                                        value: st,
                                        child: Text(st.toArabic(), style: const TextStyle(fontSize: 13)),
                                      );
                                    }).toList(),
                                    onChanged: (newSt) {
                                      if (newSt != null) {
                                        clinic.updateSessionStatus(session.id, newSt);
                                      }
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Reschedule Button
                                IconButton(
                                  icon: const Icon(Icons.event_repeat, color: AppTheme.warningOrange),
                                  tooltip: 'تأجيل موعد الجلسة',
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => SessionRescheduleDialog(session: session),
                                    );
                                  },
                                ),
                                // Shift Subsequent Sessions
                                IconButton(
                                  icon: const Icon(Icons.fast_forward, color: AppTheme.infoBlue),
                                  tooltip: 'ترحيل الجلسات المتبقية فصاعداً',
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => SessionShiftDialog(plan: plan, fromSession: session),
                                    );
                                  },
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
}
