import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_client.dart';

// ══════════════════════════════════════════════════════════════
//  COMMERCE WELCOME SCREEN
//  Shown immediately after scanning a merchant QR code
// ══════════════════════════════════════════════════════════════

abstract class _T {
  static const bg = Color(0xFFF8F6F4);
  static const ink = Color(0xFF18110C);
  static const inkSoft = Color(0xFF7A6B62);
  static const accent = Color(0xFFD73E26);
  static const surface = Color(0xFFFFFFFF);
}

class CommerceWelcomeScreen extends StatefulWidget {
  final String merchantCode;
  final VoidCallback onBack;
  /// Passes (qrCode, commerceData) to the signup screen
  final void Function(String qrCode, Map<String, dynamic> commerce) onContinueToSignup;

  const CommerceWelcomeScreen({
    super.key,
    required this.merchantCode,
    required this.onBack,
    required this.onContinueToSignup,
  });

  @override
  State<CommerceWelcomeScreen> createState() => _CommerceWelcomeScreenState();
}

class _CommerceWelcomeScreenState extends State<CommerceWelcomeScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _commerce;
  String? _resolvedQrCode;

  @override
  void initState() {
    super.initState();
    _fetchCommerce();
  }

  Future<void> _fetchCommerce() async {
    try {
      final response = await apiClient.get('/join/${widget.merchantCode}');
      if (response.statusCode == 200 && response.data['success'] == true) {
        setState(() {
          _commerce = response.data['data']['commerce'];
          _resolvedQrCode = response.data['data']['qrCode'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'QR Code invalide ou expiré.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Impossible de vérifier ce QR Code.\nDétail: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _T.bg,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: _T.accent))
            : _error != null
                ? _buildErrorState()
                : _buildSuccessState(),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: _T.accent),
            const SizedBox(height: 24),
            Text(
              'Oups...',
              style: GoogleFonts.bricolageGrotesque(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: _T.ink,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 16,
                color: _T.inkSoft,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: widget.onBack,
              style: ElevatedButton.styleFrom(
                backgroundColor: _T.ink,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text('Retour', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessState() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: _T.ink),
              onPressed: widget.onBack,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _T.surface,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                )
              ],
            ),
            child: Column(
              children: [
                if (_commerce?['logo'] != null)
                  CircleAvatar(
                    radius: 40,
                    backgroundImage: NetworkImage(_commerce!['logo']),
                  )
                else
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: _T.bg,
                    child: Text(
                      _commerce?['name']?[0]?.toUpperCase() ?? 'C',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 32,
                        color: _T.ink,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                Text(
                  'Bienvenue chez',
                  style: GoogleFonts.inter(fontSize: 16, color: _T.inkSoft),
                ),
                const SizedBox(height: 8),
                Text(
                  _commerce?['name'] ?? 'Commerce',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.bricolageGrotesque(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: _T.ink,
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () {
                    if (_resolvedQrCode != null && _commerce != null) {
                      widget.onContinueToSignup(_resolvedQrCode!, _commerce!);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _T.accent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 56),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Obtenir ma carte',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
