import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/treatment_plan.dart';
import '../models/schedule_models.dart';
import '../core/scheduling_engine.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';

class PlanCreationDialog extends StatefulWidget {
  final String? preselectedPatientId;

  const PlanCreationDialog({super.key, this.preselectedPatientId});

  @override
  State<PlanCreationDialog> createState() => _PlanCreationDialogState();
}

class _PlanCreationDialogState extends State<PlanCreationDialog> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedPatientId;
  int _totalSessions = 10;
  DateTime _startDate = DateTime.now();
  SchedulePattern _pattern = SchedulePattern.satMonWed;
  List<int> _customDays = [6, 1, 3];
  String? _therapistName = 'أخصائي العلاج الطبيعي';
  double _pricePerSession = 150.0;
  double _paidAmount = 0.0;
  String _notes = '';
  bool _allowOverride = false;

  AutoScheduleResult? _previewResult;
  String? _previewError;

  @override
  void initState() {
    super.initState();
    _selectedPatientId = widget.preselectedPatientId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _calculatePreview();
    });
  }

  void _calculatePreview() {
    final clinic = context.read<ClinicProvider>();
    final startDateStr = formatDate(_startDate);
    List<int> days;
    if (_pattern == SchedulePattern.custom) {
      days = _customDays;
    } else {
      days = patternDaysMap[_pattern] ?? [6, 1, 3];
    }

    if (days.isEmpty) {
      setState(() {
        _previewResult = null;
        _previewError = 'يجب اختيار يوم واحد على الأقل في الجدولة';
      });
      return;
    }

    try {
      final res = autoDistributeSessions(
        startDateStr: startDateStr,
        totalSessions: _totalSessions,
        preferredDays: days,
        existingSessions: clinic.sessions,
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
    final clinic = context.watch<ClinicProvider>();
    final patients = clinic.patients;

    if (_selectedPatientId == null && patients.isNotEmpty) {
      _selectedPatientId = patients.first.id;
    }

    final totalPrice = _pricePerSession * _totalSessions;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 850, maxHeight: 750),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLightTeal,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.playlist_add_check, color: AppTheme.primaryTeal),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'إنشاء خطة علاجية وجدولة ذكية',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const Divider(height: 24),
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Form column
                    Expanded(
                      flex: 5,
                      child: SingleChildScrollView(
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              DropdownButtonFormField<String>(
                                value: _selectedPatientId,
                                decoration: const InputDecoration(labelText: 'المريض *', prefixIcon: Icon(Icons.person)),
                                items: patients.map((p) {
                                  return DropdownMenuItem(value: p.id, child: Text(p.fullName));
                                }).toList(),
                                onChanged: (val) {
                                  setState(() => _selectedPatientId = val);
                                },
                              ),
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: _totalSessions.toString(),
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(labelText: 'عدد الجلسات *', prefixIcon: Icon(Icons.fitness_center)),
                                      onChanged: (val) {
                                        final n = int.tryParse(val);
                                        if (n != null && n > 0) {
                                          _totalSessions = n;
                                          _calculatePreview();
                                        }
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: InkWell(
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: _startDate,
                                          firstDate: DateTime(2020),
                                          lastDate: DateTime(2035),
                                        );
                                        if (picked != null) {
                                          setState(() => _startDate = picked);
                                          _calculatePreview();
                                        }
                                      },
                                      child: InputDecorator(
                                        decoration: const InputDecoration(labelText: 'تاريخ البدء', prefixIcon: Icon(Icons.calendar_today)),
                                        child: Text(DateFormat('yyyy/MM/dd').format(_startDate)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              DropdownButtonFormField<SchedulePattern>(
                                value: _pattern,
                                decoration: const InputDecoration(labelText: 'نمط تكرار الجلسات *', prefixIcon: Icon(Icons.repeat)),
                                items: SchedulePattern.values.map((pat) {
                                  return DropdownMenuItem(value: pat, child: Text(pat.toArabic()));
                                }).toList(),
                                onChanged: (pat) {
                                  if (pat != null) {
                                    setState(() => _pattern = pat);
                                    _calculatePreview();
                                  }
                                },
                              ),
                              if (_pattern == SchedulePattern.custom) ...[
                                const SizedBox(height: 10),
                                const Text('الأيام المفضلة:', style: TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 6),
                                Wrap(
                                  spacing: 6,
                                  children: List.generate(7, (i) {
                                    final dayIndex = (i + 6) % 7; // Sat=6, Sun=0, ... Fri=5
                                    final isSelected = _customDays.contains(dayIndex);
                                    return FilterChip(
                                      label: Text(arabicDays[dayIndex]),
                                      selected: isSelected,
                                      onSelected: (sel) {
                                        setState(() {
                                          if (sel) {
                                            _customDays.add(dayIndex);
                                          } else {
                                            _customDays.remove(dayIndex);
                                          }
                                        });
                                        _calculatePreview();
                                      },
                                    );
                                  }),
                                ),
                              ],
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: _pricePerSession.toStringAsFixed(0),
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(labelText: 'سعر الجلسة (ر.س)', prefixIcon: Icon(Icons.attach_money)),
                                      onChanged: (val) {
                                        final p = double.tryParse(val);
                                        if (p != null) setState(() => _pricePerSession = p);
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      initialValue: _paidAmount.toStringAsFixed(0),
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(labelText: 'المدفوع مقدماً (ر.س)', prefixIcon: Icon(Icons.payment)),
                                      onChanged: (val) {
                                        final p = double.tryParse(val);
                                        if (p != null) setState(() => _paidAmount = p);
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('المبلغ الإجمالي المتوقع:'),
                                    Text(
                                      '${totalPrice.toStringAsFixed(0)} ر.س',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDarkTeal, fontSize: 16),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              CheckboxListTile(
                                value: _allowOverride,
                                onChanged: (val) {
                                  setState(() => _allowOverride = val ?? false);
                                  _calculatePreview();
                                },
                                title: const Text('السماح بتجاوز الطاقة الاستيعابية اليومية في حال الازدحام', style: TextStyle(fontSize: 13)),
                                dense: true,
                                controlAffinity: ListTileControlAffinity.leading,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const VerticalDivider(width: 32),
                    // Live Preview column
                    Expanded(
                      flex: 4,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: const [
                                Icon(Icons.auto_awesome, color: AppTheme.primaryTeal, size: 20),
                                SizedBox(width: 8),
                                Text('المعاينة التلقائية للجدول', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              ],
                            ),
                            const SizedBox(height: 10),
                            if (_previewError != null)
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppTheme.dangerRed.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.dangerRed.withOpacity(0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 20),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _previewError!,
                                        style: const TextStyle(color: AppTheme.dangerRed, fontSize: 13),
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else if (_previewResult != null) ...[
                              Text(
                                'تاريخ الانتهاء المتوقع: ${_previewResult!.endDate}',
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                              ),
                              const SizedBox(height: 10),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: _previewResult!.scheduledSessions.length,
                                  itemBuilder: (ctx, i) {
                                    final item = _previewResult!.scheduledSessions[i];
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 6),
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: item.isOverrideNeeded ? AppTheme.warningOrange : AppTheme.borderLight,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 12,
                                            backgroundColor: AppTheme.primaryLightTeal,
                                            child: Text(
                                              '${item.sessionNumber}',
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryDarkTeal),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(item.dayNameAr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          const SizedBox(width: 8),
                                          Text(item.date, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                          const Spacer(),
                                          if (item.isOverrideNeeded)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppTheme.warningOrange.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text('تجاوز سعة', style: TextStyle(color: AppTheme.warningOrange, fontSize: 10, fontWeight: FontWeight.bold)),
                                            ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ] else
                              const Center(child: Text('جاري إعداد المعاينة...')),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('إلغاء'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: (_previewResult == null || _selectedPatientId == null)
                        ? null
                        : () {
                            clinic.createTreatmentPlan(
                              patientId: _selectedPatientId!,
                              totalSessions: _totalSessions,
                              startDate: formatDate(_startDate),
                              preferredPattern: _pattern,
                              customDays: _pattern == SchedulePattern.custom ? _customDays : null,
                              therapistName: _therapistName,
                              pricePerSession: _pricePerSession,
                              paidAmount: _paidAmount,
                              notes: _notes,
                              allowOverride: _allowOverride,
                            );
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('تم إنشاء الخطة العلاجية وجدولة جميع الجلسات بنجاح!'),
                                backgroundColor: AppTheme.successGreen,
                              ),
                            );
                          },
                    icon: const Icon(Icons.check),
                    label: const Text('تأكيد وحفظ الخطة'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
