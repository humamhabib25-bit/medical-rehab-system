enum DayCapacityState {
  available,
  nearFull,
  full,
  holiday;

  String toArabic() {
    switch (this) {
      case DayCapacityState.available:
        return 'متاح';
      case DayCapacityState.nearFull:
        return 'شبه ممتلئ';
      case DayCapacityState.full:
        return 'ممتلئ بالكامل';
      case DayCapacityState.holiday:
        return 'عطلة';
    }
  }
}

class DayCapacitySummary {
  final String date;
  final String dayNameAr;
  final int dayOfWeek; // 0=Sun, ..., 6=Sat
  final int bookedCount;
  final int maxCapacity;
  final bool isWorkingDay;
  final int percentage;
  final DayCapacityState status;
  final String? notes;

  DayCapacitySummary({
    required this.date,
    required this.dayNameAr,
    required this.dayOfWeek,
    required this.bookedCount,
    required this.maxCapacity,
    required this.isWorkingDay,
    required this.percentage,
    required this.status,
    this.notes,
  });
}

class AutoSchedulePreviewItem {
  final int sessionNumber;
  final String date;
  final String dayNameAr;
  final int dayCapacity;
  final int dayBookedCount;
  final bool isOverrideNeeded;

  AutoSchedulePreviewItem({
    required this.sessionNumber,
    required this.date,
    required this.dayNameAr,
    required this.dayCapacity,
    required this.dayBookedCount,
    required this.isOverrideNeeded,
  });
}

class SkippedDateItem {
  final String date;
  final String dayNameAr;
  final String reason;

  SkippedDateItem({
    required this.date,
    required this.dayNameAr,
    required this.reason,
  });
}

class AutoScheduleResult {
  final List<AutoSchedulePreviewItem> scheduledSessions;
  final List<SkippedDateItem> skippedDates;
  final String endDate;

  AutoScheduleResult({
    required this.scheduledSessions,
    required this.skippedDates,
    required this.endDate,
  });
}

class ShiftResult {
  final List<ShiftedSessionItem> updatedSessions;
  final List<SkippedDateItem> skippedDates;

  ShiftResult({
    required this.updatedSessions,
    required this.skippedDates,
  });
}

class ShiftedSessionItem {
  final String sessionId;
  final String oldDate;
  final String newDate;

  ShiftedSessionItem({
    required this.sessionId,
    required this.oldDate,
    required this.newDate,
  });
}
