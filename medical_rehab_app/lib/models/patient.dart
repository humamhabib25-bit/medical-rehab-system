class Patient {
  final String id;
  final String fullName;
  final String phone;
  final String? nationalId;
  final String initialDiagnosis;
  final String? notes;
  final DateTime createdAt;

  Patient({
    required this.id,
    required this.fullName,
    required this.phone,
    this.nationalId,
    required this.initialDiagnosis,
    this.notes,
    required this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      phone: json['phone'] as String,
      nationalId: json['nationalId'] as String?,
      initialDiagnosis: json['initialDiagnosis'] as String,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'nationalId': nationalId,
      'initialDiagnosis': initialDiagnosis,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Patient copyWith({
    String? id,
    String? fullName,
    String? phone,
    String? nationalId,
    String? initialDiagnosis,
    String? notes,
    DateTime? createdAt,
  }) {
    return Patient(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      nationalId: nationalId ?? this.nationalId,
      initialDiagnosis: initialDiagnosis ?? this.initialDiagnosis,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
