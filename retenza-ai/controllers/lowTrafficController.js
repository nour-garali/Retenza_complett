const crypto = require('crypto');
const connectDB = require('../config/db');
const { sendEmail } = require('../utils/emailService');
const { sendPush } = require('../utils/pushService');

const DEFAULTS = { enabled: false, timezone: 'Africa/Tunis', purchase_source: 'transactions', analysis_window_days: 30, slot_duration_minutes: 60, threshold_percent: 45, minimum_history_days: 14, min_slot_transactions: 8, opening_hours: { start_hour: 9, end_hour: 18 }, max_detected_slots: 4, geo_radius_km: 5, offer: { type: 'percent', discount_percent: 15, bogo: { buy: 2, get: 1 }, promo_code_prefix: 'FLASH', validity_minutes: 120, lead_time_minutes: 30 }, audience: { active_recency_days: 365, max_sends_per_client: 1, frequency_window_days: 7 } };
const batchId = () => `LOW-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}-${crypto.randomBytes(3).toString('hex')}`;
const normalizeCommerceId = (id) => (!id || id === '__all__') ? 'commerce_local' : id;

const settingsFor = async (db, rawCommerceId) => {
  const commerceId = normalizeCommerceId(rawCommerceId);
  const dbSettings = await db.collection('heures_creuses_settings').findOne({ commerce_id: commerceId }) || {};
  return {
    ...DEFAULTS,
    ...dbSettings,
    opening_hours: {
      ...DEFAULTS.opening_hours,
      ...(dbSettings.opening_hours || {})
    },
    offer: {
      ...DEFAULTS.offer,
      ...(dbSettings.offer || {}),
      bogo: {
        ...DEFAULTS.offer.bogo,
        ...((dbSettings.offer || {}).bogo || {})
      }
    },
    audience: {
      ...DEFAULTS.audience,
      ...(dbSettings.audience || {})
    }
  };
};

function localParts(date, timezone) { const p = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(date); return { weekday: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.find(x => x.type === 'weekday').value), hour: Number(p.find(x => x.type === 'hour').value) }; }

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function calculateSnapshot(db, rawCommerceId, settings) {
  const commerceId = normalizeCommerceId(rawCommerceId);
  const since = new Date(Date.now() - settings.analysis_window_days * 86400000);
  const source = settings.purchase_source || 'all';

  const rawTxList = [];

  if (source === 'transactions' || source === 'all') {
    const txs = await db.collection('transactions').find({ commerce_id: commerceId }).toArray();
    txs.forEach(t => {
      const d = new Date(t.date_transaction || t.date || t.created_at);
      if (!Number.isNaN(d.getTime()) && d >= since) rawTxList.push(d);
    });
  }

  if (source === 'commandes' || source === 'all') {
    const cmds = await db.collection('commandes').find({ commerce_id: commerceId }).toArray();
    cmds.forEach(c => {
      const d = new Date(c.date_commande || c.date || c.created_at);
      if (!Number.isNaN(d.getTime()) && d >= since) rawTxList.push(d);
    });
  }

  const days = Math.min(settings.analysis_window_days, Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86400000)));
  const numWeeks = Math.max(1, Math.ceil(days / 7));

  const buckets = new Map();
  rawTxList.forEach(d => {
    const x = localParts(d, settings.timezone);
    const step = Math.max(1, (settings.slot_duration_minutes || 60) / 60);
    const start = Math.floor(x.hour / step) * step;
    const key = `${x.weekday}-${start}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  const slots = [];
  const open = settings.opening_hours || DEFAULTS.opening_hours;
  const startHour = Number(open.start_hour ?? 9);
  const endHour = Number(open.end_hour ?? 18);
  const step = Math.max(1, (settings.slot_duration_minutes || 60) / 60);

  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = startHour; hour < endHour; hour += step) {
      const totalOrders = buckets.get(`${weekday}-${hour}`) || 0;
      const averageOrders = Number((totalOrders / numWeeks).toFixed(2));
      slots.push({
        weekday,
        start_hour: hour,
        duration_minutes: settings.slot_duration_minutes || 60,
        total_orders: totalOrders,
        average_orders: averageOrders
      });
    }
  }

  const minOrders = Number(settings.min_slot_transactions ?? 5);
  const threshold = Number(settings.threshold_percent || 40);

  // Calcul de la moyenne par jour de la semaine (pour isoler les spécificités de chaque jour)
  for (let weekday = 0; weekday < 7; weekday++) {
    const daySlots = slots.filter(s => s.weekday === weekday && s.total_orders > 0);
    const dayAverage = daySlots.length > 0 ? daySlots.reduce((sum, s) => sum + s.average_orders, 0) / daySlots.length : 0;
    slots.filter(s => s.weekday === weekday).forEach(s => {
      s.day_average = Number(dayAverage.toFixed(2));
    });
  }

  const globalAverage = slots.length > 0 ? slots.reduce((s, x) => s + x.average_orders, 0) / slots.length : 0;

  slots.forEach(s => {
    s.global_average = Number(globalAverage.toFixed(2));
    const refAverage = s.day_average || globalAverage;
    s.delta_percent = refAverage ? Number((((s.average_orders - refAverage) / refAverage) * 100).toFixed(1)) : 0;
    
    // Un créneau doit avoir un volume minimum de transactions (>= minOrders) pour être éligible au classement
    const hasEnoughData = s.total_orders >= minOrders;
    s.is_low_traffic = hasEnoughData && days >= (settings.minimum_history_days || 14) && refAverage > 0 && s.delta_percent <= -threshold;
    s.is_high_traffic = hasEnoughData && refAverage > 0 && s.delta_percent >= threshold;
  });

  // Marquer les N créneaux prioritaires ciblés par les campagnes automatiques
  const targetSlots = slots
    .filter(s => s.is_low_traffic)
    .sort((a, b) => a.delta_percent - b.delta_percent || a.average_orders - b.average_orders)
    .slice(0, Math.max(1, Number(settings.max_detected_slots || 4)));

  slots.forEach(s => {
    s.is_target_slot = targetSlots.some(t => t.weekday === s.weekday && t.start_hour === s.start_hour);
  });

  const snapshot = {
    commerce_id: commerceId,
    calculated_at: new Date(),
    window: { from: since, to: new Date(), days: settings.analysis_window_days },
    source: source,
    total_transactions_analyzed: rawTxList.length,
    slots
  };

  await db.collection('heures_creuses_snapshots').updateOne({ commerce_id: commerceId }, { $set: snapshot }, { upsert: true });
  return snapshot;
}
const getSettings = async (req,res) => { try { const db=await connectDB(); const commerceId=normalizeCommerceId(req.query.commerce_id); res.json({ status:'success', data: await settingsFor(db, commerceId) }); } catch(e){res.status(500).json({error:e.message});} };
const saveSettings = async (req,res) => { try { const db=await connectDB(); const { commerce_id: rawCid, _id, ...raw }=req.body||{}; const commerce_id = normalizeCommerceId(rawCid); const existing = await db.collection('heures_creuses_settings').findOne({ commerce_id }) || {}; const data = { ...DEFAULTS, ...existing, ...raw, commerce_id, updated_at: new Date() }; data.opening_hours = { ...DEFAULTS.opening_hours, ...(existing.opening_hours || {}), ...(raw.opening_hours || {}) }; data.offer = { ...DEFAULTS.offer, ...(existing.offer || {}), ...(raw.offer || {}), bogo: { ...DEFAULTS.offer.bogo, ...((existing.offer || {}).bogo || {}), ...((raw.offer || {}).bogo || {}) } }; data.audience = { ...DEFAULTS.audience, ...(existing.audience || {}), ...(raw.audience || {}) }; delete data._id; await db.collection('heures_creuses_settings').updateOne({commerce_id},{ $set:data },{upsert:true}); const snapshot = await calculateSnapshot(db, commerce_id, data); res.json({status:'success',data,snapshot}); }catch(e){res.status(500).json({error:e.message});} };
const getSnapshot = async (req,res) => { try { const db=await connectDB(), id=req.query.commerce_id; let s=await db.collection('heures_creuses_snapshots').findOne({commerce_id:id}); if(!s) s=await calculateSnapshot(db,id,await settingsFor(db,id)); res.json({status:'success',data:s}); }catch(e){res.status(500).json({error:e.message});} };
const getHistory = async (req,res) => { try { const db=await connectDB(), id=req.query.commerce_id; const rows=await db.collection('campagnes_envoyees').aggregate([{ $match:{commerce_id:id,category:'low_traffic'}},{ $group:{_id:'$campaign_batch_id',sent_at:{$first:'$sent_at'},subject:{$first:'$subject'},channel:{$first:'$channel'},slot:{$first:'$low_traffic'},total_sent:{$sum:1},total_opened:{$sum:{$cond:['$opened',1,0]}}}},{ $sort:{sent_at:-1}}]).toArray(); res.json({status:'success',data:rows}); }catch(e){res.status(500).json({error:e.message});} };

async function runLowTrafficAutomation(commerceId, dbArg, options={}) {
  const db = dbArg || await connectDB(), settings = await settingsFor(db, commerceId);
  if (!settings.enabled && !options.force) return { status: 'skip', message: 'Désactivé' };
  let snapshot = await db.collection('heures_creuses_snapshots').findOne({ commerce_id: commerceId });
  if (!snapshot || Date.now() - new Date(snapshot.calculated_at).getTime() > 26 * 3600000) snapshot = await calculateSnapshot(db, commerceId, settings);
  const now = new Date(), target = new Date(now.getTime() + settings.offer.lead_time_minutes * 60000), p = localParts(target, settings.timezone);
  const hit = options.force ? snapshot.slots.find(s => s.is_low_traffic) : snapshot.slots.find(s => s.is_low_traffic && s.weekday === p.weekday && s.start_hour === p.hour);
  if (!hit) return { status: 'skip', message: 'Aucun créneau à déclencher' };
  const start = options.force ? new Date(now.getTime() + settings.offer.lead_time_minutes * 60000) : target;
  const duplicate = await db.collection('campagnes_envoyees').findOne({ 'low_traffic.start_at': start, category: 'low_traffic', commerce_id: commerceId });
  if (duplicate) return { status: 'skip', message: 'Déjà envoyé' };
  const cutoff = new Date(Date.now() - settings.audience.frequency_window_days * 86400000).toISOString();
  const blocked = new Set((await db.collection('campagnes_envoyees').find({ commerce_id: commerceId, category: 'low_traffic', sent_at: { $gte: cutoff } }, { projection: { client_email: 1 } }).toArray()).map(x => x.client_email.toLowerCase()));

  // --- Géolocalisation ---
  const commerceDoc = await db.collection('commerces').findOne({ commerce_id: commerceId }) || {};
  const commerceCoords = settings.commerce_location || commerceDoc.location?.coordinates || (commerceDoc.longitude && commerceDoc.latitude ? [commerceDoc.longitude, commerceDoc.latitude] : null);
  const geoRadiusKm = settings.geo_radius_km ?? DEFAULTS.geo_radius_km;

  const clientQuery = {
    commerce_id: commerceId,
    rgpd_opt_out_marketing: { $ne: true },
    rgpd_opt_out: { $ne: true },
    'marketing_preferences.low_traffic_opt_out': { $ne: true }
  };

  if (commerceCoords && Array.isArray(commerceCoords) && commerceCoords.length === 2) {
    clientQuery.$or = [
      { location: { $nearSphere: { $geometry: { type: 'Point', coordinates: commerceCoords }, $maxDistance: geoRadiusKm * 1000 } } },
      { location: { $exists: false } },
      { 'location.coordinates': { $exists: false } }
    ];
  }

  const clients = await db.collection('clients').find(clientQuery, { projection: { email: 1, nom: 1, fcm_token: 1, location: 1, latitude: 1, longitude: 1 } }).toArray();

  const batch = batchId(), end = new Date(start.getTime() + settings.offer.validity_minutes * 60000), docs = [];
  const startStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const promoCode = `${settings.offer.promo_code_prefix}${start.getHours()}`;

  // Formats de notification selon le type d'offre ('percent' ou 'bogo')
  const offerType = settings.offer?.type === 'bogo' ? 'bogo' : 'percent';
  const bogoBuy = Number(settings.offer?.bogo?.buy || 2);
  const bogoGet = Number(settings.offer?.bogo?.get || 1);
  const discountPct = Number(settings.offer?.discount_percent || 15);

  let pushTitle, pushBody, emailSubject;

  if (offerType === 'bogo') {
    const bogoText = `${bogoBuy} acheté${bogoBuy > 1 ? 's' : ''} = ${bogoGet} offert${bogoGet > 1 ? 's' : ''}`;
    pushTitle = `⚡ Offre Flash : ${bogoText} !`;
    pushBody = `De ${startStr} à ${endStr}, profitez de ${bogoText} avec le code ${promoCode}.`;
    emailSubject = `Offre flash - ${bogoText} valable aujourd’hui`;
  } else {
    pushTitle = `⚡ Offre Flash : -${discountPct}% !`;
    pushBody = `De ${startStr} à ${endStr}, profitez de -${discountPct}% avec le code ${promoCode}.`;
    emailSubject = `Offre flash -${discountPct}% valable aujourd’hui`;
  }

  for (const c of clients) {
    if (!c.email || blocked.has(c.email.toLowerCase())) continue;

    // Filtre complémentaire Haversine si le client a des coordonnées explicites
    if (commerceCoords) {
      const clientCoords = c.location?.coordinates || (c.longitude && c.latitude ? [c.longitude, c.latitude] : null);
      if (clientCoords) {
        const distKm = haversineDistanceKm(commerceCoords[1], commerceCoords[0], clientCoords[1], clientCoords[0]);
        if (distKm > geoRadiusKm) continue;
      }
    }

    const emailBody = offerType === 'bogo'
      ? `Bonjour ${c.nom || ''},\n\nProfitez de l'offre "${bogoBuy} acheté${bogoBuy > 1 ? 's' : ''} = ${bogoGet} offert${bogoGet > 1 ? 's' : ''}" de ${startStr} à ${endStr} avec le code ${promoCode}.\n\nÀ bientôt !`
      : `Bonjour ${c.nom || ''},\n\nProfitez de -${discountPct}% de ${startStr} à ${endStr} avec le code ${promoCode}.\n\nÀ bientôt !`;

    const tracking_id = crypto.randomBytes(16).toString('hex');
    let result;
    let channel = 'fcm';

    if (c.fcm_token) {
      // 1. Canal principal FCM (Push)
      try {
        result = await sendPush({
          token: c.fcm_token,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'low_traffic_flash',
            offer_type: offerType,
            discount_percent: String(discountPct),
            bogo_buy: String(bogoBuy),
            bogo_get: String(bogoGet),
            promo_code: promoCode,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            commerce_id: commerceId
          }
        });
      } catch (err) {
        result = { status: 'failed', error: err.message };
      }
    } else {
      // 2. Fallback Email si le token FCM est absent
      channel = 'email';
      try {
        result = await sendEmail({ to: c.email, subject: emailSubject, text: emailBody, trackingId: tracking_id });
      } catch {
        result = { status: 'failed' };
      }
    }

    docs.push({
      commerce_id: commerceId,
      client_email: c.email.toLowerCase(),
      client_nom: c.nom || c.email,
      subject: channel === 'fcm' ? pushTitle : emailSubject,
      body: channel === 'fcm' ? pushBody : emailBody,
      sent_at: new Date().toISOString(),
      status: result.status,
      channel,
      tracking_id,
      campaign_batch_id: batch,
      opened: false,
      open_count: 0,
      category: 'low_traffic',
      low_traffic: {
        weekday: hit.weekday,
        start_at: start,
        end_at: end,
        offer_type: offerType,
        discount_percent: discountPct,
        bogo: { buy: bogoBuy, get: bogoGet }
      }
    });
  }
  if (docs.length) await db.collection('campagnes_envoyees').insertMany(docs);
  return { status: 'success', sent: docs.length, batch };
}

const trigger = async(req,res)=>{try{res.json(await runLowTrafficAutomation(req.body.commerce_id, null, {force:Boolean(req.body.force)}));}catch(e){res.status(500).json({error:e.message});}};
module.exports={DEFAULTS,getSettings,saveSettings,getSnapshot,getHistory,runLowTrafficAutomation,trigger,calculateSnapshot};

