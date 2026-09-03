import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/client_service.dart';

// ══════════════════════════════════════════════════════════════
//  CLIENT PROVIDER
//  Gère l'état et la mise en cache des données du tableau de bord client
// ══════════════════════════════════════════════════════════════

final clientDashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return await ClientService.getDashboard();
});
