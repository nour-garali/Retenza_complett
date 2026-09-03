import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/explore_service.dart';

// Provider pour la liste des suggestions
final suggestionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  return ExploreService.getSuggestions();
});

// Provider pour la liste des favoris
final favoritesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  return ExploreService.getFavorites();
});

class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() {
    return '';
  }

  void updateQuery(String query) {
    state = query;
  }
}

// NotifierProvider pour la requête de recherche
final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(() {
  return SearchQueryNotifier();
});

// FutureProvider qui écoute la requête et appelle l'API
final searchProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  if (query.trim().isEmpty) return [];
  return ExploreService.searchCommerces(query);
});

// Actions sur les favoris
final favoriteActionProvider = Provider((ref) => FavoriteAction(ref));

class FavoriteAction {
  final Ref ref;
  FavoriteAction(this.ref);

  Future<bool> toggleFavorite(String commerceId, bool isCurrentlyFavorite) async {
    bool success;
    if (isCurrentlyFavorite) {
      success = await ExploreService.removeFavorite(commerceId);
    } else {
      success = await ExploreService.addFavorite(commerceId);
    }
    
    // Si l'action a rÃ©ussi, on rafraÃ®chit la liste des favoris et suggestions
    if (success) {
      ref.invalidate(favoritesProvider);
      ref.invalidate(suggestionsProvider);
      // On rafraÃ®chit Ã©galement la recherche si elle est active
    }
    return success;
  }
}
