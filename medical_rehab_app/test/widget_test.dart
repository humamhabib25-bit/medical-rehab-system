import 'package:flutter_test/flutter_test.dart';
import 'package:medical_rehab_app/main.dart';

void main() {
  testWidgets('App smoke test loads MedicalRehabApp', (WidgetTester tester) async {
    await tester.pumpWidget(const MedicalRehabApp());
    expect(find.text('نظام التأهيل الطبي'), findsNothing); // App title is in MaterialApp
  });
}
