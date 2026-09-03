import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ══════════════════════════════════════════════════════════════
//  RETENZA ONBOARDING — Version Finesse (LIGHT VERSION)
// ══════════════════════════════════════════════════════════════

class OnboardingScreen extends StatefulWidget {
  final VoidCallback? onComplete;
  const OnboardingScreen({super.key, this.onComplete});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _next() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeInOutCubic,
      );
    } else {
      widget.onComplete?.call();
    }
  }

  void _skip() => widget.onComplete?.call();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4EFEB),
      body: Stack(
        children: [
          const _AmbientBg(),
          Column(
            children: [
              SafeArea(
                bottom: false,
                child: _TopBar(
                  currentPage: _currentPage,
                  onSkip: _skip,
                ),
              ),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (i) =>
                      setState(() => _currentPage = i),
                  children: [
                    _OnboardingPage(
                      illustration: const _IllustrationCapture(),
                      step: '01 / 03',
                      title: 'Collectez vos clients\nsans aucun effort.',
                      highlight: 'sans aucun effort.',
                      body:
                          'Retenza identifie automatiquement chaque client depuis votre point de vente. Zéro saisie. Données complètes dès le premier jour.',
                    ),
                    _OnboardingPage(
                      illustration: const _IllustrationScore(),
                      step: '02 / 03',
                      title: 'Notre IA note\nchaque profil client.',
                      highlight: 'chaque profil client.',
                      body:
                          'VIP, fidèles, à risque ou perdus — chaque client reçoit un score précis. Sachez exactement sur qui concentrer vos efforts.',
                    ),
                    _OnboardingPage(
                      illustration: const _IllustrationGrowth(),
                      step: '03 / 03',
                      title: 'Relancez, fidélisez,\net mesurez tout.',
                      highlight: 'et mesurez tout.',
                      body:
                          'Campagnes SMS ciblées en un clic. Résultats en temps réel. Chaque euro investi, tracé et rentabilisé. ROI moyen × 4.2.',
                    ),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: _BottomNav(
                  currentPage: _currentPage,
                  onNext: _next,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final int currentPage;
  final VoidCallback onSkip;

  const _TopBar({required this.currentPage, required this.onSkip});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const _RetenzaTile(size: 32),
              const SizedBox(width: 10),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'retenza',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1B100C),
                        letterSpacing: -0.5,
                      ),
                    ),
                    TextSpan(
                      text: '.',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFD73E26),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (currentPage < 2)
            GestureDetector(
              onTap: onSkip,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Text(
                  'Passer',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF9C8B82),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final Widget illustration;
  final String step;
  final String title;
  final String highlight;
  final String body;

  const _OnboardingPage({
    required this.illustration,
    required this.step,
    required this.title,
    required this.highlight,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 5,
            child: Center(
              child: illustration,
            ),
          ),
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step,
                  style: GoogleFonts.spaceMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFD73E26),
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 14),
                _AnimatedTitle(title: title, highlight: highlight),
                const SizedBox(height: 16),
                Text(
                  body,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    color: const Color(0xFF6E5B52),
                    height: 1.65,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AnimatedTitle extends StatelessWidget {
  final String title;
  final String highlight;

  const _AnimatedTitle({required this.title, required this.highlight});

  @override
  Widget build(BuildContext context) {
    final lines = title.split('\n');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        final isHighlight = line == highlight;
        return Text(
          line,
          style: GoogleFonts.bricolageGrotesque(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color:
                isHighlight ? const Color(0xFFD73E26) : const Color(0xFF1B100C),
            letterSpacing: -0.7,
            height: 1.15,
          ),
        );
      }).toList(),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int currentPage;
  final VoidCallback onNext;

  const _BottomNav({required this.currentPage, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final isLast = currentPage == 2;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
      child: Row(
        children: [
          Row(
            children: List.generate(3, (i) {
              final active = i == currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                margin: const EdgeInsets.only(right: 6),
                width: active ? 28 : 8,
                height: 8,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(100),
                  color: active
                      ? const Color(0xFFD73E26)
                      : const Color(0xFFEDE5DF),
                ),
              );
            }),
          ),
          const Spacer(),
          GestureDetector(
            onTap: onNext,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: EdgeInsets.symmetric(
                horizontal: isLast ? 28 : 22,
                vertical: 16,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(100),
                color: const Color(0xFFD73E26),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD73E26).withOpacity(0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isLast)
                    Text(
                      'Commencer',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.1,
                      ),
                    ),
                  if (isLast) const SizedBox(width: 8),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AmbientBg extends StatelessWidget {
  const _AmbientBg();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned.fill(
      child: CustomPaint(
        painter: _AmbientPainter(size: size),
      ),
    );
  }
}

class _AmbientPainter extends CustomPainter {
  final Size size;
  const _AmbientPainter({required this.size});

  @override
  void paint(Canvas canvas, Size s) {
    final topGlow = Paint()
      ..shader = RadialGradient(colors: [
        const Color(0xFFF2774E).withOpacity(0.08),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(
        center: Offset(s.width * 0.88, s.height * 0.06),
        radius: s.width * 0.6,
      ));
    canvas.drawRect(Rect.fromLTWH(0, 0, s.width, s.height), topGlow);

    final bottomGlow = Paint()
      ..shader = RadialGradient(colors: [
        const Color(0xFFD73E26).withOpacity(0.06),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(
        center: Offset(s.width * 0.5, s.height * 0.95),
        radius: s.width * 0.7,
      ));
    canvas.drawRect(Rect.fromLTWH(0, 0, s.width, s.height), bottomGlow);
  }

  @override
  bool shouldRepaint(_AmbientPainter old) => false;
}

// ──────────────────────────────────────────────────────────────
//  ILLUSTRATION 1 — Collecte automatique (Refonte v2)
//  Terminal sleek au centre avec cartes de données abstraites
//  descendantes et ondes radar.
// ──────────────────────────────────────────────────────────────
class _IllustrationCapture extends StatelessWidget {
  const _IllustrationCapture();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      height: 230,
      child: FittedBox(
        fit: BoxFit.contain,
        child: SizedBox(
          width: 280,
          height: 280,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Cercle de fond doux
              Container(
                width: 230,
                height: 230,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFFFFFFF),
                  border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
                ),
              ),
              
              // Lignes d'ondes radar (CustomPaint)
              SizedBox(
                width: 230,
                height: 230,
                child: CustomPaint(painter: _RadarWavesPainter()),
              ),

              // Terminal central (au centre bas)
              Positioned(
                bottom: 30,
                child: _MinimalTerminal(),
              ),

              // Cartes de données abstraites descendant vers le terminal
              Positioned(
                top: 40,
                left: 45,
                child: Transform.rotate(
                  angle: -0.2,
                  child: const _AbstractDataCard(color: Color(0xFFD73E26)),
                ),
              ),
              Positioned(
                top: 25,
                right: 65,
                child: Transform.rotate(
                  angle: 0.15,
                  child: const _AbstractDataCard(color: Color(0xFF3F7E78), isSmall: true),
                ),
              ),
              Positioned(
                top: 85,
                right: 35,
                child: Transform.rotate(
                  angle: 0.25,
                  child: const _AbstractDataCard(color: Color(0xFFE8902A)),
                ),
              ),

              // Un petit badge flottant "Zéro saisie" 
              Positioned(
                bottom: 80,
                left: 40,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: const Color(0xFFFFFFFF),
                    border: Border.all(color: const Color(0xFFEDE5DF)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.bolt_rounded, size: 14, color: Color(0xFFD73E26)),
                      const SizedBox(width: 4),
                      Text(
                        'Zéro saisie',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1B100C),
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
    );
  }
}

class _RadarWavesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height - 35);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..color = const Color(0xFFD73E26).withOpacity(0.12)
      ..strokeWidth = 1.5;

    canvas.drawCircle(center, 70, paint);
    paint.color = const Color(0xFFD73E26).withOpacity(0.06);
    canvas.drawCircle(center, 120, paint);
    paint.color = const Color(0xFFD73E26).withOpacity(0.03);
    canvas.drawCircle(center, 170, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MinimalTerminal extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 90,
      height: 120,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEDE5DF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Screen area
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFFBF8F6),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFEDE5DF), width: 0.5),
              ),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFD73E26).withOpacity(0.1),
                  ),
                  child: const Icon(
                    Icons.contactless_rounded,
                    color: Color(0xFFD73E26),
                    size: 24,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Base indicator
          Container(
            width: 30,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFEDE5DF),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }
}

class _AbstractDataCard extends StatelessWidget {
  final Color color;
  final bool isSmall;
  const _AbstractDataCard({required this.color, this.isSmall = false});

  @override
  Widget build(BuildContext context) {
    final double sizeMult = isSmall ? 0.8 : 1.0;
    return Container(
      width: 60 * sizeMult,
      height: 75 * sizeMult,
      padding: EdgeInsets.all(8 * sizeMult),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12 * sizeMult),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 12 * sizeMult,
            offset: Offset(0, 4 * sizeMult),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20 * sizeMult,
            height: 20 * sizeMult,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Container(
                width: 8 * sizeMult,
                height: 8 * sizeMult,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          const Spacer(),
          Container(
            width: double.infinity,
            height: 4 * sizeMult,
            decoration: BoxDecoration(
              color: const Color(0xFFEDE5DF),
              borderRadius: BorderRadius.circular(2 * sizeMult),
            ),
          ),
          SizedBox(height: 5 * sizeMult),
          Container(
            width: 24 * sizeMult,
            height: 4 * sizeMult,
            decoration: BoxDecoration(
              color: const Color(0xFFEDE5DF),
              borderRadius: BorderRadius.circular(2 * sizeMult),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  ILLUSTRATION 2 — Score IA (Refonte v2)
//  Carte de profil abstraite scannée par un laser IA
//  avec un badge de score premium contrasté.
// ──────────────────────────────────────────────────────────────
class _IllustrationScore extends StatelessWidget {
  const _IllustrationScore();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      height: 230,
      child: FittedBox(
        fit: BoxFit.contain,
        child: SizedBox(
          width: 280,
          height: 280,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Cercle de fond doux
              Container(
                width: 230,
                height: 230,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFFFFFFF),
                  border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
                ),
              ),
              
              // Particules flottantes en arrière-plan
              const Positioned(top: 60, right: 50, child: _MiniSparkle(color: Color(0xFFD73E26))),
              const Positioned(bottom: 80, left: 40, child: _MiniSparkle(color: Color(0xFF3F7E78), size: 10)),
              const Positioned(top: 100, left: 60, child: _MiniSparkle(color: Color(0xFFE8902A), size: 10)),

              // Carte profil scannée
              Positioned(
                child: Transform.rotate(
                  angle: 0.06,
                  child: const _AbstractProfileCard(),
                ),
              ),

              // Badge VIP flottant
              Positioned(
                top: 45,
                left: 20,
                child: Transform.rotate(
                  angle: -0.08,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD73E26).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFD73E26).withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      'VIP',
                      style: GoogleFonts.spaceMono(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ),
              ),

              // Badge Premium Score IA
              Positioned(
                bottom: 40,
                right: 15,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B100C), // Dark premium badge
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.1), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1B100C).withOpacity(0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.auto_awesome_rounded, color: Color(0xFFF2774E), size: 16),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Score IA',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF9C8B82),
                            ),
                          ),
                          Text(
                            '98',
                            style: GoogleFonts.bricolageGrotesque(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AbstractProfileCard extends StatelessWidget {
  const _AbstractProfileCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      height: 180,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Contenu abstrait
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBF8F6),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFEDE5DF)),
                      ),
                      child: const Icon(Icons.person_outline_rounded, color: Color(0xFF9C8B82), size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(height: 6, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFEDE5DF), borderRadius: BorderRadius.circular(3))),
                          const SizedBox(height: 8),
                          Container(height: 6, width: 40, decoration: BoxDecoration(color: const Color(0xFFEDE5DF), borderRadius: BorderRadius.circular(3))),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(height: 4, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFFBF8F6), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 12),
                Container(height: 4, width: 80, decoration: BoxDecoration(color: const Color(0xFFFBF8F6), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 12),
                Container(height: 4, width: 100, decoration: BoxDecoration(color: const Color(0xFFFBF8F6), borderRadius: BorderRadius.circular(2))),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _MiniGraphBar(height: 15, color: const Color(0xFFD73E26).withOpacity(0.3)),
                    _MiniGraphBar(height: 25, color: const Color(0xFFD73E26).withOpacity(0.6)),
                    _MiniGraphBar(height: 10, color: const Color(0xFFD73E26).withOpacity(0.3)),
                    _MiniGraphBar(height: 30, color: const Color(0xFFD73E26)),
                  ],
                ),
              ],
            ),
          ),

          // Ligne laser IA
          Positioned(
            top: 85,
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: const Color(0xFFD73E26),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD73E26).withOpacity(0.6),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
          ),
          
          // Traînée du laser (gradient)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 85,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFFD73E26).withOpacity(0.0),
                      const Color(0xFFD73E26).withOpacity(0.08),
                    ],
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

class _MiniGraphBar extends StatelessWidget {
  final double height;
  final Color color;
  const _MiniGraphBar({required this.height, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

class _MiniSparkle extends StatelessWidget {
  final Color color;
  final double size;
  const _MiniSparkle({required this.color, this.size = 14});

  @override
  Widget build(BuildContext context) {
    return Icon(Icons.auto_awesome_rounded, color: color.withOpacity(0.4), size: size);
  }
}

// ──────────────────────────────────────────────────────────────
//  ILLUSTRATION 3 — Croissance & Résultats
//  Courbe area chart + 3 KPI pills flottants
// ──────────────────────────────────────────────────────────────
class _IllustrationGrowth extends StatelessWidget {
  const _IllustrationGrowth();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      height: 230,
      child: FittedBox(
        fit: BoxFit.contain,
        child: SizedBox(
          width: 280,
          height: 280,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Fond circulaire
              Container(
                width: 230,
                height: 230,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFFFFFFF),
                  border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
                ),
              ),
              // Carte principale avec courbe
              Container(
                width: 210,
                height: 130,
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: const Color(0xFFFFFFFF),
                  border: Border.all(color: const Color(0xFFEDE5DF)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Fidélisation',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF6E5B52),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color:
                                const Color(0xFFD73E26).withOpacity(0.10),
                          ),
                          child: Text(
                            '↑ +31%',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFD73E26),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '×4.2 ROI',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1B100C),
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Area chart
                    Expanded(
                      child: ClipRRect(
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(8),
                          bottomRight: Radius.circular(8),
                        ),
                        child: CustomPaint(
                          size: const Size(double.infinity, double.infinity),
                          painter: _AreaChartPainter(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // KPI pill — haut gauche
              const Positioned(
                top: 22,
                left: 18,
                child: _KpiPill(value: '+31%', label: 'retour', color: Color(0xFFD73E26)),
              ),
              // KPI pill — haut droit
              const Positioned(
                top: 22,
                right: 18,
                child: _KpiPill(value: '1 clic', label: 'envoi', color: Color(0xFF3F7E78)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AreaChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Points de la courbe (normalisés 0.0–1.0)
    final pts = [0.72, 0.60, 0.65, 0.48, 0.52, 0.38, 0.28, 0.15];
    final dx = w / (pts.length - 1);

    // Chemin de remplissage (area)
    final areaPath = Path()..moveTo(0, h);
    for (int i = 0; i < pts.length; i++) {
      areaPath.lineTo(i * dx, pts[i] * h);
    }
    areaPath.lineTo(w, h);
    areaPath.close();

    final areaPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFFD73E26).withOpacity(0.18),
          const Color(0xFFD73E26).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(areaPath, areaPaint);

    // Ligne de la courbe
    final linePath = Path()..moveTo(0, pts[0] * h);
    for (int i = 1; i < pts.length; i++) {
      linePath.lineTo(i * dx, pts[i] * h);
    }
    final linePaint = Paint()
      ..color = const Color(0xFFD73E26)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(linePath, linePaint);

    // Point final (dernier point de la courbe)
    final dotPaint = Paint()..color = const Color(0xFFD73E26);
    canvas.drawCircle(Offset((pts.length - 1) * dx, pts.last * h), 4, dotPaint);
    canvas.drawCircle(
      Offset((pts.length - 1) * dx, pts.last * h),
      7,
      Paint()..color = const Color(0xFFD73E26).withOpacity(0.15),
    );
  }

  @override
  bool shouldRepaint(_AreaChartPainter old) => false;
}

class _KpiPill extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _KpiPill(
      {required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFFFFFFFF),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: GoogleFonts.bricolageGrotesque(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 9,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF6E5B52),
            ),
          ),
        ],
      ),
    );
  }
}

class _RetenzaTile extends StatelessWidget {
  final double size;
  const _RetenzaTile({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.27),
        gradient: const LinearGradient(
          colors: [Color(0xFFD73E26), Color(0xFFA82C18)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD73E26).withOpacity(0.35),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: CustomPaint(painter: _MiniArrowPainter()),
    );
  }
}

class _MiniArrowPainter extends CustomPainter {
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

    final arc = Path()
      ..arcTo(
        Rect.fromCircle(
            center: Offset(24 * sx, 24 * sy), radius: 16 * sx),
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
