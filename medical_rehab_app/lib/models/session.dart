enum SessionStatus {
  scheduled,
  completed,
  cancelled,
  noShow,
  rescheduled;

  String toArabic() {
    switch (this) {
      case SessionStatus.scheduled:
        return 'مجدولة';
      case SessionStatus.completed:
        return 'مكتملة';
      case SessionStatus.cancelled:
        return 'ملغاة';
      case SessionStatus.noShow:
        return 'لم يحضر';
      case SessionStatus.rescheduled:
        return 'مؤجلة';
    }
  }

  static SessionStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'SCHEDULED':
        return SessionStatus.scheduled;
      case 'COMPLETED':
        return SessionStatus.completed;
      case 'CANCELLED':
        return SessionStatus.cancelled;
      case 'NO_SHOW':
        return SessionStatus.noShow;
      case 'RESCHEDULED':
        return SessionStatus.rescheduled;
      default:
        return SessionStatus.scheduled;
    }
  }

  String toKey() {
    switch (this) {
      case SessionStatus.scheduled:
        return 'SCHEDULED';
      case SessionStatus.completed:
        return 'COMPLETED';
      case SessionStatus.cancelled:
        return 'CANCELLED';
      case SessionStatus.noShow:
        return 'NO_SHOW';
      case SessionStatus.rescheduled:
        return 'RESCHEDULED';
    }
  }
}

class Session {
  final String id;
  final String planId;
  final String patientId;
  final int sessionNumber;
  final String sessionDate; // YYYY-MM-DD
  final SessionStatus status;
  final String? therapistName;
  final String? notes;
  final bool? isOverride;
  final String? rescheduledFromDate;
  final DateTime createdAt;

  Session({
    required this.id,
    required this.planId,
    required this.patientId,
    required this.sessionNumber,
    required this.sessionDate,
    required this.status,
    this.therapistName,
    this.notes,
    this.isOverride = false,
    this.rescheduledFromDate,
    required this.createdAt,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      id: json['id'] as String,
      planId: json['planId'] as String,
      patientId: json['patientId'] as String,
      sessionNumber: (json['sessionNumber'] as num).toInt(),
      sessionDate: json['sessionDate'] as String,
      status: SessionStatus.fromString(json['status']?.toString() ?? 'SCHEDULED'),
      therapistName: json['therapistName'] as String?,
      notes: json['notes'] as String?,
      isOverride: json['isOverride'] as bool? ?? false,
      rescheduledFromDate: json['rescheduledFromDate'] as String?,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'planId': planId,
      'patientId': patientId,
      'sessionNumber': sessionNumber,
      'sessionDate': sessionDate,
      'status': status.toKey(),
      'therapistName': therapistName,
      'notes': notes,
      'isOverride': isOverride,
      'rescheduledFromDate': rescheduledFromDate,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Session copyWith({
    String? id,
    String? planId,
    String? patientId,
    int? sessionNumber,
    String? sessionDate,
    SessionStatus? status,
    String? therapistName,
    String? notes,
    bool? isOverride,
    String? rescheduledFromDate,
    DateTime? createdAt,
  }) {
    return Session(
      id: id ?? this.id,
      planId: planId ?? this.planId,
      patientId: patientId ?? this.patientId,
      sessionNumber: sessionNumber ?? this.sessionNumber,
      sessionDate: sessionDate ?? this.sessionDate,
      status: status ?? this.status,
      therapistName: therapistName ?? this.therapistName,
      notes: notes ?? this.notes,
      isOverride: isOverride ?? this.isOverride,
      rescheduledFromDate: rescheduledFromDate ?? this.rescheduledFromDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
