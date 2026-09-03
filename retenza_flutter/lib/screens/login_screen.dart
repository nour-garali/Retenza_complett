import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import '../services/auth_service.dart';

// ══════════════════════════════════════════════════════════════
//  RETENZA LOGIN SCREEN (LIGHT VERSION - ULTRA-MINIMAL & FINESSE)
//  Extrêmement épuré, très aéré, focus sur l'essentiel avec Google / Apple
// ══════════════════════════════════════════════════════════════

class LoginScreen extends StatefulWidget {
  final VoidCallback? onLoginSuccess;
  final VoidCallback? onScanQR;
  final VoidCallback? onBack;
  const LoginScreen({super.key, this.onLoginSuccess, this.onScanQR, this.onBack});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _obscurePass = true;
  bool _isLoading = false;
  bool _emailFocused = false;
  bool _passFocused = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  Future<void> _handleLogin() async {
    if (_isLoading) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);
    
    try {
      final success = await AuthService.login(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      
      if (mounted) {
        setState(() => _isLoading = false);
        if (success) {
          widget.onLoginSuccess?.call();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Email ou mot de passe incorrect')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF8F6), // Fond crème doux
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                  child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo miniature centré
                      Center(child: _buildLogo()),
                      const SizedBox(height: 12),
                      
                      // Titre principal discret
                      Text(
                        'Retenza',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFD73E26),
                        ),
                      ),
                      const SizedBox(height: 40),
                      
                      // Champ E-mail
                      _buildTextField(
                        label: 'Adresse e-mail',
                        controller: _emailCtrl,
                        hint: 'vous@exemple.com',
                        isFocused: _emailFocused,
                        onFocusChange: (v) => setState(() => _emailFocused = v),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 20),
                      
                      // Champ Mot de passe
                      _buildTextField(
                        label: 'Mot de passe',
                        controller: _passCtrl,
                        hint: '••••••••',
                        isFocused: _passFocused,
                        onFocusChange: (v) => setState(() => _passFocused = v),
                        obscureText: _obscurePass,
                        suffixIcon: GestureDetector(
                          onTap: () => setState(() => _obscurePass = !_obscurePass),
                          child: Icon(
                            _obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            size: 20,
                            color: const Color(0xFF9C8B82),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Lien mot de passe oublié
                      Align(
                        alignment: Alignment.centerRight,
                        child: GestureDetector(
                          onTap: () {},
                          child: Text(
                            'Mot de passe oublié ?',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFFD73E26),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      
                      // Bouton de connexion
                      _buildLoginButton(),
                      const SizedBox(height: 24),
                      
                      // Diviseur ultra fin
                      _buildDivider(),
                      const SizedBox(height: 20),
                      
                      // Boutons Google / Apple
                      _buildSocialLogin(),
                      const SizedBox(height: 28),
                      
                      // Lien de création de compte via QR Code
                      GestureDetector(
                        onTap: widget.onScanQR,
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: const Color(0xFFD73E26).withOpacity(0.08),
                            border: Border.all(
                              color: const Color(0xFFD73E26).withOpacity(0.15),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.qr_code_scanner_rounded,
                                color: Color(0xFFD73E26),
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Nouveau ? Scanner un QR Code',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFD73E26),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
              ),
            ),
            // Bouton retour en haut à gauche
            Positioned(
              top: 16,
              left: 16,
              child: IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF18110C)),
                onPressed: () {
                  if (widget.onBack != null) {
                    widget.onBack!();
                  } else {
                    Navigator.of(context).pop();
                  }
                },
                splashRadius: 24,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MINI LOGO
  // ─────────────────────────────────────────────────────────────
  Widget _buildLogo() {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFD73E26), Color(0xFFA82C18)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD73E26).withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: CustomPaint(painter: _MiniArrowPainter()),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TEXT FIELD FINESSE
  // ─────────────────────────────────────────────────────────────
  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required bool isFocused,
    required ValueChanged<bool> onFocusChange,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF5D534F))),
        const SizedBox(height: 8),
        Focus(
          onFocusChange: onFocusChange,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: const Color(0xFFFFFFFF),
              border: Border.all(
                color: isFocused
                    ? const Color(0xFFD73E26).withOpacity(0.5)
                    : const Color(0xFFEDE5DF),
                width: 1,
              ),
            ),
            child: TextFormField(
              controller: controller,
              keyboardType: keyboardType,
              obscureText: obscureText,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF1B100C),
                letterSpacing: obscureText ? 2.0 : 0,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF9C8B82).withOpacity(0.6),
                  letterSpacing: 0,
                ),
                suffixIcon: suffixIcon != null
                    ? Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: suffixIcon,
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BOUTON DE CONNEXION (FINESSE)
  // ─────────────────────────────────────────────────────────────
  Widget _buildLoginButton() {
    return GestureDetector(
      onTap: _handleLogin,
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            colors: [Color(0xFFDD442C), Color(0xFFBC2C16)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFD73E26).withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Center(
          child: _isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  'Se connecter',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 0.1,
                  ),
                ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DIVISEUR DISCRET
  // ─────────────────────────────────────────────────────────────
  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 1,
            color: const Color(0xFFEDE5DF),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'ou continuer avec',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF9C8B82),
            ),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            color: const Color(0xFFEDE5DF),
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BOUTONS SOCIAUX (FINESSE)
  // ─────────────────────────────────────────────────────────────
  Widget _buildSocialLogin() {
    return Row(
      children: [
        Expanded(
          child: _buildSocialButton(
            label: 'Google',
            icon: const _GoogleIcon(),
            onTap: () {},
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSocialButton(
            label: 'Apple',
            icon: const Icon(Icons.apple_rounded, color: Color(0xFF1B100C), size: 18),
            onTap: () {},
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton({
    required String label,
    required Widget icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: const Color(0xFFFFFFFF),
          border: Border.all(color: const Color(0xFFEDE5DF)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF6E5B52),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  PAINTERS
// ══════════════════════════════════════════════════════════════

class _MiniArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = size.width * (3.0 / 48.0) // Thinner stroke (was 5.0)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final sx = size.width / 48;
    final sy = size.height / 48;

    final arc = Path()
      ..arcTo(
        Rect.fromCircle(center: Offset(24 * sx, 24 * sy), radius: 16 * sx),
        0.0,
        311.5 * math.pi / 180,
        true,
      );
    canvas.drawPath(arc, paint);

    final arrow = Path()
      ..moveTo(36 * sx, 6.5 * sy)
      ..lineTo(36 * sx, 16 * sy)
      ..lineTo(26.5 * sx, 16 * sy);
    canvas.drawPath(arrow, paint);
  }

  @override
  bool shouldRepaint(_MiniArrowPainter old) => false;
}

class _GoogleIcon extends StatelessWidget {
  const _GoogleIcon();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16,
      height: 16,
      child: CustomPaint(painter: _GoogleIconPainter()),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;

    final colors = [
      const Color(0xFF4285F4),
      const Color(0xFF34A853),
      const Color(0xFFFBBC05),
      const Color(0xFFEA4335),
    ];

    final paint = Paint()
      ..strokeWidth = size.width * 0.22
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final sweeps = [math.pi / 2, math.pi / 2, math.pi / 2, math.pi / 2];
    double startAngle = -math.pi / 2;

    for (int i = 0; i < 4; i++) {
      paint.color = colors[i];
      canvas.drawArc(
        Rect.fromCircle(center: Offset(cx, cy), radius: r * 0.72),
        startAngle + 0.05,
        sweeps[i] - 0.1,
        false,
        paint,
      );
      startAngle += sweeps[i];
    }
  }

  @override
  bool shouldRepaint(_GoogleIconPainter old) => false;
}
