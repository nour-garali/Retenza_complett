import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

abstract class _C {
  static const bgBase  = Color(0xFFF7F4F1);
  static const bgCard  = Color(0xFFFFFFFF);
  static const ink     = Color(0xFF18100B);
  static const inkMid  = Color(0xFF6B5B52);
  static const inkMute = Color(0xFFAA9F99);
  static const red     = Color(0xFFD0392A);
  static const redDeep = Color(0xFF9E2B1E);
  static const redWarm = Color(0xFFE05540);
  static const redSoft = Color(0xFFFBE9E7);
  static const teal    = Color(0xFF00A896);
  static const amber   = Color(0xFFF4A03A);
  static const gold    = Color(0xFFFFC72C);
  static const border  = Color(0xFFEDE5DF);
}

BoxDecoration _cardDeco({double radius = 18}) => BoxDecoration(
  color: _C.bgCard,
  borderRadius: BorderRadius.circular(radius),
  border: Border.all(color: _C.border.withOpacity(0.5)),
  boxShadow: [BoxShadow(color: const Color(0xFF18100B).withOpacity(0.07), blurRadius: 14, offset: const Offset(0, 4))],
);

class MerchantDashboardScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const MerchantDashboardScreen({super.key, required this.onLogout});
  @override
  State<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends State<MerchantDashboardScreen> {
  int _tab = 0;
  
  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      _HomeTab(onNavigate: (i) => setState(() => _tab = i)),
      const _ClientsTab(),
      _QRTab(),
      const _ProgramTab(),
      _ProfilTab(onLogout: widget.onLogout),
    ];
    return Scaffold(
      backgroundColor: _C.bgBase,
      body: SafeArea(
        top: false,
        bottom: false,
        child: tabs[_tab],
      ),
      bottomNavigationBar: _BottomNav(current: _tab, onTap: (i) => setState(() => _tab = i)),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int current;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.current, required this.onTap});

  static const _labels = ['Accueil', 'Clients', 'Mon QR', 'Cadeaux', 'Profil'];
  static const _iconsOff = [Icons.grid_view_outlined, Icons.people_outline_rounded, Icons.qr_code_2_rounded, Icons.card_giftcard_outlined, Icons.person_outline_rounded];
  static const _iconsOn  = [Icons.grid_view_rounded,  Icons.people_rounded,          Icons.qr_code_2_rounded, Icons.card_giftcard_rounded,   Icons.person_rounded];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _C.bgCard,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(height: 0.8, color: _C.border),
          SafeArea(
            top: false,
            child: SizedBox(
              height: 64,
              child: Row(
                children: List.generate(5, (i) {
                  final active = i == current;
                  final isCenter = i == 2;
                  if (isCenter) {
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => onTap(i),
                        child: Center(
                          child: Container(
                            width: 50, height: 50,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [_C.redWarm, _C.redDeep], begin: Alignment.topLeft, end: Alignment.bottomRight),
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [BoxShadow(color: _C.red.withOpacity(0.4), blurRadius: 14, offset: const Offset(0, 5))],
                            ),
                            child: Icon(_iconsOn[i], color: Colors.white, size: 24),
                          ),
                        ),
                      ),
                    );
                  }
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => onTap(i),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(active ? _iconsOn[i] : _iconsOff[i], size: 22, color: active ? _C.red : _C.inkMute),
                          const SizedBox(height: 3),
                          Text(_labels[i], style: GoogleFonts.inter(fontSize: 10, fontWeight: active ? FontWeight.w700 : FontWeight.w500, color: active ? _C.red : _C.inkMute)),
                          if (active) ...[const SizedBox(height: 3), Container(width: 18, height: 3, decoration: BoxDecoration(color: _C.red, borderRadius: BorderRadius.circular(2)))],
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final ValueChanged<int>? onNavigate;
  const _HomeTab({this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final h = DateTime.now().hour;
    final greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon apres-midi' : 'Bonsoir';
    return Container(
      color: _C.bgBase,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(20, top + 20, 20, 20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(greeting, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: _C.inkMid)),
                        const SizedBox(height: 2),
                        Text('Cafe Lumiere', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: _C.ink, letterSpacing: -0.5)),
                      ],
                    ),
                  ),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(color: _C.bgCard, borderRadius: BorderRadius.circular(13), border: Border.all(color: _C.border)),
                    child: const Icon(Icons.notifications_none_rounded, color: _C.ink, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [_C.redWarm, _C.redDeep], begin: Alignment.topLeft, end: Alignment.bottomRight),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    alignment: Alignment.center,
                    child: Text('CL', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Container(
                height: 190,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(26),
                  gradient: const LinearGradient(colors: [Color(0xFFE04030), Color(0xFF8A1F14)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                  boxShadow: [BoxShadow(color: _C.red.withOpacity(0.40), blurRadius: 28, offset: const Offset(0, 12))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: Stack(
                    children: [
                      Positioned(top: -50, right: -40, child: Container(width: 180, height: 180, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.10)))),
                      Positioned(bottom: -30, left: -20, child: Container(width: 130, height: 130, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.07)))),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.18), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.25))),
                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                Container(width: 6, height: 6, decoration: const BoxDecoration(color: _C.gold, shape: BoxShape.circle)),
                                const SizedBox(width: 6),
                                Text('EN DIRECT', style: GoogleFonts.spaceMono(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1)),
                              ]),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('348', style: GoogleFonts.outfit(fontSize: 52, fontWeight: FontWeight.w400, color: Colors.white, letterSpacing: -2, height: 1)),
                                const SizedBox(width: 8),
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('clients', style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.8))),
                                      Text('inscrits', style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.8))),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.18), borderRadius: BorderRadius.circular(12)),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.arrow_upward_rounded, color: _C.gold, size: 14),
                                      Text('+22', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
                                      Text('semaine', style: GoogleFonts.inter(fontSize: 9, color: Colors.white.withOpacity(0.7))),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(children: [
                              Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.favorite_rounded, size: 11, color: Colors.white70), const SizedBox(width: 4), Text('Fidelite 31%', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))]),
                              const SizedBox(width: 14),
                              Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.card_giftcard_rounded, size: 11, color: Colors.white70), const SizedBox(width: 4), Text('4 cadeaux auj.', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))]),
                            ]),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Actions rapides', style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.2)),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(child: _ActionTile(icon: Icons.qr_code_2_rounded, label: 'Afficher\nMon QR', bg: _C.redSoft, color: _C.red, onTap: () => onNavigate?.call(2))),
                    const SizedBox(width: 10),
                    Expanded(child: _ActionTile(icon: Icons.card_giftcard_rounded, label: 'Offrir\nun cadeau', bg: const Color(0xFFE6F4F2), color: _C.teal)),
                    const SizedBox(width: 10),
                    Expanded(child: _ActionTile(icon: Icons.people_rounded, label: 'Voir\nclients', bg: const Color(0xFFFFF3E0), color: _C.amber)),
                    const SizedBox(width: 10),
                    Expanded(child: _ActionTile(icon: Icons.settings_rounded, label: 'Parametres\nprog.', bg: const Color(0xFFF3F3F3), color: _C.inkMid)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Pouls d'aujourd'hui", style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.2)),
                      Text("Aujourd'hui", style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: _C.red)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(child: _PulseTile(value: '12', label: 'Passages',    icon: Icons.qr_code_scanner_rounded, iconColor: _C.teal,  iconBg: const Color(0xFFE6F4F2), sub: '+3 vs hier')),
                    const SizedBox(width: 10),
                    Expanded(child: _PulseTile(value: '4',  label: 'Recompenses', icon: Icons.card_giftcard_rounded,   iconColor: _C.amber, iconBg: const Color(0xFFFFF3E0), sub: 'Distribuees')),
                    const SizedBox(width: 10),
                    Expanded(child: _PulseTile(value: '2',  label: 'Nvx clients', icon: Icons.person_add_rounded,      iconColor: _C.red,   iconBg: _C.redSoft,              sub: 'Inscrits')),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('En direct', style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: -0.2)),
                      Text('Voir tout', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: _C.red)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    decoration: _cardDeco(radius: 22),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        _FeedRow(icon: Icons.qr_code_scanner_rounded, iconColor: _C.teal,  iconBg: Color(0xFFE6F4F2), title: 'Scan QR - Nouveau client',   subtitle: 'Amina K. a rejoint votre programme', time: 'Il y a 3 min',  badge: '+1 client', badgeColor: _C.teal,  showDivider: true),
                        _FeedRow(icon: Icons.card_giftcard_rounded,   iconColor: _C.red,   iconBg: _C.redSoft,        title: 'Recompense reclamee',        subtitle: 'Mohamed L. - 1 cafe offert',        time: 'Il y a 18 min', badge: '-1 cadeau', badgeColor: _C.red,   showDivider: true),
                        _FeedRow(icon: Icons.star_rounded,            iconColor: _C.amber, iconBg: Color(0xFFFFF3E0), title: 'Client VIP de retour',       subtitle: 'Sarah B. - 6eme visite ce mois',    time: 'Il y a 45 min', badge: 'VIP',       badgeColor: _C.amber, showDivider: false),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon; final String label; final Color bg; final Color color; final VoidCallback? onTap;
  const _ActionTile({required this.icon, required this.label, required this.bg, required this.color, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: _cardDeco(radius: 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 42, height: 42, decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 20)),
          const SizedBox(height: 8),
          Text(label, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _C.ink, height: 1.3)),
        ]),
      ),
    );
  }
}

class _PulseTile extends StatelessWidget {
  final String value, label, sub; final IconData icon; final Color iconColor, iconBg;
  const _PulseTile({required this.value, required this.label, required this.icon, required this.iconColor, required this.iconBg, required this.sub});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: _cardDeco(radius: 18),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 34, height: 34, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: iconColor, size: 17)),
        const SizedBox(height: 10),
        Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: _C.ink, height: 1)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _C.inkMid)),
        const SizedBox(height: 4),
        Text(sub, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: iconColor)),
      ]),
    );
  }
}

class _FeedRow extends StatelessWidget {
  final IconData icon; final Color iconColor, iconBg, badgeColor;
  final String title, subtitle, time, badge; final bool showDivider;
  const _FeedRow({required this.icon, required this.iconColor, required this.iconBg, required this.title, required this.subtitle, required this.time, required this.badge, required this.badgeColor, required this.showDivider});
  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 42, height: 42, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(13)), child: Icon(icon, color: iconColor, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: _C.ink)),
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: _C.inkMid)),
            const SizedBox(height: 3),
            Text(time, style: GoogleFonts.inter(fontSize: 10, color: _C.inkMute)),
          ])),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: badgeColor.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
            child: Text(badge, style: GoogleFonts.spaceMono(fontSize: 10, fontWeight: FontWeight.w700, color: badgeColor)),
          ),
        ]),
      ),
      if (showDivider) Divider(height: 1, color: _C.border.withOpacity(0.6), indent: 68, endIndent: 14),
    ]);
  }
}

class _ClientsTab extends StatefulWidget {
  const _ClientsTab();
  @override
  State<_ClientsTab> createState() => _ClientsTabState();
}

class _ClientsTabState extends State<_ClientsTab> {
  bool _loading = true;
  List<dynamic> _clients = [];
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await apiClient.get('/merchant/clients');
      if (res.statusCode == 200 && res.data['success'] == true) {
        setState(() {
          _clients = res.data['data']['clients'] ?? [];
          _loading = false;
        });
      } else {
        setState(() { _error = 'Erreur lors du chargement des clients'; _loading = false; });
      }
    } catch (e) {
      setState(() { _error = 'Impossible de contacter le serveur'; _loading = false; });
    }
  }

  Future<void> _deleteClient(dynamic client) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('Supprimer ?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Voulez-vous vraiment retirer ce client de votre programme ?', style: GoogleFonts.inter()),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: Text('Annuler', style: GoogleFonts.inter(color: _C.inkMute))),
          TextButton(onPressed: () => Navigator.pop(c, true), child: Text('Supprimer', style: GoogleFonts.inter(color: _C.red))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await apiClient.delete('/merchant/clients/${client['_id']}');
      _loadClients();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur de suppression')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final filteredClients = _clients.where((c) {
      final name = '${c['firstName'] ?? ''} ${c['lastName'] ?? ''}'.toLowerCase();
      final email = '${c['email'] ?? ''}'.toLowerCase();
      final q = _searchQuery.toLowerCase();
      return name.contains(q) || email.contains(q);
    }).toList();

    return Container(
      color: _C.bgBase,
      child: Column(children: [
        SizedBox(height: top + 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Mes Clients', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: _C.ink, letterSpacing: -0.5)),
              if (filteredClients.isNotEmpty)
                Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: _C.redSoft, borderRadius: BorderRadius.circular(10)), child: Text('${filteredClients.length}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: _C.red))),
            ]),
            const SizedBox(height: 16),
            Container(height: 48, decoration: _cardDeco(radius: 14), child: Row(children: [
              const SizedBox(width: 14),
              const Icon(Icons.search_rounded, color: _C.inkMute, size: 20),
              const SizedBox(width: 10),
              Expanded(child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(hintText: 'Rechercher...', hintStyle: GoogleFonts.inter(fontSize: 14, color: _C.inkMute), border: InputBorder.none, isDense: true)
              )),
            ])),
          ]),
        ),
        const SizedBox(height: 20),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _C.red, strokeWidth: 2))
              : _error != null
                  ? Center(child: Text(_error!, style: GoogleFonts.inter(color: _C.red)))
                  : _clients.isEmpty
                      ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Container(width: 70, height: 70, decoration: BoxDecoration(color: _C.redSoft, borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.people_rounded, color: _C.red, size: 32)),
                          const SizedBox(height: 14),
                          Text('Aucun client encore', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
                          const SizedBox(height: 6),
                          Text('Partagez votre QR code pour commencer', style: GoogleFonts.inter(fontSize: 13, color: _C.inkMid)),
                        ]))
                      : filteredClients.isEmpty
                          ? Center(child: Text('Aucun résultat trouvé', style: GoogleFonts.inter(color: _C.inkMid)))
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                              physics: const BouncingScrollPhysics(),
                              itemCount: filteredClients.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, i) {
                                final c = filteredClients[i];
                                return Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: _cardDeco(radius: 16),
                                  child: Row(children: [
                                    CircleAvatar(backgroundColor: _C.redSoft, radius: 24, child: Text((c['firstName']?[0] ?? '?').toUpperCase(), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: _C.red, fontSize: 18))),
                                    const SizedBox(width: 16),
                                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('${c['firstName'] ?? ''} ${c['lastName'] ?? ''}'.trim(), style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: _C.ink, fontSize: 16)),
                                      const SizedBox(height: 4),
                                      Text(c['email'] ?? '', style: GoogleFonts.inter(color: _C.inkMute, fontSize: 13)),
                                    ])),
                                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                      Text('${c['loyaltyPoints'] ?? 0} pts', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: _C.red, fontSize: 15)),
                                      const SizedBox(height: 2),
                                      Text('Fidélité', style: GoogleFonts.inter(color: _C.inkMid, fontSize: 11)),
                                    ]),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.person_remove_rounded, color: _C.redSoft),
                                      tooltip: 'Supprimer le client',
                                      onPressed: () => _deleteClient(c),
                                    ),
                                  ]),
                                );
                              },
                            ),
        ),
      ]),
    );
  }
}

class _QRTab extends StatefulWidget {
  @override State<_QRTab> createState() => _QRTabState();
}
class _QRTabState extends State<_QRTab> {
  bool _loading = true; String? _qrUrl, _merchantCode, _commerceName, _error; int _scanCount = 0;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final comRes = await apiClient.get('/commerces/me');
      if (comRes.statusCode == 200 && comRes.data['success'] == true) {
        _commerceName = comRes.data['data']['commerce']['name'];
        _merchantCode = comRes.data['data']['commerce']['merchantCode'];
      }
      final qrRes = await apiClient.post('/merchant/qrcode');
      if (qrRes.statusCode == 200 && qrRes.data['success'] == true) {
        final qr = qrRes.data['data']['qrCode'];
        setState(() { _qrUrl = qr['url']; _scanCount = qr['scanCount'] ?? 0; _loading = false; });
      } else { setState(() { _error = 'QR Code introuvable'; _loading = false; }); }
    } catch (e) { setState(() { _error = e.toString(); _loading = false; }); }
  }
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: _C.bgBase,
      child: SingleChildScrollView(physics: const BouncingScrollPhysics(), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(height: top + 20),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Mon QR Code', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: _C.ink, letterSpacing: -0.5)),
          if (_commerceName != null) Text(_commerceName!, style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid)),
        ])),
        const SizedBox(height: 24),
        if (_loading) const Padding(padding: EdgeInsets.all(60), child: Center(child: CircularProgressIndicator(color: _C.red, strokeWidth: 2)))
        else if (_error != null) Padding(padding: const EdgeInsets.all(40), child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.error_outline_rounded, color: _C.red, size: 48),
          const SizedBox(height: 12),
          Text(_error!, style: GoogleFonts.inter(color: _C.inkMid), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          TextButton(onPressed: _load, child: const Text('Reessayer', style: TextStyle(color: _C.red))),
        ]))
        else ...[
          Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Container(padding: const EdgeInsets.all(22), decoration: _cardDeco(radius: 22), child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: _C.border)),
              child: QrImageView(data: _qrUrl ?? 'https://retenza.app', version: QrVersions.auto, size: 200, eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: _C.ink), dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: _C.ink))),
            const SizedBox(height: 18),
            Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: _C.redSoft, borderRadius: BorderRadius.circular(50)),
              child: Text(_merchantCode ?? '', style: GoogleFonts.spaceMono(fontSize: 16, fontWeight: FontWeight.w700, color: _C.red, letterSpacing: 2.5))),
            const SizedBox(height: 8),
            Text('Montrez ce QR Code a vos clients', style: GoogleFonts.inter(fontSize: 13, color: _C.inkMid), textAlign: TextAlign.center),
          ]))),
          const SizedBox(height: 14),
          Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 100), child: GestureDetector(
            onTap: () { Clipboard.setData(ClipboardData(text: _qrUrl ?? '')); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Lien copie!'), backgroundColor: _C.red, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), margin: const EdgeInsets.all(16))); },
            child: Container(height: 52, decoration: BoxDecoration(gradient: const LinearGradient(colors: [_C.redWarm, _C.redDeep], begin: Alignment.topLeft, end: Alignment.bottomRight), borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: _C.red.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 5))]),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.copy_rounded, color: Colors.white, size: 18), const SizedBox(width: 8), Text('Copier le lien', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white))])),
          )),
        ],
      ])),
    );
  }
}

class _ProgramTab extends StatefulWidget {
  const _ProgramTab();
  @override
  State<_ProgramTab> createState() => _ProgramTabState();
}

class _ProgramTabState extends State<_ProgramTab> {
  bool _loading = true;
  bool _saving = false;
  String _selectedType = '';
  
  final TextEditingController _pointsCtrl = TextEditingController(text: '1');
  final TextEditingController _stampsCtrl = TextEditingController(text: '10');
  final TextEditingController _cashbackCtrl = TextEditingController(text: '5');
  final TextEditingController _rewardCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProgram();
  }

  @override
  void dispose() {
    _pointsCtrl.dispose();
    _stampsCtrl.dispose();
    _cashbackCtrl.dispose();
    _rewardCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProgram() async {
    setState(() => _loading = true);
    try {
      final res = await apiClient.get('/merchant/loyalty');
      if (res.statusCode == 200 && res.data['success'] == true) {
        final prog = res.data['data']['program'];
        if (prog != null) {
          setState(() {
            _selectedType = prog['type'] ?? '';
            _pointsCtrl.text = prog['pointsPerEuro']?.toString() ?? '1';
            _stampsCtrl.text = prog['stampsRequired']?.toString() ?? '10';
            _cashbackCtrl.text = prog['cashbackPercentage']?.toString() ?? '5';
            _rewardCtrl.text = prog['rewardDescription'] ?? '';
          });
        }
      }
    } catch (e) {
      debugPrint("Error loading program: $e");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveProgram() async {
    if (_selectedType.isEmpty) return;
    setState(() => _saving = true);
    try {
      Map<String, dynamic> body = {};
      String endpoint = '';

      if (_selectedType == 'points') {
        endpoint = '/merchant/loyalty/points';
        body = {'pointsPerEuro': double.tryParse(_pointsCtrl.text) ?? 1.0, 'rewardDescription': _rewardCtrl.text};
      } else if (_selectedType == 'stamps') {
        endpoint = '/merchant/loyalty/stamps';
        body = {'stampsRequired': int.tryParse(_stampsCtrl.text) ?? 10, 'rewardDescription': _rewardCtrl.text};
      } else if (_selectedType == 'cashback') {
        endpoint = '/merchant/loyalty/cashback';
        body = {'cashbackPercentage': double.tryParse(_cashbackCtrl.text) ?? 5.0, 'rewardDescription': _rewardCtrl.text};
      }

      final res = await apiClient.put(endpoint, data: body);
      if (res.statusCode == 200 && res.data['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Programme sauvegarde avec succes!', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
          backgroundColor: _C.teal,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16)
        ));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Erreur lors de la sauvegarde.', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
        backgroundColor: _C.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16)
      ));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _card(Widget child, {EdgeInsets? p, Key? k}) => Container(
    key: k, padding: p ?? const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: _C.bgCard, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _C.border),
      boxShadow: [BoxShadow(color: _C.ink.withOpacity(.04), blurRadius: 16, offset: const Offset(0,4))],
    ), child: child);

  Widget _lbl(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 7, top: 2, left: 2),
    child: Text(t, style: GoogleFonts.spaceMono(
        fontSize: 10, fontWeight: FontWeight.w700,
        color: _C.red, letterSpacing: .8)));

  Widget _inp(TextEditingController c, {String? h, TextInputType? kb, int lines = 1}) =>
    TextField(
      controller: c, keyboardType: kb, maxLines: lines,
      style: GoogleFonts.inter(fontSize: 15, color: _C.ink),
      decoration: InputDecoration(
        hintText: h,
        hintStyle: GoogleFonts.inter(color: _C.inkMute, fontSize: 14),
        filled: true, fillColor: _C.bgBase,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border:        _bdr(), enabledBorder: _bdr(), focusedBorder: _bdr(on: true),
      ));

  OutlineInputBorder _bdr({bool on = false}) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: on ? _C.red : _C.border, width: on ? 1.5 : 1));

  Widget _numBox(TextEditingController c, {String? h, double w = 72}) => SizedBox(
    width: w,
    child: TextField(
      controller: c, keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      textAlign: TextAlign.center,
      style: GoogleFonts.spaceMono(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink),
      decoration: InputDecoration(
        hintText: h ?? '0',
        hintStyle: GoogleFonts.spaceMono(color: _C.inkMute.withOpacity(.5)),
        filled: true, fillColor: _C.bgBase,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: _bdr(), enabledBorder: _bdr(), focusedBorder: _bdr(on: true),
      )));

  Widget _gap([double h = 20]) => SizedBox(height: h);

  Widget _loyaltyConf() {
    if (_selectedType == 'points') return _card(Column(
      key: const ValueKey('pts'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('TAUX DE CONVERSION'),
        _gap(8),
        Row(children: [
          Text('1 €  =', style: GoogleFonts.inter(fontSize: 15, color: _C.inkMid, fontWeight: FontWeight.w500)),
          const SizedBox(width: 8), _numBox(_pointsCtrl), const SizedBox(width: 8),
          Text('pts', style: GoogleFonts.spaceMono(fontSize: 13, color: _C.red, fontWeight: FontWeight.w700)),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE'),
        _gap(4),
        _inp(_rewardCtrl, h: 'Cafe gratuit, Coupe offerte...'),
      ]),
    );

    if (_selectedType == 'stamps') return _card(Column(
      key: const ValueKey('stp'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('NOMBRE DE TAMPONS'),
        _gap(8),
        Row(children: [
          _numBox(_stampsCtrl), const SizedBox(width: 10),
          Expanded(child: Text('tampons = recompense', style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid))),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE OBTENUE'),
        _gap(4),
        _inp(_rewardCtrl, h: '1 Cafe offert'),
      ]),
    );

    return _card(Column(
      key: const ValueKey('cb'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('TAUX DE CASHBACK'),
        _gap(8),
        Row(children: [
          _numBox(_cashbackCtrl), const SizedBox(width: 10),
          Text('% reverse sur chaque achat', style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid)),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE'),
        _gap(4),
        _inp(_rewardCtrl, h: 'Bon de reduction, Remise...'),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: _C.bgBase,
      child: Column(
        children: [
          SizedBox(height: top + 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Programme', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: _C.ink, letterSpacing: -0.5)),
                if (_loading) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: _C.red))
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Choisissez un modele de fidelite pour vos clients.', style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid)),
                  const SizedBox(height: 24),
                  
                  ...[
                    ('points',  'Points',  'Accumuler des points\na chaque achat',       Icons.star_rounded),
                    ('stamps',  'Tampons', 'Tamponner une carte\njusqu\'a la recompense', Icons.grid_view_rounded),
                    ('cashback','Cashback','Recevoir un %\nsur chaque achat',            Icons.account_balance_wallet_rounded),
                  ].map((o) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedType = o.$1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250), curve: Curves.easeOut,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _selectedType == o.$1 ? _C.bgCard : _C.bgBase,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _selectedType == o.$1 ? _C.red : _C.border,
                            width: _selectedType == o.$1 ? 1.5 : 1),
                          boxShadow: _selectedType == o.$1
                            ? [BoxShadow(color: _C.red.withOpacity(.10), blurRadius: 20, offset: const Offset(0,4))]
                            : [],
                        ),
                        child: Row(children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(
                              color: _selectedType == o.$1 ? _C.red : _C.redSoft,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(o.$4, color: _selectedType == o.$1 ? Colors.white : _C.red, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(o.$2, style: GoogleFonts.outfit(
                                fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
                            Text(o.$3, style: GoogleFonts.inter(fontSize: 12, color: _C.inkMid, height: 1.35)),
                          ])),
                          if (_selectedType == o.$1) Container(
                            width: 22, height: 22,
                            decoration: const BoxDecoration(color: _C.red, shape: BoxShape.circle),
                            child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
                          ),
                        ]),
                      ),
                    ),
                  )),
                  
                  AnimatedSize(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.fastOutSlowIn,
                    child: _selectedType.isEmpty ? const SizedBox.shrink() : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 20),
                        _loyaltyConf(),
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: _saving ? null : _saveProgram,
                          child: Container(
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [_C.redWarm, _C.redDeep]),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: _C.red.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 5))]
                            ),
                            alignment: Alignment.center,
                            child: _saving 
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text('Sauvegarder', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfilTab extends StatefulWidget {
  final VoidCallback onLogout;
  const _ProfilTab({required this.onLogout});

  @override
  State<_ProfilTab> createState() => _ProfilTabState();
}

class _ProfilTabState extends State<_ProfilTab> {
  bool _loading = true;
  String _commerceName = 'Chargement...';
  String _address = 'Recherche...';
  String _hoursStr = '...';
  bool _isConfigured = false;
  String _initials = '';

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final res = await apiClient.get('/commerces/me');
      if (res.statusCode == 200 && res.data['success'] == true) {
        final c = res.data['data']['commerce'];
        if (c != null) {
          String addr = 'Adresse non renseignee';
          if (c['contact'] != null) {
            final street = c['contact']['address'] ?? '';
            final city = c['contact']['city'] ?? '';
            if (street.isNotEmpty || city.isNotEmpty) {
              addr = [street, city].where((e) => e.isNotEmpty).join(', ');
            }
          }

          String hStr = 'Non renseignes';
          if (c['openingHours'] != null && c['openingHours'] is List) {
            final hours = c['openingHours'] as List;
            if (hours.isNotEmpty) {
              final todayIndex = DateTime.now().weekday - 1; // 0=Monday
              final days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              final todayKey = days[todayIndex];
              
              final todayData = hours.firstWhere((h) => h['day'] == todayKey, orElse: () => null);
              if (todayData != null) {
                if (todayData['isClosed'] == true) {
                  hStr = 'Ferme aujourd\'hui';
                } else {
                  hStr = '${todayData['open'] ?? '08:00'} - ${todayData['close'] ?? '18:00'}';
                }
              }
            }
          }

          String name = c['name'] ?? 'Mon Commerce';
          String inits = name.length >= 2 ? name.substring(0, 2).toUpperCase() : 'C';

          if (mounted) {
            setState(() {
              _commerceName = name;
              _initials = inits;
              _address = addr;
              _hoursStr = hStr;
              _isConfigured = c['isConfigured'] == true;
              _loading = false;
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint("Error fetching profile: $e");
    }
    
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: Colors.white,
      child: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.fromLTRB(20, top + 20, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ─── Header ───
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Mon Profil',
                        style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w600, color: _C.ink, letterSpacing: -0.5)),
                    Container(
                      width: 44, height: 44,
                      decoration: const BoxDecoration(color: Color(0xFFF4F5F7), shape: BoxShape.circle),
                      child: const Icon(Icons.person_outline_rounded, color: _C.ink, size: 22),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // ─── Card 1: Votre commerce ───
                GestureDetector(
                  onTap: () => _showEditInfoDialog(context),
                  child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: const Color(0xFFF4F5F7), borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Informations de la vitrine', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: _C.ink)),
                          const Icon(Icons.arrow_forward_ios_rounded, color: _C.red, size: 16),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        child: _loading 
                          ? const Center(child: Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator(color: _C.red)))
                          : Column(
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, color: _C.inkMid, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(_commerceName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink)),
                                      Text(_address, style: GoogleFonts.inter(fontSize: 13, color: _C.inkMute)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Icon(Icons.access_time_rounded, color: _C.inkMid, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Ouvert aujourd\'hui', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink)),
                                      Text(_hoursStr, style: GoogleFonts.inter(fontSize: 13, color: _C.inkMute)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  ),
                ),
                const SizedBox(height: 16),

                // ─── Card 2: Configuration ───
                GestureDetector(
                  onTap: () => _showEditInfoDialog(context),
                  child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: const Color(0xFFF4F5F7), borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 46, height: 46,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CircularProgressIndicator(
                              value: _isConfigured ? 1.0 : 0.8,
                              backgroundColor: Colors.grey.withOpacity(0.2),
                              color: _C.red,
                              strokeWidth: 4,
                            ),
                            Center(child: Text(_isConfigured ? '100%' : '80%', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: _C.ink))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Completez votre profil', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: _C.ink)),
                            const SizedBox(height: 2),
                            Text(_isConfigured ? '100% complete' : '4 sur 5 etapes terminees', style: GoogleFonts.inter(fontSize: 13, color: _C.inkMute)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, color: _C.red, size: 16),
                    ],
                  ),
                  ),
                ),

                const SizedBox(height: 32),

                // ─── ESSENTIELS ───
                Text('ESSENTIELS', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: 1.5)),
                const SizedBox(height: 16),
                
                Row(
                  children: [
                    Expanded(child: _buildGridItem(Icons.person_outline_rounded, 'Profil', false, onTap: () => _showEditInfoDialog(context))),
                    const SizedBox(width: 16),
                    Expanded(child: _buildGridItem(Icons.settings_outlined, 'Securite', false, onTap: () => _showSecurityDialog(context))),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildGridItem(Icons.star_border_rounded, 'Programme', false, onTap: () => _showSnack(context, 'Allez dans l\'onglet Cadeaux pour gerer le programme.'))),
                    const SizedBox(width: 16),
                    Expanded(child: _buildGridItem(Icons.notifications_none_rounded, 'Notifications', true, onTap: () => _showNotificationsDialog(context))),
                  ],
                ),

                const SizedBox(height: 32),

                // ─── SUPPORT ───
                Text('SUPPORT', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: _C.ink, letterSpacing: 1.5)),
                const SizedBox(height: 16),
                
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(color: const Color(0xFFF4F5F7), borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      _buildListItem('Aide et FAQ', onTap: () => _showHelpDialog(context)),
                      Divider(height: 1, color: _C.border.withOpacity(0.5)),
                      _buildListItem('A propos de Retenza', onTap: () => _showAboutDialog(context)),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // ─── Logout ───
                GestureDetector(
                  onTap: () async { await AuthService.logout(); widget.onLogout(); },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(color: const Color(0xFFF4F5F7), borderRadius: BorderRadius.circular(16)),
                    alignment: Alignment.center,
                    child: Text('Se deconnecter', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: _C.red)),
                  ),
                ),
              ],
            ),
          ),
          
          // Floating Chat Button
          Positioned(
            right: 20,
            bottom: 20,
            child: GestureDetector(
              onTap: () => _showHelpDialog(context),
              child: Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 4))],
              ),
              child: const Icon(Icons.chat_bubble_outline_rounded, color: _C.red, size: 24),
            ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Helper: snack ──
  void _showSnack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.inter(fontSize: 13, color: Colors.white)),
      backgroundColor: _C.ink,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
      duration: const Duration(seconds: 3),
    ));
  }

  // ── Dialog: Edit info (nom, adresse, tel, site) ──
  void _showEditInfoDialog(BuildContext ctx) {
    final nameC = TextEditingController(text: _commerceName);
    final addrC = TextEditingController(text: _address);
    showModalBottomSheet(
      context: ctx, isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0xFFE0E0E0), borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 20),
              Text('Modifier la vitrine', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
              const SizedBox(height: 20),
              _field('Nom du commerce', nameC),
              const SizedBox(height: 12),
              _field('Adresse', addrC),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _C.red, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: () async {
                  Navigator.pop(ctx);
                  // Split address back: "street, city"
                  final parts = addrC.text.split(',');
                  final street = parts.isNotEmpty ? parts[0].trim() : '';
                  final city = parts.length > 1 ? parts[1].trim() : '';
                  try {
                    await apiClient.put('/commerces/me', data: {
                      'name': nameC.text.trim(),
                      'contact': {'address': street, 'city': city},
                    });
                    _fetchProfile();
                    _showSnack(context, 'Informations mises a jour!');
                  } catch (e) {
                    _showSnack(context, 'Erreur: ${e.toString().replaceAll('Exception: ', '')}');
                  }
                },
                child: Text('Enregistrer', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Dialog: Securite (changer mot de passe) ──
  void _showSecurityDialog(BuildContext ctx) {
    final oldPwC = TextEditingController();
    final newPwC = TextEditingController();
    final confC  = TextEditingController();
    bool obs = true;
    showModalBottomSheet(
      context: ctx, isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (bCtx) => StatefulBuilder(builder: (bCtx2, setSt) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0xFFE0E0E0), borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 20),
              Text('Changer le mot de passe', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
              const SizedBox(height: 20),
              _field('Mot de passe actuel', oldPwC, obscure: obs),
              const SizedBox(height: 12),
              _field('Nouveau mot de passe', newPwC, obscure: obs),
              const SizedBox(height: 12),
              _field('Confirmer', confC, obscure: obs),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _C.red, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: () async {
                  if (newPwC.text != confC.text) { _showSnack(ctx, 'Les mots de passe ne correspondent pas.'); return; }
                  if (newPwC.text.length < 6)    { _showSnack(ctx, 'Minimum 6 caracteres.'); return; }
                  Navigator.pop(bCtx);
                  try {
                    await apiClient.put('/auth/change-password', data: {
                      'currentPassword': oldPwC.text,
                      'newPassword': newPwC.text,
                    });
                    _showSnack(context, 'Mot de passe change avec succes!');
                  } catch (e) {
                    _showSnack(context, 'Erreur: ${e.toString().replaceAll('Exception: ', '')}');
                  }
                },
                child: Text('Confirmer', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ],
          ),
        ),
      )),
    );
  }

  // ── Dialog: Notifications ──
  void _showNotificationsDialog(BuildContext ctx) {
    bool clientNotifs = true;
    bool promoNotifs  = true;
    showModalBottomSheet(
      context: ctx,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => StatefulBuilder(builder: (bCtx, setSt) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0xFFE0E0E0), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 20),
            Text('Notifications', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
            const SizedBox(height: 20),
            _switchTile('Nouveaux clients', 'Quand un client scan votre QR', clientNotifs, (v) => setSt(() => clientNotifs = v)),
            const Divider(height: 1),
            _switchTile('Offres promotionnelles', 'Alertes sur vos promotions', promoNotifs, (v) => setSt(() => promoNotifs = v)),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: _C.red, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 16)),
              onPressed: () async {
                Navigator.pop(bCtx);
                try {
                  await apiClient.put('/commerces/me', data: {
                    'notifications': {'receiveClientNotifications': clientNotifs, 'autoSendPromos': promoNotifs}
                  });
                  _showSnack(context, 'Preferences enregistrees!');
                } catch (e) {
                  _showSnack(context, 'Erreur lors de la sauvegarde.');
                }
              },
              child: Text('Enregistrer', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ],
        ),
      )),
    );
  }

  // ── Dialog: Aide ──
  void _showHelpDialog(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0xFFE0E0E0), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 20),
            Text('Aide et Support', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink)),
            const SizedBox(height: 8),
            Text('Notre equipe est disponible du lundi au vendredi, 9h - 18h.', style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid, height: 1.5)),
            const SizedBox(height: 24),
            _helpRow(Icons.email_outlined, 'support@retenza.tn'),
            const SizedBox(height: 12),
            _helpRow(Icons.phone_outlined, '+216 XX XXX XXX'),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ── Dialog: A propos ──
  void _showAboutDialog(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: const Color(0xFFE0E0E0), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(color: _C.red, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: _C.red.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]),
                  alignment: Alignment.center,
                  child: Text('R', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Retenza Connect', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: _C.ink, letterSpacing: -0.5)),
                      const SizedBox(height: 2),
                      Text('Version 1.0.0', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: _C.inkMute)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text('Retenza Connect aide les commercants a fideliser leurs clients via un systeme de points, tampons ou cashback. Une plateforme d\'acquisition client et de fidelisation digitale pour commerces locaux.', 
              style: GoogleFonts.inter(fontSize: 14, color: _C.inkMid, height: 1.6), textAlign: TextAlign.justify),
            const SizedBox(height: 32),
            Center(child: Text('© 2026 Retenza. Tous droits reserves.', style: GoogleFonts.inter(fontSize: 12, color: _C.inkMute))),
          ],
        ),
      ),
    );
  }

  // ── Widget helpers ──
  Widget _field(String label, TextEditingController c, {bool obscure = false}) => TextField(
    controller: c, obscureText: obscure,
    style: GoogleFonts.inter(fontSize: 14, color: _C.ink),
    decoration: InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.inter(fontSize: 13, color: _C.inkMid),
      filled: true, fillColor: const Color(0xFFF4F5F7),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    ),
  );

  Widget _switchTile(String title, String sub, bool val, ValueChanged<bool> onChanged) =>
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink)),
          Text(sub, style: GoogleFonts.inter(fontSize: 12, color: _C.inkMute)),
        ])),
        Switch.adaptive(value: val, onChanged: onChanged, activeColor: _C.red),
      ]),
    );

  Widget _helpRow(IconData icon, String text) => Row(children: [
    Container(width: 40, height: 40, decoration: BoxDecoration(color: _C.redSoft, borderRadius: BorderRadius.circular(12)),
      child: Icon(icon, color: _C.red, size: 19)),
    const SizedBox(width: 14),
    Text(text, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: _C.ink)),
  ]);

  Widget _buildGridItem(IconData icon, String label, bool hasBadge, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFFF4F5F7), borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 40, height: 40,
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: Icon(icon, color: _C.red, size: 20),
              ),
              if (hasBadge)
                Positioned(
                  top: -4, right: -4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: _C.red, shape: BoxShape.circle),
                    child: Text('2', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(label, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: _C.ink)),
        ],
      ),
      ),
    );
  }

  Widget _buildListItem(String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: _C.ink)),
          const Icon(Icons.arrow_forward_ios_rounded, color: _C.inkMid, size: 16),
        ],
      ),
      ),
    );
  }
}
