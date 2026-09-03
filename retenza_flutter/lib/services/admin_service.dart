import 'package:dio/dio.dart';
import 'api_client.dart';

class AdminService {
  // ── Statistiques globales ──────────────────────────────────────────
  static Future<Map<String, dynamic>> getStatistics() async {
    try {
      final res = await apiClient.get('/admin/statistics');
      return res.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur lors du chargement des statistiques');
    }
  }

  // ── Commerces ─────────────────────────────────────────────────────
  static Future<List<dynamic>> getCommerces({String? status}) async {
    try {
      final res = await apiClient.get('/admin/commerces', queryParameters: {
        if (status != null) 'status': status,
        'limit': 100,
      });
      return res.data['data']['commerces'] as List<dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur lors du chargement des commerces');
    }
  }

  static Future<void> approveCommerce(String id) async {
    try {
      await apiClient.patch('/admin/commerces/$id/activate');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur d\'approbation');
    }
  }

  static Future<void> rejectCommerce(String id) async {
    try {
      await apiClient.delete('/admin/commerces/$id');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur de rejet');
    }
  }

  // ── Support ───────────────────────────────────────────────────────
  static Future<List<dynamic>> getSupportRequests({String? status}) async {
    try {
      final res = await apiClient.get('/admin/support', queryParameters: {
        if (status != null) 'status': status,
        'limit': 50,
      });
      return res.data['data']['requests'] as List<dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur support');
    }
  }

  static Future<void> respondToSupport(String id, String message) async {
    try {
      await apiClient.post('/admin/support/$id/respond', data: {'message': message});
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur lors de l\'envoi de la réponse');
    }
  }

  static Future<void> closeSupportRequest(String id) async {
    try {
      await apiClient.patch('/admin/support/$id/close');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur lors de la fermeture');
    }
  }

  // ── Incidents ─────────────────────────────────────────────────────
  static Future<List<dynamic>> getIncidents({String? status}) async {
    try {
      final res = await apiClient.get('/admin/incidents', queryParameters: {
        if (status != null) 'status': status,
        'limit': 50,
      });
      return res.data['data']['incidents'] as List<dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur incidents');
    }
  }

  static Future<void> respondToIncident(String id, String message) async {
    try {
      await apiClient.post('/admin/incidents/$id/respond', data: {'message': message});
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur lors de la réponse à l\'incident');
    }
  }

  static Future<void> updateIncidentStatus(String id, String status) async {
    try {
      await apiClient.patch('/admin/incidents/$id/status', data: {'status': status});
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur de mise à jour du statut');
    }
  }
}
