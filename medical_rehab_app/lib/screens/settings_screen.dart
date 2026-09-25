import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../providers/clinic_provider.dart';
import '../services/cloud_sync_service.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _defaultCapController;
  late TextEditingController _projectIdController;
  late TextEditingController _apiKeyController;
  late TextEditingController _customEndpointController;
  bool _cloudSyncEnabled = false;
  int _syncInterval = 5;

  @override
  void initState() {
    super.initState();
    final clinic = context.read<ClinicProvider>();
    _defaultCapController = TextEditingController(text: clinic.defaultCapacity.toString());

    final cfg = clinic.syncService.config;
    _cloudSyncEnabled = cfg.isEnabled;
    _projectIdController = TextEditingController(text: cfg.firebaseProjectId);
    _apiKeyController = TextEditingController(text: cfg.firebaseApiKey);
    _customEndpointController = TextEditingController(text: cfg.customEndpoint);
    _syncInterval = cfg.autoSyncIntervalMinutes;
  }

  @override
  void dispose() {
    _defaultCapController.dispose();
    _projectIdController.dispose();
    _apiKeyController.dispose();
    _customEndpointController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clinic = context.watch<ClinicProvider>();
    final sync = clinic.syncService;

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'إعدادات النظام والمزامنة السحابية',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Cloud Sync Section Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.infoBlue.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.cloud_sync, color: AppTheme.infoBlue, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'المزامنة السحابية (Firebase Cloud Sync)',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Text(
                                'ربط التطبيق بالسحابة لمزامنة بيانات المرضى والجلسات بين الهاتف وسطح المكتب لحظياً',
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: _cloudSyncEnabled,
                          activeColor: AppTheme.primaryTeal,
                          onChanged: (val) {
                            setState(() => _cloudSyncEnabled = val);
                          },
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    if (_cloudSyncEnabled) ...[
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _projectIdController,
                              decoration: const InputDecoration(
                                labelText: 'Firebase Project ID *',
                                hintText: 'مثال: medical-rehab-clinic',
                                prefixIcon: Icon(Icons.hub),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: TextFormField(
                              controller: _apiKeyController,
                              decoration: const InputDecoration(
                                labelText: 'Firebase Web API Key / Database Secret (اختياري)',
                                prefixIcon: Icon(Icons.vpn_key),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _customEndpointController,
                        decoration: const InputDecoration(
                          labelText: 'Custom Cloud REST Endpoint (اختياري في حال استخدام خادم خاص)',
                          hintText: 'https://your-server.com/api/sync',
                          prefixIcon: Icon(Icons.link),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Text('فترة المزامنة التلقائية: '),
                          DropdownButton<int>(
                            value: _syncInterval,
                            items: const [
                              DropdownMenuItem(value: 1, child: Text('كل دقيقة')),
                              DropdownMenuItem(value: 5, child: Text('كل 5 دقائق')),
                              DropdownMenuItem(value: 15, child: Text('كل 15 دقيقة')),
                              DropdownMenuItem(value: 30, child: Text('كل 30 دقيقة')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _syncInterval = val);
                            },
                          ),
                          const Spacer(),
                          OutlinedButton.icon(
                            onPressed: () {
                              clinic.syncWithCloud();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('تم إرسال طلب المزامنة السحابية...')),
                              );
                            },
                            icon: const Icon(Icons.sync),
                            label: const Text('مزامنة الآن'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.history, size: 18, color: AppTheme.textMuted),
                                const SizedBox(width: 8),
                                Text(
                                  sync.lastSyncTime != null
                                      ? 'آخر مزامنة ناجحة: ${DateFormat('yyyy/MM/dd HH:mm:ss').format(sync.lastSyncTime!)}'
                                      : 'لم تتم أي مزامنة بعد',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                            Text(
                              'الحالة: ${sync.state.toArabic()}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: sync.state == SyncState.synced ? AppTheme.successGreen : AppTheme.primaryTeal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        clinic.updateCloudConfig(CloudSyncConfig(
                          isEnabled: _cloudSyncEnabled,
                          firebaseProjectId: _projectIdController.text.trim(),
                          firebaseApiKey: _apiKeyController.text.trim(),
                          customEndpoint: _customEndpointController.text.trim(),
                          autoSyncIntervalMinutes: _syncInterval,
                        ));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تم حفظ إعدادات المزامنة السحابية بنجاح!'),
                            backgroundColor: AppTheme.successGreen,
                          ),
                        );
                      },
                      icon: const Icon(Icons.save),
                      label: const Text('حفظ إعدادات المزامنة'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Capacity & Center Defaults Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'الطاقة الاستيعابية اليومية للمركز',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'الحد الأقصى لعدد المرضى المسموح بجدولتهم في اليوم الواحد لمنع الازدحام',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        SizedBox(
                          width: 220,
                          child: TextFormField(
                            controller: _defaultCapController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'الحد الافتراضي (مريض / يوم)',
                              prefixIcon: Icon(Icons.group),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        ElevatedButton(
                          onPressed: () {
                            final val = int.tryParse(_defaultCapController.text);
                            if (val != null && val > 0) {
                              clinic.setDefaultCapacity(val);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('تم تحديث الطاقة الاستيعابية اليومية')),
                              );
                            }
                          },
                          child: const Text('تحديث السعة'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Reset Data Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    const Icon(Icons.refresh, color: AppTheme.warningOrange),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('إعادة تعيين البيانات الافتراضية', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text('استرجاع بيانات المرضى والخطط النموذجية المرفقة للتجربة', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(foregroundColor: AppTheme.warningOrange),
                      onPressed: () {
                        clinic.resetToMockData();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('تمت استعادة البيانات النموذجية بنجاح')),
                        );
                      },
                      child: const Text('استعادة البيانات'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
