import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:retenza_flutter/main.dart';
import 'dart:io';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Capture Onboarding Screens', (tester) async {
    await tester.pumpWidget(const RetenzaApp());
    await tester.pumpAndSettle();

    // The splash screen lasts 3 seconds, wait for it
    await Future.delayed(const Duration(seconds: 4));
    await tester.pumpAndSettle();

    // We are on onboarding page 1
    await binding.convertFlutterSurfaceToImage();
    await tester.pumpAndSettle();
    final bytes1 = await binding.takeScreenshot('onboarding_1');
    if (bytes1 != null) {
      File('onboarding_1.png').writeAsBytesSync(bytes1);
    }

    // Tap next
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();
    
    // Onboarding page 2
    final bytes2 = await binding.takeScreenshot('onboarding_2');
    if (bytes2 != null) {
      File('onboarding_2.png').writeAsBytesSync(bytes2);
    }

    // Tap next
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();

    // Onboarding page 3
    final bytes3 = await binding.takeScreenshot('onboarding_3');
    if (bytes3 != null) {
      File('onboarding_3.png').writeAsBytesSync(bytes3);
    }
  });
}
