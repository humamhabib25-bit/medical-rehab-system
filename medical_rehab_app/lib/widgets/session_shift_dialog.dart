import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/treatment_plan.dart';
import '../models/session.dart';
import '../models/schedule_models.dart';
import '../core/scheduling_engine.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';

class SessionShiftDialog extends StatefulWidget {
  final TreatmentPlan plan;
  final Session fromSession;

  const SessionShiftDialog({
    super.key,
    required this.plan,
    required this.fromSession,
  });

  @override
  State<SessionShiftDialog> createState() => _SessionShiftDialogState();
}

class _SessionShiftDialogState extends State<SessionShiftDialog> {
  late DateTime _newStartDate;
  bool _allowOverride = false;
  ShiftResult? _previewResult;
  String? _previewError;

  @override
  void initState() {
    super.initState();
    _newStartDate = parseDate(widget.fromSession.sessionDate).add(const Duration(days: 2));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _calculateShiftPreview();
    });
  }

  void _calculateShiftPreview() {
    final clinic = context.read<ClinicProvider>();
    final planSessions = clinic.sessions.where((s) => s.planId == widget.plan.id).toList();

    try {
      final res = shiftSubsequentSessions(
        fromSessionNumber: widget.fromSession.sessionNumber,
        newStartDateStr: formatDate(_newStartDate),
        preferredDays: widget.plan.preferredDays,
        allPlanSessions: planSessions,
        allCenterSessions: clinic.sessions,
        capacitySettings: clinic.capacitySettings,
        allowOverride: _allowOverride,
        defaultCapacity: clinic.defaultCapacity,
      );
      setState(() {
        _previewResult = res;
        _previewError = null;
      });
    } catch (e) {
      setState(() {
        _previewResult = null;
        _previewError = e.toString().replaceFirst('Exception: ', '').replaceFirst('StateError: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final clinic = context.read<ClinicProvider>();

    return AlertDialog(
      title: Row(
        children: const [
          Icon(Icons.fast_forward, color: AppTheme.infoBlue),
          SizedBox(width: 10),
          Text('ترحيل الجلسات المتبقية (Cascade Shift)'),
        ],
      ),
      content: SizedBox(
        width: 520,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'سيتم إعادة جدولة الجلسة رقم ${widget.fromSession.sessionNumber} وجميع الجلسات التالية لها تلقائياً بحسب النمط المفضل وأيام الفراغ المتاحة.',
              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _newStartDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2035),
                );
                if (picked != null) {
                  setState(() => _newStartDate = picked);
                  _calculateShiftPreview();
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'تاريخ بداية الترحيل الجديد *',
                  prefixIcon: Icon(Icons.date_range),
                ),
                child: Text(DateFormat('yyyy/MM/dd').format(_newStartDate)),
              ),
            ),
            const SizedBox(height: 12),
            CheckboxListTile(
              value: _allowOverride,
              onChanged: (val) {
                setState(() => _allowOverride = val ?? false);
                _calculateShiftPreview();
              },
              title: const Text('السماح بتجاوز السعة القصوى للأيام المزدحمة', style: TextStyle(fontSize: 13)),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: 12),
            const Text('معاينة التغييرات على التواريخ:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            if (_previewError != null)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.dangerRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_previewError!, style: const TextStyle(color: AppTheme.dangerRed, fontSize: 12)),
              )
            else if (_previewResult != null)
              Container(
                height: 160,
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.borderLight),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _previewResult!.updatedSessions.length,
                  itemBuilder: (ctx, i) {
                    final item = _previewResult!.updatedSessions[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('الجلسة: ${item.oldDate}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          const Icon(Icons.arrow_back, size: 14, color: AppTheme.primaryTeal),
                          Text(item.newDate, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryTeal, fontSize: 12)),
                        ],
                      ),
                    );
                  },
                ),
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
          onPressed: _previewResult == null
              ? null
              : () {
                  clinic.cascadeShiftSessions(
                    planId: widget.plan.id,
                    fromSessionNumber: widget.fromSession.sessionNumber,
                    newStartDate: formatDate(_newStartDate),
                    allowOverride: _allowOverride,
                  );
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم ترحيل الجلسات المتبقية بنجاح!'),
                      backgroundColor: AppTheme.successGreen,
                    ),
                  );
                },
          child: const Text('تطبيق الترحيل الذكي'),
        ),
      ],
    );
  }
}
