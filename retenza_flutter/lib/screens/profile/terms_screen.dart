import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

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
          'Conditions générales',
          style: GoogleFonts.bricolageGrotesque(
            color: const Color(0xFF1A1512),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFEDE5DF)),
            boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '1. Acceptation des conditions',
                style: GoogleFonts.bricolageGrotesque(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF1A1512)),
              ),
              const SizedBox(height: 8),
              Text(
                'En utilisant l\'application Retenza, vous acceptez d\'être lié par les présentes conditions générales d\'utilisation.',
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9C8B82), height: 1.5),
              ),
              const SizedBox(height: 24),
              Text(
                '2. Programme de fidélité',
                style: GoogleFonts.bricolageGrotesque(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF1A1512)),
              ),
              const SizedBox(height: 8),
              Text(
                'Retenza met à disposition une plateforme permettant aux commerçants de digitaliser leur programme de fidélité. Les récompenses sont offertes par les commerçants et non par Retenza.',
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9C8B82), height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
