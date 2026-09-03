import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

// ══════════════════════════════════════════════════════════════
//  AUTH SERVICE
//  Gestion des requêtes d'authentification vers le backend
// ══════════════════════════════════════════════════════════════

class AuthService {
  /// Inscrit un client suite au scan d'un QR code (lié à un commerce)
  static Future<bool> registerWithQR({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
    required String qrCode,
  }) async {
    try {
      final response = await apiClient.post(
        '/clients/register-qr',
        data: {
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'phone': phone,
          'password': password,
          'qrCode': qrCode,
        },
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        // Après l'inscription, on connecte le compte pour avoir le token
        return await login(email: email, password: password);
      }
      return false;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Erreur lors de l\'inscription');
      }
      throw Exception('Reseau: ${e.type.name} | ${e.message ?? 'sans detail'}');
    }
  }

  /// Inscrit un commerçant (demande de partenariat)
  static Future<void> registerMerchant({
    required String commerceName,
    required String ownerName,
    required String email,
    required String phone,
    required String category,
    required String address,
    required String password,
  }) async {
    // Split ownerName into firstName / lastName
    final parts = ownerName.trim().split(' ');
    final firstName = parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '.';

    try {
      final response = await apiClient.post(
        '/auth/register/merchant',
        data: {
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'phone': phone,
          'commerceName': commerceName,
          'category': category,
          'address': address,
          'password': password,
        },
      );

      if (response.statusCode != 201) {
        throw Exception('Erreur lors de la soumission');
      }
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Erreur lors de l\'inscription commerçant');
      }
      throw Exception('Reseau[merchant]: ${e.type.name} | ${e.message ?? "?"}');
    }
  }

  /// Connecte l'utilisateur
  static Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await apiClient.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data != null && data['token'] != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', data['token']);
          // Optional: store role if needed
          if (data['user'] != null && data['user']['role'] != null) {
            await prefs.setString('user_role', data['user']['role']);
          }
          return true;
        }
      }
      return false;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        throw Exception(e.response?.data['message'] ?? 'Erreur lors de la connexion');
      }
      throw Exception('Reseau[login]: ${e.type.name} | ${e.message ?? "?"}');
    }
  }

  /// Déconnecte l'utilisateur
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_role');
  }
}
