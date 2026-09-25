class DailyCapacitySetting {
  final String date; // YYYY-MM-DD
  final int maxCapacity;
  final bool isWorkingDay;
  final String? notes;

  DailyCapacitySetting({
    required this.date,
    required this.maxCapacity,
    required this.isWorkingDay,
    this.notes,
  });

  factory DailyCapacitySetting.fromJson(Map<String, dynamic> json) {
    return DailyCapacitySetting(
      date: json['date'] as String,
      maxCapacity: (json['maxCapacity'] as num).toInt(),
      isWorkingDay: json['isWorkingDay'] as bool? ?? true,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'maxCapacity': maxCapacity,
      'isWorkingDay': isWorkingDay,
      'notes': notes,
    };
  }

  DailyCapacitySetting copyWith({
    String? date,
    int? maxCapacity,
    bool? isWorkingDay,
    String? notes,
  }) {
    return DailyCapacitySetting(
      date: date ?? this.date,
      maxCapacity: maxCapacity ?? this.maxCapacity,
      isWorkingDay: isWorkingDay ?? this.isWorkingDay,
      notes: notes ?? this.notes,
    );
  }
}
