import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String selectedLanguage = 'fr';

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
          'Langue',
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
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFEDE5DF)),
            boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: Column(
            children: [
              _buildLanguageItem('Français', 'fr'),
              const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
              _buildLanguageItem('English (Prochainement)', 'en', disabled: true),
              const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
              _buildLanguageItem('Español (Prochainement)', 'es', disabled: true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageItem(String title, String value, {bool disabled = false}) {
    final isSelected = selectedLanguage == value;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled ? null : () => setState(() => selectedLanguage = value),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: disabled ? const Color(0xFF9C8B82) : const Color(0xFF1A1512),
                  ),
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle_rounded, color: Color(0xFFD73E26))
              else if (!disabled)
                Icon(Icons.circle_outlined, color: const Color(0xFF1A1512).withValues(alpha: 0.2)),
            ],
          ),
        ),
      ),
    );
  }
}
