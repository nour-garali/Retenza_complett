import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CommerceDetailScreen extends StatelessWidget {
  final dynamic commerce;

  const CommerceDetailScreen({super.key, required this.commerce});

  @override
  Widget build(BuildContext context) {
    final name = commerce['name'] ?? 'Commerce';
    final category = commerce['category'] ?? 'Commerce local';
    final loyaltyProgram = commerce['loyaltyProgram'] ?? {};
    final type = loyaltyProgram['type'] == 'cashback' ? 'Cashback' : 'Points';
    
    // Récupération des détails du programme (ex: "Dès 100 points")
    String programDetails = '';
    if (type == 'Points') {
      final ppe = loyaltyProgram['pointsPerEuro'] ?? 1;
      programDetails = '1€ dépensé = $ppe point${ppe > 1 ? "s" : ""}';
    } else {
      final cbRate = loyaltyProgram['cashbackRate'] ?? 5;
      programDetails = '$cbRate% de cashback sur chaque achat';
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1B100C)),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border, color: Color(0xFF9C8B82)),
            onPressed: () {
              // Action pour le favori gÃ©rÃ©e globalement, mais on peut l'avoir ici aussi
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. HEADER COMMERCE
            Center(
              child: Container(
                width: 100, height: 100,
                decoration: BoxDecoration(
                  color: const Color(0xFFF4EFEB),
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 20, offset: Offset(0, 10))],
                ),
                child: const Icon(Icons.storefront_rounded, size: 48, color: Color(0xFF1B100C)),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              name,
              style: GoogleFonts.bricolageGrotesque(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF1B100C),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, size: 16, color: Color(0xFFFFB300)),
                const SizedBox(width: 4),
                Text(category, style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF9C8B82))),
              ],
            ),
            const SizedBox(height: 40),

            // 2. Ã€ PROPOS DU PROGRAMME
            Text(
              'À propos du programme',
              style: GoogleFonts.bricolageGrotesque(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1B100C)),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFEDE5DF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(color: Color(0xFFF4EFEB), shape: BoxShape.circle),
                        child: const Icon(Icons.stars_rounded, color: Color(0xFFD73E26), size: 20),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Type de programme', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9C8B82))),
                            Text(type, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF1B100C))),
                          ],
                        ),
                      )
                    ],
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(color: Color(0xFFEDE5DF))),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(color: Color(0xFFF4EFEB), shape: BoxShape.circle),
                        child: const Icon(Icons.info_outline_rounded, color: Color(0xFFD73E26), size: 20),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Règle d\'accumulation', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9C8B82))),
                            Text(programDetails, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF1B100C))),
                          ],
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // 3. CALL TO ACTION (Scanner)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1B100C),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 40),
                  const SizedBox(height: 16),
                  Text(
                    'Rejoindre ce programme',
                    style: GoogleFonts.bricolageGrotesque(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pour rejoindre ce programme de fidélité, veuillez scanner le QR Code lors de votre passage en caisse chez ce commerçant.',
                    style: GoogleFonts.inter(fontSize: 14, color: Colors.white.withValues(alpha: 0.8), height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Ouvrir le scanner
                      },
                      icon: const Icon(Icons.camera_alt_outlined, size: 20),
                      label: Text('Scanner le QR du commerce', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD73E26),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
