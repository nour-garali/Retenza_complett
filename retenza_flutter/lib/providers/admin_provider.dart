import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/admin_service.dart';

// ── Stats globales ─────────────────────────────────────────────────
final adminStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return await AdminService.getStatistics();
});

// ── Commerces ──────────────────────────────────────────────────────
final adminCommercesProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getCommerces(status: 'active');
});

final adminPendingProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getCommerces(status: 'pending');
});

// ── Support ────────────────────────────────────────────────────────
final adminSupportProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getSupportRequests();
});

final adminSupportOpenProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getSupportRequests(status: 'open');
});

// ── Incidents ──────────────────────────────────────────────────────
final adminIncidentsProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getIncidents();
});

final adminIncidentsOpenProvider = FutureProvider<List<dynamic>>((ref) async {
  return await AdminService.getIncidents(status: 'reported');
});
