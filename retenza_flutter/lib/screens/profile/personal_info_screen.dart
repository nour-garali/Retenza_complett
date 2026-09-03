import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:retenza_flutter/providers/client_provider.dart';

class PersonalInfoScreen extends ConsumerStatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  ConsumerState<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends ConsumerState<PersonalInfoScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isInitialized = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(clientDashboardProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1A1512)),
        title: Text(
          'Informations',
          style: GoogleFonts.bricolageGrotesque(
            color: const Color(0xFF1A1512),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: dashboardState.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFD73E26))),
        error: (err, stack) => Center(child: Text('Erreur: $err')),
        data: (data) {
          if (!_isInitialized) {
            final client = data['client'] ?? {};
            _firstNameController.text = client['firstName'] ?? '';
            _lastNameController.text = client['lastName'] ?? '';
            _emailController.text = client['email'] ?? '';
            _phoneController.text = client['phone'] ?? '';
            _isInitialized = true;
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildTextField('Prénom', _firstNameController),
                const SizedBox(height: 20),
                _buildTextField('Nom', _lastNameController),
                const SizedBox(height: 20),
                _buildTextField('Adresse Email', _emailController, readOnly: true),
                const SizedBox(height: 20),
                _buildTextField('Numéro de téléphone', _phoneController),
                const SizedBox(height: 40),
                ElevatedButton(
                  onPressed: () {
                    // TODO: Appeler l'API de mise à jour du profil
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Modifications enregistrées !', style: GoogleFonts.inter()),
                        backgroundColor: const Color(0xFF1B100C),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD73E26),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text(
                    'Enregistrer les modifications',
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool readOnly = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1A1512)),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: readOnly ? const Color(0xFFF4EFEB) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEDE5DF)),
            boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: TextField(
            controller: controller,
            readOnly: readOnly,
            style: GoogleFonts.inter(color: readOnly ? const Color(0xFF9C8B82) : const Color(0xFF1A1512)),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }
}
