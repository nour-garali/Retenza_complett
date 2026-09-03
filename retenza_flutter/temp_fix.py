import sys

def main():
    with open('lib/screens/client_dashboard_screen.dart', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the corrupted string
    corrupted_part = "'$totalPoints points \ndǸpenser',"
    corrupted_part2 = "'$totalPoints points \ndpenser',"
    content = content.replace(corrupted_part, "'$totalPoints points à dépenser',")
    content = content.replace(corrupted_part2, "'$totalPoints points à dépenser',")

    # 2. Add _buildEmptyState
    empty_state_code = """
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 40),
          Icon(Icons.credit_card_off_rounded, size: 64, color: muted.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            'Aucune carte pour le moment',
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: ink),
          ),
          const SizedBox(height: 8),
          Text(
            'Scannez le QR code d\\'un commerce\\npour rejoindre son programme.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 14, color: muted),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildScanButton() {"""
    
    if '_buildEmptyState' not in content:
        content = content.replace('  Widget _buildScanButton() {', empty_state_code)

    with open('lib/screens/client_dashboard_screen.dart', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
