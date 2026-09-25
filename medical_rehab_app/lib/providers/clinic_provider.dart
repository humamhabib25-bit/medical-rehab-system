import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../models/patient.dart';
import '../models/treatment_plan.dart';
import '../models/session.dart';
import '../models/capacity_setting.dart';
import '../core/scheduling_engine.dart';
import '../services/mock_data.dart';
import '../services/local_storage_service.dart';
import '../services/cloud_sync_service.dart';

class ClinicProvider extends ChangeNotifier {
  final _uuid = const Uuid();
  final CloudSyncService _syncService = CloudSyncService();

  List<Patient> _patients = [];
  List<TreatmentPlan> _plans = [];
  List<Session> _sessions = [];
  Map<String, DailyCapacitySetting> _capacitySettings = {};
  int _defaultCapacity = defaultMaxCapacity;

  bool _isLoading = true;
  Timer? _autoSyncTimer;

  // Getters
  List<Patient> get patients => List.unmodifiable(_patients);
  List<TreatmentPlan> get plans => List.unmodifiable(_plans);
  List<Session> get sessions => List.unmodifiable(_sessions);
  Map<String, DailyCapacitySetting> get capacitySettings => Map.unmodifiable(_capacitySettings);
  int get defaultCapacity => _defaultCapacity;
  bool get isLoading => _isLoading;
  CloudSyncService get syncService => _syncService;

  ClinicProvider() {
    _initData();
  }

  Future<void> _initData() async {
    _isLoading = true;
    notifyListeners();

    try {
      final savedData = await LocalStorageService.loadClinicData();
      if (savedData != null) {
        _loadFromMap(savedData);
      } else {
        _patients = List.from(initialPatients);
        _plans = List.from(initialPlans);
        _sessions = List.from(initialSessions);
        _capacitySettings = Map.from(initialCapacitySettings);
        _defaultCapacity = defaultMaxCapacity;
      }
    } catch (e) {
      debugPrint('Error loading initial data: $e');
      _patients = List.from(initialPatients);
      _plans = List.from(initialPlans);
      _sessions = List.from(initialSessions);
      _capacitySettings = Map.from(initialCapacitySettings);
    }

    _isLoading = false;
    notifyListeners();

    // If cloud sync is enabled, attempt pull and start auto-sync timer
    if (_syncService.config.isEnabled) {
      syncWithCloud();
    }
  }

  void _loadFromMap(Map<String, dynamic> data) {
    if (data['patients'] != null) {
      _patients = (data['patients'] as List)
          .map((e) => Patient.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data['plans'] != null) {
      _plans = (data['plans'] as List)
          .map((e) => TreatmentPlan.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data['sessions'] != null) {
      _sessions = (data['sessions'] as List)
          .map((e) => Session.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data['capacitySettings'] != null) {
      final capMap = data['capacitySettings'] as Map<String, dynamic>;
      _capacitySettings = capMap.map((key, value) =>
          MapEntry(key, DailyCapacitySetting.fromJson(value as Map<String, dynamic>)));
    }
    if (data['defaultCapacity'] != null) {
      _defaultCapacity = (data['defaultCapacity'] as num).toInt();
    }
    if (data['cloudConfig'] != null) {
      _syncService.updateConfig(CloudSyncConfig.fromJson(data['cloudConfig'] as Map<String, dynamic>));
    }
  }

  Map<String, dynamic> _toMap() {
    return {
      'patients': _patients.map((p) => p.toJson()).toList(),
      'plans': _plans.map((p) => p.toJson()).toList(),
      'sessions': _sessions.map((s) => s.toJson()).toList(),
      'capacitySettings': _capacitySettings.map((k, v) => MapEntry(k, v.toJson())),
      'defaultCapacity': _defaultCapacity,
      'cloudConfig': _syncService.config.toJson(),
    };
  }

  Future<void> _persistAndSync() async {
    final payload = _toMap();
    await LocalStorageService.saveClinicData(payload);
    if (_syncService.config.isEnabled) {
      unawaited(_syncService.pushDataToCloud(payload).then((_) => notifyListeners()));
    }
    notifyListeners();
  }

  // --- Patients Operations ---
  Patient addPatient({
    required String fullName,
    required String phone,
    String? nationalId,
    required String initialDiagnosis,
    String? notes,
  }) {
    final patient = Patient(
      id: 'p-${_uuid.v4().substring(0, 8)}',
      fullName: fullName,
      phone: phone,
      nationalId: nationalId,
      initialDiagnosis: initialDiagnosis,
      notes: notes,
      createdAt: DateTime.now(),
    );
    _patients.insert(0, patient);
    _persistAndSync();
    return patient;
  }

  void updatePatient(Patient updated) {
    final idx = _patients.indexWhere((p) => p.id == updated.id);
    if (idx != -1) {
      _patients[idx] = updated;
      _persistAndSync();
    }
  }

  void deletePatient(String patientId) {
    _patients.removeWhere((p) => p.id == patientId);
    _plans.removeWhere((pl) => pl.patientId == patientId);
    _sessions.removeWhere((s) => s.patientId == patientId);
    _persistAndSync();
  }

  // --- Treatment Plans & Auto Scheduling ---
  TreatmentPlan createTreatmentPlan({
    required String patientId,
    required int totalSessions,
    required String startDate,
    required SchedulePattern preferredPattern,
    List<int>? customDays,
    String? notes,
    String? therapistName,
    bool allowOverride = false,
    double? pricePerSession,
    double paidAmount = 0,
  }) {
    List<int> preferredDays = [];
    if (preferredPattern == SchedulePattern.custom && customDays != null) {
      preferredDays = customDays;
    } else {
      preferredDays = patternDaysMap[preferredPattern] ?? [0, 2, 4];
    }

    final scheduleResult = autoDistributeSessions(
      startDateStr: startDate,
      totalSessions: totalSessions,
      preferredDays: preferredDays,
      existingSessions: _sessions,
      capacitySettings: _capacitySettings,
      allowOverride: allowOverride,
      defaultCapacity: _defaultCapacity,
    );

    final planId = 'plan-${_uuid.v4().substring(0, 8)}';
    final calculatedTotal = (pricePerSession ?? 0) * totalSessions;

    PaymentStatus paymentStatus = PaymentStatus.unpaid;
    if (paidAmount >= calculatedTotal && calculatedTotal > 0) {
      paymentStatus = PaymentStatus.paid;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.partiallyPaid;
    }

    final newPlan = TreatmentPlan(
      id: planId,
      patientId: patientId,
      totalSessions: totalSessions,
      completedSessions: 0,
      status: PlanStatus.active,
      startDate: startDate,
      preferredPattern: preferredPattern,
      preferredDays: preferredDays,
      pricePerSession: pricePerSession,
      totalPrice: calculatedTotal,
      paidAmount: paidAmount,
      paymentStatus: paymentStatus,
      notes: notes,
      createdAt: DateTime.now(),
    );

    final newSessions = scheduleResult.scheduledSessions.map((item) {
      return Session(
        id: 's-${_uuid.v4().substring(0, 8)}',
        planId: planId,
        patientId: patientId,
        sessionNumber: item.sessionNumber,
        sessionDate: item.date,
        status: SessionStatus.scheduled,
        therapistName: therapistName,
        isOverride: item.isOverrideNeeded,
        createdAt: DateTime.now(),
      );
    }).toList();

    _plans.insert(0, newPlan);
    _sessions.addAll(newSessions);

    _persistAndSync();
    return newPlan;
  }

  void updateTreatmentPlan(TreatmentPlan updated) {
    final idx = _plans.indexWhere((p) => p.id == updated.id);
    if (idx != -1) {
      _plans[idx] = updated;
      _persistAndSync();
    }
  }

  void cancelTreatmentPlan(String planId) {
    final idx = _plans.indexWhere((p) => p.id == planId);
    if (idx != -1) {
      _plans[idx] = _plans[idx].copyWith(status: PlanStatus.cancelled);
      for (int i = 0; i < _sessions.length; i++) {
        if (_sessions[i].planId == planId && _sessions[i].status == SessionStatus.scheduled) {
          _sessions[i] = _sessions[i].copyWith(status: SessionStatus.cancelled);
        }
      }
      _persistAndSync();
    }
  }

  // --- Session Management ---
  void updateSessionStatus(String sessionId, SessionStatus newStatus, {String? notes}) {
    final idx = _sessions.indexWhere((s) => s.id == sessionId);
    if (idx == -1) return;

    final target = _sessions[idx];
    _sessions[idx] = target.copyWith(
      status: newStatus,
      notes: notes ?? target.notes,
    );

    // Update completed sessions in plan
    final planId = target.planId;
    final planSessions = _sessions.where((s) => s.planId == planId).toList();
    final completedCount = planSessions.where((s) => s.status == SessionStatus.completed).length;

    final planIdx = _plans.indexWhere((p) => p.id == planId);
    if (planIdx != -1) {
      final plan = _plans[planIdx];
      final isNowCompleted = completedCount >= plan.totalSessions;
      _plans[planIdx] = plan.copyWith(
        completedSessions: completedCount,
        status: isNowCompleted ? PlanStatus.completed : plan.status,
      );
    }

    _persistAndSync();
  }

  void rescheduleSession({
    required String sessionId,
    required String newDate,
    String? reason,
    bool allowOverride = false,
  }) {
    final idx = _sessions.indexWhere((s) => s.id == sessionId);
    if (idx == -1) return;

    final session = _sessions[idx];
    final cap = calculateDayCapacity(newDate, _sessions, _capacitySettings, _defaultCapacity);

    if (!cap.isWorkingDay && !allowOverride) {
      throw Exception('اليوم المحدد عطلة رسمية.');
    }
    if (cap.bookedCount >= cap.maxCapacity && !allowOverride) {
      throw Exception('اليوم المحدد مكتمل الاستيعاب.');
    }

    _sessions[idx] = session.copyWith(
      sessionDate: newDate,
      rescheduledFromDate: session.sessionDate,
      isOverride: cap.bookedCount >= cap.maxCapacity,
      notes: reason != null ? '${session.notes ?? ""}\n[تأجيل]: $reason'.trim() : session.notes,
    );

    _persistAndSync();
  }

  void cascadeShiftSessions({
    required String planId,
    required int fromSessionNumber,
    required String newStartDate,
    bool allowOverride = false,
  }) {
    final planIdx = _plans.indexWhere((p) => p.id == planId);
    if (planIdx == -1) return;
    final plan = _plans[planIdx];

    final planSessions = _sessions.where((s) => s.planId == planId).toList();
    final shiftResult = shiftSubsequentSessions(
      fromSessionNumber: fromSessionNumber,
      newStartDateStr: newStartDate,
      preferredDays: plan.preferredDays,
      allPlanSessions: planSessions,
      allCenterSessions: _sessions,
      capacitySettings: _capacitySettings,
      allowOverride: allowOverride,
      defaultCapacity: _defaultCapacity,
    );

    final updatedMap = {for (var u in shiftResult.updatedSessions) u.sessionId: u.newDate};

    for (int i = 0; i < _sessions.length; i++) {
      if (updatedMap.containsKey(_sessions[i].id)) {
        final oldDate = _sessions[i].sessionDate;
        final nextDate = updatedMap[_sessions[i].id]!;
        _sessions[i] = _sessions[i].copyWith(
          sessionDate: nextDate,
          rescheduledFromDate: oldDate,
        );
      }
    }

    _persistAndSync();
  }

  // --- Capacity Settings ---
  void setDailyCapacity({
    required String date,
    required int maxCapacity,
    required bool isWorkingDay,
    String? notes,
  }) {
    _capacitySettings[date] = DailyCapacitySetting(
      date: date,
      maxCapacity: maxCapacity,
      isWorkingDay: isWorkingDay,
      notes: notes,
    );
    _persistAndSync();
  }

  void removeDailyCapacityOverride(String date) {
    _capacitySettings.remove(date);
    _persistAndSync();
  }

  void setDefaultCapacity(int cap) {
    if (cap > 0) {
      _defaultCapacity = cap;
      _persistAndSync();
    }
  }

  // --- Cloud Sync Actions ---
  Future<void> updateCloudConfig(CloudSyncConfig config) async {
    _syncService.updateConfig(config);
    _setupAutoSyncTimer();
    await _persistAndSync();
  }

  void _setupAutoSyncTimer() {
    _autoSyncTimer?.cancel();
    if (_syncService.config.isEnabled && _syncService.config.autoSyncIntervalMinutes > 0) {
      _autoSyncTimer = Timer.periodic(
        Duration(minutes: _syncService.config.autoSyncIntervalMinutes),
        (_) => syncWithCloud(),
      );
    }
  }

  Future<void> syncWithCloud() async {
    if (!_syncService.config.isEnabled) return;
    notifyListeners();

    // 1. Pull remote data
    final remoteData = await _syncService.pullDataFromCloud();
    if (remoteData != null) {
      _loadFromMap(remoteData);
    }

    // 2. Push current consolidated data
    await _syncService.pushDataToCloud(_toMap());
    await LocalStorageService.saveClinicData(_toMap());
    notifyListeners();
  }

  void resetToMockData() {
    _patients = List.from(initialPatients);
    _plans = List.from(initialPlans);
    _sessions = List.from(initialSessions);
    _capacitySettings = Map.from(initialCapacitySettings);
    _defaultCapacity = defaultMaxCapacity;
    _persistAndSync();
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    super.dispose();
  }
}
