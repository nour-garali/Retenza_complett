import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_client.dart';

// ══════════════════════════════════════════════════════════════
//  RETENZA — MERCHANT SETUP · PREMIUM WIZARD
//
//  Brand DNA ─ Grenadier #D73E26 pour l'action
//             Ember #F2774E pour la chaleur
//             Ink #1B100C pour l'ancrage
//             Paper #F4EFEB pour l'espace
//
//  Typo ─ Bricolage Grotesque (Display · poids · impact)
//         Inter (UI · clarté · lisibilité)
//         Space Mono (données · codes · badges)
//
//  Principe ─ "Le commerçant ne fait rien" — rassurer,
//             automatiser, montrer le résultat.
// ══════════════════════════════════════════════════════════════

/* ────────── Design Tokens ────────── */
const _C = _Colors();

class _Colors {
  const _Colors();
  final grenadier     = const Color(0xFFD73E26);
  final grenadierDeep = const Color(0xFFA82C18);
  final ember         = const Color(0xFFF2774E);
  final emberSoft     = const Color(0xFFFCE7DD);
  final ink           = const Color(0xFF1B100C);
  final ink2          = const Color(0xFF241813);
  final ink60         = const Color(0xFF6E5B52);
  final ink40         = const Color(0xFF9C8B82);
  final line          = const Color(0xFFEDE5DF);
  final bg            = const Color(0xFFF4EFEB);
  final white         = const Color(0xFFFFFFFF);
  final regular       = const Color(0xFF3F8E84);
}

/* ────────── Day Model ────────── */
class _Day {
  final String key, label;
  bool closed;
  String open, close;
  _Day(this.key, this.label, {this.closed = false, this.open = '09:00', this.close = '18:00'});
}

/* ══════════════════════════════════════════════════════════════ */

class MerchantSetupScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const MerchantSetupScreen({super.key, required this.onComplete});
  @override State<MerchantSetupScreen> createState() => _State();
}

class _State extends State<MerchantSetupScreen> with SingleTickerProviderStateMixin {

  /* ── state ── */
  bool _loading = true, _saving = false;
  int  _step = 0;
  String? _cId, _cName;
  late final _pc = PageController();

  /* step 0 — identity */
  String _brandColor = '#D73E26';
  final _descC = TextEditingController();

  final _palette = const [
    '#D73E26','#F2774E','#E8902A','#3F8E84',
    '#1A6FAF','#7C4AC1','#C2185B','#1B100C',
  ];

  /* step 1 — info */
  final _webC = TextEditingController();
  final _phoneC = TextEditingController();
  final _addrC = TextEditingController();
  final _cityC = TextEditingController();

  /* step 2 — hours */
  final _days = [
    _Day('monday','Lundi'), _Day('tuesday','Mardi'),
    _Day('wednesday','Mercredi'), _Day('thursday','Jeudi'),
    _Day('friday','Vendredi'),
    _Day('saturday','Samedi', closed: true),
    _Day('sunday','Dimanche', closed: true),
  ];

  /* step 3 — loyalty */
  String _lType = 'points';
  final _amtC = TextEditingController(text: '10');
  final _ptC  = TextEditingController(text: '5');
  final _stC  = TextEditingController(text: '10');
  final _srC  = TextEditingController(text: 'Café offert');
  final _cbC  = TextEditingController(text: '5');
  final _rnC  = TextEditingController(text: 'Café gratuit');
  final _rtC  = TextEditingController(text: '100');

  /* step 4 — notifs */
  bool _nClient = true, _nPromo = true;

  /* ── lifecycle ── */
  @override
  void initState() { super.initState(); _fetch(); }

  @override
  void dispose() {
    _pc.dispose();
    for (final c in [_descC,_webC,_phoneC,_addrC,_cityC,
                      _amtC,_ptC,_stC,_srC,_cbC,_rnC,_rtC]) c.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    try {
      final r = await apiClient.get('/commerces/me');
      if (r.statusCode == 200 && r.data['success']) {
        final c = r.data['data']['commerce'];
        _cId = c['_id']; _cName = c['name'];
        _descC.text = c['description'] ?? '';
        _webC.text  = c['website'] ?? '';
        _brandColor = c['brandColor'] ?? '#D73E26';
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _go(int dir) {
    final to = _step + dir;
    if (to < 0 || to > 4) return;
    setState(() => _step = to);
    _pc.animateToPage(to,
        duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic);
  }

  Future<void> _submit() async {
    if (_cId == null) { widget.onComplete(); return; }
    setState(() => _saving = true);

    final Map<String, dynamic> lp;
    if (_lType == 'points') {
      lp = {'type':'points',
        'amountPerPoints': int.tryParse(_amtC.text)??10,
        'pointsPerEuro':   int.tryParse(_ptC.text)??5,
        'rewardName': _rnC.text.trim(),
        'rewardThreshold': int.tryParse(_rtC.text)??100,
        'rewardDescription': _rnC.text.trim()};
    } else if (_lType == 'stamps') {
      lp = {'type':'stamps',
        'stampsRequired': int.tryParse(_stC.text)??10,
        'rewardName': _srC.text.trim(),
        'rewardThreshold': int.tryParse(_stC.text)??10,
        'rewardDescription': _srC.text.trim()};
    } else {
      lp = {'type':'cashback',
        'cashbackPercentage': double.tryParse(_cbC.text)??5,
        'rewardName': _rnC.text.trim(),
        'rewardThreshold': int.tryParse(_rtC.text)??100,
        'rewardDescription': _rnC.text.trim()};
    }

    try {
      await apiClient.put('/commerces/$_cId', data: {
        'description': _descC.text.trim(),
        'website': _webC.text.trim(),
        'brandColor': _brandColor,
        'contact': {'phone':_phoneC.text.trim(),'address':_addrC.text.trim(),'city':_cityC.text.trim()},
        'openingHours': _days.map((d) =>
          {'day':d.key,'open':d.open,'close':d.close,'isClosed':d.closed}).toList(),
        'loyaltyProgram': lp,
        'notifications': {'receiveClientNotifications':_nClient,'autoSendPromos':_nPromo},
        'isConfigured': true,
      });
      await apiClient.post('/merchant/qrcode');
      widget.onComplete();
    } catch (e) {
      setState(() => _saving = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString().replaceAll('Exception: ','')),
        backgroundColor: _C.grenadier,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ));
    }
  }

  /* ══════════════════════════════════════════════════════════════
     BUILD
  ══════════════════════════════════════════════════════════════ */

  static const _titles = [
    ['Votre vitrine',          'Créez une identité qui vous ressemble.'],
    ['Coordonnées',            'Comment vos clients vous trouvent.'],
    ['Horaires d\'ouverture',  'Indiquez votre disponibilité.'],
    ['Programme de fidélité',  'Choisissez votre moteur de rétention.'],
    ['Lancement',              'Derniers réglages avant le décollage.'],
  ];

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(backgroundColor: _C.bg,
        body: Center(child: CircularProgressIndicator(color: _C.grenadier, strokeWidth: 2.5)));

    return Scaffold(
      backgroundColor: _C.bg,
      body: SafeArea(child: Column(children: [
        /* ── header bar ────────────────────────── */
        _headerBar(),
        /* ── hero title area ───────────────────── */
        _heroTitle(),
        /* ── pages ─────────────────────────────── */
        Expanded(child: PageView(
          controller: _pc,
          physics: const NeverScrollableScrollPhysics(),
          children: [_p0(), _p1(), _p2(), _p3(), _p4()],
        )),
        /* ── bottom action bar ─────────────────── */
        _bottomBar(),
      ])),
    );
  }

  /* ─────── HEADER BAR ─────── */
  Widget _headerBar() => Container(
    padding: const EdgeInsets.fromLTRB(22,12,22,0),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
      /* back button */
      GestureDetector(
        onTap: () {
          if (_step > 0) _go(-1);
        },
        child: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: _C.white,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFF0F0F0)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Icon(Icons.arrow_back_rounded, color: _C.grenadier, size: 20),
        ),
      ),
      /* step pill */
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF0ED), borderRadius: BorderRadius.circular(100)),
        child: Text('Étape ${_step + 1}/5',
          style: GoogleFonts.inter(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: _C.grenadier)),
      ),
    ]),
  );

  /* ─────── HERO TITLE ─────── */
  Widget _heroTitle() => Padding(
    padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      /* progress segments */
      Row(children: List.generate(5, (i) => Expanded(child: AnimatedContainer(
        duration: const Duration(milliseconds: 350), curve: Curves.easeOut,
        height: 4,
        margin: EdgeInsets.only(right: i < 4 ? 6 : 0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: i <= _step ? _C.grenadier : const Color(0xFFEAEAEA),
        ),
      )))),
      const SizedBox(height: 28),
      /* title */
      AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: Column(
          key: ValueKey(_step),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_titles[_step][0], style: GoogleFonts.bricolageGrotesque(
                fontSize: 32, fontWeight: FontWeight.w700, color: const Color(0xFF111111),
                letterSpacing: -.5, height: 1.1)),
            const SizedBox(height: 8),
            Text(_titles[_step][1], style: GoogleFonts.inter(
                fontSize: 15, color: const Color(0xFF666666), height: 1.4, fontWeight: FontWeight.w400)),
          ],
        ),
      ),
      const SizedBox(height: 24),
    ]),
  );

  /* ─────── BOTTOM BAR ─────── */
  Widget _bottomBar() {
    final isLast = _step == 4;
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
      color: _C.white,
      child: GestureDetector(
        onTap: _saving ? null : (isLast ? _submit : () => _go(1)),
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            color: _C.grenadier, borderRadius: BorderRadius.circular(14),
          ),
          child: _saving
            ? Center(child: SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(color: _C.white, strokeWidth: 2)))
            : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(isLast ? 'Lancer ma vitrine' : 'Continuer',
                  style: GoogleFonts.inter(color: _C.white, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(width: 8),
                Icon(isLast ? Icons.rocket_launch_rounded : Icons.arrow_forward_rounded,
                    color: _C.white, size: 20),
              ]),
        ),
      ),
    );
  }

  /* ══════════════════════════════════════════════════════════════
     PAGES
  ══════════════════════════════════════════════════════════════ */

  /* ─────── helpers ─────── */
  Widget _page(List<Widget> ch) => ListView(
      padding: const EdgeInsets.symmetric(horizontal: 22), children: ch);

  Widget _card(Widget child, {EdgeInsets? p, Key? k}) => Container(
    key: k, padding: p ?? const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: _C.white, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _C.line),
      boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: .04), blurRadius: 16, offset: const Offset(0,4))],
    ), child: child);

  Widget _lbl(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 7, top: 2, left: 2),
    child: Text(t, style: GoogleFonts.spaceMono(
        fontSize: 10, fontWeight: FontWeight.w700,
        color: _C.grenadier, letterSpacing: .8)));

  Widget _inp(TextEditingController c, {String? h, TextInputType? kb, int lines = 1}) =>
    TextField(
      controller: c, keyboardType: kb, maxLines: lines,
      style: GoogleFonts.inter(fontSize: 15, color: _C.ink),
      decoration: InputDecoration(
        hintText: h,
        hintStyle: GoogleFonts.inter(color: _C.ink40, fontSize: 14),
        filled: true, fillColor: _C.bg,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border:        _bdr(), enabledBorder: _bdr(), focusedBorder: _bdr(on: true),
      ));

  OutlineInputBorder _bdr({bool on = false}) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: on ? _C.grenadier : _C.line, width: on ? 1.5 : 1));

  Widget _numBox(TextEditingController c, {String? h, double w = 72}) => SizedBox(
    width: w,
    child: TextField(
      controller: c, keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      textAlign: TextAlign.center,
      style: GoogleFonts.spaceMono(fontSize: 18, fontWeight: FontWeight.w700, color: _C.ink),
      decoration: InputDecoration(
        hintText: h ?? '0',
        hintStyle: GoogleFonts.spaceMono(color: _C.ink40.withValues(alpha: .5)),
        filled: true, fillColor: _C.bg,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: _bdr(), enabledBorder: _bdr(), focusedBorder: _bdr(on: true),
      )));

  Widget _gap([double h = 20]) => SizedBox(height: h);

  /* ─────── PAGE 0 · IDENTITY ─────── */
  Widget _p0() => _page([
    Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _C.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF4F4F4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.015), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Votre logo', style: GoogleFonts.bricolageGrotesque(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF111111))),
          const SizedBox(height: 6),
          Text('Ajoutez le logo de votre établissement.', style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF666666))),
          const SizedBox(height: 32),
          Center(
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const RadialGradient(
                  colors: [Color(0xFFFEF5F4), Colors.white],
                  stops: [0.6, 1.0],
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CustomPaint(
                    size: const Size(200, 200),
                    painter: _DashedCirclePainter(color: _C.grenadier),
                  ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Icon(Icons.broken_image_outlined, size: 52, color: _C.grenadier),
                          Container(
                            decoration: const BoxDecoration(color: Color(0xFFD73E26), shape: BoxShape.circle),
                            padding: const EdgeInsets.all(2),
                            child: const Icon(Icons.add, size: 16, color: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text('Importer votre logo', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF111111))),
                      const SizedBox(height: 6),
                      Text('PNG, JPG ou SVG', style: GoogleFonts.inter(fontSize: 11, color: _C.grenadier, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Text('Taille recommandée : 512x512px', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF999999))),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
    _gap(16),

    Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _C.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF4F4F4)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.015), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Couleurs de marque', style: GoogleFonts.bricolageGrotesque(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF111111))),
          const SizedBox(height: 6),
          Text('Choisissez la couleur principale de votre marque.', style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF666666))),
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                '#D73E26', '#F5F5F5', '#222222', '#1B3B5A', '#2D7A58', '#F5B01D', '#E2E2E2'
              ].map((hex) {
                final c = hex == '#F5F5F5' ? const Color(0xFFF5F5F5) : Color(int.parse('FF${hex.substring(1)}', radix: 16));
                final on = _brandColor == hex;
                return GestureDetector(
                  onTap: () => setState(() => _brandColor = hex),
                  child: Container(
                    margin: const EdgeInsets.only(right: 14),
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: on ? _C.grenadier : (hex == '#F5F5F5' ? const Color(0xFFE5E5E5) : Colors.transparent),
                        width: on ? 1.5 : 1.0,
                      ),
                    ),
                    child: Center(
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: c,
                          border: hex == '#F5F5F5' ? Border.all(color: const Color(0xFFE5E5E5)) : null,
                        ),
                        child: on ? Icon(Icons.check_rounded, color: hex == '#F5F5F5' || hex == '#E2E2E2' || hex == '#F5B01D' ? Colors.black : Colors.white, size: 18) : null,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    ),
    _gap(32),
  ]);

  /* ─────── PAGE 1 · INFO ─────── */
  Widget _p1() => _page([
    _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(color: _C.emberSoft, borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.language_rounded, color: _C.grenadier, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text('Présence en ligne', style: GoogleFonts.bricolageGrotesque(
            fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink))),
      ]),
      _gap(16),
      _lbl('SITE WEB'),
      _inp(_webC, h: 'https://moncommerce.tn', kb: TextInputType.url),
    ])),
    _gap(),

    _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(color: _C.emberSoft, borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.place_outlined, color: _C.grenadier, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text('Localisation', style: GoogleFonts.bricolageGrotesque(
            fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink))),
      ]),
      _gap(16),
      _lbl('TÉLÉPHONE'),
      _inp(_phoneC, h: '+216 XX XXX XXX', kb: TextInputType.phone),
      _gap(12),
      _lbl('ADRESSE'),
      _inp(_addrC, h: 'Rue, numéro…'),
      _gap(12),
      _lbl('VILLE'),
      _inp(_cityC, h: 'Tunis, Sousse, Sfax…'),
    ])),
    _gap(32),
  ]);

  /* ─────── PAGE 2 · HOURS ─────── */
  Widget _p2() => _page([
    ..._days.map((d) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _card(Row(children: [
        /* day name */
        SizedBox(width: 74, child: Text(d.label,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600,
            color: d.closed ? _C.ink40 : _C.ink))),
        /* times or closed */
        Expanded(child: d.closed
          ? Text('Fermé', style: GoogleFonts.spaceMono(
              fontSize: 12, color: _C.grenadier, fontWeight: FontWeight.w700))
          : Row(children: [
              _time(d.open,  (v) => setState(() => d.open = v)),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text('→', style: TextStyle(color: _C.ink40, fontSize: 13))),
              _time(d.close, (v) => setState(() => d.close = v)),
            ])),
        /* switch */
        SizedBox(width: 46, height: 28, child: FittedBox(
          child: Switch.adaptive(
            value: !d.closed,
            onChanged: (v) => setState(() => d.closed = !v),
            activeTrackColor: _C.grenadier,
          ),
        )),
      ]),
      p: const EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
    )),
    _gap(24),
  ]);

  Widget _time(String v, ValueChanged<String> cb) {
    final ts = List.generate(48,
      (i) => '${(i~/2).toString().padLeft(2,'0')}:${i%2==0?'00':'30'}');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: _C.bg, borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _C.line)),
      child: DropdownButton<String>(
        value: ts.contains(v) ? v : ts.first,
        underline: const SizedBox(), isDense: true,
        style: GoogleFonts.spaceMono(fontSize: 12, color: _C.ink, fontWeight: FontWeight.w700),
        icon: Icon(Icons.unfold_more, size: 14, color: _C.ink40),
        items: ts.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
        onChanged: (n) { if (n != null) cb(n); },
      ),
    );
  }

  /* ─────── PAGE 3 · LOYALTY ─────── */
  Widget _p3() => _page([
    ...[
      ('points',  'Points',  'Accumuler des points\nà chaque achat',       Icons.star_rounded),
      ('stamps',  'Tampons', 'Tamponner une carte\njusqu\'à la récompense', Icons.grid_view_rounded),
      ('cashback','Cashback','Recevoir un %\nsur chaque achat',            Icons.account_balance_wallet_rounded),
    ].map((o) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: () => setState(() => _lType = o.$1),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250), curve: Curves.easeOut,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _lType == o.$1 ? _C.white : _C.bg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _lType == o.$1 ? _C.grenadier : _C.line,
              width: _lType == o.$1 ? 1.5 : 1),
            boxShadow: _lType == o.$1
              ? [BoxShadow(color: _C.grenadier.withValues(alpha: .10), blurRadius: 20, offset: const Offset(0,4))]
              : [],
          ),
          child: Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: _lType == o.$1 ? _C.grenadier : _C.emberSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(o.$4, color: _lType == o.$1 ? _C.white : _C.grenadier, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.$2, style: GoogleFonts.bricolageGrotesque(
                  fontSize: 16, fontWeight: FontWeight.w700, color: _C.ink)),
              Text(o.$3, style: GoogleFonts.inter(fontSize: 12, color: _C.ink60, height: 1.35)),
            ])),
            if (_lType == o.$1) Container(
              width: 22, height: 22,
              decoration: BoxDecoration(color: _C.grenadier, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
            ),
          ]),
        ),
      ),
    )),

    _gap(8),
    AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeOut,
      child: _loyaltyConf()),
    _gap(32),
  ]);

  Widget _loyaltyConf() {
    if (_lType == 'points') return _card(Column(
      key: const ValueKey('pts'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('TAUX DE CONVERSION'),
        _gap(8),
        Row(children: [
          _numBox(_amtC), const SizedBox(width: 8),
          Text('DT  =', style: GoogleFonts.inter(fontSize: 15, color: _C.ink60, fontWeight: FontWeight.w500)),
          const SizedBox(width: 8), _numBox(_ptC), const SizedBox(width: 8),
          Text('pts', style: GoogleFonts.spaceMono(fontSize: 13, color: _C.grenadier, fontWeight: FontWeight.w700)),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE'),
        _gap(4),
        _inp(_rnC, h: 'Café gratuit, Coupe offerte…'),
        _gap(12),
        Row(children: [
          _numBox(_rtC, w: 80), const SizedBox(width: 10),
          Expanded(child: Text('points nécessaires', style: GoogleFonts.inter(fontSize: 14, color: _C.ink60))),
        ]),
      ]),
    );

    if (_lType == 'stamps') return _card(Column(
      key: const ValueKey('stp'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('NOMBRE DE TAMPONS'),
        _gap(8),
        Row(children: [
          _numBox(_stC), const SizedBox(width: 10),
          Expanded(child: Text('tampons = récompense', style: GoogleFonts.inter(fontSize: 14, color: _C.ink60))),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE OBTENUE'),
        _gap(4),
        _inp(_srC, h: '1 Café offert'),
      ]),
    );

    return _card(Column(
      key: const ValueKey('cb'),
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        _lbl('TAUX DE CASHBACK'),
        _gap(8),
        Row(children: [
          _numBox(_cbC), const SizedBox(width: 10),
          Text('% reversé sur chaque achat', style: GoogleFonts.inter(fontSize: 14, color: _C.ink60)),
        ]),
        _gap(20),
        _lbl('RÉCOMPENSE'),
        _gap(4),
        _inp(_rnC, h: 'Bon de réduction, Remise…'),
      ]),
    );
  }

  /* ─────── PAGE 4 · LAUNCH ─────── */
  Widget _p4() => _page([
    /* dark hero */
    Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [_C.ink, _C.ink2],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: _C.ink.withValues(alpha: .28), blurRadius: 30, offset: const Offset(0,10))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: _C.grenadier, borderRadius: BorderRadius.circular(11),
            boxShadow: [BoxShadow(color: _C.grenadier.withValues(alpha: .40), blurRadius: 14)]),
          child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 20),
        ),
        const SizedBox(height: 18),
        Text('Prêt pour le\ndécollage.',
          style: GoogleFonts.bricolageGrotesque(fontSize: 24, fontWeight: FontWeight.w800,
            color: _C.white, height: 1.1, letterSpacing: -.5)),
        const SizedBox(height: 10),
        Text('Votre QR Code sera généré automatiquement.\nVos clients pourront scanner et rejoindre votre programme en 5 secondes.',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFE8C9BD), height: 1.5)),
      ]),
    ),
    _gap(20),

    /* toggles */
    _card(Row(children: [
      Container(width: 38, height: 38,
        decoration: BoxDecoration(color: _C.emberSoft, borderRadius: BorderRadius.circular(10)),
        child: Icon(Icons.notifications_active_outlined, color: _C.grenadier, size: 18)),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Alertes clients', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink)),
        Text('Quand un client scanne votre QR', style: GoogleFonts.inter(fontSize: 12, color: _C.ink60)),
      ])),
      SizedBox(width: 46, height: 28, child: FittedBox(child: Switch.adaptive(
        value: _nClient, onChanged: (v) => setState(() => _nClient = v), activeTrackColor: _C.grenadier))),
    ]), p: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
    _gap(10),

    _card(Row(children: [
      Container(width: 38, height: 38,
        decoration: BoxDecoration(color: _C.emberSoft, borderRadius: BorderRadius.circular(10)),
        child: Icon(Icons.local_offer_outlined, color: _C.grenadier, size: 18)),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Offres automatiques', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: _C.ink)),
        Text('Promos envoyées à vos fidèles', style: GoogleFonts.inter(fontSize: 12, color: _C.ink60)),
      ])),
      SizedBox(width: 46, height: 28, child: FittedBox(child: Switch.adaptive(
        value: _nPromo, onChanged: (v) => setState(() => _nPromo = v), activeTrackColor: _C.grenadier))),
    ]), p: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
    _gap(24),

    /* summary banner */
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.emberSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _C.ember.withValues(alpha: .25))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(Icons.auto_awesome_rounded, color: _C.grenadier, size: 20),
        const SizedBox(width: 12),
        Expanded(child: RichText(text: TextSpan(
          style: GoogleFonts.inter(fontSize: 13, color: _C.grenadierDeep, height: 1.45),
          children: const [
            TextSpan(text: 'En cliquant sur '),
            TextSpan(text: '« Lancer ma vitrine »', style: TextStyle(fontWeight: FontWeight.w700)),
            TextSpan(text: ', votre QR Code unique sera généré et votre programme de fidélité sera activé instantanément.'),
          ],
        ))),
      ]),
    ),
    _gap(32),
  ]);
}

class _DashedCirclePainter extends CustomPainter {
  final Color color;
  _DashedCirclePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final double dashWidth = 5.0;
    final double dashSpace = 4.0;
    final double circumference = size.width * 3.141592653589793;
    final int dashCount = (circumference / (dashWidth + dashSpace)).floor();

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    for (int i = 0; i < dashCount; i++) {
      final double startAngle = (i * (dashWidth + dashSpace)) / radius;
      final double sweepAngle = dashWidth / radius;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
