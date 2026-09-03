import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ──────────────────────────────────────────────────────────────
//  RETENZA BRAND TOKENS (LIGHT VERSION)
// ──────────────────────────────────────────────────────────────
class RetenzaColors {
  static const grenadier = Color(0xFFD73E26);
  static const grenadierDeep = Color(0xFFA82C18);
  static const grenadier700 = Color(0xFFB83320);
  static const ember = Color(0xFFF2774E);
  static const emberSoft = Color(0xFFFBE4DA);
  static const ink = Color(0xFF1B100C);
  static const ink60 = Color(0xFF6E5B52);
  static const ink40 = Color(0xFF9C8B82);
  static const line = Color(0xFFEDE5DF);
  static const paper = Color(0xFFFFFFFF);
  static const bg = Color(0xFFF4EFEB);
  static const white = Color(0xFFFFFFFF);
}

// ──────────────────────────────────────────────────────────────
//  RETENZA SPLASH SCREEN
// ──────────────────────────────────────────────────────────────
class SplashScreen extends StatefulWidget {
  final VoidCallback? onComplete;

  const SplashScreen({super.key, this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _bgController;
  late final AnimationController _tileController;
  late final AnimationController _glowController;
  late final AnimationController _logoController;
  late final AnimationController _wordmarkController;
  late final AnimationController _taglineController;
  late final AnimationController _particleController;
  late final AnimationController _rippleController;
  late final AnimationController _exitController;

  late final Animation<double> _bgOpacity;
  late final Animation<double> _tileScale;
  late final Animation<double> _tileRotation;
  late final Animation<double> _tileElevation;
  late final Animation<double> _glowRadius;
  late final Animation<double> _glowOpacity;
  late final Animation<double> _logoDraw;
  late final Animation<double> _logoFade;
  late final Animation<Offset> _wordmarkSlide;
  late final Animation<double> _wordmarkFade;
  late final Animation<Offset> _taglineSlide;
  late final Animation<double> _taglineFade;
  late final Animation<double> _rippleScale;
  late final Animation<double> _rippleOpacity;
  late final Animation<double> _exitScale;
  late final Animation<double> _exitOpacity;

  bool _exiting = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _initControllers();
    _initAnimations();
    _startSequence();
  }

  void _initControllers() {
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _tileController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _wordmarkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _taglineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();

    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _exitController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
  }

  void _initAnimations() {
    _bgOpacity = CurvedAnimation(parent: _bgController, curve: Curves.easeIn);
    _tileScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _tileController, curve: Curves.elasticOut),
    );
    _tileRotation = Tween<double>(begin: -0.15, end: 0.0).animate(
      CurvedAnimation(
        parent: _tileController,
        curve: const Interval(0.0, 0.7, curve: Curves.easeOut),
      ),
    );
    _tileElevation = Tween<double>(begin: 0.0, end: 32.0).animate(
      CurvedAnimation(
        parent: _tileController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut),
      ),
    );

    _glowRadius = Tween<double>(begin: 50.0, end: 80.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
    _glowOpacity = Tween<double>(begin: 0.2, end: 0.4).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _logoDraw = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeInOut),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeIn),
      ),
    );

    _wordmarkSlide = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _wordmarkController, curve: Curves.easeOutCubic),
    );
    _wordmarkFade = CurvedAnimation(
      parent: _wordmarkController,
      curve: Curves.easeIn,
    );

    _taglineSlide = Tween<Offset>(
      begin: const Offset(0, 0.8),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _taglineController, curve: Curves.easeOutCubic),
    );
    _taglineFade = CurvedAnimation(
      parent: _taglineController,
      curve: Curves.easeIn,
    );

    _rippleScale = Tween<double>(begin: 0.8, end: 2.0).animate(
      CurvedAnimation(parent: _rippleController, curve: Curves.easeOut),
    );
    _rippleOpacity = Tween<double>(begin: 0.35, end: 0.0).animate(
      CurvedAnimation(parent: _rippleController, curve: Curves.easeIn),
    );

    _exitScale = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _exitController, curve: Curves.easeIn),
    );
    _exitOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _exitController, curve: Curves.easeIn),
    );
  }

  Future<void> _startSequence() async {
    await Future.delayed(const Duration(milliseconds: 80));
    _bgController.forward();
    await Future.delayed(const Duration(milliseconds: 200));
    _tileController.forward();
    await Future.delayed(const Duration(milliseconds: 550));
    _logoController.forward();
    await Future.delayed(const Duration(milliseconds: 900));
    _wordmarkController.forward();
    await Future.delayed(const Duration(milliseconds: 1150));
    _taglineController.forward();
    await Future.delayed(const Duration(milliseconds: 1600));
    _triggerExit();
  }

  Future<void> _triggerExit() async {
    setState(() => _exiting = true);
    _exitController.forward();
    await Future.delayed(const Duration(milliseconds: 650));
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    widget.onComplete?.call();
  }

  @override
  void dispose() {
    _bgController.dispose();
    _tileController.dispose();
    _glowController.dispose();
    _logoController.dispose();
    _wordmarkController.dispose();
    _taglineController.dispose();
    _particleController.dispose();
    _rippleController.dispose();
    _exitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return AnimatedBuilder(
      animation: _exitController,
      builder: (ctx, _) {
        return Opacity(
          opacity: _exiting ? _exitOpacity.value : 1.0,
          child: Transform.scale(
            scale: _exiting ? _exitScale.value : 1.0,
            child: _buildSplash(size),
          ),
        );
      },
    );
  }

  Widget _buildSplash(Size size) {
    return Scaffold(
      backgroundColor: RetenzaColors.bg,
      body: AnimatedBuilder(
        animation: Listenable.merge([
          _bgController,
          _tileController,
          _glowController,
          _logoController,
          _wordmarkController,
          _taglineController,
          _particleController,
          _rippleController,
        ]),
        builder: (ctx, _) {
          return Stack(
            alignment: Alignment.center,
            children: [
              _buildBackground(size),
              _buildParticles(size),
              _buildRipple(),
              _buildGlow(),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildLogoTile(),
                  const SizedBox(height: 24),
                  _buildWordmark(),
                  const SizedBox(height: 10),
                  _buildTagline(),
                ],
              ),
              _buildBottomBadge(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBackground(Size size) {
    return FadeTransition(
      opacity: _bgOpacity,
      child: SizedBox.expand(
        child: CustomPaint(
          painter: _BackgroundPainter(
            particleProgress: _particleController.value,
          ),
        ),
      ),
    );
  }

  Widget _buildParticles(Size size) {
    return FadeTransition(
      opacity: _bgOpacity,
      child: SizedBox.expand(
        child: CustomPaint(
          painter: _ParticlePainter(
            progress: _particleController.value,
            tileProgress: _tileController.value,
          ),
        ),
      ),
    );
  }

  Widget _buildRipple() {
    return Transform.scale(
      scale: _rippleScale.value,
      child: Opacity(
        opacity: _rippleOpacity.value * _tileController.value,
        child: Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: RetenzaColors.grenadier,
              width: 1.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGlow() {
    return Opacity(
      opacity: _glowOpacity.value * _tileController.value,
      child: Container(
        width: _glowRadius.value * 2,
        height: _glowRadius.value * 2,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              RetenzaColors.grenadier.withOpacity(0.35),
              RetenzaColors.ember.withOpacity(0.15),
              Colors.transparent,
            ],
            stops: const [0.0, 0.5, 1.0],
          ),
        ),
      ),
    );
  }

  Widget _buildLogoTile() {
    return Transform.scale(
      scale: _tileScale.value,
      child: Transform.rotate(
        angle: _tileRotation.value,
        child: Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(25),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [RetenzaColors.grenadier, RetenzaColors.grenadierDeep],
            ),
            boxShadow: [
              BoxShadow(
                color: RetenzaColors.grenadier.withOpacity(0.3),
                blurRadius: _tileElevation.value,
                spreadRadius: _tileElevation.value * 0.2,
                offset: Offset(0, _tileElevation.value * 0.4),
              ),
              BoxShadow(
                color: RetenzaColors.ember.withOpacity(0.15),
                blurRadius: _tileElevation.value * 1.5,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: FadeTransition(
              opacity: _logoFade,
              child: CustomPaint(
                painter: _RetenzaLogoPainter(
                  progress: _logoDraw.value,
                  color: RetenzaColors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWordmark() {
    return FadeTransition(
      opacity: _wordmarkFade,
      child: SlideTransition(
        position: _wordmarkSlide,
        child: RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: 'retenza',
                style: GoogleFonts.bricolageGrotesque(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: RetenzaColors.ink,
                  letterSpacing: -1.2,
                  height: 1.0,
                ),
              ),
              TextSpan(
                text: '.',
                style: GoogleFonts.bricolageGrotesque(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: RetenzaColors.grenadier,
                  letterSpacing: -1.2,
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTagline() {
    return FadeTransition(
      opacity: _taglineFade,
      child: SlideTransition(
        position: _taglineSlide,
        child: Text(
          'La croissance locale automatisée.',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: RetenzaColors.ink60,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBadge() {
    return Positioned(
      bottom: 40,
      child: FadeTransition(
        opacity: _taglineFade,
        child: Column(
          children: [
            _buildPulsingDot(),
            const SizedBox(height: 8),
            Text(
              'retenza.io',
              style: GoogleFonts.spaceMono(
                fontSize: 10,
                color: RetenzaColors.ink40,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPulsingDot() {
    return AnimatedBuilder(
      animation: _glowController,
      builder: (_, __) {
        final t = _glowController.value;
        return Container(
          width: 5,
          height: 5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: RetenzaColors.grenadier.withOpacity(0.4 + 0.6 * t),
          ),
        );
      },
    );
  }
}

class _BackgroundPainter extends CustomPainter {
  final double particleProgress;
  _BackgroundPainter({required this.particleProgress});

  @override
  void paint(Canvas canvas, Size size) {
    // Light clean base
    final basePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFFFFFFFF),
          Color(0xFFF4EFEB),
          Color(0xFFEDE5DF),
        ],
        stops: [0.0, 0.5, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), basePaint);

    // Ember glow — top right
    final emberPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFF2774E).withOpacity(0.12),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCircle(
          center: Offset(size.width * 0.85, size.height * 0.08),
          radius: size.width * 0.55,
        ),
      );
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), emberPaint);

    // Grenadier glow — bottom left
    final grenadierPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFD73E26).withOpacity(0.08),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCircle(
          center: Offset(size.width * 0.12, size.height * 0.88),
          radius: size.width * 0.45,
        ),
      );
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), grenadierPaint);
  }

  @override
  bool shouldRepaint(_BackgroundPainter old) =>
      old.particleProgress != particleProgress;
}

class _ParticlePainter extends CustomPainter {
  final double progress;
  final double tileProgress;

  _ParticlePainter({required this.progress, required this.tileProgress});

  static final List<_ParticleDef> _particles = [
    _ParticleDef(0.15, 0.18, 2.5, 0.0),
    _ParticleDef(0.82, 0.22, 1.8, 0.25),
    _ParticleDef(0.08, 0.65, 2.0, 0.5),
    _ParticleDef(0.90, 0.58, 1.5, 0.1),
    _ParticleDef(0.35, 0.12, 1.2, 0.7),
    _ParticleDef(0.70, 0.82, 2.2, 0.35),
    _ParticleDef(0.22, 0.88, 1.6, 0.6),
    _ParticleDef(0.78, 0.10, 1.3, 0.85),
    _ParticleDef(0.50, 0.92, 1.0, 0.45),
    _ParticleDef(0.62, 0.42, 1.8, 0.15),
    _ParticleDef(0.30, 0.55, 1.1, 0.9),
    _ParticleDef(0.88, 0.74, 1.4, 0.55),
    _ParticleDef(0.05, 0.35, 1.7, 0.3),
    _ParticleDef(0.95, 0.40, 1.2, 0.75),
    _ParticleDef(0.45, 0.05, 2.0, 0.2),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    for (final p in _particles) {
      final phase = (progress + p.phase) % 1.0;
      final dy = math.sin(phase * math.pi * 2) * 8.0;

      final x = p.relX * size.width;
      final y = p.relY * size.height + dy;

      final opacity = ((0.08 + 0.15 * math.sin(phase * math.pi * 2 + 1.0)) *
          tileProgress).clamp(0.0, 1.0);

      paint.color = RetenzaColors.grenadier.withOpacity(opacity);
      canvas.drawCircle(Offset(x, y), p.radius, paint);
    }

    final linePaint = Paint()
      ..color = RetenzaColors.ink.withOpacity((0.015 * tileProgress).clamp(0.0, 1.0))
      ..strokeWidth = 0.5;

    const step = 60.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), linePaint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
    }
  }

  @override
  bool shouldRepaint(_ParticlePainter old) =>
      old.progress != progress || old.tileProgress != tileProgress;
}

class _ParticleDef {
  final double relX, relY, radius, phase;
  const _ParticleDef(this.relX, this.relY, this.radius, this.phase);
}

class _RetenzaLogoPainter extends CustomPainter {
  final double progress;
  final Color color;

  _RetenzaLogoPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    final w = size.width;
    final h = size.height;

    final paint = Paint()
      ..color = color
      ..strokeWidth = w * (5.0 / 48.0)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final sx = w / 48;
    final sy = h / 48;

    final path1 = Path();
    path1.arcTo(
      Rect.fromCircle(center: Offset(24 * sx, 24 * sy), radius: 16 * sx),
      0.0,
      311.5 * math.pi / 180,
      true,
    );

    final path2 = Path();
    path2.moveTo(36 * sx, 6.5 * sy);
    path2.lineTo(36 * sx, 16 * sy);
    path2.lineTo(26.5 * sx, 16 * sy);

    final len1 = _totalLength(path1);
    final len2 = _totalLength(path2);
    final total = len1 + len2;
    if (total <= 0) return;

    final drawn = (progress * total).clamp(0.0, total);

    if (drawn > 0 && len1 > 0) {
      final d1 = drawn.clamp(0.0, len1);
      final p = _extractUpTo(path1, d1);
      if (p != null) canvas.drawPath(p, paint);
    }

    if (drawn > len1 && len2 > 0) {
      final d2 = (drawn - len1).clamp(0.0, len2);
      final p = _extractUpTo(path2, d2);
      if (p != null) canvas.drawPath(p, paint);
    }
  }

  double _totalLength(Path path) {
    double total = 0;
    for (final m in path.computeMetrics()) {
      total += m.length;
    }
    return total;
  }

  Path? _extractUpTo(Path path, double upTo) {
    if (upTo <= 0) return null;
    final result = Path();
    double remaining = upTo;
    for (final m in path.computeMetrics()) {
      if (remaining <= 0) break;
      final segLen = m.length;
      if (segLen <= 0) continue;
      final end = remaining.clamp(0.0, segLen);
      result.addPath(m.extractPath(0, end), Offset.zero);
      remaining -= segLen;
    }
    return result;
  }

  @override
  bool shouldRepaint(_RetenzaLogoPainter old) =>
      old.progress != progress || old.color != color;
}
