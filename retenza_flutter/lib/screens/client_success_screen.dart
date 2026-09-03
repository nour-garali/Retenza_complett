import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import 'dart:ui';

abstract class _T {
  static const bg = Color(0xFFFAFAFA);
  static const ink = Color(0xFF111111);
  static const inkSoft = Color(0xFF666666);
  static const accent = Color(0xFFD73E26);
  static const accentDark = Color(0xFFA12C1A);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFEEEEEE);
}

class ClientSuccessScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> commerceData;
  final VoidCallback onContinue;

  const ClientSuccessScreen({
    super.key,
    required this.commerceData,
    required this.onContinue,
  });

  @override
  ConsumerState<ClientSuccessScreen> createState() => _ClientSuccessScreenState();
}

class _ClientSuccessScreenState extends ConsumerState<ClientSuccessScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _slideAnim = Tween<Offset>(
            begin: const Offset(0, 0.1), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _addToWallet() async {
    // Show blurred loading overlay
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black12,
      builder: (c) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: const Center(
          child: CircularProgressIndicator(color: _T.accent, strokeWidth: 2),
        ),
      ),
    );

    try {
      final commerceId =
          widget.commerceData['id'] ?? widget.commerceData['_id'];
      if (commerceId == null) throw Exception('Commerce ID introuvable');

      final res =
          await apiClient.get('/clients/wallet-pass?commerceId=$commerceId');

      if (!mounted) return;
      Navigator.pop(context); // close loading

      if (res.statusCode == 200 && res.data['success'] == true) {
        final passUrl = res.data['passUrl'] as String?;

        if (passUrl == null || passUrl.isEmpty) {
          _showError('Lien Google Wallet non disponible');
          return;
        }

        // Open the real Google Wallet "Add" URL
        final uri = Uri.parse(passUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          _showError('Impossible d\'ouvrir Google Wallet sur cet appareil');
        }
      } else {
        _showError(res.data['message']?.toString() ?? 'Erreur lors de la génération du pass');
      }
    } catch (e) {
      if (!mounted) return;
      // Close dialog if still open
      if (Navigator.canPop(context)) Navigator.pop(context);
      _showError('Erreur réseau : $e');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.inter(fontSize: 14)),
        backgroundColor: _T.ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final commerceName = widget.commerceData['name'] ?? 'Boutique';
    final programType =
        widget.commerceData['loyaltyProgram']?['type'] ?? 'points';
    final unit = programType == 'points'
        ? 'pts'
        : (programType == 'stamps' ? 'tampons' : '€');

    return Scaffold(
      backgroundColor: _T.bg,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Spacer(),

                  // ── Check icon ────────────────────────────────────────────
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: _T.accent.withOpacity(0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded,
                        color: _T.accent, size: 40),
                  ),
                  const SizedBox(height: 40),

                  // ── Title ─────────────────────────────────────────────────
                  Text(
                    'Bienvenue chez\n$commerceName',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w600,
                      color: _T.ink,
                      height: 1.2,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    'Votre compte de fidélité est actif.',
                    textAlign: TextAlign.center,
                    style:
                        GoogleFonts.inter(fontSize: 15, color: _T.inkSoft),
                  ),

                  const SizedBox(height: 48),

                  // ── Balance card ──────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        vertical: 32, horizontal: 24),
                    decoration: BoxDecoration(
                      color: _T.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: _T.border),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'SOLDE INITIAL',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: _T.inkSoft,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '0',
                              style: GoogleFonts.outfit(
                                fontSize: 56,
                                fontWeight: FontWeight.w300,
                                color: _T.accent,
                                height: 1,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              unit,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                color: _T.accent,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // ── Google Wallet button ──────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _addToWallet,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _T.accent,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                              Icons.account_balance_wallet_outlined,
                              size: 20),
                          const SizedBox(width: 12),
                          Text(
                            'Ajouter à Google Wallet',
                            style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Skip button ───────────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: TextButton(
                      onPressed: widget.onContinue,
                      style: TextButton.styleFrom(
                        foregroundColor: _T.inkSoft,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        'Peut-être plus tard',
                        style: GoogleFonts.inter(
                            fontSize: 15, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
