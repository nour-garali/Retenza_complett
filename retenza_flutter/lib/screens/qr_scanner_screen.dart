import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';

// ══════════════════════════════════════════════════════════════
//  RETENZA — QR SCANNER SCREEN
//  Premium QR Code scanner for Client Onboarding
// ══════════════════════════════════════════════════════════════

class QRScannerScreen extends StatefulWidget {
  final VoidCallback onBack;
  final ValueChanged<String> onScanSuccess;

  const QRScannerScreen({
    super.key,
    required this.onBack,
    required this.onScanSuccess,
  });

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  bool _hasScanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
      final code = barcodes.first.rawValue!;
      
      // Extract the merchantCode. Handles multiple formats:
      // 1. https://retenza.app/join/M482931  (preferred)
      // 2. http://localhost:3000/api/qrcodes/scan/RC-XXXXXX (legacy backend URL)
      // 3. RC-XXXXXX or M482931 (raw code)
      String merchantCode = code;
      if (code.contains('/join/')) {
        merchantCode = code.split('/join/').last;
      } else if (code.contains('/qrcodes/scan/')) {
        // Legacy format: extract the raw code (e.g., RC-XXXXXX)
        // The backend will resolve it via the QR table
        merchantCode = code.split('/qrcodes/scan/').last;
      }
      
      setState(() => _hasScanned = true);
      HapticFeedback.mediumImpact();
      widget.onScanSuccess(merchantCode);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Scanner View
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) {
              return Center(
                child: Text(
                  'Erreur de caméra:\n$error',
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              );
            },
          ),
          
          // 2. Overlay (Scanner UI with cutout)
          Positioned.fill(
            child: _ScannerOverlay(),
          ),
          
          // 3. Top Bar (Back button + Title)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildIconButton(
                    icon: Icons.close_rounded,
                    onTap: widget.onBack,
                  ),
                  Text(
                    'Scanner',
                    style: GoogleFonts.bricolageGrotesque(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  _buildIconButton(
                    icon: _controller.torchEnabled 
                        ? Icons.flash_on_rounded 
                        : Icons.flash_off_rounded,
                    onTap: () => _controller.toggleTorch(),
                  ),
                ],
              ),
            ),
          ),
          
          // 4. Bottom Instructions
          Positioned(
            bottom: 48,
            left: 24,
            right: 24,
            child: Column(
              children: [
                Text(
                  'Alignez le QR Code',
                  style: GoogleFonts.bricolageGrotesque(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Scannez le QR Code en magasin pour créer\nvotre carte de fidélité instantanément.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.8),
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withValues(alpha: 0.4),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
//  SCANNER OVERLAY (Dark background with transparent cutout)
// ══════════════════════════════════════════════════════════════
class _ScannerOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _OverlayPainter(),
    );
  }
}

class _OverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.65)
      ..style = PaintingStyle.fill;

    // Draw full background
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Calculate cutout rect
    final cutoutSize = size.width * 0.7;
    final cutoutRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2.2),
      width: cutoutSize,
      height: cutoutSize,
    );

    // Clear the cutout area
    canvas.drawRRect(
      RRect.fromRectAndRadius(cutoutRect, const Radius.circular(24)),
      Paint()..blendMode = BlendMode.clear,
    );

    // Draw the framing corners
    final cornerPaint = Paint()
      ..color = const Color(0xFFD73E26)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    final double cornerLength = 30;
    final r = cutoutRect;

    // Top Left
    canvas.drawPath(
      Path()
        ..moveTo(r.left, r.top + cornerLength)
        ..quadraticBezierTo(r.left, r.top, r.left + cornerLength, r.top),
      cornerPaint,
    );
    // Top Right
    canvas.drawPath(
      Path()
        ..moveTo(r.right - cornerLength, r.top)
        ..quadraticBezierTo(r.right, r.top, r.right, r.top + cornerLength),
      cornerPaint,
    );
    // Bottom Right
    canvas.drawPath(
      Path()
        ..moveTo(r.right, r.bottom - cornerLength)
        ..quadraticBezierTo(r.right, r.bottom, r.right - cornerLength, r.bottom),
      cornerPaint,
    );
    // Bottom Left
    canvas.drawPath(
      Path()
        ..moveTo(r.left + cornerLength, r.bottom)
        ..quadraticBezierTo(r.left, r.bottom, r.left, r.bottom - cornerLength),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(_OverlayPainter oldDelegate) => false;
}
