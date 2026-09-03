import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ThemeScreen extends StatefulWidget {
  const ThemeScreen({super.key});

  @override
  State<ThemeScreen> createState() => _ThemeScreenState();
}

class _ThemeScreenState extends State<ThemeScreen> {
  String selectedTheme = 'light';

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
          'Thème',
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
              _buildThemeItem('Mode Clair', 'light', Icons.light_mode_outlined),
              const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
              _buildThemeItem('Mode Sombre (Prochainement)', 'dark', Icons.dark_mode_outlined, disabled: true),
              const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
              _buildThemeItem('Automatique', 'system', Icons.settings_suggest_outlined, disabled: true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeItem(String title, String value, IconData icon, {bool disabled = false}) {
    final isSelected = selectedTheme == value;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled ? null : () => setState(() => selectedTheme = value),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(icon, color: disabled ? const Color(0xFF9C8B82) : const Color(0xFF1A1512), size: 22),
              const SizedBox(width: 16),
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
