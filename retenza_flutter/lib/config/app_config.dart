import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

/// AppConfig centralise la configuration de l URL du backend.
class AppConfig {
  static const String _keyBackendUrl = 'backend_url';

  static const String webUrl      = 'http://localhost:3000/api';
  static const String wifiUrl     = 'http://192.168.0.171:3000/api';

  static String? _cachedUrl;

  static Future<String> getBaseUrl() async {
    if (_cachedUrl != null) return _cachedUrl!;
    if (kIsWeb) { _cachedUrl = webUrl; return _cachedUrl!; }
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyBackendUrl);
    _cachedUrl = saved ?? wifiUrl;
    return _cachedUrl!;
  }

  static Future<void> setBaseUrl(String url) async {
    _cachedUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBackendUrl, url);
  }

  static Future<void> resetToDefault() async {
    _cachedUrl = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyBackendUrl);
  }
}
