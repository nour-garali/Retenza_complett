import 'package:dio/dio.dart';
import 'api_client.dart';

class ExploreService {
  /// Récupère les suggestions de commerces
  static Future<List<dynamic>> getSuggestions() async {
    try {
      final response = await apiClient.get('/clients/commerces/suggestions');
      if (response.statusCode == 200) {
        return response.data['data']['commerces'] ?? [];
      }
      return [];
    } catch (e) {
      print('Erreur lors de la récupération des suggestions : $e');
      throw e;
    }
  }

  /// Recherche des commerces par nom ou catégorie
  static Future<List<dynamic>> searchCommerces(String query) async {
    try {
      if (query.trim().isEmpty) return [];
      
      final response = await apiClient.get('/clients/commerces/search', queryParameters: {
        'query': query,
      });
      if (response.statusCode == 200) {
        return response.data['data']['commerces'] ?? [];
      }
      return [];
    } catch (e) {
      print('Erreur lors de la recherche : $e');
      throw e;
    }
  }

  /// Récupère la liste des favoris de l'utilisateur
  static Future<List<dynamic>> getFavorites() async {
    try {
      final response = await apiClient.get('/clients/favorites');
      if (response.statusCode == 200) {
        return response.data['data']['favorites'] ?? [];
      }
      return [];
    } catch (e) {
      print('Erreur lors de la récupération des favoris : $e');
      throw e;
    }
  }

  /// Ajoute un commerce aux favoris
  static Future<bool> addFavorite(String commerceId) async {
    try {
      final response = await apiClient.post('/clients/favorites/$commerceId');
      return response.statusCode == 200;
    } catch (e) {
      print('Erreur lors de l\'ajout aux favoris : $e');
      return false;
    }
  }

  /// Retire un commerce des favoris
  static Future<bool> removeFavorite(String commerceId) async {
    try {
      final response = await apiClient.delete('/clients/favorites/$commerceId');
      return response.statusCode == 200;
    } catch (e) {
      print('Erreur lors de la suppression des favoris : $e');
      return false;
    }
  }
}
