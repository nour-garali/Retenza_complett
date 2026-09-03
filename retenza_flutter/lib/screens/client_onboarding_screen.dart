import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

// ══════════════════════════════════════════════════════════════
//  CLIENT ONBOARDING SCREEN
//  Formulaire simplifié après le scan du QR Code
// ══════════════════════════════════════════════════════════════

abstract class _T {
  static const bg = Color(0xFFF8F6F4);
  static const ink = Color(0xFF18110C);
  static const inkSoft = Color(0xFF7A6B62);
  static const inkMuted = Color(0xFFB0A49C);
  static const accent = Color(0xFFD73E26);
  static const accentDeep = Color(0xFFA82C18);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFEAE4DF);
}

class ClientOnboardingScreen extends ConsumerStatefulWidget {
  final void Function(Map<String, dynamic> commerce) onSignupSuccess;
  final VoidCallback onCancel;
  final String qrCodeData; // ID du commerce scanné
  final Map<String, dynamic> commerceData; // Données du commerce (name, logo...)

  const ClientOnboardingScreen({
    super.key,
    required this.onSignupSuccess,
    required this.onCancel,
    required this.qrCodeData,
    required this.commerceData,
  });

  @override
  ConsumerState<ClientOnboardingScreen> createState() => _ClientOnboardingScreenState();
}

class _ClientOnboardingScreenState extends ConsumerState<ClientOnboardingScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _obscurePass = true;
  bool _obscureConfirmPass = true;
  String? _focusedId;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
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

    ref.read(authProvider.notifier).registerWithQR(
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
          password: _passCtrl.text,
          qrCode: widget.qrCodeData,
        );
  }

  void _setFocus(String? id) => setState(() => _focusedId = id);

  @override
  Widget build(BuildContext context) {
    // Écoute des changements d'état (succès ou erreur)
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: _T.accentDeep,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else if (next.isSuccess) {
        widget.onSignupSuccess(widget.commerceData);
      }
    });

    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: _T.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _BackButton(onTap: widget.onCancel),
                    const SizedBox(height: 40),
                    
                    Text(
                      'Félicitations !',
                      style: GoogleFonts.bricolageGrotesque(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        color: _T.ink,
                        letterSpacing: -0.9,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Complétez votre profil pour obtenir votre carte de fidélité et vos premiers points.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: _T.inkSoft,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Card Form
                    Container(
                      decoration: BoxDecoration(
                        color: _T.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _T.border),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _FieldRow(
                                  id: 'prenom',
                                  hint: 'Prénom',
                                  controller: _firstNameCtrl,
                                  focusedId: _focusedId,
                                  onFocus: _setFocus,
                                  isFirst: true,
                                ),
                              ),
                              Container(width: 1, height: 50, color: _T.border),
                              Expanded(
                                child: _FieldRow(
                                  id: 'nom',
                                  hint: 'Nom',
                                  controller: _lastNameCtrl,
                                  focusedId: _focusedId,
                                  onFocus: _setFocus,
                                ),
                              ),
                            ],
                          ),
                          _FieldDivider(),
                          _FieldRow(
                            id: 'email',
                            hint: 'Adresse e-mail',
                            controller: _emailCtrl,
                            focusedId: _focusedId,
                            onFocus: _setFocus,
                            keyboardType: TextInputType.emailAddress,
                          ),
                          _FieldDivider(),
                          _FieldRow(
                            id: 'phone',
                            hint: 'Téléphone (ex: +336...)',
                            controller: _phoneCtrl,
                            focusedId: _focusedId,
                            onFocus: _setFocus,
                            keyboardType: TextInputType.phone,
                          ),
                          _FieldDivider(),
                          _FieldRow(
                            id: 'pass',
                            hint: 'Mot de passe sécurisé',
                            controller: _passCtrl,
                            focusedId: _focusedId,
                            onFocus: _setFocus,
                            obscureText: _obscurePass,
                            isLast: false,
                            trailing: GestureDetector(
                              onTap: () => setState(() => _obscurePass = !_obscurePass),
                              behavior: HitTestBehavior.opaque,
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Icon(
                                  _obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
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
                            isLast: true,
                            trailing: GestureDetector(
                              onTap: () => setState(() => _obscureConfirmPass = !_obscureConfirmPass),
                              behavior: HitTestBehavior.opaque,
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Icon(
                                  _obscureConfirmPass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                  size: 16,
                                  color: _T.inkMuted,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    _SubmitButton(
                      isLoading: authState.isLoading,
                      onTap: _submit,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FieldDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(height: 1, margin: const EdgeInsets.only(left: 16), color: _T.border);
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
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  State<_FieldRow> createState() => _FieldRowState();
}

class _FieldRowState extends State<_FieldRow> {
  bool get _isFocused => widget.focusedId == widget.id;

  @override
  Widget build(BuildContext context) {
    final topRadius = widget.isFirst ? const Radius.circular(14) : Radius.zero;
    final bottomRadius = widget.isLast ? const Radius.circular(14) : Radius.zero;

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
              onFocusChange: (focused) => widget.onFocus(focused ? widget.id : null),
              child: TextFormField(
                controller: widget.controller,
                keyboardType: widget.keyboardType,
                obscureText: widget.obscureText,
                validator: (val) => val != null && val.isEmpty ? 'Requis' : null,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: _T.ink),
                decoration: InputDecoration(
                  hintText: widget.hint,
                  hintStyle: GoogleFonts.inter(fontSize: 14, color: _T.inkMuted),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
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

class _SubmitButton extends StatefulWidget {
  final bool isLoading;
  final VoidCallback onTap;
  const _SubmitButton({required this.isLoading, required this.onTap});

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
        duration: const Duration(milliseconds: 120),
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: _pressed ? _T.accentDeep : _T.accent,
            boxShadow: _pressed ? [] : [
              BoxShadow(color: _T.accent.withValues(alpha: 0.25), blurRadius: 20, offset: const Offset(0, 6)),
            ],
          ),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 1.8, color: Colors.white))
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Obtenir ma carte', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(width: 8),
                      const Icon(Icons.credit_card_rounded, color: Colors.white, size: 18),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  final VoidCallback? onTap;
  const _BackButton({this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(color: _T.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: _T.border)),
        child: const Icon(Icons.close_rounded, size: 16, color: _T.inkSoft),
      ),
    );
  }
}
