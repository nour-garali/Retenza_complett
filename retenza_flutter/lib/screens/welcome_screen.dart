import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;

class WelcomeScreen extends StatefulWidget {
  final VoidCallback onSignIn;
  final VoidCallback onCreateAccount;
  final VoidCallback onBecomeMerchant;

  const WelcomeScreen({
    super.key,
    required this.onSignIn,
    required this.onCreateAccount,
    required this.onBecomeMerchant,
  });

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideIn;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeIn = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slideIn = Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5EDE5),
      body: FadeTransition(
        opacity: _fadeIn,
        child: SlideTransition(
          position: _slideIn,
          child: SafeArea(
            bottom: false,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ─── TOP SECTION: fond crème blanc ─────────────────
                  Container(
                    color: const Color(0xFFFBF7F4),
                    padding: const EdgeInsets.fromLTRB(28, 40, 28, 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // ── Logo rouge arrondi ──
                        Image.asset(
                          'assets/images/welcome_logo.png',
                          width: 80,
                          height: 80,
                        ),
                        const SizedBox(height: 30),

                        // ── Titre ──
                        Text(
                          'Bienvenue sur',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.bricolageGrotesque(
                            fontSize: 28,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1C1C2E),
                            height: 1.2,
                          ),
                        ),
                        Text(
                          'Retenza Connect',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.bricolageGrotesque(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFFBF2112),
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 14),

                        // ── Sous-titre ──
                        Text(
                          'Cumulez des points, débloquez des avantages\net restez fidèle à ce qui vous inspire.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            color: const Color(0xFF8C7B73),
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 34),

                        // ── Bouton Se connecter (rouge) ──
                        _PrimaryButton(
                          label: 'Se connecter',
                          iconWidget: const _LoginIcon(),
                          onTap: widget.onSignIn,
                        ),
                        const SizedBox(height: 12),

                        // ── Bouton Créer un compte (blanc) ──
                        _SecondaryButton(
                          label: 'Créer un compte',
                          icon: Icons.person_outline_rounded,
                          onTap: widget.onCreateAccount,
                        ),
                        const SizedBox(height: 34),

                        // ── Diviseur ──
                        Row(
                          children: [
                            Expanded(
                                child: Container(
                                    height: 1,
                                    color: const Color(0xFFE2D6CE))),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'Vous avez un commerce ?',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: const Color(0xFFAA9E97),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ),
                            Expanded(
                                child: Container(
                                    height: 1,
                                    color: const Color(0xFFE2D6CE))),
                          ],
                        ),
                        const SizedBox(height: 18),

                        // ── Devenir Partenaire ──
                        GestureDetector(
                          onTap: widget.onBecomeMerchant,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Devenir Partenaire Retenza',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFBF2112),
                                ),
                              ),
                              const SizedBox(width: 5),
                              const Icon(Icons.arrow_forward_rounded,
                                  size: 16, color: Color(0xFFBF2112)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ─── BOTTOM: Image 3D carte (exactement comme Figma) ─
                  Image.asset(
                    'assets/images/welcome_card_3d.png',
                    width: double.infinity,
                    fit: BoxFit.fitWidth,
                  ),

                  // ─── BOTTOM: Image features + copyright (exactement comme Figma) ─
                  Image.asset(
                    'assets/images/welcome_features.png',
                    width: double.infinity,
                    fit: BoxFit.fitWidth,
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


// ── Icône login (personne + flèche entrée) ───────────────────────
class _LoginIcon extends StatelessWidget {
  const _LoginIcon();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(22, 22),
      painter: _LoginIconPainter(),
    );
  }
}

class _LoginIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = size.width * 0.09
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    // Tête (cercle)
    canvas.drawCircle(Offset(w * 0.34, h * 0.27), w * 0.13, paint);

    // Épaules (demi-arc)
    final body = Path()
      ..moveTo(w * 0.06, h * 0.88)
      ..quadraticBezierTo(w * 0.06, h * 0.58, w * 0.34, h * 0.56)
      ..quadraticBezierTo(w * 0.52, h * 0.56, w * 0.56, h * 0.68);
    canvas.drawPath(body, paint);

    // Flèche login →
    final arrow = Path()
      ..moveTo(w * 0.60, h * 0.50)
      ..lineTo(w * 0.94, h * 0.50)
      ..moveTo(w * 0.78, h * 0.34)
      ..lineTo(w * 0.94, h * 0.50)
      ..lineTo(w * 0.78, h * 0.66);
    canvas.drawPath(arrow, paint);
  }

  @override
  bool shouldRepaint(_LoginIconPainter old) => false;
}

// ══════════════════════════════════════════════════════════════════
//  Bouton primaire rouge
// ══════════════════════════════════════════════════════════════════
class _PrimaryButton extends StatefulWidget {
  final String label;
  final Widget iconWidget;
  final VoidCallback onTap;
  const _PrimaryButton(
      {required this.label, required this.iconWidget, required this.onTap});
  @override
  State<_PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<_PrimaryButton> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 80),
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: _pressed
                ? null
                : const LinearGradient(
                    colors: [Color(0xFFD94030), Color(0xFF9E1A0A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
            color: _pressed ? const Color(0xFF9E1A0A) : null,
            boxShadow: _pressed
                ? []
                : [
                    BoxShadow(
                      color: const Color(0xFFBF2112).withOpacity(0.28),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              widget.iconWidget,
              const SizedBox(width: 10),
              Text(widget.label,
                  style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white)),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
//  Bouton secondaire blanc
// ══════════════════════════════════════════════════════════════════
class _SecondaryButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _SecondaryButton(
      {required this.label, required this.icon, required this.onTap});
  @override
  State<_SecondaryButton> createState() => _SecondaryButtonState();
}

class _SecondaryButtonState extends State<_SecondaryButton> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 80),
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: _pressed ? const Color(0xFFF0EAE6) : Colors.white,
            border: Border.all(color: const Color(0xFFE4DAD5), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, color: const Color(0xFF1C1C2E), size: 22),
              const SizedBox(width: 10),
              Text(widget.label,
                  style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1C1C2E))),
            ],
          ),
        ),
      ),
    );
  }
}
