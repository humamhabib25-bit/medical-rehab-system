import '../models/session.dart';
import '../models/treatment_plan.dart';
import '../models/capacity_setting.dart';
import '../models/schedule_models.dart';

const int defaultMaxCapacity = 10;

const List<String> arabicDays = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

final Map<SchedulePattern, List<int>> patternDaysMap = {
  SchedulePattern.satMonWed: [6, 1, 3], // السبت، الإثنين، الأربعاء
  SchedulePattern.sunTueThu: [0, 2, 4], // الأحد، الثلاثاء، الخميس
  SchedulePattern.daily: [0, 1, 2, 3, 4, 6], // يومياً عدا الجمعة
  SchedulePattern.custom: [],
};

String formatDate(DateTime d) {
  final year = d.year.toString();
  final month = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

DateTime parseDate(String dateStr) {
  final parts = dateStr.split('-');
  return DateTime(
    int.parse(parts[0]),
    int.parse(parts[1]),
    int.parse(parts[2]),
  );
}

String getArabicDayName(String dateStr) {
  final d = parseDate(dateStr);
  return arabicDays[d.weekday % 7]; // Dart DateTime.weekday: 1=Mon .. 7=Sun. d.weekday % 7: 7%7=0=Sun, 1%7=1=Mon
}

int getDayOfWeek(DateTime d) {
  return d.weekday % 7; // 0=Sunday, 1=Monday ... 6=Saturday
}

DayCapacitySummary calculateDayCapacity(
  String dateStr,
  List<Session> sessions,
  Map<String, DailyCapacitySetting> capacitySettings, [
  int defaultCapacity = defaultMaxCapacity,
]) {
  final d = parseDate(dateStr);
  final dayOfWeek = getDayOfWeek(d);
  final setting = capacitySettings[dateStr];

  // Friday is default holiday unless overridden
  final bool isDefaultWorkingDay = dayOfWeek != 5; // 5 = الجمعة
  final bool isWorkingDay = setting != null ? setting.isWorkingDay : isDefaultWorkingDay;
  final int maxCapacity = setting != null ? setting.maxCapacity : defaultCapacity;

  // Count active sessions (excluding CANCELLED)
  final bookedCount = sessions.where(
    (s) => s.sessionDate == dateStr && s.status != SessionStatus.cancelled,
  ).length;

  final percentage = maxCapacity > 0 ? ((bookedCount / maxCapacity) * 100).round() : 100;

  DayCapacityState status = DayCapacityState.available;
  if (!isWorkingDay) {
    status = DayCapacityState.holiday;
  } else if (bookedCount >= maxCapacity) {
    status = DayCapacityState.full;
  } else if (bookedCount >= maxCapacity * 0.8) {
    status = DayCapacityState.nearFull;
  }

  return DayCapacitySummary(
    date: dateStr,
    dayNameAr: arabicDays[dayOfWeek],
    dayOfWeek: dayOfWeek,
    bookedCount: bookedCount,
    maxCapacity: maxCapacity,
    isWorkingDay: isWorkingDay,
    percentage: percentage,
    status: status,
    notes: setting?.notes,
  );
}

AutoScheduleResult autoDistributeSessions({
  required String startDateStr,
  required int totalSessions,
  required List<int> preferredDays,
  required List<Session> existingSessions,
  required Map<String, DailyCapacitySetting> capacitySettings,
  bool allowOverride = false,
  int defaultCapacity = defaultMaxCapacity,
}) {
  if (totalSessions <= 0) {
    throw ArgumentError('عدد الجلسات يجب أن يكون أكبر من الصفر');
  }

  if (preferredDays.isEmpty) {
    throw ArgumentError('يجب تحديد يوم واحد على الأقل في نمط الجدولة');
  }

  final List<AutoSchedulePreviewItem> scheduledSessions = [];
  final List<SkippedDateItem> skippedDates = [];

  // Local simulated copy of sessions
  final simulatedSessions = List<Session>.from(existingSessions);

  DateTime currentDate = parseDate(startDateStr);
  const int maxDaysLookahead = 180;
  int daysScanned = 0;

  while (scheduledSessions.length < totalSessions && daysScanned < maxDaysLookahead) {
    final dayOfWeek = getDayOfWeek(currentDate);
    final dateStr = formatDate(currentDate);
    final dayNameAr = arabicDays[dayOfWeek];

    if (preferredDays.contains(dayOfWeek)) {
      final cap = calculateDayCapacity(dateStr, simulatedSessions, capacitySettings, defaultCapacity);

      if (!cap.isWorkingDay) {
        skippedDates.add(SkippedDateItem(
          date: dateStr,
          dayNameAr: dayNameAr,
          reason: cap.notes != null ? 'عطلة: ${cap.notes}' : 'عطلة أسبوعية أو رسمية',
        ));
      } else if (cap.bookedCount >= cap.maxCapacity && !allowOverride) {
        skippedDates.add(SkippedDateItem(
          date: dateStr,
          dayNameAr: dayNameAr,
          reason: 'اليوم ممتلئ بالكامل (${cap.bookedCount}/${cap.maxCapacity})',
        ));
      } else {
        final isOverrideNeeded = cap.bookedCount >= cap.maxCapacity;
        final sessionNum = scheduledSessions.length + 1;

        scheduledSessions.add(AutoSchedulePreviewItem(
          sessionNumber: sessionNum,
          date: dateStr,
          dayNameAr: dayNameAr,
          dayCapacity: cap.maxCapacity,
          dayBookedCount: cap.bookedCount + 1,
          isOverrideNeeded: isOverrideNeeded,
        ));

        simulatedSessions.add(Session(
          id: 'sim-$sessionNum',
          planId: 'sim-plan',
          patientId: 'sim-patient',
          sessionNumber: sessionNum,
          sessionDate: dateStr,
          status: SessionStatus.scheduled,
          createdAt: DateTime.now(),
        ));
      }
    }

    currentDate = currentDate.add(const Duration(days: 1));
    daysScanned++;
  }

  if (scheduledSessions.length < totalSessions) {
    throw StateError('لم نتمكن من جدولة جميع الجلسات. تم جدولة ${scheduledSessions.length} من أصل $totalSessions جلسة.');
  }

  final endDate = scheduledSessions.last.date;

  return AutoScheduleResult(
    scheduledSessions: scheduledSessions,
    skippedDates: skippedDates,
    endDate: endDate,
  );
}

ShiftResult shiftSubsequentSessions({
  required int fromSessionNumber,
  required String newStartDateStr,
  required List<int> preferredDays,
  required List<Session> allPlanSessions,
  required List<Session> allCenterSessions,
  required Map<String, DailyCapacitySetting> capacitySettings,
  bool allowOverride = false,
  int defaultCapacity = defaultMaxCapacity,
}) {
  final targetSessions = allPlanSessions
      .where((s) => s.sessionNumber >= fromSessionNumber && s.status != SessionStatus.completed)
      .toList()
    ..sort((a, b) => a.sessionNumber.compareTo(b.sessionNumber));

  if (targetSessions.isEmpty) {
    return ShiftResult(updatedSessions: [], skippedDates: []);
  }

  final targetIds = targetSessions.map((s) => s.id).toSet();
  final otherCenterSessions = allCenterSessions.where((s) => !targetIds.contains(s.id)).toList();

  final result = autoDistributeSessions(
    startDateStr: newStartDateStr,
    totalSessions: targetSessions.length,
    preferredDays: preferredDays,
    existingSessions: otherCenterSessions,
    capacitySettings: capacitySettings,
    allowOverride: allowOverride,
    defaultCapacity: defaultCapacity,
  );

  final updated = <ShiftedSessionItem>[];
  for (int i = 0; i < targetSessions.length; i++) {
    updated.add(ShiftedSessionItem(
      sessionId: targetSessions[i].id,
      oldDate: targetSessions[i].sessionDate,
      newDate: result.scheduledSessions[i].date,
    ));
  }

  return ShiftResult(
    updatedSessions: updated,
    skippedDates: result.skippedDates,
  );
}
