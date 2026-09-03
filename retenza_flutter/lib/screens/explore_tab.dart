import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/client_provider.dart';
import '../providers/explore_provider.dart';
import '../services/api_client.dart';
import 'commerce_detail_screen.dart';

class ExploreTab extends ConsumerStatefulWidget {
  const ExploreTab({super.key});

  @override
  ConsumerState<ExploreTab> createState() => _ExploreTabState();
}

class _ExploreTabState extends ConsumerState<ExploreTab> {
  int _selectedTabIndex = 0; // 0 = Récompenses, 1 = Explorer
  final TextEditingController _searchController = TextEditingController();
  
  // Catégories pour les chips
  final List<Map<String, String>> _categories = [
    {'name': 'Tous', 'icon': ''},
    {'name': 'Café', 'icon': '☕'},
    {'name': 'Restaurant', 'icon': '🍽️'},
    {'name': 'Beauté', 'icon': '💇‍♀️'},
    {'name': 'Shopping', 'icon': '🛍️'},
  ];
  String _selectedCategory = 'Tous';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    ref.read(searchQueryProvider.notifier).updateQuery(value);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          // Header with Chips
          Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
            color: const Color(0xFFF9F9F9),
            child: Row(
              children: [
                _buildTabChip(0, '🎁 Récompenses'),
                const SizedBox(width: 12),
                _buildTabChip(1, '🔍 Explorer'),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: _selectedTabIndex == 0 
                ? const _RewardsSubTab() 
                : _buildExploreSubTab(),
          ),
        ],
      ),
    );
  }

  Widget _buildTabChip(int index, String label) {
    final isSelected = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1B100C) : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: isSelected ? const Color(0xFF1B100C) : const Color(0xFFE0E0E0),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF9C8B82),
          ),
        ),
      ),
    );
  }

  Widget _buildExploreSubTab() {
    final searchResults = ref.watch(searchProvider);
    final isSearching = _searchController.text.trim().isNotEmpty;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 120), // Espace pour la bottom nav
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Barre de recherche
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF4EFEB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Color(0xFF9C8B82)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Rechercher un commerçant...',
                        hintStyle: GoogleFonts.inter(color: const Color(0xFF9C8B82)),
                      ),
                      style: GoogleFonts.inter(color: const Color(0xFF1B100C)),
                    ),
                  ),
                  if (isSearching)
                    GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        ref.read(searchQueryProvider.notifier).updateQuery('');
                      },
                      child: const Icon(Icons.close, color: Color(0xFF9C8B82)),
                    )
                ],
              ),
            ),
          ),

          if (isSearching)
            _buildSearchResults(searchResults)
          else
            _buildDefaultExploreView(),
        ],
      ),
    );
  }

  Widget _buildSearchResults(AsyncValue<List<dynamic>> searchResults) {
    return searchResults.when(
      loading: () => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: Color(0xFFD73E26)))),
      error: (e, st) => Center(child: Text('Erreur: $e')),
      data: (results) {
        if (results.isEmpty) {
          return const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('Aucun résultat trouvé.')));
        }
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: results.length,
          itemBuilder: (context, index) {
            final commerce = results[index];
            return _buildCommerceCard(commerce, isFavorite: false); // Simplified for search results
          },
        );
      },
    );
  }

  Widget _buildDefaultExploreView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 2. Chips Catégories
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: _categories.map((cat) {
              final isSelected = _selectedCategory == cat['name'];
              return GestureDetector(
                onTap: () => setState(() => _selectedCategory = cat['name']!),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF1B100C) : Colors.white,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: const Color(0xFFEDE5DF)),
                  ),
                  child: Row(
                    children: [
                      if (cat['icon']!.isNotEmpty) ...[
                        Text(cat['icon']!),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        cat['name']!,
                        style: GoogleFonts.inter(
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isSelected ? Colors.white : const Color(0xFF1B100C),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 32),

        // 3. Mes Favoris
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            '❤️ Mes Favoris',
            style: GoogleFonts.bricolageGrotesque(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1B100C)),
          ),
        ),
        const SizedBox(height: 16),
        _buildFavoritesSection(),
        const SizedBox(height: 32),

        // 4. Suggestions pour vous
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Suggestions pour vous',
            style: GoogleFonts.bricolageGrotesque(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1B100C)),
          ),
        ),
        const SizedBox(height: 16),
        _buildSuggestionsSection(),
      ],
    );
  }

  Widget _buildFavoritesSection() {
    final favoritesAsync = ref.watch(favoritesProvider);
    return favoritesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFD73E26))),
      error: (e, st) => const Center(child: Text('Erreur de chargement des favoris')),
      data: (favorites) {
        if (favorites.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF4EFEB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                "Vous n'avez pas encore de commerces favoris. Explorez ci-dessous pour en ajouter !",
                style: GoogleFonts.inter(color: const Color(0xFF9C8B82)),
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: favorites.map((commerce) {
              return _buildFavoriteMiniCard(commerce);
            }).toList(),
          ),
        );
      },
    );
  }

  Widget _buildSuggestionsSection() {
    final suggestionsAsync = ref.watch(suggestionsProvider);
    final favoritesAsync = ref.watch(favoritesProvider);
    
    // Récupérer les IDs des favoris pour l'état du coeur
    final favoriteIds = favoritesAsync.maybeWhen(
      data: (favs) => favs.map((c) => c['_id'].toString()).toSet(),
      orElse: () => <String>{},
    );

    return suggestionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFD73E26))),
      error: (e, st) => const Center(child: Text('Erreur de chargement des suggestions')),
      data: (suggestions) {
        // Filtrage local par catégorie si nécessaire
        final filtered = _selectedCategory == 'Tous' 
            ? suggestions 
            : suggestions.where((c) {
                final cat = c['category']?.toString() ?? '';
                return cat.toLowerCase().contains(_selectedCategory.toLowerCase());
              }).toList();

        if (filtered.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(20),
            child: Text('Aucune suggestion pour cette catégorie.'),
          );
        }

        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final commerce = filtered[index];
            final isFav = favoriteIds.contains(commerce['_id'].toString());
            return _buildCommerceCard(commerce, isFavorite: isFav, index: index);
          },
        );
      },
    );
  }

  Widget _buildFavoriteMiniCard(dynamic commerce) {
    final name = commerce['name'] ?? 'Commerce';
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => CommerceDetailScreen(commerce: commerce)));
      },
      child: Container(
        width: 120,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEDE5DF)),
          boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
        ),
        child: Column(
          children: [
            Container(
              width: 48, height: 48,
              decoration: const BoxDecoration(
                color: Color(0xFFF4EFEB),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.store, color: Color(0xFF1B100C)),
            ),
            const SizedBox(height: 12),
            Text(
              name,
              style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommerceCard(dynamic commerce, {required bool isFavorite, int index = 0}) {
    final name = commerce['name'] ?? 'Commerce';
    final category = commerce['category'] ?? 'Commerce local';
    final loyaltyProgram = commerce['loyaltyProgram'] ?? {};
    final type = loyaltyProgram['type'] == 'cashback' ? 'Cashback' : 'Points';

    // Badge attractif
    String badgeText = '';
    Color badgeColor = Colors.transparent;
    if (index % 3 == 0) {
      badgeText = 'Nouveau';
      badgeColor = const Color(0xFF2E7D32); // Vert
    } else if (index % 3 == 1) {
      badgeText = 'Populaire';
      badgeColor = const Color(0xFFD73E26); // Rouge
    } else {
      badgeText = 'Tendance';
      badgeColor = const Color(0xFF1976D2); // Bleu
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => CommerceDetailScreen(commerce: commerce)));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEDE5DF)),
          boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
        ),
        child: Row(
          children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFFF4EFEB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.storefront_rounded, size: 32, color: Color(0xFF1B100C)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.bricolageGrotesque(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1B100C)),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 14, color: Color(0xFFFFB300)),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          category, 
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9C8B82)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(color: Color(0xFFD9D9D9), shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Text(type, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF1B100C))),
                    ],
                  ),
                  if (badgeText.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        badgeText,
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: badgeColor),
                      ),
                    ),
                  ]
                ],
              ),
            ),
            GestureDetector(
              onTap: () async {
                final success = await ref.read(favoriteActionProvider).toggleFavorite(commerce['_id'].toString(), isFavorite);
                if (!success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors de la modification des favoris')));
                }
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFF9F9F9),
                ),
                child: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? const Color(0xFFD73E26) : const Color(0xFF9C8B82),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// RÃ‰COMPENSES SUB-TAB (Code migrÃ© depuis l'ancien CadeauxTab)
// ---------------------------------------------------------------------------

class _RewardsSubTab extends ConsumerStatefulWidget {
  const _RewardsSubTab();

  @override
  ConsumerState<_RewardsSubTab> createState() => _RewardsSubTabState();
}

class _RewardsSubTabState extends ConsumerState<_RewardsSubTab> {
  bool _isLoading = false;

  Future<void> _redeemReward(String commerceId, String title, int cost) async {
    setState(() => _isLoading = true);
    try {
      final res = await apiClient.post('/clients/redeem', data: {
        'commerceId': commerceId,
        'programType': 'points',
        'amount': cost,
        'description': title,
      });

      if (res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('🎉 $title débloqué avec succès !'), backgroundColor: Colors.green),
          );
        }
        ref.invalidate(clientDashboardProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur: Impossible de débloquer la récompense.'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(clientDashboardProvider);

    return dashboardAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFD73E26))),
      error: (e, st) => Center(child: Text('Erreur : $e')),
      data: (data) {
        final totals = data['totals'] ?? {};
        final totalPoints = (totals['points'] ?? 0).toInt();

        final accounts = List<dynamic>.from(data['loyaltyAccounts'] ?? []);
        String? commerceId;
        if (accounts.isNotEmpty) {
          final commerce = accounts.first['commerce'];
          if (commerce != null && commerce is Map) {
            commerceId = commerce['_id'];
          }
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(clientDashboardProvider),
          color: const Color(0xFFD73E26),
          child: Stack(
            children: [
              SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // TOP BANNER (Black with Gift)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1B100C),
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 20, offset: Offset(0, 10))],
                      ),
                      child: Column(
                        children: [
                          const Text('🎁', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 16),
                          Text(
                            '$totalPoints points à dépenser',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.bricolageGrotesque(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Débloquez vos récompenses',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.8),
                              fontWeight: FontWeight.w500,
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // REWARDS LIST
                    _buildRewardItem(commerceId, '☕', 'Boisson offerte', 100, totalPoints),
                    _buildRewardItem(commerceId, '🥐', 'Viennoiserie offerte', 150, totalPoints),
                    _buildRewardItem(commerceId, '🍰', 'Pâtisserie', 300, totalPoints),
                  ],
                ),
              ),
              if (_isLoading)
                Container(
                  color: Colors.white.withValues(alpha: 0.5),
                  child: const Center(child: CircularProgressIndicator(color: Color(0xFFD73E26))),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRewardItem(String? commerceId, String emoji, String title, int cost, int userPoints) {
    final bool canRedeem = userPoints >= cost;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Row(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFF4EFEB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.bricolageGrotesque(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1B100C),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$cost points',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF9C8B82),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: (canRedeem && commerceId != null) 
              ? () => _redeemReward(commerceId, title, cost) 
              : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: canRedeem ? const Color(0xFFFCE7DD) : const Color(0xFFF4EFEB),
              foregroundColor: canRedeem ? const Color(0xFFD73E26) : const Color(0xFF9C8B82),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: Text(
              'Échanger', 
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)
            ),
          )
        ],
      ),
    );
  }
}
