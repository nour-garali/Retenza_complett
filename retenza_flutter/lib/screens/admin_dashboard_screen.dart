import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:csv/csv.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:math' as math;
import '../providers/admin_provider.dart';
import '../services/admin_service.dart';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  RETENZA â€” ADMIN DASHBOARD  (v2 Â· Brand-True Redesign)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
abstract class _C {
  static const grenadier   = Color(0xFFD73E26);
  static const grenadierDp = Color(0xFFA82C18);
  static const ember       = Color(0xFFF2774E);
  static const emberSoft   = Color(0xFFFCE7DD);
  static const ink         = Color(0xFF1B100C);
  static const ink60       = Color(0xFF6E5B52);
  static const ink40       = Color(0xFF9C8B82);
  static const line        = Color(0xFFEDE5DF);
  static const bg          = Color(0xFFF4EFEB);
  static const white       = Color(0xFFFFFFFF);
  static const regular     = Color(0xFF3F8E84);
  static const risk        = Color(0xFFE8902A);
  static const lost        = Color(0xFFB0A39B);
}

class AdminDashboardScreen extends ConsumerStatefulWidget {
  final VoidCallback onLogout;
  const AdminDashboardScreen({super.key, required this.onLogout});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  int _tab = 0;
  late final AnimationController _pulseCtrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _pulse = CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _C.bg,
      body: Column(
        children: [
          _TopBar(onLogout: widget.onLogout, pulse: _pulse),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              switchInCurve: Curves.easeOut,
              switchOutCurve: Curves.easeIn,
              child: _body(),
            ),
          ),
          _BottomNav(
            selected: _tab,
            onTap: (i) => setState(() => _tab = i),
          ),
        ],
      ),
    );
  }

  Widget _body() {
    switch (_tab) {
      case 0: return _OverviewTab(key: const ValueKey(0));
      case 1: return _MerchantsTab(key: const ValueKey(1));
      case 2: return _SupportTab(key: const ValueKey(2));
      case 3: return _PendingTab(key: const ValueKey(3));
      default: return _OverviewTab(key: const ValueKey(0));
    }
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TOP BAR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _TopBar extends StatelessWidget {
  final VoidCallback onLogout;
  final Animation<double> pulse;
  const _TopBar({required this.onLogout, required this.pulse});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _C.white,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: _C.white,
            border: Border(bottom: BorderSide(color: _C.line)),
          ),
          child: Row(
            children: [
              _LogoMark(size: 32),
              const SizedBox(width: 9),
              RichText(
                text: TextSpan(
                  style: GoogleFonts.bricolageGrotesque(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: _C.ink,
                      letterSpacing: -0.03),
                  children: [
                    const TextSpan(text: 'retenza'),
                    const TextSpan(text: '.', style: TextStyle(color: _C.grenadier)),
                  ],
                ),
              ),
              const Spacer(),
              AnimatedBuilder(
                animation: pulse,
                builder: (_, __) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _C.emberSoft,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Opacity(
                      opacity: 0.3 + 0.7 * pulse.value,
                      child: Container(
                        width: 6, height: 6,
                        decoration: const BoxDecoration(
                          color: _C.grenadier, shape: BoxShape.circle),
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text('LIVE',
                        style: GoogleFonts.spaceMono(
                            fontSize: 10,
                            color: _C.grenadierDp,
                            letterSpacing: 0.04)),
                  ]),
                ),
              ),
              const SizedBox(width: 10),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Aucune nouvelle notification', style: GoogleFonts.inter(fontSize: 13)),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: _C.ink,
                    duration: const Duration(seconds: 2),
                  ));
                },
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    color: _C.bg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _C.line),
                  ),
                  child: const Icon(Icons.notifications_none_rounded, size: 16, color: _C.ink60),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onLogout,
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    color: _C.bg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _C.line),
                  ),
                  child: const Icon(Icons.logout_rounded, size: 15, color: _C.ink60),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 0 â€” VUE D'ENSEMBLE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _OverviewTab extends ConsumerWidget {
  const _OverviewTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(adminStatsProvider);

    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: _C.grenadier)),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (stats) {
        final totalScans = stats['activity']?['totalQrScans'] ?? 0;
        final totalClients = stats['users']?['clients'] ?? 0;
        final activeMerchants = stats['commerces']?['active'] ?? 0;
        final pendingCount = stats['commerces']?['pending'] ?? 0;
        // totalLoyaltyTransactions disponible via _KpiRow directement

        return RefreshIndicator(
          onRefresh: () => ref.refresh(adminStatsProvider.future),
          color: _C.grenadier,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Greeting(),
              const SizedBox(height: 16),
              _HeroCard(
                merchants: activeMerchants.toString(),
                clients: totalClients.toString(),
                scans: totalScans.toString(),
                pending: pendingCount.toString(),
              ),
              const SizedBox(height: 14),
              _KpiRow(stats: stats),
              const SizedBox(height: 14),
              if (pendingCount > 0)
                GestureDetector(
                  onTap: () {
                    // Could navigate to pending tab here by updating state in parent
                  },
                  child: _PendingBanner(count: pendingCount),
                ),
              const SizedBox(height: 24),
              _QuickActions(),
              const SizedBox(height: 14),
              _TwoCol(
                left: _TopMerchantsCard(),
                right: _RecentActivityCard(),
              ),
              const SizedBox(height: 24),
            ]),
          ),
        );
      },
    );
  }
}

class _Greeting extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Aperçu de la plateforme Retenza Connect.',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: _C.ink60,
          ),
        ),
      ],
    );
  }
}
class _HeroCard extends StatelessWidget {
  final String merchants;
  final String clients;
  final String scans;
  final String pending;

  const _HeroCard({required this.merchants, required this.clients, required this.scans, required this.pending});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFFD73E26), Color(0xFFA82C18)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: _C.grenadier.withValues(alpha: 0.30),
            blurRadius: 26,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(children: [
        Positioned(
          right: -50, top: -50,
          child: Container(
            width: 180, height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.10),
            ),
          ),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('PLATEFORME RETENZA',
                style: GoogleFonts.spaceMono(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.75),
                    letterSpacing: 0.05)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text('ADMIN',
                  style: GoogleFonts.spaceMono(
                      fontSize: 10,
                      color: Colors.white,
                      letterSpacing: 0.04)),
            ),
          ]),
          const SizedBox(height: 14),
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(merchants,
                style: GoogleFonts.bricolageGrotesque(
                    fontSize: 42,
                    fontWeight: FontWeight.w800,
                    color: _C.white,
                    letterSpacing: -0.03,
                    height: 1)),
          ]),
          const SizedBox(height: 4),
          Text('Partenaires actifs',
              style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.82))),

          const SizedBox(height: 18),
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(100),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: 0.72,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
            ),
          ),
          const SizedBox(height: 9),
          Row(children: [
            _HeroMeta(label: 'Scans QR', value: scans),
            const SizedBox(width: 20),
            _HeroMeta(label: 'Clients', value: clients),
            const SizedBox(width: 20),
            _HeroMeta(label: 'En attente', value: pending),
          ]),
        ]),
      ]),
    );
  }
}

class _HeroMeta extends StatelessWidget {
  final String label, value;
  const _HeroMeta({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value,
          style: GoogleFonts.bricolageGrotesque(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: _C.white,
              letterSpacing: -0.02)),
      Text(label,
          style: GoogleFonts.inter(
              fontSize: 10,
              color: Colors.white.withValues(alpha: 0.75))),
    ]);
  }
}

class _KpiRow extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _KpiRow({required this.stats});
  
  @override
  Widget build(BuildContext context) {
    final active = stats['commerces']?['active'] ?? 0;
    final scans = stats['activity']?['totalQrScans'] ?? 0;
    final loyaltyTxs = stats['activity']?['totalLoyaltyTransactions'] ?? 0;

    final clients = stats['users']?['clients'] ?? 0;

    final kpis = [
      _KD('Notif. non lues', (stats['commerces']?['pending'] ?? 0).toString(), 'urgent', false),
      _KD('Scans QR', scans.toString(), '+5%', true),
      _KD('Offres actives', loyaltyTxs.toString(), '+8%', true),
      _KD('Partenaires actifs', active.toString(), '+2', true),
    ];
    return Row(
      children: kpis
          .map((k) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                      right: kpis.indexOf(k) < kpis.length - 1 ? 10 : 0),
                  child: _KpiCard(data: k),
                ),
              ))
          .toList(),
    );
  }
}

class _KD {
  final String label, value, delta;
  final bool up;
  const _KD(this.label, this.value, this.delta, this.up);
}

class _KpiCard extends StatelessWidget {
  final _KD data;
  const _KpiCard({required this.data});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _C.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(data.label,
            style: GoogleFonts.inter(fontSize: 10, color: _C.ink60), maxLines: 1, overflow: TextOverflow.ellipsis,),
        const SizedBox(height: 5),
        Text(data.value,
            style: GoogleFonts.bricolageGrotesque(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: _C.ink,
                letterSpacing: -0.02)),
        const SizedBox(height: 4),
        Text(data.delta,
            style: GoogleFonts.spaceMono(
                fontSize: 9,
                color: data.up ? _C.regular : _C.risk,
                letterSpacing: 0.02)),
      ]),
    );
  }
}


class _PendingBanner extends StatelessWidget {
  final int count;
  const _PendingBanner({required this.count});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _C.emberSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _C.grenadier.withValues(alpha: 0.18)),
      ),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          decoration: BoxDecoration(
            color: _C.grenadier,
            borderRadius: BorderRadius.circular(11),
          ),
          child: const Icon(Icons.pending_actions_rounded,
              color: Colors.white, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$count demandes en attente',
                style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _C.grenadierDp)),
            Text('Partenariats Ã  approuver',
                style: GoogleFonts.inter(fontSize: 11, color: _C.ink60)),
          ],
        )),
        const Icon(Icons.chevron_right_rounded, color: _C.grenadier, size: 20),
      ]),
    );
  }
}

class _QuickActions extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Actions rapides', style: GoogleFonts.bricolageGrotesque(fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _QuickActionBtn(icon: Icons.storefront_rounded, label: 'Partenaire', color: _C.grenadier, onTap: () {})),
        const SizedBox(width: 10),
        Expanded(child: _QuickActionBtn(icon: Icons.campaign_rounded, label: 'Diffuser Promo', color: _C.risk, onTap: () {})),
        const SizedBox(width: 10),
        Expanded(child: _QuickActionBtn(icon: Icons.notifications_active_rounded, label: 'Notifications', color: _C.regular, onTap: () {
          _showReportDialog(context, ref);
        })),
      ]),
    ]);
  }

  void _showReportDialog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: _C.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Centre de notifications', style: GoogleFonts.bricolageGrotesque(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.mark_email_read_rounded, color: _C.grenadier),
            title: Text('Demandes en attente', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Consulter les nouvelles demandes de partenariat', style: GoogleFonts.inter(fontSize: 11, color: _C.ink60)),
            onTap: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Voir onglet Demandes'), backgroundColor: _C.grenadier));
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.support_agent_rounded, color: _C.regular),
            title: Text('Tickets support ouverts', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Voir les messages clients non traites', style: GoogleFonts.inter(fontSize: 11, color: _C.ink60)),
            onTap: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Voir onglet Support'), backgroundColor: _C.grenadier));
            },
          ),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  Future<void> _exportPdf(BuildContext context, WidgetRef ref) async {
    final stats = await ref.read(adminStatsProvider.future);
    
    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('Rapport Global - Retenza', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 20),
              pw.Text('Statistiques GÃ©nÃ©rales', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Text('Clients EngagÃ©s : ${stats['users']?['clients'] ?? 0}'),
              pw.Text('Commerces Actifs : ${stats['commerces']?['active'] ?? 0}'),
              pw.Text('Scans Totaux : ${stats['activity']?['totalQrScans'] ?? 0}'),
              pw.Text('Echanges fidelite : ' + (stats['activity']?['totalLoyaltyTransactions'] ?? 0).toString()),
              pw.SizedBox(height: 30),
              pw.Text('GÃ©nÃ©rÃ© le : ${DateTime.now().toString()}'),
            ],
          );
        },
      ),
    );

    await Printing.sharePdf(bytes: await doc.save(), filename: 'rapport_retenza.pdf');
  }

  Future<void> _exportCsv(BuildContext context, WidgetRef ref) async {
    final commerces = await ref.read(adminCommercesProvider.future);
    
    List<List<dynamic>> rows = [];
    rows.add(['Nom du commerce', 'CatÃ©gorie', 'Ville', 'Statut']); // Headers
    
    for (var c in commerces) {
      rows.add([
        c['name'] ?? '',
        c['category'] ?? '',
        c['contact']?['city'] ?? '',
        c['status'] ?? ''
      ]);
    }
    
    String csv = const ListToCsvConverter().convert(rows);
    
    // For Flutter Web downloading
    final bytes = utf8.encode(csv);
    final base64String = base64Encode(bytes);
    final url = 'data:text/csv;base64,$base64String';
    await launchUrl(Uri.parse(url));
  }
}

class _QuickActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickActionBtn({required this.icon, required this.label, required this.color, required this.onTap});
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: _C.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _C.line),
          boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(label, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _C.ink)),
        ]),
      ),
    );
  }
}

class _TopMerchantsCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commercesAsync = ref.watch(adminCommercesProvider);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _C.line),
        boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.military_tech_rounded, size: 16, color: _C.risk),
          const SizedBox(width: 6),
          Text('Top Partenaires', style: GoogleFonts.bricolageGrotesque(fontSize: 14, fontWeight: FontWeight.w700, color: _C.ink)),
        ]),
        const SizedBox(height: 16),
        commercesAsync.when(
          loading: () => const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: _C.grenadier, strokeWidth: 2))),
          error: (_,__) => const SizedBox(),
          data: (commerces) {
            if (commerces.isEmpty) {
              return Text('Aucun commerce', style: GoogleFonts.inter(color: _C.ink40, fontSize: 12));
            }
            final top = commerces.take(3).toList();
            return Column(
              children: top.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(children: [
                  Container(
                    width: 32, height: 32,
                    decoration: const BoxDecoration(color: _C.emberSoft, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text((c['name'] ?? 'C')[0].toUpperCase(), style: GoogleFonts.bricolageGrotesque(fontSize: 14, fontWeight: FontWeight.w800, color: _C.grenadier)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(c['name'] ?? 'Commerce', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: _C.ink)),
                    Text(c['contact']?['city'] ?? 'Ville', style: GoogleFonts.inter(fontSize: 10, color: _C.ink40)),
                  ])),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: _C.bg, borderRadius: BorderRadius.circular(6)),
                    child: Text('Actif', style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.w700, color: _C.regular)),
                  ),
                ]),
              )).toList(),
            );
          }
        ),
      ]),
    );
  }
}

class _RecentActivityCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _C.line),
        boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.bolt_rounded, size: 16, color: _C.grenadier),
          const SizedBox(width: 6),
          Text('Flux en direct', style: GoogleFonts.bricolageGrotesque(fontSize: 14, fontWeight: FontWeight.w700, color: _C.ink)),
        ]),
        const SizedBox(height: 16),
        const _ActivityRow('Nouveau scan QR', 'CafÃ© LumiÃ¨re', 'Il y a 2 min', _C.regular),
        const _ActivityRow('Nouveau partenaire', 'Boutique Zen', 'Il y a 15 min', _C.grenadier),
        const _ActivityRow('Abonnement renouvelÃ©', 'Restaurant Le Phare', 'Il y a 1h', _C.risk),
      ]),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  final String title, subtitle, time;
  final Color color;
  const _ActivityRow(this.title, this.subtitle, this.time, this.color);
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          margin: const EdgeInsets.only(top: 4),
          width: 8, height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: _C.ink)),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: _C.ink60)),
        ])),
        Text(time, style: GoogleFonts.spaceMono(fontSize: 9, color: _C.ink40)),
      ]),
    );
  }
}

class _TwoCol extends StatelessWidget {
  final Widget left, right;
  const _TwoCol({required this.left, required this.right});
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      if (constraints.maxWidth < 600) {
        return Column(children: [left, const SizedBox(height: 14), right]);
      }
      return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: left),
        const SizedBox(width: 14),
        Expanded(child: right),
      ]);
    });
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 1 â€” COMMERÃ‡ANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _MerchantsTab extends ConsumerWidget {
  const _MerchantsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commercesAsync = ref.watch(adminCommercesProvider);

    return commercesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: _C.grenadier)),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (commerces) {
        return RefreshIndicator(
          onRefresh: () => ref.refresh(adminCommercesProvider.future),
          color: _C.grenadier,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _TabTitle('Commerçants', '${commerces.length} partenaires actifs'),
              const SizedBox(height: 16),
              if (commerces.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text("Aucun commerçant actif trouvé."),
                ),
              ...commerces.map((m) {
                final clientCount = m['clients']?.length ?? 0;
                return _MerchCard(
                  m: _Merch(m['name'], m['category'] ?? 'Commerce', '$clientCount clients', m['status'] == 'active'),
                );
              }),
            ]),
          ),
        );
      },
    );
  }
}

class _Merch {
  final String name, cat, clients;
  final bool active;
  const _Merch(this.name, this.cat, this.clients, this.active);
}

class _MerchCard extends StatelessWidget {
  final _Merch m;
  const _MerchCard({required this.m});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _C.line),
      ),
      child: Row(children: [
        Container(
          width: 46, height: 46,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [_C.grenadier, _C.grenadierDp],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Center(
            child: Text(m.name.isNotEmpty ? m.name[0] : '?',
                style: GoogleFonts.bricolageGrotesque(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
          ),
        ),
        const SizedBox(width: 13),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(m.name,
                style: GoogleFonts.bricolageGrotesque(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: _C.ink)),
            Text(m.cat,
                style: GoogleFonts.inter(fontSize: 12, color: _C.ink60)),
          ],
        )),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(
                color: m.active ? _C.regular : _C.lost,
                shape: BoxShape.circle),
          ),
          const SizedBox(height: 4),
          Text(m.clients,
              style: GoogleFonts.spaceMono(fontSize: 10, color: _C.ink60)),
        ]),
      ]),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 2 â€” CLIENTS CRM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 2 â€” SUPPORT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _SupportTab extends ConsumerStatefulWidget {
  const _SupportTab({super.key});
  @override
  ConsumerState<_SupportTab> createState() => _SupportTabState();
}

class _SupportTabState extends ConsumerState<_SupportTab> {
  String _filter = 'all'; // all | open | in_progress | closed

  @override
  Widget build(BuildContext context) {
    final supportAsync = ref.watch(adminSupportProvider);

    return Column(children: [
      // â”€â”€ Filtres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      Container(
        color: _C.white,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final f in [('all', 'Tous'), ('open', 'Ouverts'), ('in_progress', 'En cours'), ('closed', 'FermÃ©s')])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _filter = f.$1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: _filter == f.$1 ? _C.grenadier : _C.bg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(f.$2, style: GoogleFonts.inter(
                      fontSize: 12, fontWeight: FontWeight.w600,
                      color: _filter == f.$1 ? _C.white : _C.ink60,
                    )),
                  ),
                ),
              ),
          ]),
        ),
      ),
      // â”€â”€ Liste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      Expanded(
        child: supportAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: _C.grenadier)),
          error: (e, _) => Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.wifi_off_rounded, size: 40, color: _C.ink40),
              const SizedBox(height: 12),
              Text('Impossible de charger le support', style: GoogleFonts.inter(color: _C.ink60)),
              const SizedBox(height: 8),
              Text(e.toString(), style: GoogleFonts.inter(fontSize: 11, color: _C.ink40), textAlign: TextAlign.center),
            ]),
          ),
          data: (tickets) {
            final filtered = _filter == 'all'
                ? tickets
                : tickets.where((t) => t['status'] == _filter).toList();

            return RefreshIndicator(
              color: _C.grenadier,
              onRefresh: () => ref.refresh(adminSupportProvider.future),
              child: filtered.isEmpty
                ? ListView(
                    children: [SizedBox(
                      height: 300,
                      child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.support_agent_rounded, size: 50, color: _C.ink40),
                        const SizedBox(height: 12),
                        Text('Aucun ticket ${_filter == "all" ? "" : "($_filter)"}',
                            style: GoogleFonts.inter(fontSize: 14, color: _C.ink60)),
                      ])),
                    )],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) => _SupportCard(ticket: filtered[i], onRefresh: () => ref.refresh(adminSupportProvider.future)),
                  ),
            );
          },
        ),
      ),
    ]);
  }
}

class _SupportCard extends StatelessWidget {
  final dynamic ticket;
  final VoidCallback onRefresh;
  const _SupportCard({required this.ticket, required this.onRefresh});

  Color _statusColor(String s) {
    switch (s) {
      case 'open': return _C.grenadier;
      case 'in_progress': return _C.risk;
      case 'closed': return _C.regular;
      default: return _C.ink40;
    }
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'closed': return 'FermÃ©';
      default: return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = ticket['status'] ?? 'open';
    final submittedBy = ticket['submittedBy'];
    final commerce = ticket['commerce'];
    final authorName = submittedBy != null
        ? '${submittedBy['firstName'] ?? ''} ${submittedBy['lastName'] ?? ''}'.trim()
        : 'Inconnu';
    final commerceName = commerce?['name'] ?? '';
    final subject = ticket['subject'] ?? ticket['message'] ?? 'Sans objet';
    final createdAt = ticket['createdAt'] ?? '';
    final responses = ticket['responses'] as List? ?? [];
    final statusColor = _statusColor(status);

    return Container(
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: status == 'open' ? _C.grenadier.withValues(alpha: 0.3) : _C.line),
        boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // En-tÃªte
          Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(Icons.support_agent_rounded, color: statusColor, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(authorName, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: _C.ink)),
              if (commerceName.isNotEmpty)
                Text(commerceName, style: GoogleFonts.inter(fontSize: 11, color: _C.ink40)),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(_statusLabel(status),
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: statusColor)),
            ),
          ]),
          const SizedBox(height: 12),
          // Sujet
          Text(subject,
              style: GoogleFonts.inter(fontSize: 13, color: _C.ink, fontWeight: FontWeight.w500),
              maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          // MÃ©ta
          Row(children: [
            Icon(Icons.forum_outlined, size: 13, color: _C.ink40),
            const SizedBox(width: 4),
            Text('${responses.length} rÃ©ponse${responses.length > 1 ? 's' : ''}',
                style: GoogleFonts.spaceMono(fontSize: 10, color: _C.ink40)),
            const Spacer(),
            if (status != 'closed') ...[
              _SmallBtn(
                label: 'RÃ©pondre',
                icon: Icons.reply_rounded,
                color: _C.grenadier,
                onTap: () => _showReplyDialog(context, ticket['_id']),
              ),
              const SizedBox(width: 8),
              _SmallBtn(
                label: 'Fermer',
                icon: Icons.check_circle_outline_rounded,
                color: _C.regular,
                onTap: () async {
                  await AdminService.closeSupportRequest(ticket['_id']);
                  onRefresh();
                },
              ),
            ] else
              Icon(Icons.check_circle_rounded, size: 16, color: _C.regular),
          ]),
        ]),
      ),
    );
  }

  void _showReplyDialog(BuildContext context, String id) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: _C.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 36, height: 4, decoration: BoxDecoration(color: _C.line, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('RÃ©pondre au ticket', style: GoogleFonts.bricolageGrotesque(fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Votre rÃ©ponse...',
                hintStyle: GoogleFonts.inter(color: _C.ink40),
                filled: true,
                fillColor: _C.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              style: GoogleFonts.inter(fontSize: 13, color: _C.ink),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: () async {
                  if (ctrl.text.trim().isEmpty) return;
                  await AdminService.respondToSupport(id, ctrl.text.trim());
                  if (ctx.mounted) Navigator.pop(ctx);
                  onRefresh();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: _C.grenadier,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text('Envoyer la rÃ©ponse', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: _C.white)),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 3 â€” INCIDENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _IncidentsTab extends ConsumerStatefulWidget {
  const _IncidentsTab({super.key});
  @override
  ConsumerState<_IncidentsTab> createState() => _IncidentsTabState();
}

class _IncidentsTabState extends ConsumerState<_IncidentsTab> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final incidentsAsync = ref.watch(adminIncidentsProvider);

    return Column(children: [
      // â”€â”€ Filtres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      Container(
        color: _C.white,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final f in [('all', 'Tous'), ('reported', 'SignalÃ©'), ('investigating', 'En enquÃªte'), ('resolved', 'RÃ©solu')])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _filter = f.$1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: _filter == f.$1 ? _C.risk : _C.bg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(f.$2, style: GoogleFonts.inter(
                      fontSize: 12, fontWeight: FontWeight.w600,
                      color: _filter == f.$1 ? _C.white : _C.ink60,
                    )),
                  ),
                ),
              ),
          ]),
        ),
      ),
      // â”€â”€ Liste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      Expanded(
        child: incidentsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: _C.risk)),
          error: (e, _) => Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.wifi_off_rounded, size: 40, color: _C.ink40),
              const SizedBox(height: 12),
              Text('Impossible de charger les incidents', style: GoogleFonts.inter(color: _C.ink60)),
              const SizedBox(height: 8),
              Text(e.toString(), style: GoogleFonts.inter(fontSize: 11, color: _C.ink40), textAlign: TextAlign.center),
            ]),
          ),
          data: (incidents) {
            final filtered = _filter == 'all'
                ? incidents
                : incidents.where((t) => t['status'] == _filter).toList();

            return RefreshIndicator(
              color: _C.risk,
              onRefresh: () => ref.refresh(adminIncidentsProvider.future),
              child: filtered.isEmpty
                ? ListView(children: [SizedBox(height: 300, child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.shield_outlined, size: 50, color: _C.ink40),
                    const SizedBox(height: 12),
                    Text('Aucun incident', style: GoogleFonts.inter(fontSize: 14, color: _C.ink60)),
                  ])))])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) => _IncidentCard(incident: filtered[i], onRefresh: () => ref.refresh(adminIncidentsProvider.future)),
                  ),
            );
          },
        ),
      ),
    ]);
  }
}

class _IncidentCard extends StatelessWidget {
  final dynamic incident;
  final VoidCallback onRefresh;
  const _IncidentCard({required this.incident, required this.onRefresh});

  Color _statusColor(String s) {
    switch (s) {
      case 'reported': return _C.grenadier;
      case 'investigating': return _C.risk;
      case 'resolved': return _C.regular;
      case 'dismissed': return _C.lost;
      default: return _C.ink40;
    }
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'reported': return 'SignalÃ©';
      case 'investigating': return 'EnquÃªte';
      case 'resolved': return 'RÃ©solu';
      case 'dismissed': return 'ClassÃ©';
      default: return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = incident['status'] ?? 'reported';
    final reportedBy = incident['reportedBy'];
    final commerce = incident['commerce'];
    final authorName = reportedBy != null
        ? '${reportedBy['firstName'] ?? ''} ${reportedBy['lastName'] ?? ''}'.trim()
        : 'Inconnu';
    final commerceName = commerce?['name'] ?? '';
    final description = incident['description'] ?? incident['title'] ?? 'Sans description';
    final type = incident['type'] ?? 'incident';
    final adminResponses = incident['adminResponses'] as List? ?? [];
    final statusColor = _statusColor(status);
    final isOpen = status == 'reported' || status == 'investigating';

    return Container(
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: status == 'reported' ? _C.grenadier.withValues(alpha: 0.4) : _C.line),
        boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1), shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Icon(Icons.warning_amber_rounded, color: statusColor, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(authorName, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: _C.ink)),
              Row(children: [
                if (commerceName.isNotEmpty) ...[Text(commerceName, style: GoogleFonts.inter(fontSize: 11, color: _C.ink40)), const SizedBox(width: 6)],
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: _C.bg, borderRadius: BorderRadius.circular(4)),
                  child: Text(type, style: GoogleFonts.spaceMono(fontSize: 9, color: _C.ink60)),
                ),
              ]),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
              child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: statusColor)),
            ),
          ]),
          const SizedBox(height: 12),
          Text(description, style: GoogleFonts.inter(fontSize: 13, color: _C.ink), maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          Row(children: [
            Icon(Icons.message_outlined, size: 13, color: _C.ink40),
            const SizedBox(width: 4),
            Text('${adminResponses.length} rÃ©ponse${adminResponses.length > 1 ? 's' : ''}',
                style: GoogleFonts.spaceMono(fontSize: 10, color: _C.ink40)),
            const Spacer(),
            if (isOpen) ...[
              _SmallBtn(
                label: 'RÃ©pondre',
                icon: Icons.reply_rounded,
                color: _C.risk,
                onTap: () => _showReplyDialog(context, incident['_id']),
              ),
              const SizedBox(width: 8),
              _SmallBtn(
                label: 'RÃ©soudre',
                icon: Icons.check_circle_outline_rounded,
                color: _C.regular,
                onTap: () async {
                  await AdminService.updateIncidentStatus(incident['_id'], 'resolved');
                  onRefresh();
                },
              ),
            ] else
              Icon(Icons.verified_rounded, size: 16, color: _C.regular),
          ]),
        ]),
      ),
    );
  }

  void _showReplyDialog(BuildContext context, String id) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: _C.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 36, height: 4, decoration: BoxDecoration(color: _C.line, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('RÃ©pondre Ã  l\'incident', style: GoogleFonts.bricolageGrotesque(fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Votre rÃ©ponse Ã  l\'incident...',
                hintStyle: GoogleFonts.inter(color: _C.ink40),
                filled: true,
                fillColor: _C.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              style: GoogleFonts.inter(fontSize: 13, color: _C.ink),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: () async {
                  if (ctrl.text.trim().isEmpty) return;
                  await AdminService.respondToIncident(id, ctrl.text.trim());
                  if (ctx.mounted) Navigator.pop(ctx);
                  onRefresh();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(color: _C.risk, borderRadius: BorderRadius.circular(12)),
                  alignment: Alignment.center,
                  child: Text('Envoyer la rÃ©ponse', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: _C.white)),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _SmallBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _SmallBtn({required this.label, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ]),
      ),
    );
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  TAB 3 â€” DEMANDES EN ATTENTE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _PendingTab extends ConsumerWidget {
  const _PendingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(adminPendingProvider);

    return pendingAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: _C.grenadier)),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (requests) {
        return RefreshIndicator(
          onRefresh: () => ref.refresh(adminPendingProvider.future),
          color: _C.grenadier,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _TabTitle('Demandes partenariat',
                  '${requests.length} dossier(s) en attente'),
              const SizedBox(height: 16),
              if (requests.isEmpty)
                const _EmptyState(
                    icon: Icons.check_circle_outline_rounded,
                    title: 'Aucune demande',
                    sub: 'Tout est Ã  jour.')
              else
                ...requests.map((r) {
                  final user = r['owner'];
                  final ownerName = user != null ? '${user['firstName']} ${user['lastName']}' : 'Inconnu';
                  final email = user != null ? user['email'] : 'Inconnu';
                  final date = r['createdAt'] != null ? r['createdAt'].toString().substring(0, 10) : 'RÃ©cent';

                  return _PendingCard(
                    r: _PR(r['_id'], r['name'], ownerName, r['category'] ?? 'Commerce', email, date),
                    onApprove: () async {
                      try {
                        await AdminService.approveCommerce(r['_id']);
                        ref.invalidate(adminPendingProvider);
                        ref.invalidate(adminStatsProvider);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text('${r['name']} approuvÃ© âœ“'),
                            backgroundColor: _C.regular,
                          ));
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text('Erreur: $e'),
                            backgroundColor: _C.grenadierDp,
                          ));
                        }
                      }
                    },
                    onReject: () async {
                       try {
                        await AdminService.rejectCommerce(r['_id']);
                        ref.invalidate(adminPendingProvider);
                        ref.invalidate(adminStatsProvider);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text('${r['name']} rejetÃ©'),
                            backgroundColor: _C.grenadierDp,
                          ));
                        }
                      } catch (e) {
                         if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text('Erreur: $e'),
                            backgroundColor: _C.grenadierDp,
                          ));
                        }
                      }
                    },
                  );
                }),
            ]),
          ),
        );
      },
    );
  }
}

class _PR {
  final String id, name, owner, cat, email, time;
  const _PR(this.id, this.name, this.owner, this.cat, this.email, this.time);
}

class _PendingCard extends StatelessWidget {
  final _PR r;
  final VoidCallback onApprove, onReject;
  const _PendingCard(
      {required this.r, required this.onApprove, required this.onReject});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _C.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [_C.grenadier, _C.grenadierDp],
                  begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Center(
              child: Text(r.name.isNotEmpty ? r.name[0] : '?',
                  style: GoogleFonts.bricolageGrotesque(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(r.name,
                  style: GoogleFonts.bricolageGrotesque(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: _C.ink)),
              Text(r.owner,
                  style: GoogleFonts.inter(fontSize: 12, color: _C.ink60)),
            ],
          )),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
              color: _C.emberSoft,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text('En attente',
                style: GoogleFonts.spaceMono(
                    fontSize: 9,
                    color: _C.grenadierDp,
                    letterSpacing: 0.03)),
          ),
        ]),
        const SizedBox(height: 14),
        _InfoRow(Icons.category_rounded, r.cat),
        const SizedBox(height: 5),
        _InfoRow(Icons.email_outlined, r.email),
        const SizedBox(height: 5),
        _InfoRow(Icons.access_time_rounded, 'Soumis le ${r.time}'),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: _ActionBtn(
                label: 'Rejeter',
                filled: false,
                onTap: onReject),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _ActionBtn(
                label: 'Approuver',
                filled: true,
                onTap: onApprove),
          ),
        ]),
      ]),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow(this.icon, this.text);
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 13, color: _C.ink40),
      const SizedBox(width: 7),
      Expanded(
          child: Text(text,
              style: GoogleFonts.inter(fontSize: 12, color: _C.ink60))),
    ]);
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _ActionBtn(
      {required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: filled ? _C.grenadier : _C.bg,
          borderRadius: BorderRadius.circular(11),
          border: filled ? null : Border.all(color: _C.line),
          boxShadow: filled
              ? [BoxShadow(
                  color: _C.grenadier.withValues(alpha: 0.22),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )]
              : null,
        ),
        child: Center(
          child: Text(label,
              style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: filled ? Colors.white : _C.ink60)),
        ),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SHARED UTILITIES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _WhiteCard extends StatelessWidget {
  final String title, subtitle;
  final Widget child;
  const _WhiteCard(
      {required this.title, required this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _C.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: GoogleFonts.bricolageGrotesque(
                fontSize: 14, fontWeight: FontWeight.w700, color: _C.ink)),
        Text(subtitle,
            style: GoogleFonts.inter(fontSize: 10, color: _C.ink40)),
        const SizedBox(height: 2),
        child,
      ]),
    );
  }
}

class _TabTitle extends StatelessWidget {
  final String title, sub;
  const _TabTitle(this.title, this.sub);
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title,
          style: GoogleFonts.bricolageGrotesque(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: _C.ink,
              letterSpacing: -0.6)),
      const SizedBox(height: 3),
      Text(sub,
          style: GoogleFonts.inter(fontSize: 13, color: _C.ink60)),
    ]);
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title, sub;
  const _EmptyState({required this.icon, required this.title, required this.sub});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(
              color: _C.emberSoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: _C.regular, size: 28),
          ),
          const SizedBox(height: 14),
          Text(title,
              style: GoogleFonts.bricolageGrotesque(
                  fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
          const SizedBox(height: 4),
          Text(sub,
              style: GoogleFonts.inter(fontSize: 13, color: _C.ink60)),
        ]),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  LOGO MARK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _LogoMark extends StatelessWidget {
  final double size;
  const _LogoMark({required this.size});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.27),
        gradient: const LinearGradient(
          colors: [_C.grenadier, _C.grenadierDp],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: _C.grenadier.withValues(alpha: 0.28),
            blurRadius: 8, offset: const Offset(0, 3)),
        ],
      ),
      child: CustomPaint(painter: _LogoPainter(size: size)),
    );
  }
}

class _LogoPainter extends CustomPainter {
  final double size;
  const _LogoPainter({required this.size});
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()
      ..color = Colors.white
      ..strokeWidth = s.width * (5.5 / 36)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    final cx = s.width / 2, cy = s.height / 2, r = s.width * 0.30;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      0.0, 311.5 * math.pi / 180, false, p);
    final ax = s.width * 0.72, ay1 = s.height * 0.14, ay2 = s.height * 0.33;
    canvas.drawPath(Path()
      ..moveTo(ax, ay1)
      ..lineTo(ax, ay2)
      ..lineTo(ax - s.width * 0.19, ay2), p);
  }
  @override bool shouldRepaint(_) => false;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  BOTTOM NAVIGATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
class _BottomNav extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.grid_view_rounded,      Icons.grid_view_rounded,       'Aperçu'),
      (Icons.store_rounded,          Icons.store_outlined,           'Commerçants'),
      (Icons.support_agent_rounded,  Icons.support_agent_outlined,  'Support'),
      (Icons.pending_actions_rounded,Icons.pending_outlined,         'Demandes'),
    ];
    return Container(
      decoration: BoxDecoration(
        color: _C.white,
        border: Border(top: BorderSide(color: _C.line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          child: Row(
            children: items.asMap().entries.map((e) {
              final i = e.key;
              final active = i == selected;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: active
                          ? _C.grenadier.withValues(alpha: 0.09)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(
                        active ? e.value.$1 : e.value.$2,
                        size: 22,
                        color: active ? _C.grenadier : _C.ink40,
                      ),
                      const SizedBox(height: 3),
                      Text(e.value.$3,
                          style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: active
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: active ? _C.grenadier : _C.ink40)),
                    ]),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
