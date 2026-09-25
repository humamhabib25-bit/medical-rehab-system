import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/patient.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';

class PatientFormDialog extends StatefulWidget {
  final Patient? patientToEdit;

  const PatientFormDialog({super.key, this.patientToEdit});

  @override
  State<PatientFormDialog> createState() => _PatientFormDialogState();
}

class _PatientFormDialogState extends State<PatientFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _nationalIdController;
  late TextEditingController _diagnosisController;
  late TextEditingController _notesController;

  @override
  void initState() {
    super.initState();
    final p = widget.patientToEdit;
    _nameController = TextEditingController(text: p?.fullName ?? '');
    _phoneController = TextEditingController(text: p?.phone ?? '');
    _nationalIdController = TextEditingController(text: p?.nationalId ?? '');
    _diagnosisController = TextEditingController(text: p?.initialDiagnosis ?? '');
    _notesController = TextEditingController(text: p?.notes ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _nationalIdController.dispose();
    _diagnosisController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.patientToEdit != null;

    return AlertDialog(
      title: Row(
        children: [
          Icon(isEdit ? Icons.edit : Icons.person_add, color: AppTheme.primaryTeal),
          const SizedBox(width: 10),
          Text(isEdit ? 'تعديل بيانات مريض' : 'إضافة مريض جديد'),
        ],
      ),
      content: SizedBox(
        width: 500,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'اسم المريض الثلاثي *',
                    prefixIcon: Icon(Icons.person),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال اسم المريض' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'رقم الهاتف *',
                    prefixIcon: Icon(Icons.phone),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال رقم الهاتف' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _nationalIdController,
                  decoration: const InputDecoration(
                    labelText: 'رقم الهوية الوطنية / الإقامة (اختياري)',
                    prefixIcon: Icon(Icons.badge),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _diagnosisController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'التشخيص الطبي الأولي *',
                    prefixIcon: Icon(Icons.medical_services),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال التشخيص الأولي' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات وتوصيات إضافية',
                    prefixIcon: Icon(Icons.notes),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final clinic = context.read<ClinicProvider>();
              if (isEdit) {
                clinic.updatePatient(widget.patientToEdit!.copyWith(
                  fullName: _nameController.text.trim(),
                  phone: _phoneController.text.trim(),
                  nationalId: _nationalIdController.text.trim().isEmpty ? null : _nationalIdController.text.trim(),
                  initialDiagnosis: _diagnosisController.text.trim(),
                  notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
                ));
              } else {
                clinic.addPatient(
                  fullName: _nameController.text.trim(),
                  phone: _phoneController.text.trim(),
                  nationalId: _nationalIdController.text.trim().isEmpty ? null : _nationalIdController.text.trim(),
                  initialDiagnosis: _diagnosisController.text.trim(),
                  notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
                );
              }
              Navigator.pop(context);
            }
          },
          child: Text(isEdit ? 'حفظ التعديلات' : 'إضافة المريض'),
        ),
      ],
    );
  }
}
