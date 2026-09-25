import 'package:flutter_test/flutter_test.dart';
import 'package:medical_rehab_app/core/scheduling_engine.dart';
import 'package:medical_rehab_app/models/session.dart';
import 'package:medical_rehab_app/models/capacity_setting.dart';
import 'package:medical_rehab_app/models/schedule_models.dart';
import 'package:medical_rehab_app/models/treatment_plan.dart';

void main() {
  group('Scheduling Engine Core Tests', () {
    test('calculateDayCapacity detects holiday and capacity properly', () {
      final sessions = <Session>[];
      final capacitySettings = <String, DailyCapacitySetting>{
        '2026-09-23': DailyCapacitySetting(
          date: '2026-09-23',
          maxCapacity: 0,
          isWorkingDay: false,
          notes: 'عطلة رسمية',
        ),
      };

      final capHoliday = calculateDayCapacity('2026-09-23', sessions, capacitySettings, 10);
      expect(capHoliday.isWorkingDay, isFalse);
      expect(capHoliday.status, equals(DayCapacityState.holiday));

      final capNormal = calculateDayCapacity('2026-09-20', sessions, capacitySettings, 10);
      expect(capNormal.isWorkingDay, isTrue);
      expect(capNormal.bookedCount, equals(0));
      expect(capNormal.status, equals(DayCapacityState.available));
    });

    test('autoDistributeSessions schedules requested number of sessions on matching days', () {
      final existingSessions = <Session>[];
      final capacitySettings = <String, DailyCapacitySetting>{};

      final result = autoDistributeSessions(
        startDateStr: '2026-09-06',
        totalSessions: 6,
        preferredDays: [0, 2, 4], // Sun, Tue, Thu
        existingSessions: existingSessions,
        capacitySettings: capacitySettings,
        allowOverride: false,
        defaultCapacity: 10,
      );

      expect(result.scheduledSessions.length, equals(6));
      expect(result.scheduledSessions.first.date, equals('2026-09-06'));
    });

    test('shiftSubsequentSessions shifts sessions from target onwards', () {
      final planSessions = [
        Session(id: 's-1', planId: 'p-1', patientId: 'pat-1', sessionNumber: 1, sessionDate: '2026-09-06', status: SessionStatus.completed, createdAt: DateTime.now()),
        Session(id: 's-2', planId: 'p-1', patientId: 'pat-1', sessionNumber: 2, sessionDate: '2026-09-08', status: SessionStatus.scheduled, createdAt: DateTime.now()),
        Session(id: 's-3', planId: 'p-1', patientId: 'pat-1', sessionNumber: 3, sessionDate: '2026-09-10', status: SessionStatus.scheduled, createdAt: DateTime.now()),
      ];

      final shiftRes = shiftSubsequentSessions(
        fromSessionNumber: 2,
        newStartDateStr: '2026-09-13',
        preferredDays: [0, 2, 4],
        allPlanSessions: planSessions,
        allCenterSessions: planSessions,
        capacitySettings: {},
      );

      expect(shiftRes.updatedSessions.length, equals(2));
      expect(shiftRes.updatedSessions[0].newDate, equals('2026-09-13'));
    });
  });
}
