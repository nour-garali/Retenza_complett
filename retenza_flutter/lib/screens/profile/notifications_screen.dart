import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool pushEnabled = true;
  bool emailEnabled = false;
  bool smsEnabled = true;

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
          'Notifications',
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Gérez vos préférences de communication pour rester informé de vos récompenses.',
              style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9C8B82), height: 1.5),
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFEDE5DF)),
                boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Column(
                children: [
                  _buildToggleItem(
                    'Notifications Push',
                    'Recevez des alertes sur votre téléphone.',
                    pushEnabled,
                    (v) => setState(() => pushEnabled = v),
                  ),
                  const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
                  _buildToggleItem(
                    'Emails',
                    'Recevez des offres et des résumés par email.',
                    emailEnabled,
                    (v) => setState(() => emailEnabled = v),
                  ),
                  const Divider(height: 1, color: Color(0xFFF4EFEB), indent: 16, endIndent: 16),
                  _buildToggleItem(
                    'SMS',
                    'Recevez des alertes urgentes par SMS.',
                    smsEnabled,
                    (v) => setState(() => smsEnabled = v),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleItem(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF1A1512)),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF9C8B82)),
                ),
              ],
            ),
          ),
          CupertinoSwitch(
            value: value,
            activeTrackColor: const Color(0xFFD73E26),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
