import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/session.dart';
import '../core/scheduling_engine.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';

class SessionRescheduleDialog extends StatefulWidget {
  final Session session;

  const SessionRescheduleDialog({super.key, required this.session});

  @override
  State<SessionRescheduleDialog> createState() => _SessionRescheduleDialogState();
}

class _SessionRescheduleDialogState extends State<SessionRescheduleDialog> {
  late DateTime _newDate;
  final TextEditingController _reasonController = TextEditingController();
  bool _allowOverride = false;

  @override
  void initState() {
    super.initState();
    _newDate = parseDate(widget.session.sessionDate).add(const Duration(days: 2));
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();
    final newDateStr = formatDate(_newDate);
    final cap = calculateDayCapacity(newDateStr, clinic.sessions, clinic.capacitySettings, clinic.defaultCapacity);

    final bool isBlocked = (!cap.isWorkingDay || cap.bookedCount >= cap.maxCapacity) && !_allowOverride;

    return AlertDialog(
      title: Row(
        children: const [
          Icon(Icons.event_repeat, color: AppTheme.warningOrange),
          SizedBox(width: 10),
          Text('تأجيل موعد الجلسة'),
        ],
      ),
      content: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 20, color: AppTheme.textMuted),
                  const SizedBox(width: 8),
                  Text('الجلسة رقم ${widget.session.sessionNumber} - الموعد الحالي: ${widget.session.sessionDate}'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _newDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2035),
                );
                if (picked != null) {
                  setState(() => _newDate = picked);
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'الموعد البديل الجديد *',
                  prefixIcon: Icon(Icons.calendar_month),
                ),
                child: Text('${DateFormat('yyyy/MM/dd').format(_newDate)} (${cap.dayNameAr})'),
              ),
            ),
            const SizedBox(height: 12),
            // Capacity alert box
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: !cap.isWorkingDay
                    ? AppTheme.dangerRed.withOpacity(0.1)
                    : (cap.bookedCount >= cap.maxCapacity
                        ? AppTheme.warningOrange.withOpacity(0.15)
                        : AppTheme.successGreen.withOpacity(0.1)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    !cap.isWorkingDay ? Icons.block : (cap.bookedCount >= cap.maxCapacity ? Icons.warning : Icons.check_circle),
                    size: 18,
                    color: !cap.isWorkingDay
                        ? AppTheme.dangerRed
                        : (cap.bookedCount >= cap.maxCapacity ? AppTheme.warningOrange : AppTheme.successGreen),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      !cap.isWorkingDay
                          ? 'هذا اليوم عطلة غير متاح للحجز (${cap.notes ?? "عطلة مركز"})'
                          : 'إشغال اليوم: ${cap.bookedCount} من أصل ${cap.maxCapacity} مريض (${cap.status.toArabic()})',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: !cap.isWorkingDay
                            ? AppTheme.dangerRed
                            : (cap.bookedCount >= cap.maxCapacity ? AppTheme.warningOrange : AppTheme.successGreen),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _reasonController,
              decoration: const InputDecoration(
                labelText: 'سبب التأجيل (اختياري)',
                prefixIcon: Icon(Icons.comment),
              ),
            ),
            const SizedBox(height: 8),
            CheckboxListTile(
              value: _allowOverride,
              onChanged: (val) => setState(() => _allowOverride = val ?? false),
              title: const Text('تجاوز السعة أو العطلة استثنائياً', style: TextStyle(fontSize: 13)),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(
          onPressed: isBlocked
              ? null
              : () {
                  try {
                    clinic.rescheduleSession(
                      sessionId: widget.session.id,
                      newDate: newDateStr,
                      reason: _reasonController.text.trim().isEmpty ? null : _reasonController.text.trim(),
                      allowOverride: _allowOverride,
                    );
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تم تأجيل موعد الجلسة بنجاح!'),
                        backgroundColor: AppTheme.successGreen,
                      ),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('خطأ: $e'), backgroundColor: AppTheme.dangerRed),
                    );
                  }
                },
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.warningOrange),
          child: const Text('تأكيد التأجيل'),
        ),
      ],
    );
  }
}
