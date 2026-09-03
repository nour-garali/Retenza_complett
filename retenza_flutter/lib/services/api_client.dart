import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

// ══════════════════════════════════════════════════════════════
//  API CLIENT - Smart Auto-Detection
//  Ce client resout le probleme "Ca marche sur PC mais pas Mobile" :
//  1. Sur Web : toujours localhost.
//  2. Sur Mobile : Teste rapidement le cable USB, sinon bascule 
//     automatiquement sur le Wi-Fi de ton PC !
// ══════════════════════════════════════════════════════════════

class ApiClient {
  static const String _webUrl = 'http://localhost:3000/api';
  static const String _usbUrl = 'http://127.0.0.1:3000/api';
  static const String _wifiUrl = 'http://192.168.0.171:3000/api';

  static String _activeBaseUrl = kIsWeb ? _webUrl : _usbUrl;
  static bool _hasDetectedNetwork = kIsWeb; // Sur web, pas besoin de detecter

  late final Dio dio;

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: _activeBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Auto-detection reseau au premier lancement sur mobile
          if (!_hasDetectedNetwork) {
            await _detectBestNetwork();
            options.baseUrl = _activeBaseUrl; // Appliquer la bonne URL
          }

          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          print('[ApiClient] Erreur: ${e.type} -> ${e.requestOptions.uri}');
          
          // Si on perd la connexion, on peut re-detecter a la prochaine requete
          if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.connectionError) {
             _hasDetectedNetwork = false; 
          }
          
          return handler.next(e);
        },
      ),
    );
  }

  /// Fonction magique : essaie le cable USB, si echec, prend le Wi-Fi (IP du PC)
  Future<void> _detectBestNetwork() async {
    _hasDetectedNetwork = true;
    // Timeout plus long pour laisser le temps à adb reverse de répondre
    final tester = Dio(BaseOptions(connectTimeout: const Duration(milliseconds: 3000)));

    try {
      print('🔍 [ApiClient] Test USB (adb reverse tcp:3000 tcp:3000)...');
      await tester.get('$_usbUrl/health');
      _activeBaseUrl = _usbUrl;
      dio.options.baseUrl = _usbUrl;
      print('✅ [ApiClient] SUCCÈS — Connecté via Câble USB !');
      return;
    } catch (e) {
      print('❌ [ApiClient] USB échoué: $e');
      print('💡 [ApiClient] CONSEIL : Lance "adb reverse tcp:3000 tcp:3000" dans un terminal et réessaie.');
    }

    try {
      print('🔍 [ApiClient] Test Wi-Fi ($_wifiUrl)...');
      await tester.get('$_wifiUrl/health');
      _activeBaseUrl = _wifiUrl;
      dio.options.baseUrl = _wifiUrl;
      print('✅ [ApiClient] SUCCÈS — Connecté via Wi-Fi (192.168.0.171) !');
      return;
    } catch (e) {
      print('❌ [ApiClient] Wi-Fi échoué aussi: $e');
      print('💡 [ApiClient] CONSEIL : Vérifie que ton backend tourne et que le téléphone est sur le même réseau Wi-Fi que ton PC.');
    }
  }
}

// Instance globale singleton
final apiClient = ApiClient().dio;
