import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:retenza_flutter/services/auth_service.dart';
import 'package:retenza_flutter/providers/client_provider.dart';

import 'profile/personal_info_screen.dart';
import 'profile/change_password_screen.dart';
import 'profile/notifications_screen.dart';
import 'profile/language_screen.dart';
import 'profile/theme_screen.dart';
import 'profile/help_center_screen.dart';
import 'profile/contact_us_screen.dart';
import 'profile/terms_screen.dart';
import 'profile/privacy_screen.dart';

class ClientProfileTab extends ConsumerWidget {
  final VoidCallback onLogout;

  const ClientProfileTab({super.key, required this.onLogout});

  static const Color grenadier = Color(0xFFD73E26);
  static const Color ink = Color(0xFF1A1512);
  static const Color paper = Color(0xFFFAF7F5);
  static const Color muted = Color(0xFF9C8B82);
  static const Color line = Color(0xFFE8E1DA);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(clientDashboardProvider);

    return dashboardState.when(
      loading: () => const Scaffold(
        backgroundColor: paper,
        body: Center(child: CircularProgressIndicator(color: grenadier)),
      ),
      error: (err, stack) => Scaffold(
        backgroundColor: paper,
        body: Center(child: Text('Erreur: $err', style: GoogleFonts.inter())),
      ),
      data: (data) {
        final clientData = data['client'] ?? {};
        final firstName = clientData['firstName'] ?? 'Client';
        final lastName = clientData['lastName'] ?? '';
        final userName = '$firstName $lastName'.trim();
        final userEmail = clientData['email'] ?? '';
        
        String initials = 'C';
        if (firstName.isNotEmpty && lastName.isNotEmpty) {
          initials = '${firstName[0]}${lastName[0]}'.toUpperCase();
        } else if (userName.isNotEmpty) {
          initials = userName[0].toUpperCase();
        }

        return Scaffold(
      backgroundColor: paper,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // --- EN-TÊTE ---
              const SizedBox(height: 12),
              _buildHeader(initials, userName, userEmail),
              const SizedBox(height: 36),

              // --- SECTIONS ---
              _buildSection(
                title: 'Mon Compte',
                items: [
                  _ProfileItem(
                    icon: Icons.person_outline_rounded,
                    title: 'Informations personnelles',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PersonalInfoScreen())),
                  ),
                  _ProfileItem(
                    icon: Icons.lock_outline_rounded,
                    title: 'Modifier le mot de passe',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
                  ),
                ],
              ),

              _buildSection(
                title: 'Préférences',
                items: [
                  _ProfileItem(
                    icon: Icons.notifications_none_rounded,
                    title: 'Notifications',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                  ),
                  _ProfileItem(
                    icon: Icons.language_rounded,
                    title: 'Langue',
                    subtitle: 'Français',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LanguageScreen())),
                  ),
                  _ProfileItem(
                    icon: Icons.color_lens_outlined,
                    title: 'Thème',
                    subtitle: 'Clair',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ThemeScreen())),
                  ),
                ],
              ),

              _buildSection(
                title: 'Support',
                items: [
                  _ProfileItem(
                    icon: Icons.help_outline_rounded,
                    title: 'Centre d\'aide / FAQ',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterScreen())),
                  ),
                  _ProfileItem(
                    icon: Icons.chat_bubble_outline_rounded,
                    title: 'Nous contacter',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactUsScreen())),
                  ),
                ],
              ),

              _buildSection(
                title: 'À propos de Retenza',
                items: [
                  _ProfileItem(
                    icon: Icons.description_outlined,
                    title: 'Conditions générales',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsScreen())),
                  ),
                  _ProfileItem(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Politique de confidentialité',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyScreen())),
                  ),
                ],
              ),

              _buildSection(
                title: 'Compte',
                items: [
                  _ProfileItem(
                    icon: Icons.logout_rounded,
                    title: 'Se déconnecter',
                    onTap: () => _handleLogout(context),
                  ),
                  _ProfileItem(
                    icon: Icons.person_remove_outlined,
                    title: 'Supprimer mon compte',
                    isDestructive: true,
                    onTap: () => _handleDeleteAccount(context),
                  ),
                ],
              ),
              
              const SizedBox(height: 40),
              Center(
                child: Text(
                  'Retenza v1.0.0',
                  style: GoogleFonts.inter(fontSize: 12, color: muted, fontWeight: FontWeight.w500),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
      },
    );
  }

  Widget _buildHeader(String initials, String name, String email) {
    return Column(
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFEA5E44), grenadier],
            ),
            boxShadow: [
              BoxShadow(
                color: grenadier.withValues(alpha: 0.3),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Center(
            child: Text(
              initials,
              style: GoogleFonts.bricolageGrotesque(
                fontSize: 36,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: -1,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          name,
          style: GoogleFonts.bricolageGrotesque(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: ink,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          email,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: muted,
          ),
        ),
      ],
    );
  }

  Widget _buildSection({required String title, required List<_ProfileItem> items}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 12),
            child: Text(
              title,
              style: GoogleFonts.bricolageGrotesque(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: ink,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFEDE5DF), width: 1),
              boxShadow: const [
                BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4)),
              ],
            ),
            child: Column(
              children: items.asMap().entries.map((entry) {
                final int idx = entry.key;
                final _ProfileItem item = entry.value;
                final bool isLast = idx == items.length - 1;

                return Column(
                  children: [
                    _buildItemTile(item),
                    if (!isLast)
                      const Divider(
                        height: 1,
                        thickness: 1,
                        color: Color(0xFFF4EFEB),
                        indent: 64,
                        endIndent: 16,
                      ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemTile(_ProfileItem item) {
    final color = item.isDestructive ? grenadier : ink;
    final iconBgColor = item.isDestructive ? const Color(0xFFFBEAE7) : const Color(0xFFF4EFEB);
    final iconColor = item.isDestructive ? grenadier : muted;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: item.onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item.icon, size: 20, color: iconColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                    if (item.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle!,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: muted,
                        ),
                      ),
                    ]
                  ],
                ),
              ),
              if (!item.isDestructive)
                Icon(Icons.chevron_right_rounded, size: 20, color: muted.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + MediaQuery.of(context).padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: line, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 24),
            Text('Se déconnecter ?', style: GoogleFonts.bricolageGrotesque(fontSize: 22, fontWeight: FontWeight.w700, color: ink)),
            const SizedBox(height: 8),
            Text('Êtes-vous sûr de vouloir vous déconnecter ?', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: muted)),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF4EFEB),
                      foregroundColor: ink,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Annuler', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context); // Close bottom sheet
                      await AuthService.logout();
                      onLogout();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: grenadier,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Déconnexion', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _handleDeleteAccount(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Supprimer mon compte', style: GoogleFonts.bricolageGrotesque(fontSize: 20, fontWeight: FontWeight.w700, color: ink)),
        content: Text(
          'Cette action est irréversible. Toutes vos données, points de fidélité et cartes seront définitivement supprimés.',
          style: GoogleFonts.inter(fontSize: 14, color: muted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            style: TextButton.styleFrom(foregroundColor: ink),
            child: Text('Annuler', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () {
              // TODO: Appeler l'API pour supprimer le compte
              Navigator.pop(context);
              AuthService.logout();
              onLogout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFBEAE7),
              foregroundColor: grenadier,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Supprimer définitivement', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _ProfileItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final bool isDestructive;
  final VoidCallback onTap;

  _ProfileItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.isDestructive = false,
    required this.onTap,
  });
}
