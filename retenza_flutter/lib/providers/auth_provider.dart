import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

// ══════════════════════════════════════════════════════════════
//  AUTH PROVIDER
//  Gère l'état de l'authentification (chargement, erreurs, succès)
// ══════════════════════════════════════════════════════════════

class AuthState {
  final bool isLoading;
  final String? error;
  final bool isSuccess;

  const AuthState({
    this.isLoading = false,
    this.error,
    this.isSuccess = false,
  });

  AuthState copyWith({bool? isLoading, String? error, bool? isSuccess}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    return const AuthState();
  }

  Future<void> registerWithQR({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
    required String qrCode,
  }) async {
    state = state.copyWith(isLoading: true, error: null, isSuccess: false);
    
    try {
      final success = await AuthService.registerWithQR(
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        password: password,
        qrCode: qrCode,
      );
      
      if (success) {
        state = state.copyWith(isLoading: false, isSuccess: true);
      } else {
        state = state.copyWith(isLoading: false, error: 'Échec de l\'inscription');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString().replaceAll('Exception: ', ''));
    }
  }

  void reset() {
    state = const AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
