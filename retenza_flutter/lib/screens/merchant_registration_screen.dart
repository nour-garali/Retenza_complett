import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';

// ══════════════════════════════════════════════════════════════
//  MERCHANT REGISTRATION SCREEN
//  Completely independent from the customer flow
// ══════════════════════════════════════════════════════════════

abstract class _T {
  static const bg = Color(0xFFFBF8F6);
  static const ink = Color(0xFF18110C);
  static const inkSoft = Color(0xFF7A6B62);
  static const inkMuted = Color(0xFFB0A49C);
  static const accent = Color(0xFFD73E26);
  static const accentDeep = Color(0xFFA82C18);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFEAE4DF);
}

class MerchantRegistrationScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onSuccess;

  const MerchantRegistrationScreen({
    super.key,
    required this.onBack,
    required this.onSuccess,
  });

  @override
  State<MerchantRegistrationScreen> createState() =>
      _MerchantRegistrationScreenState();
}

class _MerchantRegistrationScreenState
    extends State<MerchantRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();

  final _businessNameCtrl = TextEditingController();
  final _ownerNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  String? _selectedCategory;
  bool _obscurePass = true;
  bool _obscureConfirmPass = true;
  bool _isLoading = false;
  String? _focusedId;

  final List<String> _categories = [
    'Restaurant',
    'Café / Boulangerie',
    'Mode & Vêtements',
    'Beauté & Bien-être',
    'Sport & Loisirs',
    'Épicerie & Alimentation',
    'Électronique',
    'Librairie & Culture',
    'Santé & Pharmacie',
    'Services',
    'Autre',
  ];

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  void dispose() {
    _businessNameCtrl.dispose();
    _ownerNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _setFocus(String? id) => setState(() => _focusedId = id);

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Veuillez sélectionner une catégorie.',
            style: GoogleFonts.inter(fontSize: 13),
          ),
          backgroundColor: _T.accentDeep,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    if (_passCtrl.text != _confirmPassCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Les mots de passe ne correspondent pas.',
            style: GoogleFonts.inter(fontSize: 13),
          ),
          backgroundColor: _T.accentDeep,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      await AuthService.registerMerchant(
        commerceName: _businessNameCtrl.text.trim(),
        ownerName: _ownerNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        category: _selectedCategory!,
        address: _addressCtrl.text.trim(),
        password: _passCtrl.text,
      );
      if (mounted) widget.onSuccess();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString().replaceAll('Exception: ', ''),
              style: GoogleFonts.inter(fontSize: 13),
            ),
            backgroundColor: _T.accentDeep,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _T.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Top bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Row(
                  children: [
                    _IconBtn(
                      icon: Icons.close_rounded,
                      onTap: widget.onBack,
                    ),
                  ],
                ),
              ),
            ),

            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Partenariat\nRetenza',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: _T.ink,
                        letterSpacing: -0.9,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Rejoignez notre réseau de commerçants et offrez\nun programme fidélité à vos clients.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: _T.inkSoft,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Form
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Commerce section ───────────────────────────
                      _SectionLabel(label: 'Votre commerce'),
                      const SizedBox(height: 8),
                      _CardForm(children: [
                        _FieldRow(
                          id: 'businessName',
                          hint: 'Nom du commerce',
                          controller: _businessNameCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          isFirst: true,
                          isLast: false,
                        ),
                        _FieldDivider(),
                        // Category dropdown
                        _CategoryPicker(
                          value: _selectedCategory,
                          categories: _categories,
                          onChanged: (v) => setState(() => _selectedCategory = v),
                          focusedId: _focusedId,
                        ),
                        _FieldDivider(),
                        _FieldRow(
                          id: 'address',
                          hint: 'Adresse du commerce',
                          controller: _addressCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          isFirst: false,
                          isLast: true,
                        ),
                      ]),

                      const SizedBox(height: 20),

                      // ── Owner section ──────────────────────────────
                      _SectionLabel(label: 'Informations du propriétaire'),
                      const SizedBox(height: 8),
                      _CardForm(children: [
                        _FieldRow(
                          id: 'ownerName',
                          hint: 'Nom complet',
                          controller: _ownerNameCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          isFirst: true,
                          isLast: false,
                        ),
                        _FieldDivider(),
                        _FieldRow(
                          id: 'email',
                          hint: 'Adresse e-mail',
                          controller: _emailCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          keyboardType: TextInputType.emailAddress,
                          isFirst: false,
                          isLast: false,
                        ),
                        _FieldDivider(),
                        _FieldRow(
                          id: 'phone',
                          hint: 'Numéro de téléphone',
                          controller: _phoneCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          keyboardType: TextInputType.phone,
                          isFirst: false,
                          isLast: false,
                        ),
                        _FieldDivider(),
                        _FieldRow(
                          id: 'pass',
                          hint: 'Mot de passe sécurisé',
                          controller: _passCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          obscureText: _obscurePass,
                          isFirst: false,
                          isLast: false,
                          trailing: GestureDetector(
                            onTap: () =>
                                setState(() => _obscurePass = !_obscurePass),
                            behavior: HitTestBehavior.opaque,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Icon(
                                _obscurePass
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 16,
                                color: _T.inkMuted,
                              ),
                            ),
                          ),
                        ),
                        _FieldDivider(),
                        _FieldRow(
                          id: 'confirmPass',
                          hint: 'Confirmer le mot de passe',
                          controller: _confirmPassCtrl,
                          focusedId: _focusedId,
                          onFocus: _setFocus,
                          obscureText: _obscureConfirmPass,
                          isFirst: false,
                          isLast: true,
                          trailing: GestureDetector(
                            onTap: () =>
                                setState(() => _obscureConfirmPass = !_obscureConfirmPass),
                            behavior: HitTestBehavior.opaque,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Icon(
                                _obscureConfirmPass
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 16,
                                color: _T.inkMuted,
                              ),
                            ),
                          ),
                        ),
                      ]),

                      const SizedBox(height: 32),

                      // ── Submit ─────────────────────────────────────
                      _SubmitButton(
                        label: 'Soumettre ma demande',
                        isLoading: _isLoading,
                        onTap: _submit,
                      ),

                      const SizedBox(height: 16),
                      Text(
                        'Votre demande sera examinée par notre équipe.\nVous recevrez une réponse sous 24–48h.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: _T.inkMuted,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  MERCHANT CONFIRMATION SCREEN
// ══════════════════════════════════════════════════════════════

class MerchantConfirmationScreen extends StatelessWidget {
  final VoidCallback onBackToHome;

  const MerchantConfirmationScreen({super.key, required this.onBackToHome});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _T.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Check circle
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFD73E26).withValues(alpha: 0.1),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Color(0xFFD73E26),
                  size: 36,
                ),
              ),
              const SizedBox(height: 32),

              Text(
                'Demande envoyée !',
                textAlign: TextAlign.center,
                style: GoogleFonts.bricolageGrotesque(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _T.ink,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Votre demande de partenariat a été soumise avec succès.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: _T.inkSoft,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 28),

              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3F1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color(0xFFD73E26).withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFD73E26),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'En attente d\'approbation administrateur',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFFD73E26),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              Text(
                'Notre équipe examinera votre dossier et vous\ncontactera sous 24–48h par email.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: _T.inkMuted,
                  height: 1.55,
                ),
              ),

              const Spacer(flex: 2),

              GestureDetector(
                onTap: onBackToHome,
                child: Container(
                  height: 54,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: _T.accent,
                    boxShadow: [
                      BoxShadow(
                        color: _T.accent.withValues(alpha: 0.22),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      'Retour à l\'accueil',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  SHARED FORM COMPONENTS
// ══════════════════════════════════════════════════════════════

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: _T.inkMuted,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _CardForm extends StatelessWidget {
  final List<Widget> children;
  const _CardForm({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _T.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _T.border),
      ),
      child: Column(children: children),
    );
  }
}

class _FieldDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
        height: 1, margin: const EdgeInsets.only(left: 16), color: _T.border);
  }
}

class _FieldRow extends StatefulWidget {
  final String id;
  final String hint;
  final TextEditingController controller;
  final String? focusedId;
  final ValueChanged<String?> onFocus;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? trailing;
  final bool isFirst;
  final bool isLast;

  const _FieldRow({
    required this.id,
    required this.hint,
    required this.controller,
    required this.focusedId,
    required this.onFocus,
    this.keyboardType,
    this.obscureText = false,
    this.trailing,
    required this.isFirst,
    required this.isLast,
  });

  @override
  State<_FieldRow> createState() => _FieldRowState();
}

class _FieldRowState extends State<_FieldRow> {
  bool get _isFocused => widget.focusedId == widget.id;

  @override
  Widget build(BuildContext context) {
    final topRadius =
        widget.isFirst ? const Radius.circular(14) : Radius.zero;
    final bottomRadius =
        widget.isLast ? const Radius.circular(14) : Radius.zero;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: _isFocused ? _T.accent.withValues(alpha: 0.025) : Colors.transparent,
        borderRadius: BorderRadius.only(
          topLeft: topRadius,
          topRight: topRadius,
          bottomLeft: bottomRadius,
          bottomRight: bottomRadius,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Focus(
              onFocusChange: (f) => widget.onFocus(f ? widget.id : null),
              child: TextFormField(
                controller: widget.controller,
                keyboardType: widget.keyboardType,
                obscureText: widget.obscureText,
                validator: (val) =>
                    val != null && val.isEmpty ? 'Requis' : null,
                style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: _T.ink),
                decoration: InputDecoration(
                  hintText: widget.hint,
                  hintStyle:
                      GoogleFonts.inter(fontSize: 14, color: _T.inkMuted),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                      vertical: 16, horizontal: 16),
                ),
              ),
            ),
          ),
          if (widget.trailing != null) widget.trailing!,
        ],
      ),
    );
  }
}

class _CategoryPicker extends StatelessWidget {
  final String? value;
  final List<String> categories;
  final ValueChanged<String?> onChanged;
  final String? focusedId;

  const _CategoryPicker({
    required this.value,
    required this.categories,
    required this.onChanged,
    required this.focusedId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          hint: Text(
            'Catégorie du commerce',
            style: GoogleFonts.inter(fontSize: 14, color: _T.inkMuted),
          ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              color: _T.inkMuted, size: 18),
          style: GoogleFonts.inter(
              fontSize: 14, fontWeight: FontWeight.w500, color: _T.ink),
          dropdownColor: _T.surface,
          borderRadius: BorderRadius.circular(12),
          items: categories
              .map((c) => DropdownMenuItem(value: c, child: Text(c)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _SubmitButton extends StatefulWidget {
  final String label;
  final bool isLoading;
  final VoidCallback onTap;

  const _SubmitButton({
    required this.label,
    required this.isLoading,
    required this.onTap,
  });

  @override
  State<_SubmitButton> createState() => _SubmitButtonState();
}

class _SubmitButtonState extends State<_SubmitButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 110),
        child: Container(
          height: 54,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: _pressed ? _T.accentDeep : _T.accent,
            boxShadow: _pressed
                ? []
                : [
                    BoxShadow(
                      color: _T.accent.withValues(alpha: 0.22),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
          ),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 1.8, color: Colors.white),
                  )
                : Text(
                    widget.label,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: _T.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _T.border),
        ),
        child: Icon(icon, size: 16, color: _T.inkSoft),
      ),
    );
  }
}
