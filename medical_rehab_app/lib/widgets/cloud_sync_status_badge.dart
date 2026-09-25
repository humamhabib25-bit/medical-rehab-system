import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/clinic_provider.dart';
import '../services/cloud_sync_service.dart';
import '../theme/app_theme.dart';

class CloudSyncStatusBadge extends StatelessWidget {
  const CloudSyncStatusBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ClinicProvider>(
      builder: (context, clinic, child) {
        final sync = clinic.syncService;
        final state = sync.state;

        Color bg;
        Color textColor;
        IconData icon;

        switch (state) {
          case SyncState.synced:
            bg = AppTheme.successGreen.withOpacity(0.12);
            textColor = AppTheme.successGreen;
            icon = Icons.cloud_done;
            break;
          case SyncState.syncing:
            bg = AppTheme.infoBlue.withOpacity(0.12);
            textColor = AppTheme.infoBlue;
            icon = Icons.sync;
            break;
          case SyncState.error:
            bg = AppTheme.dangerRed.withOpacity(0.12);
            textColor = AppTheme.dangerRed;
            icon = Icons.cloud_off;
            break;
          case SyncState.offline:
            bg = Colors.grey.withValues(alpha: 0.12);
            textColor = Colors.grey.shade700;
            icon = Icons.cloud_queue;
            break;
        }

        return InkWell(
          onTap: () {
            if (sync.config.isEnabled) {
              clinic.syncWithCloud();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('جاري بدء المزامنة السحابية...'),
                  duration: Duration(seconds: 2),
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('المزامنة السحابية معطلة حالياً. يمكنك تفعيلها من شاشة الإعدادات.'),
                  duration: Duration(seconds: 3),
                ),
              );
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: textColor.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (state == SyncState.syncing)
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(textColor),
                    ),
                  )
                else
                  Icon(icon, size: 16, color: textColor),
                const SizedBox(width: 8),
                Text(
                  state.toArabic(),
                  style: TextStyle(
                    color: textColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
