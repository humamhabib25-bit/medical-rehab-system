enum PlanStatus {
  active,
  completed,
  suspended,
  cancelled;

  String toArabic() {
    switch (this) {
      case PlanStatus.active:
        return 'نشطة';
      case PlanStatus.completed:
        return 'مكتملة';
      case PlanStatus.suspended:
        return 'معلقة';
      case PlanStatus.cancelled:
        return 'ملغاة';
    }
  }

  static PlanStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'ACTIVE':
        return PlanStatus.active;
      case 'COMPLETED':
        return PlanStatus.completed;
      case 'SUSPENDED':
        return PlanStatus.suspended;
      case 'CANCELLED':
        return PlanStatus.cancelled;
      default:
        return PlanStatus.active;
    }
  }

  String toKey() => name.toUpperCase();
}

enum PaymentStatus {
  paid,
  partiallyPaid,
  unpaid;

  String toArabic() {
    switch (this) {
      case PaymentStatus.paid:
        return 'مدفوع بالكامل';
      case PaymentStatus.partiallyPaid:
        return 'مدفوع جزئياً';
      case PaymentStatus.unpaid:
        return 'غير مدفوع';
    }
  }

  static PaymentStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'PAID':
        return PaymentStatus.paid;
      case 'PARTIALLY_PAID':
        return PaymentStatus.partiallyPaid;
      case 'UNPAID':
        return PaymentStatus.unpaid;
      default:
        return PaymentStatus.unpaid;
    }
  }

  String toKey() {
    switch (this) {
      case PaymentStatus.paid:
        return 'PAID';
      case PaymentStatus.partiallyPaid:
        return 'PARTIALLY_PAID';
      case PaymentStatus.unpaid:
        return 'UNPAID';
    }
  }
}

enum SchedulePattern {
  satMonWed,
  sunTueThu,
  daily,
  custom;

  String toArabic() {
    switch (this) {
      case SchedulePattern.satMonWed:
        return 'سبت - إثنين - أربعاء';
      case SchedulePattern.sunTueThu:
        return 'أحد - ثلاثاء - خميس';
      case SchedulePattern.daily:
        return 'يومياً (عدا الجمعة)';
      case SchedulePattern.custom:
        return 'أيام مخصصة';
    }
  }

  static SchedulePattern fromString(String value) {
    switch (value.toUpperCase()) {
      case 'SAT_MON_WED':
        return SchedulePattern.satMonWed;
      case 'SUN_TUE_THU':
        return SchedulePattern.sunTueThu;
      case 'DAILY':
        return SchedulePattern.daily;
      case 'CUSTOM':
      default:
        return SchedulePattern.custom;
    }
  }

  String toKey() {
    switch (this) {
      case SchedulePattern.satMonWed:
        return 'SAT_MON_WED';
      case SchedulePattern.sunTueThu:
        return 'SUN_TUE_THU';
      case SchedulePattern.daily:
        return 'DAILY';
      case SchedulePattern.custom:
        return 'CUSTOM';
    }
  }
}

class TreatmentPlan {
  final String id;
  final String patientId;
  final int totalSessions;
  final int completedSessions;
  final PlanStatus status;
  final String startDate; // YYYY-MM-DD
  final SchedulePattern preferredPattern;
  final List<int> preferredDays; // 0 = Sun, 1 = Mon ... 6 = Sat
  final double? pricePerSession;
  final double totalPrice;
  final double paidAmount;
  final PaymentStatus paymentStatus;
  final String? notes;
  final DateTime createdAt;

  TreatmentPlan({
    required this.id,
    required this.patientId,
    required this.totalSessions,
    required this.completedSessions,
    required this.status,
    required this.startDate,
    required this.preferredPattern,
    required this.preferredDays,
    this.pricePerSession,
    required this.totalPrice,
    required this.paidAmount,
    required this.paymentStatus,
    this.notes,
    required this.createdAt,
  });

  double get remainingAmount => (totalPrice - paidAmount).clamp(0, double.infinity);
  double get progressPercentage => totalSessions > 0 ? (completedSessions / totalSessions) : 0;

  factory TreatmentPlan.fromJson(Map<String, dynamic> json) {
    return TreatmentPlan(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      totalSessions: (json['totalSessions'] as num).toInt(),
      completedSessions: (json['completedSessions'] as num?)?.toInt() ?? 0,
      status: PlanStatus.fromString(json['status']?.toString() ?? 'ACTIVE'),
      startDate: json['startDate'] as String,
      preferredPattern: SchedulePattern.fromString(json['preferredPattern']?.toString() ?? 'CUSTOM'),
      preferredDays: (json['preferredDays'] as List<dynamic>?)?.map((e) => (e as num).toInt()).toList() ?? [],
      pricePerSession: (json['pricePerSession'] as num?)?.toDouble(),
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0.0,
      paymentStatus: PaymentStatus.fromString(json['paymentStatus']?.toString() ?? 'UNPAID'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'totalSessions': totalSessions,
      'completedSessions': completedSessions,
      'status': status.toKey(),
      'startDate': startDate,
      'preferredPattern': preferredPattern.toKey(),
      'preferredDays': preferredDays,
      'pricePerSession': pricePerSession,
      'totalPrice': totalPrice,
      'paidAmount': paidAmount,
      'paymentStatus': paymentStatus.toKey(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  TreatmentPlan copyWith({
    String? id,
    String? patientId,
    int? totalSessions,
    int? completedSessions,
    PlanStatus? status,
    String? startDate,
    SchedulePattern? preferredPattern,
    List<int>? preferredDays,
    double? pricePerSession,
    double? totalPrice,
    double? paidAmount,
    PaymentStatus? paymentStatus,
    String? notes,
    DateTime? createdAt,
  }) {
    return TreatmentPlan(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      totalSessions: totalSessions ?? this.totalSessions,
      completedSessions: completedSessions ?? this.completedSessions,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      preferredPattern: preferredPattern ?? this.preferredPattern,
      preferredDays: preferredDays ?? this.preferredDays,
      pricePerSession: pricePerSession ?? this.pricePerSession,
      totalPrice: totalPrice ?? this.totalPrice,
      paidAmount: paidAmount ?? this.paidAmount,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
