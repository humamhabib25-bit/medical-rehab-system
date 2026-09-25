import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';

class LocalStorageService {
  static const String _fileName = 'medical_rehab_data.json';

  static Future<String> _getFilePath() async {
    if (kIsWeb) {
      return _fileName;
    }
    try {
      if (Platform.isWindows) {
        final appData = Platform.environment['APPDATA'] ?? Platform.environment['USERPROFILE'];
        if (appData != null) {
          final dir = Directory('$appData/MedicalRehabApp');
          if (!await dir.exists()) {
            await dir.create(recursive: true);
          }
          return '${dir.path}/$_fileName';
        }
      } else if (Platform.isAndroid || Platform.isIOS || Platform.isMacOS || Platform.isLinux) {
        final home = Platform.environment['HOME'] ?? '.';
        final dir = Directory('$home/.medical_rehab_app');
        if (!await dir.exists()) {
          await dir.create(recursive: true);
        }
        return '${dir.path}/$_fileName';
      }
    } catch (e) {
      debugPrint('Error getting custom storage path: $e');
    }
    return _fileName;
  }

  static Future<void> saveClinicData(Map<String, dynamic> data) async {
    try {
      final jsonString = jsonEncode(data);
      if (kIsWeb) {
        return;
      }
      final path = await _getFilePath();
      final file = File(path);
      await file.writeAsString(jsonString);
    } catch (e) {
      debugPrint('Failed to save clinic data locally: $e');
    }
  }

  static Future<Map<String, dynamic>?> loadClinicData() async {
    try {
      if (kIsWeb) return null;
      final path = await _getFilePath();
      final file = File(path);
      if (await file.exists()) {
        final content = await file.readAsString();
        if (content.isNotEmpty) {
          return jsonDecode(content) as Map<String, dynamic>;
        }
      }
    } catch (e) {
      debugPrint('Failed to load clinic data locally: $e');
    }
    return null;
  }
}
