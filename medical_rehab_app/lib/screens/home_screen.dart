import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/cloud_sync_status_badge.dart';
import '../widgets/plan_creation_dialog.dart';
import '../widgets/patient_form_dialog.dart';
import 'calendar_screen.dart';
import 'patients_screen.dart';
import 'plans_screen.dart';
import 'analytics_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    CalendarScreen(),
    PatientsScreen(),
    PlansScreen(),
    AnalyticsScreen(),
    SettingsScreen(),
  ];

  final List<String> _titles = const [
    'جدول ومواعيد الجلسات',
    'إدارة سجلات المرضى',
    'الخطط العلاجية',
    'التحليلات والمؤشرات',
    'الإعدادات والمزامنة',
  ];

  @override
  Widget build(BuildContext context) {
    final isDesktop = Breakpoints.isDesktop(context) || Breakpoints.isTablet(context);

    if (isDesktop) {
      return Scaffold(
        body: Row(
          children: [
            // Sidebar Navigation (Desktop)
            Container(
              width: 260,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(left: BorderSide(color: AppTheme.borderLight)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  // App Brand Logo & Title
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primaryTeal, AppTheme.accentCyan],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.healing, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'تأهيل طبي',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppTheme.textDark),
                              ),
                              Text(
                                'نظام إدارة الجلسات الذكي',
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(height: 1),
                  const SizedBox(height: 16),

                  // Navigation Items
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      children: [
                        _buildNavItem(0, 'جدول الجلسات', Icons.calendar_month),
                        _buildNavItem(1, 'سجل المرضى', Icons.people_alt_outlined),
                        _buildNavItem(2, 'الخطط العلاجية', Icons.assignment_turned_in_outlined),
                        _buildNavItem(3, 'التحليلات والتقارير', Icons.insert_chart_outlined),
                        _buildNavItem(4, 'الإعدادات والمزامنة', Icons.settings_outlined),
                      ],
                    ),
                  ),

                  // Quick Action Buttons
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(44),
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => const PlanCreationDialog(),
                            );
                          },
                          icon: const Icon(Icons.add_task, size: 18),
                          label: const Text('خطة علاجية جديدة', style: TextStyle(fontSize: 13)),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(44),
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => const PatientFormDialog(),
                            );
                          },
                          icon: const Icon(Icons.person_add_alt, size: 18),
                          label: const Text('إضافة مريض', style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Main Content Area
            Expanded(
              child: Column(
                children: [
                  // Desktop Header
                  Container(
                    height: 68,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(bottom: BorderSide(color: AppTheme.borderLight)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _titles[_selectedIndex],
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const CloudSyncStatusBadge(),
                      ],
                    ),
                  ),
                  // Screen Body
                  Expanded(
                    child: _screens[_selectedIndex],
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Mobile Layout
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex], style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
        actions: const [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: CloudSyncStatusBadge(),
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.calendar_month), label: 'الجدول'),
          NavigationDestination(icon: Icon(Icons.people), label: 'المرضى'),
          NavigationDestination(icon: Icon(Icons.assignment), label: 'الخطط'),
          NavigationDestination(icon: Icon(Icons.insert_chart), label: 'التحليلات'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'الإعدادات'),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryTeal,
        foregroundColor: Colors.white,
        onPressed: () {
          showModalBottomSheet(
            context: context,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
            builder: (ctx) => Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: AppTheme.primaryLightTeal,
                      child: Icon(Icons.playlist_add, color: AppTheme.primaryDarkTeal),
                    ),
                    title: const Text('إنشاء خطة علاجية وجدولة ذكية'),
                    subtitle: const Text('توزيع الجلسات تلقائياً وفق الطاقة الاستيعابية'),
                    onTap: () {
                      Navigator.pop(ctx);
                      showDialog(context: context, builder: (_) => const PlanCreationDialog());
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: AppTheme.primaryLightTeal,
                      child: Icon(Icons.person_add, color: AppTheme.primaryDarkTeal),
                    ),
                    title: const Text('تسجيل مريض جديد'),
                    subtitle: const Text('إضافة ملف طبي ومعلومات اتصال للمريض'),
                    onTap: () {
                      Navigator.pop(ctx);
                      showDialog(context: context, builder: (_) => const PatientFormDialog());
                    },
                  ),
                ],
              ),
            ),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildNavItem(int index, String label, IconData icon) {
    final isSelected = _selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: isSelected ? AppTheme.primaryLightTeal.withValues(alpha: 0.6) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: ListTile(
          leading: Icon(
            icon,
            color: isSelected ? AppTheme.primaryTeal : AppTheme.textMuted,
            size: 22,
          ),
          title: Text(
            label,
            style: TextStyle(
              color: isSelected ? AppTheme.primaryDarkTeal : AppTheme.textDark,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              fontSize: 14,
            ),
          ),
          dense: true,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          onTap: () => setState(() => _selectedIndex = index),
        ),
      ),
    );
  }
}
