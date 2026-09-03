import 'dart:io';

void main() {
  final file = File('lib/screens/client_dashboard_screen.dart');
  List<String> lines = file.readAsLinesSync();

  int startIndex = lines.indexWhere((line) => line.contains('Widget _buildBrandHeader() {'));
  int endIndex = lines.indexWhere((line) => line.contains('//  ONGLET 2 : CADEAUX'));

  if (startIndex == -1 || endIndex == -1) {
    print('Indices not found! \$startIndex, \$endIndex');
    return;
  }

  // Go back a few lines from ONGLET 2 to find the closing brace of the class
  while (!lines[endIndex - 1].startsWith('}')) {
    endIndex--;
  }

  print('Replacing lines \$startIndex to \${endIndex - 1}');

  final newContent = '''  Widget _buildBrandHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFEA5E44), Color(0xFFD73E26), Color(0xFF9E2A17)],
                ),
                borderRadius: BorderRadius.circular(9),
                boxShadow: [
                  BoxShadow(color: grenadier.withValues(alpha: 0.45), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Center(
                child: Text(
                  'R',
                  style: GoogleFonts.bricolageGrotesque(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
            ),
            const SizedBox(width: 9),
            RichText(
              text: TextSpan(
                style: GoogleFonts.bricolageGrotesque(fontWeight: FontWeight.w700, fontSize: 15.5, color: ink, letterSpacing: -0.2),
                children: const [
                  TextSpan(text: 'retenza'),
                  TextSpan(text: '.', style: TextStyle(color: grenadier)),
                ],
              ),
            ),
          ],
        ),
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.7),
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: ink.withValues(alpha: 0.06), blurRadius: 6, offset: const Offset(0, 2))],
          ),
          child: const Icon(Icons.notifications_none_rounded, size: 17, color: ink),
        ),
      ],
    );
  }

  Widget _buildCard(LoyaltyCard card) {
    Widget cardWidget;
    switch (card.type) {
      case LoyaltyType.points:
        cardWidget = _pointsCard(card);
        break;
      case LoyaltyType.stamps:
        cardWidget = _stampsCard(card);
        break;
      case LoyaltyType.cashback:
        cardWidget = _cashbackCard(card);
        break;
    }
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CardDetailsScreen(card: card),
          ),
        );
      },
      child: cardWidget,
    );
  }

  // --- Carte "points" (holographique) -----------------------------------------
  Widget _pointsCard(LoyaltyCard card) {
    final progress = (card.currentPoints ?? 0) / (card.pointsGoal ?? 1);
    final remaining = (card.pointsGoal ?? 0) - (card.currentPoints ?? 0);

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0xFFEA5E44), Color(0xFFD73E26), Color(0xFF9E2A17)],
          ),
          boxShadow: [
            BoxShadow(color: grenadier.withValues(alpha: 0.5), blurRadius: 40, offset: const Offset(0, 22)),
            BoxShadow(color: grenadier.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6)),
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
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(5),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFF4E2B8), Color(0xFFC9A25C), Color(0xFF8C6E36)],
                    ),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 4, offset: const Offset(0, 2))],
                  ),
                ),
                _cardHeader(card, iconBg: Colors.white.withValues(alpha: 0.2), iconColor: Colors.white),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '\${card.currentPoints ?? 0}',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1,
                        color: Colors.white,
                        shadows: [Shadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'pts · encore \${remaining > 0 ? remaining : 0} avant récompense',
                        style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.75)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 11),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress.clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: Colors.black.withValues(alpha: 0.18),
                    valueColor: AlwaysStoppedAnimation(Colors.white.withValues(alpha: 0.95)),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  card.maskedNumber ?? '•••• •••• •••• ••••',
                  style: GoogleFonts.inter(fontSize: 12.5, letterSpacing: 2, color: Colors.white.withValues(alpha: 0.6)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // --- Carte "tampons" (relief d'encre) ---------------------------------------
  Widget _stampsCard(LoyaltyCard card) {
    final collected = card.stampsCollected ?? 0;
    final goal = card.stampsGoal ?? 10;
    final rotations = [-4.0, 3.0, -2.0, 5.0, -3.0, 2.0, 4.0, -5.0, 1.0, -1.0];

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Colors.white, Color(0xFFFBF8F6)],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: ink.withValues(alpha: 0.045)),
        boxShadow: [
          BoxShadow(color: ink.withValues(alpha: 0.12), blurRadius: 36, offset: const Offset(0, 18)),
          BoxShadow(color: ink.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(card, iconBg: const Color(0xFFFBEAE7), iconColor: grenadier, dark: true),
          const SizedBox(height: 18),
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
                    border: Border.all(color: const Color(0xFFE3D9D0), width: 1.5),
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
                      BoxShadow(color: grenadier.withValues(alpha: 0.4), blurRadius: 6, offset: const Offset(0, 3)),
                      BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 2, offset: const Offset(0, -1)),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.check, size: 9, color: Colors.white70),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 11),
          Text(
            '\$collected sur \$goal · \${goal - collected} visites avant une récompense',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: muted),
          ),
        ],
      ),
    );
  }

  // --- Carte "cashback" (métal brossé) -----------------------------------------
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
            // Texture métal brossé (fines rayures diagonales)
            Positioned.fill(child: CustomPaint(painter: _BrushedMetalPainter())),
            Container(
              padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.55), blurRadius: 40, offset: const Offset(0, 22)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _cardHeader(card, iconBg: Colors.white.withValues(alpha: 0.08), iconColor: const Color(0xFFF0D9C8)),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFFDF3E7), Color(0xFFE7C9A6), Color(0xFFB98A57)],
                        ).createShader(bounds),
                        child: Text(
                          '\${(card.cashbackAmount ?? 0).toStringAsFixed(2).replaceAll('.', ',')} €',
                          style: GoogleFonts.bricolageGrotesque(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: -0.8, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Text(
                        'cagnotte disponible',
                        style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.4)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Réutilisable dès votre prochaine visite',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.35)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- En-tête commun à toutes les cartes -------------------------------------
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
          decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
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
                  color: dark ? const Color(0xFFA69E97) : Colors.white.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
        Icon(
          Icons.chevron_right,
          size: 18,
          color: dark ? const Color(0xFFC4BCB4) : Colors.white.withValues(alpha: 0.6),
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

  Widget _buildScanButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFDFAF8), Color(0xFFF5F0EC)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ink.withValues(alpha: 0.08)),
        boxShadow: [
          BoxShadow(color: ink.withValues(alpha: 0.14), blurRadius: 24, offset: const Offset(0, 10)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            // TODO: naviguer vers l'écran de scan QR
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.qr_code_scanner, size: 17, color: grenadier),
                const SizedBox(width: 9),
                Text(
                  'Scanner un nouveau commerce',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: ink),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }''';

  final painter = '''

// ---------------------------------------------------------------------------
// Texture "métal brossé" pour la carte cashback
// ---------------------------------------------------------------------------

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
''';

  final updatedLines = <String>[];
  updatedLines.addAll(lines.sublist(0, startIndex));
  updatedLines.add(newContent);
  updatedLines.addAll(lines.sublist(endIndex));
  updatedLines.add(painter);

  file.writeAsStringSync(updatedLines.join('\\n'));
}
