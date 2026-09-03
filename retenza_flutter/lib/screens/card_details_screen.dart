import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:retenza_flutter/screens/client_dashboard_screen.dart';
import 'package:retenza_flutter/services/client_service.dart';
import 'package:dio/dio.dart';
import '../services/api_client.dart';

// ══════════════════════════════════════════════════════════════
//  PROVIDERS
// ══════════════════════════════════════════════════════════════

final cardHistoryProvider =
    FutureProvider.family.autoDispose<List<dynamic>, LoyaltyCard>(
        (ref, card) async {
  if (card.clientId.isEmpty || card.merchantId.isEmpty) return [];
  return await ClientService.getCardHistory(card.clientId, card.merchantId);
});

// ══════════════════════════════════════════════════════════════
//  CARD DETAILS SCREEN
// ══════════════════════════════════════════════════════════════

class CardDetailsScreen extends ConsumerStatefulWidget {
  final LoyaltyCard card;
  const CardDetailsScreen({super.key, required this.card});

  @override
  ConsumerState<CardDetailsScreen> createState() => _CardDetailsScreenState();
}

class _CardDetailsScreenState extends ConsumerState<CardDetailsScreen> {
  static const Color grenadier = Color(0xFFD73E26);
  static const Color ink = Color(0xFF1A1512);
  static const Color paper = Color(0xFFFAF7F5);
  static const Color muted = Color(0xFF9C8B82);
  static const Color line = Color(0xFFE8E1DA);

  int _activeTab = 0;
  bool _isRedeemLoading = false;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Client récemment';
    return 'Client depuis ${DateFormat('MMMM yyyy', 'fr_FR').format(date)}';
  }

  // ══════════════════════════════════════════════════════════════
  //  BUILD
  // ══════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: paper,
      appBar: AppBar(
        backgroundColor: paper,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        titleTextStyle: GoogleFonts.bricolageGrotesque(
          color: ink,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        title: const Text('Mes cartes'),
        leading: Padding(
          padding: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
          child: _CircleIconButton(
            icon: Icons.arrow_back,
            onTap: () => Navigator.pop(context),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            child: _CircleIconButton(
              icon: Icons.settings_outlined,
              onTap: () => _showSettingsSheet(context),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 16),
            _buildCardStack(),
            const SizedBox(height: 20),
            _buildDots(),
            const SizedBox(height: 36),
            _buildActionButtons(),
            const SizedBox(height: 36),
            _buildTabBar(),
            const SizedBox(height: 20),
            _activeTab == 0 ? _buildActivityTab() : _buildInfosTab(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  CARD STACK
  // ══════════════════════════════════════════════════════════════
  Widget _buildCardStack() {
    const double hPad = 24;
    return SizedBox(
      height: 220,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: hPad + 10,
            right: hPad - 16,
            top: 10,
            bottom: 6,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFE4DDD6),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          Positioned(
            left: hPad,
            right: hPad,
            top: 0,
            bottom: 14,
            child: _buildMainCard(),
          ),
        ],
      ),
    );
  }

  Widget _buildMainCard() {
    switch (widget.card.type) {
      case LoyaltyType.points:
        return _pointsCard(widget.card);
      case LoyaltyType.stamps:
        return _stampsCard(widget.card);
      case LoyaltyType.cashback:
        return _cashbackCard(widget.card);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  CARTE POINTS (holographique)
  // ══════════════════════════════════════════════════════════════
  Widget _pointsCard(LoyaltyCard card) {
    final progress = (card.currentPoints ?? 0) / (card.pointsGoal ?? 1);
    final remaining = (card.pointsGoal ?? 0) - (card.currentPoints ?? 0);

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0xFFEA5E44), Color(0xFFD73E26), Color(0xFF9E2A17)],
          ),
          boxShadow: [
            BoxShadow(
                color: grenadier.withValues(alpha: 0.5),
                blurRadius: 40,
                offset: const Offset(0, 22)),
            BoxShadow(
                color: grenadier.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6)),
          ],
        ),
        child: Stack(
          children: [
            // Reflet holographique diagonal
            Positioned(
              top: -140,
              left: -60,
              child: Transform.rotate(
                angle: 8 * pi / 180,
                child: Container(
                  width: 180,
                  height: 420,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.white.withValues(alpha: 0.18),
                        Colors.transparent,
                      ],
                      stops: const [0.35, 0.5, 0.65],
                    ),
                  ),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Puce carte
                Container(
                  width: 32,
                  height: 24,
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(5),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFF4E2B8),
                        Color(0xFFC9A25C),
                        Color(0xFF8C6E36)
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 4,
                          offset: const Offset(0, 2))
                    ],
                  ),
                ),
                _cardHeader(card,
                    iconBg: Colors.white.withValues(alpha: 0.2),
                    iconColor: Colors.white),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '${card.currentPoints ?? 0}',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 8,
                              offset: const Offset(0, 2))
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'pts \u2022 encore ${remaining > 0 ? remaining : 0} avant récompense',
                        style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withValues(alpha: 0.75)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress.clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: Colors.black.withValues(alpha: 0.18),
                    valueColor: AlwaysStoppedAnimation(
                        Colors.white.withValues(alpha: 0.95)),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  card.maskedNumber ?? '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022',
                  style: GoogleFonts.inter(
                      fontSize: 12.5,
                      letterSpacing: 2,
                      color: Colors.white.withValues(alpha: 0.6)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  CARTE TAMPONS (relief d'encre)
  // ══════════════════════════════════════════════════════════════
  Widget _stampsCard(LoyaltyCard card) {
    final collected = card.stampsCollected ?? 0;
    final goal = card.stampsGoal ?? 10;
    final rotations = [-4.0, 3.0, -2.0, 5.0, -3.0, 2.0, 4.0, -5.0, 1.0, -1.0];

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Colors.white, Color(0xFFFBF8F6)],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: ink.withValues(alpha: 0.045)),
        boxShadow: [
          BoxShadow(
              color: ink.withValues(alpha: 0.12),
              blurRadius: 36,
              offset: const Offset(0, 18)),
          BoxShadow(
              color: ink.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(card,
              iconBg: const Color(0xFFFBEAE7),
              iconColor: grenadier,
              dark: true),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: goal,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 10,
              crossAxisSpacing: 7,
              mainAxisSpacing: 7,
            ),
            itemBuilder: (context, index) {
              final filled = index < collected;
              if (!filled) {
                return Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border:
                        Border.all(color: const Color(0xFFE3D9D0), width: 1.5),
                  ),
                );
              }
              return Transform.rotate(
                angle: rotations[index % rotations.length] * pi / 180,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const RadialGradient(
                      center: Alignment(-0.35, -0.4),
                      colors: [Color(0xFFEA5E44), Color(0xFFB8321F)],
                      stops: [0.0, 0.85],
                    ),
                    boxShadow: [
                      BoxShadow(
                          color: grenadier.withValues(alpha: 0.4),
                          blurRadius: 6,
                          offset: const Offset(0, 3)),
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 2,
                          offset: const Offset(0, -1)),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.check, size: 9, color: Colors.white70),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 6),
          Text(
            '$collected sur $goal \u2022 ${goal - collected} visites avant une récompense',
            style: GoogleFonts.inter(
                fontSize: 12, fontWeight: FontWeight.w500, color: muted),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  CARTE CASHBACK (métal brossé)
  // ══════════════════════════════════════════════════════════════
  Widget _cashbackCard(LoyaltyCard card) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2E2925), Color(0xFF17130F), Color(0xFF0A0806)],
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _BrushedMetalPainter())),
            Container(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.55),
                      blurRadius: 40,
                      offset: const Offset(0, 22)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _cardHeader(card,
                      iconBg: Colors.white.withValues(alpha: 0.08),
                      iconColor: const Color(0xFFF0D9C8)),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFFFDF3E7),
                            Color(0xFFE7C9A6),
                            Color(0xFFB98A57)
                          ],
                        ).createShader(bounds),
                        child: Text(
                          '${(card.cashbackAmount ?? 0).toStringAsFixed(2).replaceAll('.', ',')} \u20ac',
                          style: GoogleFonts.bricolageGrotesque(
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.8,
                              color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Text(
                        'cagnotte disponible',
                        style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withValues(alpha: 0.4)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Réutilisable dès votre prochaine visite',
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.35)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  EN-TÊTE COMMUN
  // ══════════════════════════════════════════════════════════════
  Widget _cardHeader(
    LoyaltyCard card, {
    required Color iconBg,
    required Color iconColor,
    bool dark = false,
  }) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration:
              BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
          child: Icon(card.icon, color: iconColor, size: 19),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                card.merchantName,
                style: GoogleFonts.bricolageGrotesque(
                  fontWeight: FontWeight.w700,
                  fontSize: 15.5,
                  letterSpacing: -0.2,
                  color: dark ? ink : Colors.white,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                _typeLabel(card.type).toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                  color: dark
                      ? const Color(0xFFA69E97)
                      : Colors.white.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
        Icon(
          Icons.chevron_right,
          size: 18,
          color: dark
              ? const Color(0xFFC4BCB4)
              : Colors.white.withValues(alpha: 0.6),
        ),
      ],
    );
  }

  String _typeLabel(LoyaltyType type) {
    switch (type) {
      case LoyaltyType.points:
        return 'Points fidélité';
      case LoyaltyType.stamps:
        return 'Carte à tampons';
      case LoyaltyType.cashback:
        return 'Cashback';
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  DOTS
  // ══════════════════════════════════════════════════════════════
  Widget _buildDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 22,
          height: 5,
          decoration: BoxDecoration(
              color: ink, borderRadius: BorderRadius.circular(10)),
        ),
        const SizedBox(width: 6),
        Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
                color: Color(0xFFCFC8C2), shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
                color: Color(0xFFCFC8C2), shape: BoxShape.circle)),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  ACTION BUTTONS
  // ══════════════════════════════════════════════════════════════
  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildActionBtn(
              Icons.account_balance_wallet_rounded, 'Wallet', _onWalletTap),
          _buildActionBtn(
              Icons.card_giftcard_rounded, 'Récompense', _onRecompenseTap),
          _buildActionBtn(
              Icons.location_on_rounded, 'Commerce', _onCommerceTap),
        ],
      ),
    );
  }

  Widget _buildActionBtn(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: ink.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4))
              ],
            ),
            child: Icon(icon, color: grenadier, size: 28),
          ),
          const SizedBox(height: 10),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w500, color: ink)),
        ],
      ),
    );
  }

  void _onWalletTap() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _WalletSheet(card: widget.card),
    );
  }

  void _onRecompenseTap() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _RecompenseSheet(
        card: widget.card,
        onRedeem: _redeemReward,
        isLoading: _isRedeemLoading,
      ),
    );
  }

  Future<void> _redeemReward(double amount, String description) async {
    setState(() => _isRedeemLoading = true);
    try {
      final response = await apiClient.post('/clients/loyalty/redeem', data: {
        'commerceId': widget.card.merchantId,
        'programType': widget.card.type.name,
        'amount': amount,
        'description': description,
      });
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF4A8C2A),
            content: Text(
              response.data['message'] ?? 'Récompense utilisée !',
              style: GoogleFonts.inter(
                  color: Colors.white, fontWeight: FontWeight.w600),
            ),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        ref.invalidate(cardHistoryProvider(widget.card));
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg =
            e.response?.data?['message'] ?? 'Erreur lors de la rédemption';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: grenadier,
            content: Text(msg, style: GoogleFonts.inter(color: Colors.white)),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isRedeemLoading = false);
    }
  }

  void _onCommerceTap() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _CommerceSheet(card: widget.card),
    );
  }

  void _showSettingsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _SettingsSheet(card: widget.card),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  TAB BAR
  // ══════════════════════════════════════════════════════════════
  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: const Color(0xFFEBE6E2),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          _buildTab('Activité', 0),
          _buildTab('Infos', 1),
        ],
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isActive = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            color: isActive ? ink : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
            boxShadow: isActive
                ? [
                    BoxShadow(
                        color: ink.withValues(alpha: 0.20),
                        blurRadius: 8,
                        offset: const Offset(0, 2))
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? Colors.white : muted,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  TAB: ACTIVITÉ
  // ══════════════════════════════════════════════════════════════
  Widget _buildActivityTab() {
    final historyAsync = ref.watch(cardHistoryProvider(widget.card));

    return historyAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator(color: grenadier)),
      ),
      error: (e, _) => Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.wifi_off_rounded,
                  color: Color(0xFFCFC8C2), size: 48),
              const SizedBox(height: 12),
              Text('Impossible de charger l\'historique',
                  style: GoogleFonts.inter(color: muted, fontSize: 14)),
            ],
          ),
        ),
      ),
      data: (transactions) {
        if (transactions.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Column(
              children: [
                Icon(Icons.receipt_long_outlined, color: line, size: 56),
                const SizedBox(height: 14),
                Text('Aucune activité récente.',
                    style: GoogleFonts.inter(color: muted, fontSize: 14)),
                const SizedBox(height: 6),
                Text('Vos transactions apparaîtront ici.',
                    style: GoogleFonts.inter(color: muted, fontSize: 12)),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: transactions.asMap().entries.map((entry) {
              final index = entry.key;
              final tx = entry.value;
              final isLast = index == transactions.length - 1;
              final type = tx['type'] as String? ?? 'earn';
              final rawAmount = (tx['amount'] ?? 0);
              final amount = rawAmount is int
                  ? rawAmount.toDouble()
                  : (rawAmount as num).toDouble();
              final desc =
                  tx['description'] as String? ?? _defaultTxDesc(type);

              DateTime? date;
              if (tx['createdAt'] != null) {
                date = DateTime.tryParse(tx['createdAt'].toString());
              }
              final subtitle = date != null
                  ? DateFormat('d MMM yyyy, HH:mm', 'fr_FR').format(date)
                  : '';

              final positive = type == 'earn';
              final displayAmount = _formatAmount(amount, positive);

              IconData icon = Icons.shopping_bag_rounded;
              if (type == 'redeem') icon = Icons.card_giftcard_rounded;
              if (type == 'adjustment') icon = Icons.tune_rounded;

              return Column(
                children: [
                  _activityItem(
                    icon: icon,
                    title: desc,
                    subtitle: subtitle,
                    value: displayAmount,
                    positive: positive,
                  ),
                  if (!isLast) _divider(),
                ],
              );
            }).toList(),
          ),
        );
      },
    );
  }

  String _defaultTxDesc(String type) {
    switch (type) {
      case 'earn':
        return 'Achat validé';
      case 'redeem':
        return 'Récompense utilisée';
      case 'adjustment':
        return 'Ajustement';
      default:
        return 'Transaction';
    }
  }

  String _formatAmount(double amount, bool positive) {
    final prefix = positive ? '+' : '-';
    switch (widget.card.type) {
      case LoyaltyType.points:
        return '$prefix${amount.toStringAsFixed(0)} pts';
      case LoyaltyType.stamps:
        return '$prefix${amount.toStringAsFixed(0)} \ud83c\udf37';
      case LoyaltyType.cashback:
        return '$prefix${amount.toStringAsFixed(2).replaceAll('.', ',')} DA';
    }
  }

  Widget _activityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required String value,
    required bool positive,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: positive
                  ? const Color(0xFFEBF5E9)
                  : const Color(0xFFFBEAE7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon,
                color: positive ? const Color(0xFF4A8C2A) : grenadier,
                size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: ink)),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(subtitle,
                      style: GoogleFonts.inter(fontSize: 12, color: muted)),
                ],
              ],
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: positive ? const Color(0xFF4A8C2A) : grenadier,
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(
        height: 1,
        color: line,
      );

  // ══════════════════════════════════════════════════════════════
  //  TAB: INFOS
  // ══════════════════════════════════════════════════════════════
  Widget _buildInfosTab() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _fetchCommerceInfo(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator(color: grenadier)),
          );
        }
        if (snapshot.hasError ||
            !snapshot.hasData ||
            snapshot.data!.isEmpty) {
          return _buildInfosFallback();
        }

        final data = snapshot.data!;
        final commerce = data['commerce'] as Map<String, dynamic>? ?? {};
        final loyaltyProgram =
            commerce['loyaltyProgram'] as Map<String, dynamic>? ?? {};
        final contact = commerce['contact'] as Map<String, dynamic>? ?? {};

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _infoSection(
                title: 'Programme de fidélité',
                child: Column(
                  children: [
                    _infoRow(Icons.star_rounded, 'Type',
                        _programTypeLabel(loyaltyProgram['type'] ?? widget.card.type.name)),
                    if (loyaltyProgram['rewardDescription'] != null)
                      _infoRow(Icons.card_giftcard_rounded, 'Récompense',
                          loyaltyProgram['rewardDescription'].toString()),
                    if (loyaltyProgram['goal'] != null)
                      _infoRow(Icons.flag_rounded, 'Objectif',
                          '${loyaltyProgram['goal']} points'),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _infoSection(
                title: 'Contact',
                child: Column(
                  children: [
                    if (contact['phone'] != null)
                      _infoRow(Icons.phone_rounded, 'Téléphone',
                          contact['phone'].toString()),
                    if (contact['email'] != null)
                      _infoRow(Icons.email_rounded, 'Email',
                          contact['email'].toString()),
                    if (commerce['address'] != null)
                      _infoRow(Icons.location_on_rounded, 'Adresse',
                          commerce['address'].toString()),
                    if (commerce['city'] != null)
                      _infoRow(Icons.location_city_rounded, 'Ville',
                          commerce['city'].toString()),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _infoSection(
                title: 'Ma carte',
                child: Column(
                  children: [
                    _infoRow(Icons.calendar_today_rounded, 'Membre depuis',
                        _formatDate(widget.card.createdAt)),
                    if (widget.card.currentPoints != null)
                      _infoRow(Icons.stars_rounded, 'Points actuels',
                          '${widget.card.currentPoints} pts'),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfosFallback() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoSection(
            title: 'Programme de fidélité',
            child: Column(
              children: [
                _infoRow(Icons.star_rounded, 'Type',
                    _typeLabel(widget.card.type)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _infoSection(
            title: 'Ma carte',
            child: Column(
              children: [
                _infoRow(Icons.calendar_today_rounded, 'Membre depuis',
                    _formatDate(widget.card.createdAt)),
                if (widget.card.currentPoints != null)
                  _infoRow(Icons.stars_rounded, 'Points actuels',
                      '${widget.card.currentPoints} pts'),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Future<Map<String, dynamic>> _fetchCommerceInfo() async {
    try {
      final res = await apiClient
          .get('/loyalty/balance/${widget.card.clientId}/${widget.card.merchantId}');
      if (res.statusCode == 200) {
        return Map<String, dynamic>.from(res.data as Map);
      }
      return {};
    } catch (_) {
      return {};
    }
  }

  String _programTypeLabel(String type) {
    switch (type) {
      case 'points':
        return 'Points fidélité';
      case 'stamps':
        return 'Carte à tampons';
      case 'cashback':
        return 'Cashback';
      default:
        return type;
    }
  }

  Widget _infoSection({required String title, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.bricolageGrotesque(
                fontSize: 16, fontWeight: FontWeight.w700, color: ink)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: line),
          ),
          child: child,
        ),
      ],
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: grenadier, size: 20),
          const SizedBox(width: 12),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 14, color: muted, fontWeight: FontWeight.w500)),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: GoogleFonts.inter(
                  fontSize: 14, fontWeight: FontWeight.w600, color: ink),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  CIRCLE ICON BUTTON
// ══════════════════════════════════════════════════════════════
class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
                color: const Color(0xFF1A1512).withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2))
          ],
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF1A1512)),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  WALLET SHEET
// ══════════════════════════════════════════════════════════════
class _WalletSheet extends StatelessWidget {
  final LoyaltyCard card;
  const _WalletSheet({required this.card});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 20, 24, 24 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: const Color(0xFFE0D8D2),
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Text('Ajouter au Wallet',
              style: GoogleFonts.bricolageGrotesque(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1A1512))),
          const SizedBox(height: 8),
          Text('Ajoutez votre carte à votre application Wallet',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                  fontSize: 14, color: const Color(0xFF9C8B82))),
          const SizedBox(height: 28),
          _walletButton(context, 'Google Wallet', const Color(0xFF4285F4),
              Icons.account_balance_wallet_rounded, 'google'),
          const SizedBox(height: 12),
          _walletButton(context, 'Apple Wallet', const Color(0xFF1A1512),
              Icons.wallet_rounded, 'apple'),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _walletButton(BuildContext context, String label, Color color,
      IconData icon, String platform) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () async {
          try {
            await apiClient.post('/clients/wallet-pass', data: {
              'commerceId': card.merchantId,
              'platform': platform,
            });
            if (context.mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Carte ajoutée au $label !'),
                  backgroundColor: color,
                ),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Fonctionnalité bientôt disponible')),
              );
            }
          }
        },
        icon: Icon(icon, size: 20),
        label: Text(label,
            style:
                GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  RÉCOMPENSE SHEET
// ══════════════════════════════════════════════════════════════
class _RecompenseSheet extends StatelessWidget {
  final LoyaltyCard card;
  final Future<void> Function(double, String) onRedeem;
  final bool isLoading;

  const _RecompenseSheet({
    required this.card,
    required this.onRedeem,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final canRedeem = _canRedeem();
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 20, 24, 24 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: const Color(0xFFE0D8D2),
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFFFBEAE7), Color(0xFFFDF4F2)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Icon(Icons.card_giftcard_rounded,
                    color: Color(0xFFD73E26), size: 48),
                const SizedBox(height: 12),
                Text(_rewardTitle(),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.bricolageGrotesque(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1A1512))),
                const SizedBox(height: 8),
                Text(_rewardDescription(),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                        fontSize: 14, color: const Color(0xFF9C8B82))),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: canRedeem && !isLoading
                  ? () => onRedeem(_rewardAmount(), _rewardTitle())
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD73E26),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFE0D8D2),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      canRedeem ? 'Utiliser ma récompense' : 'Pas encore disponible',
                      style: GoogleFonts.inter(
                          fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  bool _canRedeem() {
    switch (card.type) {
      case LoyaltyType.points:
        return (card.currentPoints ?? 0) >= (card.pointsGoal ?? 999999);
      case LoyaltyType.stamps:
        return (card.stampsCollected ?? 0) >= (card.stampsGoal ?? 999999);
      case LoyaltyType.cashback:
        return (card.cashbackAmount ?? 0) > 0;
    }
  }

  double _rewardAmount() {
    switch (card.type) {
      case LoyaltyType.points:
        return (card.pointsGoal ?? 0).toDouble();
      case LoyaltyType.stamps:
        return (card.stampsGoal ?? 0).toDouble();
      case LoyaltyType.cashback:
        return card.cashbackAmount ?? 0;
    }
  }

  String _rewardTitle() {
    switch (card.type) {
      case LoyaltyType.points:
        return '${card.pointsGoal ?? 0} points = récompense';
      case LoyaltyType.stamps:
        return '${card.stampsGoal ?? 0} tampons = récompense';
      case LoyaltyType.cashback:
        return '${(card.cashbackAmount ?? 0).toStringAsFixed(2)} \u20ac de cashback';
    }
  }

  String _rewardDescription() {
    switch (card.type) {
      case LoyaltyType.points:
        final pts = card.currentPoints ?? 0;
        final goal = card.pointsGoal ?? 0;
        return 'Vous avez $pts pts sur $goal nécessaires.';
      case LoyaltyType.stamps:
        final s = card.stampsCollected ?? 0;
        final g = card.stampsGoal ?? 0;
        return 'Vous avez $s tampons sur $g nécessaires.';
      case LoyaltyType.cashback:
        return 'Utilisez votre cagnotte lors de votre prochaine visite.';
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  COMMERCE SHEET
// ══════════════════════════════════════════════════════════════
class _CommerceSheet extends StatelessWidget {
  final LoyaltyCard card;
  const _CommerceSheet({required this.card});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 20, 24, 24 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: const Color(0xFFE0D8D2),
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Text(card.merchantName,
              style: GoogleFonts.bricolageGrotesque(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1A1512))),
          const SizedBox(height: 6),
          Text('Informations du commerce',
              style: GoogleFonts.inter(
                  fontSize: 14, color: const Color(0xFF9C8B82))),
          const SizedBox(height: 24),
          _row(Icons.location_on_rounded, 'Adresse', card.merchantName),
          _row(Icons.phone_rounded, 'Téléphone', 'Non disponible'),
          _row(Icons.schedule_rounded, 'Horaires', 'Voir sur place'),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFD73E26), size: 22),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: GoogleFonts.inter(
                      fontSize: 12, color: const Color(0xFF9C8B82))),
              Text(value,
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1A1512))),
            ],
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS SHEET
// ══════════════════════════════════════════════════════════════
class _SettingsSheet extends StatelessWidget {
  final LoyaltyCard card;
  const _SettingsSheet({required this.card});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 20, 24, 24 + MediaQuery.of(context).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: const Color(0xFFE0D8D2),
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Text('Paramètres de la carte',
              style: GoogleFonts.bricolageGrotesque(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1A1512))),
          const SizedBox(height: 24),
          _optionTile(context, Icons.notifications_outlined, 'Notifications',
              'Gérer les alertes de points', () {}),
          _optionTile(context, Icons.share_outlined, 'Partager la carte',
              'Invitez vos amis', () {}),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _optionTile(BuildContext context, IconData icon, String title,
      String subtitle, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFBEAE7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: const Color(0xFFD73E26), size: 20),
      ),
      title: Text(title,
          style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: const Color(0xFF1A1512))),
      subtitle: Text(subtitle,
          style: GoogleFonts.inter(
              fontSize: 12, color: const Color(0xFF9C8B82))),
      trailing: const Icon(Icons.chevron_right,
          color: Color(0xFF9C8B82)),
      onTap: onTap,
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  BRUSHED METAL PAINTER
// ══════════════════════════════════════════════════════════════
class _BrushedMetalPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.025)
      ..strokeWidth = 1;

    const spacing = 3.0;
    final diagonal = size.width + size.height;
    for (double i = -diagonal; i < diagonal; i += spacing) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
