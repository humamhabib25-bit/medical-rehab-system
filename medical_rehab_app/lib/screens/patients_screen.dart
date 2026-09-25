import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/patient.dart';
import '../providers/clinic_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/patient_form_dialog.dart';
import '../widgets/plan_creation_dialog.dart';

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();
    final patients = clinic.patients.where((p) {
      final q = _searchQuery.trim().toLowerCase();
      if (q.isEmpty) return true;
      return p.fullName.toLowerCase().contains(q) ||
          p.phone.contains(q) ||
          p.initialDiagnosis.toLowerCase().contains(q) ||
          (p.nationalId?.contains(q) ?? false);
    }).toList();

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Bar
            Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'البحث باسم المريض أو رقم الهاتف أو التشخيص...',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ),
                const SizedBox(width: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => const PatientFormDialog(),
                    );
                  },
                  icon: const Icon(Icons.person_add),
                  label: const Text('إضافة مريض جديد'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            Text(
              'سجل المرضى (${patients.length})',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),

            Expanded(
              child: patients.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          const Text('لم يتم العثور على أي مريض', style: TextStyle(color: AppTheme.textMuted)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: patients.length,
                      itemBuilder: (ctx, i) {
                        final patient = patients[i];
                        final patientPlans = clinic.plans.where((pl) => pl.patientId == patient.id).toList();
                        final patientSessions = clinic.sessions.where((s) => s.patientId == patient.id).toList();

                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: AppTheme.primaryLightTeal,
                                      child: const Icon(Icons.person, color: AppTheme.primaryDarkTeal),
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
                                            'الهاتف: ${patient.phone}${patient.nationalId != null ? ' | الهوية: ${patient.nationalId}' : ''}',
                                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      'تاريخ التسجيل: ${DateFormat('yyyy/MM/dd').format(patient.createdAt)}',
                                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                    ),
                                    const SizedBox(width: 10),
                                    IconButton(
                                      icon: const Icon(Icons.edit, color: AppTheme.primaryTeal, size: 20),
                                      tooltip: 'تعديل البيانات',
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => PatientFormDialog(patientToEdit: patient),
                                        );
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, color: AppTheme.dangerRed, size: 20),
                                      tooltip: 'حذف المريض',
                                      onPressed: () {
                                        _showDeleteConfirmation(context, clinic, patient);
                                      },
                                    ),
                                  ],
                                ),
                                const Divider(height: 20),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.medical_services, size: 16, color: AppTheme.primaryTeal),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'التشخيص: ${patient.initialDiagnosis}',
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (patient.notes != null && patient.notes!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'ملاحظات: ${patient.notes}',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'الخطط العلاجية: ${patientPlans.length} | إجمالي الجلسات: ${patientSessions.length}',
                                      style: const TextStyle(color: AppTheme.primaryDarkTeal, fontWeight: FontWeight.w600, fontSize: 12),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => PlanCreationDialog(preselectedPatientId: patient.id),
                                        );
                                      },
                                      icon: const Icon(Icons.add, size: 16),
                                      label: const Text('إنشاء خطة لهذا المريض', style: TextStyle(fontSize: 12)),
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

  void _showDeleteConfirmation(BuildContext context, ClinicProvider clinic, Patient patient) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد حذف المريض'),
        content: Text('هل أنت متأكد من حذف المريض "${patient.fullName}"؟ سيتم حذف خططه العلاجية وجلساته المرتبطة به أيضاً.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.dangerRed),
            onPressed: () {
              clinic.deletePatient(patient.id);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم حذف المريض بنجاح')),
              );
            },
            child: const Text('حذف نهائي'),
          ),
        ],
      ),
    );
  }
}
