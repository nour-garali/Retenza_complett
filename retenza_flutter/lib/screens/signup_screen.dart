import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ══════════════════════════════════════════════════════════════
//  RETENZA — SIGNUP SCREEN
//  World-class premium interface. Stripe / Apple quality.
//  Minimal. Elegant. Purposeful.
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
abstract class _T {
  // Colors
  static const bg         = Color(0xFFF8F6F4);
  static const ink        = Color(0xFF18110C);
  static const inkSoft    = Color(0xFF7A6B62);
  static const inkMuted   = Color(0xFFB0A49C);
  static const accent     = Color(0xFFD73E26);
  static const accentDeep = Color(0xFFA82C18);
  static const surface    = Color(0xFFFFFFFF);
  static const border     = Color(0xFFEAE4DF);

  // Spacing (8pt grid)
  static const s4  = 4.0;
  static const s8  = 8.0;
  static const s12 = 12.0;
  static const s16 = 16.0;
  static const s20 = 20.0;
  static const s24 = 24.0;
  static const s32 = 32.0;
  static const s40 = 40.0;
  static const s56 = 56.0;

  // Radius
  static const r10 = 10.0;
  static const r12 = 12.0;
  static const r14 = 14.0;
  static const r100 = 100.0;
}

// ══════════════════════════════════════════════════════════════
//  SIGNUP SCREEN
// ══════════════════════════════════════════════════════════════
class SignupScreen extends StatefulWidget {
  final VoidCallback? onSignupSuccess;
  final VoidCallback? onBackToLogin;

  const SignupScreen({
    super.key,
    this.onSignupSuccess,
    this.onBackToLogin,
  });

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  final _formKey   = GlobalKey<FormState>();

  bool _obscurePass  = true;
  bool _isLoading    = false;
  String? _focusedId;

  // ── Password strength (0–4)
  int get _passStrength {
    final p = _passCtrl.text;
    if (p.isEmpty) return 0;
    int s = 0;
    if (p.length >= 8) s++;
    if (p.contains(RegExp(r'[A-Z]'))) s++;
    if (p.contains(RegExp(r'[0-9]'))) s++;
    if (p.contains(RegExp(r'[^A-Za-z0-9]'))) s++;
    return s;
  }

  void _setFocus(String? id) => setState(() => _focusedId = id);

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _passCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isLoading) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;
    setState(() => _isLoading = false);
    widget.onSignupSuccess?.call();
  }

  // ─────────────────────────────────────────────────────────
  //  BUILD
  // ─────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _T.bg,
      body: Stack(
        children: [
          // Very subtle background texture
          const Positioned.fill(child: _SubtleBackground()),
          // Main scroll
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: _T.s24,
                  vertical: _T.s16,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _BackButton(onTap: widget.onBackToLogin),
                        const SizedBox(height: _T.s40),
                        _Header(),
                        const SizedBox(height: _T.s40),
                        _FieldGroup(
                          nameCtrl: _nameCtrl,
                          emailCtrl: _emailCtrl,
                          passCtrl: _passCtrl,
                          obscurePass: _obscurePass,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          onTogglePass: () =>
                              setState(() => _obscurePass = !_obscurePass),
                        ),
                        if (_passCtrl.text.isNotEmpty) ...[
                          const SizedBox(height: _T.s12),
                          _PasswordStrengthBar(strength: _passStrength),
                        ],
                        const SizedBox(height: _T.s32),
                        _SubmitButton(
                          isLoading: _isLoading,
                          onTap: _submit,
                        ),
                        const SizedBox(height: _T.s24),
                        const _OrDivider(),
                        const SizedBox(height: _T.s20),
                        const _SocialRow(),
                        const SizedBox(height: _T.s32),
                        _LoginLink(onTap: widget.onBackToLogin),
                        const SizedBox(height: _T.s24),
                        const _LegalText(),
                        const SizedBox(height: _T.s24),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  SUBTLE BACKGROUND  (two blurred shapes, <5% opacity)
// ══════════════════════════════════════════════════════════════
class _SubtleBackground extends StatelessWidget {
  const _SubtleBackground();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return CustomPaint(painter: _BgPainter(size: size));
  }
}

class _BgPainter extends CustomPainter {
  final Size size;
  const _BgPainter({required this.size});

  @override
  void paint(Canvas canvas, Size s) {
    // Top-right blob
    final a = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 120)
      ..color = _T.accent.withOpacity(0.04);
    canvas.drawCircle(Offset(s.width * 1.1, s.height * -0.05), s.width * 0.7, a);

    // Bottom-left blob
    final b = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 100)
      ..color = _T.accent.withOpacity(0.03);
    canvas.drawCircle(Offset(s.width * -0.1, s.height * 1.05), s.width * 0.6, b);
  }

  @override
  bool shouldRepaint(_BgPainter o) => false;
}

// ══════════════════════════════════════════════════════════════
//  BACK BUTTON
// ══════════════════════════════════════════════════════════════
class _BackButton extends StatelessWidget {
  final VoidCallback? onTap;
  const _BackButton({this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 36,
        height: 36,
        child: Center(
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _T.surface,
              borderRadius: BorderRadius.circular(_T.r10),
              border: Border.all(color: _T.border),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 14,
              color: _T.inkSoft,
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  HEADER
// ══════════════════════════════════════════════════════════════
class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Logo mark
        _LogoMark(),
        const SizedBox(height: _T.s24),
        // Title
        Text(
          'Créez votre compte.',
          style: GoogleFonts.bricolageGrotesque(
            fontSize: 30,
            fontWeight: FontWeight.w800,
            color: _T.ink,
            letterSpacing: -0.9,
            height: 1.1,
          ),
        ),
        const SizedBox(height: _T.s8),
        // Subtitle
        Text(
          'Lancez votre fidélisation en moins d\'une minute.',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: _T.inkSoft,
            height: 1.5,
            letterSpacing: -0.1,
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  LOGO MARK
// ══════════════════════════════════════════════════════════════
class _LogoMark extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(11),
        color: _T.accent,
      ),
      child: CustomPaint(painter: _ArrowPainter()),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  FIELD GROUP  (name + email + password as one unit)
// ══════════════════════════════════════════════════════════════
class _FieldGroup extends StatelessWidget {
  final TextEditingController nameCtrl;
  final TextEditingController emailCtrl;
  final TextEditingController passCtrl;
  final bool obscurePass;
  final String? focusedId;
  final ValueChanged<String?> onFocus;
  final VoidCallback onTogglePass;

  const _FieldGroup({
    required this.nameCtrl,
    required this.emailCtrl,
    required this.passCtrl,
    required this.obscurePass,
    required this.focusedId,
    required this.onFocus,
    required this.onTogglePass,
  });

  @override
  Widget build(BuildContext context) {
    // Grouped card approach — inputs live in one card,
    // separated by hairline dividers. Like iOS Settings.
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: _T.surface,
        borderRadius: BorderRadius.circular(_T.r14),
        border: Border.all(color: _T.border),
      ),
      child: Column(
        children: [
          _FieldRow(
            id: 'name',
            icon: Icons.person_outline_rounded,
            hint: 'Nom complet',
            controller: nameCtrl,
            focusedId: focusedId,
            onFocus: onFocus,
            textInputAction: TextInputAction.next,
            isFirst: true,
          ),
          _FieldDivider(),
          _FieldRow(
            id: 'email',
            icon: Icons.alternate_email_rounded,
            hint: 'E-mail professionnel',
            controller: emailCtrl,
            focusedId: focusedId,
            onFocus: onFocus,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          _FieldDivider(),
          _FieldRow(
            id: 'pass',
            icon: Icons.lock_outline_rounded,
            hint: 'Mot de passe',
            controller: passCtrl,
            focusedId: focusedId,
            onFocus: onFocus,
            obscureText: obscurePass,
            textInputAction: TextInputAction.done,
            isLast: true,
            trailing: GestureDetector(
              onTap: onTogglePass,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(_T.s12),
                child: Icon(
                  obscurePass
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 16,
                  color: _T.inkMuted,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.only(left: _T.s16),
      color: _T.border,
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  FIELD ROW  (single input inside group)
// ──────────────────────────────────────────────────────────────
class _FieldRow extends StatefulWidget {
  final String id;
  final IconData icon;
  final String hint;
  final TextEditingController controller;
  final String? focusedId;
  final ValueChanged<String?> onFocus;
  final TextInputType? keyboardType;
  final bool obscureText;
  final TextInputAction? textInputAction;
  final Widget? trailing;
  final bool isFirst;
  final bool isLast;

  const _FieldRow({
    required this.id,
    required this.icon,
    required this.hint,
    required this.controller,
    required this.focusedId,
    required this.onFocus,
    this.keyboardType,
    this.obscureText = false,
    this.textInputAction,
    this.trailing,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  State<_FieldRow> createState() => _FieldRowState();
}

class _FieldRowState extends State<_FieldRow> {
  bool get _isFocused => widget.focusedId == widget.id;

  @override
  Widget build(BuildContext context) {
    // Determine border radius for first/last item
    final topRadius = widget.isFirst ? const Radius.circular(_T.r14) : Radius.zero;
    final bottomRadius = widget.isLast ? const Radius.circular(_T.r14) : Radius.zero;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: _isFocused
            ? _T.accent.withOpacity(0.025)
            : Colors.transparent,
        borderRadius: BorderRadius.only(
          topLeft: topRadius,
          topRight: topRadius,
          bottomLeft: bottomRadius,
          bottomRight: bottomRadius,
        ),
      ),
      child: Row(
        children: [
          // Icon
          Padding(
            padding: const EdgeInsets.only(left: _T.s16),
            child: AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 180),
              style: TextStyle(color: _isFocused ? _T.accent : _T.inkMuted),
              child: Icon(
                widget.icon,
                size: 16,
                color: _isFocused ? _T.accent : _T.inkMuted,
              ),
            ),
          ),
          const SizedBox(width: _T.s12),
          // Input
          Expanded(
            child: Focus(
              onFocusChange: (focused) =>
                  widget.onFocus(focused ? widget.id : null),
              child: TextFormField(
                controller: widget.controller,
                keyboardType: widget.keyboardType,
                obscureText: widget.obscureText,
                textInputAction: widget.textInputAction,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: _T.ink,
                  letterSpacing: -0.1,
                ),
                decoration: InputDecoration(
                  hintText: widget.hint,
                  hintStyle: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: _T.inkMuted,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: _T.s16,
                  ),
                ),
              ),
            ),
          ),
          // Trailing
          if (widget.trailing != null) widget.trailing!,
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  PASSWORD STRENGTH BAR
// ══════════════════════════════════════════════════════════════
class _PasswordStrengthBar extends StatelessWidget {
  final int strength; // 0–4

  const _PasswordStrengthBar({required this.strength});

  static const _labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  static final _colors = [
    Colors.transparent,
    const Color(0xFFE8902A),
    const Color(0xFFE8902A),
    _T.accent,
    _T.accent,
  ];

  @override
  Widget build(BuildContext context) {
    final color = strength > 0 ? _colors[strength] : _T.border;
    final label = strength > 0 ? _labels[strength] : '';

    return Row(
      children: [
        Expanded(
          child: Row(
            children: List.generate(4, (i) {
              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: EdgeInsets.only(right: i < 3 ? _T.s4 : 0),
                  height: 2.5,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(_T.r100),
                    color: i < strength ? color : _T.border,
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(width: _T.s12),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Text(
            label,
            key: ValueKey(label),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT BUTTON
// ══════════════════════════════════════════════════════════════
class _SubmitButton extends StatefulWidget {
  final bool isLoading;
  final VoidCallback onTap;

  const _SubmitButton({required this.isLoading, required this.onTap});

  @override
  State<_SubmitButton> createState() => _SubmitButtonState();
}

class _SubmitButtonState extends State<_SubmitButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp:   (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: _T.s56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(_T.r14),
            color: _pressed ? _T.accentDeep : _T.accent,
            boxShadow: _pressed
                ? []
                : [
                    BoxShadow(
                      color: _T.accent.withOpacity(0.25),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
          ),
          child: Center(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: widget.isLoading
                  ? const SizedBox(
                      key: ValueKey('loader'),
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 1.8,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Row(
                      key: const ValueKey('label'),
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Créer mon compte',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                            letterSpacing: -0.1,
                          ),
                        ),
                        const SizedBox(width: _T.s8),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 16,
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

// ══════════════════════════════════════════════════════════════
//  OR DIVIDER
// ══════════════════════════════════════════════════════════════
class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: _HairLine()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: _T.s16),
          child: Text(
            'ou',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: _T.inkMuted,
            ),
          ),
        ),
        const Expanded(child: _HairLine()),
      ],
    );
  }
}

class _HairLine extends StatelessWidget {
  const _HairLine();
  @override
  Widget build(BuildContext context) =>
      Container(height: 1, color: _T.border);
}

// ══════════════════════════════════════════════════════════════
//  SOCIAL ROW
// ══════════════════════════════════════════════════════════════
class _SocialRow extends StatelessWidget {
  const _SocialRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(child: _SocialButton(label: 'Google', isGoogle: true)),
        SizedBox(width: _T.s12),
        Expanded(child: _SocialButton(label: 'Apple', isGoogle: false)),
      ],
    );
  }
}

class _SocialButton extends StatefulWidget {
  final String label;
  final bool isGoogle;
  const _SocialButton({required this.label, required this.isGoogle});

  @override
  State<_SocialButton> createState() => _SocialButtonState();
}

class _SocialButtonState extends State<_SocialButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp:   (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {},
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 50,
        decoration: BoxDecoration(
          color: _pressed ? const Color(0xFFF4F0EC) : _T.surface,
          borderRadius: BorderRadius.circular(_T.r12),
          border: Border.all(color: _T.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.isGoogle)
              const _GoogleMark()
            else
              const Icon(Icons.apple_rounded, size: 18, color: _T.ink),
            const SizedBox(width: _T.s8),
            Text(
              widget.label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: _T.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  LOGIN LINK
// ══════════════════════════════════════════════════════════════
class _LoginLink extends StatelessWidget {
  final VoidCallback? onTap;
  const _LoginLink({this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Center(
        child: Text.rich(
          TextSpan(
            style: GoogleFonts.inter(
              fontSize: 13,
              color: _T.inkSoft,
            ),
            children: const [
              TextSpan(text: 'Déjà un compte ? '),
              TextSpan(
                text: 'Se connecter',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: _T.accent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  LEGAL TEXT
// ══════════════════════════════════════════════════════════════
class _LegalText extends StatelessWidget {
  const _LegalText();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text.rich(
        TextSpan(
          style: GoogleFonts.inter(
            fontSize: 11,
            color: _T.inkMuted,
            height: 1.6,
          ),
          children: const [
            TextSpan(text: 'En créant un compte, vous acceptez nos '),
            TextSpan(
              text: 'Conditions d\'utilisation',
              style: TextStyle(
                decoration: TextDecoration.underline,
                decorationColor: Color(0xFFB0A49C),
              ),
            ),
            TextSpan(text: ' et notre '),
            TextSpan(
              text: 'Politique de confidentialité',
              style: TextStyle(
                decoration: TextDecoration.underline,
                decorationColor: Color(0xFFB0A49C),
              ),
            ),
            TextSpan(text: '.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  PAINTERS
// ══════════════════════════════════════════════════════════════

/// Retenza circular arrow logo painter
class _ArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = size.width * (5.0 / 48.0)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final sx = size.width / 48;
    final sy = size.height / 48;

    canvas.drawPath(
      Path()
        ..arcTo(
          Rect.fromCircle(
            center: Offset(24 * sx, 24 * sy),
            radius: 16 * sx,
          ),
          0.0,
          311.5 * math.pi / 180,
          true,
        ),
      paint,
    );
    canvas.drawPath(
      Path()
        ..moveTo(36 * sx, 6.5 * sy)
        ..lineTo(36 * sx, 16 * sy)
        ..lineTo(26.5 * sx, 16 * sy),
      paint,
    );
  }

  @override
  bool shouldRepaint(_ArrowPainter o) => false;
}

/// Google G icon — four-color arc
class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16,
      height: 16,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    const colors = [
      Color(0xFF4285F4),
      Color(0xFF34A853),
      Color(0xFFFBBC05),
      Color(0xFFEA4335),
    ];
    final paint = Paint()
      ..strokeWidth = s.width * 0.22
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    double start = -math.pi / 2;
    for (int i = 0; i < 4; i++) {
      paint.color = colors[i];
      canvas.drawArc(
        Rect.fromCircle(center: Offset(cx, cy), radius: s.width * 0.36),
        start + 0.06,
        math.pi / 2 - 0.12,
        false,
        paint,
      );
      start += math.pi / 2;
    }
  }

  @override
  bool shouldRepaint(_GooglePainter o) => false;
}
