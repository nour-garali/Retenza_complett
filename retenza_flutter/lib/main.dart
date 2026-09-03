import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/welcome_screen.dart';
import 'screens/login_screen.dart';
import 'screens/qr_scanner_screen.dart';
import 'screens/client_onboarding_screen.dart';
import 'screens/commerce_welcome_screen.dart';
import 'screens/merchant_registration_screen.dart';
import 'screens/merchant_setup_screen.dart';
import 'screens/client_success_screen.dart';
import 'screens/merchant_dashboard_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/client_dashboard_screen.dart';
import 'services/api_client.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    const ProviderScope(
      child: RetenzaApp(),
    ),
  );
}

class RetenzaApp extends StatelessWidget {
  const RetenzaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Retenza',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD73E26),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const AppRoot(),
    );
  }
}

// ──────────────────────────────────────────────────────────────
//  ROOT — Splash → Onboarding → Welcome → Login → Dashboard
//                                       ↘ QR → ClientSignup
//                                       ↘ MerchantReg → MerchantConfirm
// ──────────────────────────────────────────────────────────────
enum _AppPhase {
  splash,
  onboarding,
  welcome,
  login,
  qrScan,
  commerceWelcome,
  clientSignup,
  clientSuccess,
  merchantReg,
  merchantConfirm,
  merchantSetup,
  merchantDashboard,
  adminDashboard,
  main,
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  _AppPhase _phase = _AppPhase.splash;
  String _scannedQrCode = '';
  Map<String, dynamic>? _currentCommerceData;

  // ── Navigation callbacks ───────────────────────────────────
  void _onSplashComplete() => setState(() => _phase = _AppPhase.onboarding);
  void _onOnboardingComplete() => setState(() => _phase = _AppPhase.welcome);

  // Welcome → Login (customer)
  void _onSignIn() => setState(() => _phase = _AppPhase.login);

  // Welcome → QR scan (new customer signup)
  void _onCreateAccount() => setState(() => _phase = _AppPhase.qrScan);

  // Welcome → Merchant
  void _onBecomeMerchant() => setState(() => _phase = _AppPhase.merchantReg);

  // Login success — route based on role
  void _onLoginSuccess() async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('user_role');
    
    if (role == 'admin') {
      setState(() => _phase = _AppPhase.adminDashboard);
    } else if (role == 'merchant') {
      try {
        final res = await apiClient.get('/commerces/me');
        if (res.statusCode == 200 && res.data['success']) {
          final commerce = res.data['data']['commerce'];
          if (commerce['isConfigured'] == true) {
            setState(() => _phase = _AppPhase.merchantDashboard);
          } else {
            setState(() => _phase = _AppPhase.merchantSetup);
          }
        } else {
          setState(() => _phase = _AppPhase.merchantDashboard);
        }
      } catch (e) {
        setState(() => _phase = _AppPhase.merchantDashboard);
      }
    } else {
      // client
      setState(() => _phase = _AppPhase.main);
    }
  }

  // QR scan
  void _onScanQR() => setState(() => _phase = _AppPhase.qrScan);
  void _onScanSuccess(String code) {
    setState(() {
      _scannedQrCode = code;
      _phase = _AppPhase.commerceWelcome;
    });
  }

  void _onContinueToSignup(String qrCodeId, Map<String, dynamic> commerceData) {
    setState(() {
      _scannedQrCode = qrCodeId;
      _currentCommerceData = commerceData;
      _phase = _AppPhase.clientSignup;
    });
  }

  // Client signup
  void _onClientSignupSuccess(Map<String, dynamic> commerceData) {
    setState(() {
      _currentCommerceData = commerceData;
      _phase = _AppPhase.clientSuccess;
    });
  }
  void _onClientSuccessDone() => setState(() => _phase = _AppPhase.main);

  // Merchant
  void _onMerchantSuccess() => setState(() => _phase = _AppPhase.merchantConfirm);
  void _onMerchantConfirmDone() => setState(() => _phase = _AppPhase.welcome);

  // Back
  void _onBackToWelcome() => setState(() => _phase = _AppPhase.welcome);

  @override
  Widget build(BuildContext context) {
    switch (_phase) {
      case _AppPhase.splash:
        return SplashScreen(onComplete: _onSplashComplete);

      case _AppPhase.onboarding:
        return OnboardingScreen(onComplete: _onOnboardingComplete);

      case _AppPhase.welcome:
        return WelcomeScreen(
          onSignIn: _onSignIn,
          onCreateAccount: _onCreateAccount,
          onBecomeMerchant: _onBecomeMerchant,
        );

      case _AppPhase.login:
        return LoginScreen(
          onLoginSuccess: _onLoginSuccess,
          onScanQR: _onScanQR,
          onBack: _onBackToWelcome,
        );

      case _AppPhase.qrScan:
        return QRScannerScreen(
          onBack: _onBackToWelcome,
          onScanSuccess: _onScanSuccess,
        );

      case _AppPhase.commerceWelcome:
        return CommerceWelcomeScreen(
          merchantCode: _scannedQrCode,
          onBack: _onBackToWelcome,
          onContinueToSignup: _onContinueToSignup,
        );

      case _AppPhase.clientSignup:
        return ClientOnboardingScreen(
          qrCodeData: _scannedQrCode,
          commerceData: _currentCommerceData ?? {},
          onSignupSuccess: _onClientSignupSuccess,
          onCancel: _onBackToWelcome,
        );
        
      case _AppPhase.clientSuccess:
        return ClientSuccessScreen(
          commerceData: _currentCommerceData ?? {},
          onContinue: _onClientSuccessDone,
        );

      case _AppPhase.merchantReg:
        return MerchantRegistrationScreen(
          onBack: _onBackToWelcome,
          onSuccess: _onMerchantSuccess,
        );

      case _AppPhase.merchantConfirm:
        return MerchantConfirmationScreen(
          onBackToHome: _onMerchantConfirmDone,
        );

      case _AppPhase.merchantSetup:
        return MerchantSetupScreen(
          onComplete: () => setState(() => _phase = _AppPhase.merchantDashboard),
        );

      case _AppPhase.merchantDashboard:
        return MerchantDashboardScreen(
          onLogout: _onBackToWelcome,
        );

      case _AppPhase.adminDashboard:
        return AdminDashboardScreen(
          onLogout: _onBackToWelcome,
        );

      case _AppPhase.main:
        return ClientDashboardScreen(
          onLogout: _onBackToWelcome,
        );
    }
  }
}
