import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

enum SyncState {
  offline,
  syncing,
  synced,
  error;

  String toArabic() {
    switch (this) {
      case SyncState.offline:
        return 'غير متصل (محلي فقط)';
      case SyncState.syncing:
        return 'جاري المزامنة السحابية...';
      case SyncState.synced:
        return 'متزامن مع السحابة';
      case SyncState.error:
        return 'تعذر الاتصال بالسحابة';
    }
  }
}

class CloudSyncConfig {
  final bool isEnabled;
  final String firebaseProjectId;
  final String firebaseApiKey;
  final String customEndpoint;
  final int autoSyncIntervalMinutes;

  CloudSyncConfig({
    this.isEnabled = false,
    this.firebaseProjectId = '',
    this.firebaseApiKey = '',
    this.customEndpoint = '',
    this.autoSyncIntervalMinutes = 5,
  });

  factory CloudSyncConfig.fromJson(Map<String, dynamic> json) {
    return CloudSyncConfig(
      isEnabled: json['isEnabled'] as bool? ?? false,
      firebaseProjectId: json['firebaseProjectId'] as String? ?? '',
      firebaseApiKey: json['firebaseApiKey'] as String? ?? '',
      customEndpoint: json['customEndpoint'] as String? ?? '',
      autoSyncIntervalMinutes: (json['autoSyncIntervalMinutes'] as num?)?.toInt() ?? 5,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isEnabled': isEnabled,
      'firebaseProjectId': firebaseProjectId,
      'firebaseApiKey': firebaseApiKey,
      'customEndpoint': customEndpoint,
      'autoSyncIntervalMinutes': autoSyncIntervalMinutes,
    };
  }

  CloudSyncConfig copyWith({
    bool? isEnabled,
    String? firebaseProjectId,
    String? firebaseApiKey,
    String? customEndpoint,
    int? autoSyncIntervalMinutes,
  }) {
    return CloudSyncConfig(
      isEnabled: isEnabled ?? this.isEnabled,
      firebaseProjectId: firebaseProjectId ?? this.firebaseProjectId,
      firebaseApiKey: firebaseApiKey ?? this.firebaseApiKey,
      customEndpoint: customEndpoint ?? this.customEndpoint,
      autoSyncIntervalMinutes: autoSyncIntervalMinutes ?? this.autoSyncIntervalMinutes,
    );
  }
}

class CloudSyncService {
  CloudSyncConfig _config = CloudSyncConfig();
  SyncState _state = SyncState.offline;
  DateTime? _lastSyncTime;
  String? _lastError;

  SyncState get state => _state;
  DateTime? get lastSyncTime => _lastSyncTime;
  String? get lastError => _lastError;
  CloudSyncConfig get config => _config;

  void updateConfig(CloudSyncConfig newConfig) {
    _config = newConfig;
    if (!_config.isEnabled) {
      _state = SyncState.offline;
    }
  }

  /// Upload full snapshot to Cloud (Firebase Realtime DB or Firestore REST)
  Future<bool> pushDataToCloud(Map<String, dynamic> payload) async {
    if (!_config.isEnabled) {
      _state = SyncState.offline;
      return false;
    }

    _state = SyncState.syncing;
    _lastError = null;

    try {
      String? url;
      if (_config.customEndpoint.isNotEmpty) {
        url = _config.customEndpoint;
      } else if (_config.firebaseProjectId.isNotEmpty) {
        // Firebase Realtime DB REST API
        final projectId = _config.firebaseProjectId.trim();
        final authParam = _config.firebaseApiKey.isNotEmpty ? '?auth=${_config.firebaseApiKey.trim()}' : '';
        url = 'https://$projectId-default-rtdb.firebaseio.com/rehab_clinic_data.json$authParam';
      }

      if (url == null || url.isEmpty) {
        _state = SyncState.offline;
        return false;
      }

      final response = await http.put(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({
          ...payload,
          'syncedAt': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        _state = SyncState.synced;
        _lastSyncTime = DateTime.now();
        return true;
      } else {
        _state = SyncState.error;
        _lastError = 'رمز الاستجابة: ${response.statusCode} - ${response.body}';
        return false;
      }
    } catch (e) {
      _state = SyncState.error;
      _lastError = e.toString();
      debugPrint('Cloud sync push error: $e');
      return false;
    }
  }

  /// Fetch remote snapshot from Cloud
  Future<Map<String, dynamic>?> pullDataFromCloud() async {
    if (!_config.isEnabled) return null;

    _state = SyncState.syncing;
    try {
      String? url;
      if (_config.customEndpoint.isNotEmpty) {
        url = _config.customEndpoint;
      } else if (_config.firebaseProjectId.isNotEmpty) {
        final projectId = _config.firebaseProjectId.trim();
        final authParam = _config.firebaseApiKey.isNotEmpty ? '?auth=${_config.firebaseApiKey.trim()}' : '';
        url = 'https://$projectId-default-rtdb.firebaseio.com/rehab_clinic_data.json$authParam';
      }

      if (url == null || url.isEmpty) return null;

      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 15));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (response.body.isEmpty || response.body == 'null') {
          _state = SyncState.synced;
          return null;
        }
        final Map<String, dynamic> data = jsonDecode(response.body);
        _state = SyncState.synced;
        _lastSyncTime = DateTime.now();
        return data;
      } else {
        _state = SyncState.error;
        _lastError = 'رمز الخطأ: ${response.statusCode}';
        return null;
      }
    } catch (e) {
      _state = SyncState.error;
      _lastError = e.toString();
      return null;
    }
  }
}
