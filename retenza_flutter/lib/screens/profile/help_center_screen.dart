import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1A1512)),
        title: Text(
          'Centre d\'aide',
          style: GoogleFonts.bricolageGrotesque(
            color: const Color(0xFF1A1512),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            _buildFaqItem('Comment utiliser mes points ?', 'Pour utiliser vos points, rendez-vous chez votre commerçant et présentez votre code QR dans l\'onglet "Carte". Le commerçant scannera votre code et déduira les points de votre solde.'),
            const SizedBox(height: 16),
            _buildFaqItem('Comment gagner des points ?', 'Vous gagnez des points à chaque achat chez un commerçant partenaire de Retenza. Scannez simplement votre QR code lors de votre passage en caisse.'),
            const SizedBox(height: 16),
            _buildFaqItem('Mes points ont-ils une date d\'expiration ?', 'Les points accumulés n\'expirent pas tant que le commerçant participe au programme Retenza.'),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEDE5DF)),
        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: const Color(0xFFD73E26),
          collapsedIconColor: const Color(0xFF9C8B82),
          title: Text(
            question,
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF1A1512)),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                answer,
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9C8B82), height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
