"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Save, Loader2 } from "lucide-react";

const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

export default function HeuresCreuses() {
  const [id, setId] = useState("commerce_local_1");
  const [settings, setSettings] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commerces, setCommerces] = useState<{ id: string; label: string }[]>([]);

  // Charger la liste des commerces, puis s'assurer qu'on sélectionne un commerce valide (commerce_local_1 en priorité)
  useEffect(() => {
    fetch("/api/commerces")
      .then((r) => r.json())
      .then((d) => {
        const list: { id: string; label: string }[] = Array.isArray(d) ? d : [];
        setCommerces(list);
        if (list.length > 0 && !list.some(c => c.id === id)) {
          const target = list.find(c => c.id === "commerce_local_1") || list[0];
          setId(target.id);
        }
      })
      .catch(() => setCommerces([]));
  }, []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const activeCommerceId = commerces.find(c => c.id === "commerce_local_1")?.id || (commerces.length > 0 ? commerces[0].id : "commerce_local_1");
      const targetId = id === "__all__" ? activeCommerceId : id;
      const r = await Promise.all([
        fetch(`/api/low-traffic/settings?commerce_id=${targetId}`, { cache: "no-store" }),
        fetch(`/api/low-traffic/snapshot?commerce_id=${targetId}`, { cache: "no-store" }),
        fetch(`/api/low-traffic/history?commerce_id=${targetId}`, { cache: "no-store" })
      ]);
      if (r.some(x => !x.ok)) throw Error("Le service Heures creuses est indisponible.");
      const [a, b, c] = await Promise.all(r.map(x => x.json()));
      setSettings(a.data);
      setSlots(b.data?.slots || []);
      setHistory(c.data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleSync = (e: any) => {
      const activeCommerceId = commerces.find(c => c.id === "commerce_local_1")?.id || "commerce_local_1";
      const targetId = id === "__all__" ? activeCommerceId : id;
      if (!e.detail?.commerce_id || e.detail.commerce_id === targetId) {
        load();
      }
    };
    window.addEventListener("ratenza_heures_creuses_updated", handleSync);
    window.addEventListener("focus", load);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("ratenza_heures_creuses_sync");
      bc.onmessage = (msg) => {
        const activeCommerceId = commerces.find(c => c.id === "commerce_local_1")?.id || "commerce_local_1";
        const targetId = id === "__all__" ? activeCommerceId : id;
        if (!msg.data?.commerce_id || msg.data.commerce_id === targetId) {
          load();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener("ratenza_heures_creuses_updated", handleSync);
      window.removeEventListener("focus", load);
      if (bc) bc.close();
    };
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const activeCommerceId = commerces.find(c => c.id === "commerce_local_1")?.id || "commerce_local_1";
      const targetId = id === "__all__" ? activeCommerceId : id;
      const r = await fetch('/api/low-traffic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, commerce_id: targetId })
      });
      if (!r.ok) throw Error("Impossible d'enregistrer les paramètres.");

      // Émission d'événements de synchronisation pour les autres composants/onglets
      window.dispatchEvent(new CustomEvent("ratenza_heures_creuses_updated", { detail: { commerce_id: targetId } }));
      try {
        const bc = new BroadcastChannel("ratenza_heures_creuses_sync");
        bc.postMessage({ commerce_id: targetId, timestamp: Date.now() });
        bc.close();
      } catch {}

      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex gap-3 text-[#7A6E68]"><Loader2 className="animate-spin" />Chargement…</div>;
  if (!settings) return <div className="p-8 text-rose-600">{error || "Configuration indisponible."}</div>;

  const startH = settings.opening_hours?.start_hour ?? 9;
  const endH = settings.opening_hours?.end_hour ?? 18;
  const hoursCount = Math.max(1, endH - startH);
  const hasData = slots.length > 0;
  const upd = (x: any) => setSettings({ ...settings, ...x });
  const hour = (key: string, v: number) => upd({ opening_hours: { ...(settings.opening_hours || {}), [key]: v } });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Heures Creuses & Relance Automatique"
        subtitle="Carte de chaleur d'affluence et offres dynamiques ciblées"
      >
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-sm"
        >
          <option value="__all__">Toutes les boutiques (Par défaut)</option>
          {commerces.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </PageHeader>

      {error && <p className="mx-8 mt-4 text-sm text-rose-600">{error}</p>}

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-[#EEE5DF] rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-[#1A1A1A] text-sm">Carte de chaleur — 30 derniers jours</h3>
          {!hasData ? (
            <div className="mt-5 rounded-xl border border-[#E8D9CF] bg-[#FDECEA] p-4 text-sm text-[#C93A25] font-semibold">
              Pas encore assez de données d’activité pour générer la carte de chaleur.
            </div>
          ) : (
            <>
              <div style={{ gridTemplateColumns: `52px repeat(${hoursCount}, minmax(0, 1fr))` }} className="grid gap-1 mt-6 text-[10px]">
                {["", ...Array.from({ length: hoursCount }, (_, i) => `${i + startH}h`)].map(x => (
                  <span key={x} className="font-bold text-[#7A6E68]">{x}</span>
                ))}
                {days.map((d, day) => (
                  <div key={d} className="contents">
                    <span className="font-bold text-[#7A6E68] flex items-center">{d}</span>
                    {Array.from({ length: hoursCount }, (_, i) => {
                      const h = i + startH;
                      const s = slots.find(x => x.weekday === day && x.start_hour === h);
                      const colorClass = s?.is_low_traffic ? 'bg-rose-400' : s?.is_high_traffic ? 'bg-emerald-400' : 'bg-[#FAF3EE] border border-[#EEE5DF]';
                      const refLabel = s?.day_average != null ? `Moy. du jour: ${s.day_average}` : `Moy. globale: ${s?.global_average}`;
                      const tooltip = s ? `${d} ${h}h : ${s.average_orders} cmd/h (${refLabel}, Écart: ${s.delta_percent > 0 ? '+' : ''}${s.delta_percent}%)` : `${d} ${h}h : Données insuffisantes`;
                      return <div key={i} title={tooltip} className={`h-8 rounded transition-all hover:scale-105 cursor-pointer shadow-xs ${colorClass}`} />;
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-[#7A6E68]">
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded bg-rose-400" />Rouge : heure creuse (-{settings.threshold_percent}%)</span>
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded bg-emerald-400" />Vert : forte affluence (+{settings.threshold_percent}%)</span>
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded bg-[#FAF3EE] border border-[#EEE5DF]" />Gris : activité normale</span>
              </div>
            </>
          )}
        </section>

        <aside className="bg-white border border-[#EEE5DF] rounded-2xl p-4 space-y-2 shadow-sm self-start">
          <div className="flex justify-between items-center border-b border-[#EEE5DF] pb-2">
            <b className="text-sm font-extrabold text-[#1A1A1A]">Configuration</b>
            <input type="checkbox" checked={settings.enabled} onChange={e => upd({ enabled: e.target.checked })} className="accent-[#E8462F] w-4 h-4 cursor-pointer" />
          </div>
          <label className="block text-[11px] font-bold text-[#7A6E68]">
            Seuil (%)
            <input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.threshold_percent} onChange={e => upd({ threshold_percent: +e.target.value })} />
          </label>
          <label className="block text-[11px] font-bold text-[#7A6E68]">
            Type d'offre
            <select className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" value={settings.offer?.type || 'percent'} onChange={e => upd({ offer: { ...(settings.offer || {}), type: e.target.value } })}>
              <option value="percent">Réduction en Pourcentage (-%)</option>
              <option value="bogo">2 achetés = 1 offert (BOGO)</option>
            </select>
          </label>
          {(settings.offer?.type === 'bogo') ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-[#7A6E68]">Acheté(s)<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.offer?.bogo?.buy ?? 2} onChange={e => upd({ offer: { ...(settings.offer || {}), bogo: { ...((settings.offer || {}).bogo || {}), buy: +e.target.value } } })} /></label>
              <label className="text-[11px] font-bold text-[#7A6E68]">Offert(s)<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.offer?.bogo?.get ?? 1} onChange={e => upd({ offer: { ...(settings.offer || {}), bogo: { ...((settings.offer || {}).bogo || {}), get: +e.target.value } } })} /></label>
            </div>
          ) : (
            <label className="block text-[11px] font-bold text-[#7A6E68]">Réduction (%)<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.offer?.discount_percent ?? 15} onChange={e => upd({ offer: { ...(settings.offer || {}), discount_percent: +e.target.value } })} /></label>
          )}
          <label className="block text-[11px] font-bold text-[#7A6E68]">
            Préfixe Code Promo
            <input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="text" value={settings.offer?.promo_code_prefix || 'FLASH'} onChange={e => upd({ offer: { ...(settings.offer || {}), promo_code_prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") } })} />
          </label>
          <label className="block text-[11px] font-bold text-[#7A6E68]">
            Durée de validité (Minutes)
            <input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.offer?.validity_minutes ?? 120} onChange={e => upd({ offer: { ...(settings.offer || {}), validity_minutes: +e.target.value } })} />
          </label>
          <label className="block text-[11px] font-bold text-[#7A6E68]">Rayon Géo (km)<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.geo_radius_km ?? 5} onChange={e => upd({ geo_radius_km: +e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-bold text-[#7A6E68]">Ouverture<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.opening_hours?.start_hour ?? 9} onChange={e => hour('start_hour', +e.target.value)} /></label>
            <label className="text-[11px] font-bold text-[#7A6E68]">Fermeture<input className="mt-0.5 w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] font-semibold outline-none focus:border-[#E8462F]" type="number" value={settings.opening_hours?.end_hour ?? 18} onChange={e => hour('end_hour', +e.target.value)} /></label>
          </div>
          <button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-[#E8462F] to-[#F06038] hover:from-[#C93A25] hover:to-[#E8462F] text-white rounded-xl py-2 font-bold text-xs shadow-sm flex justify-center gap-2 cursor-pointer transition-all mt-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Enregistrer
          </button>
        </aside>

        <section className="xl:col-span-3 bg-white border border-[#EEE5DF] rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-[#1A1A1A] text-sm mb-3">Historique des Campagnes Heures Creuses</h3>
          {history.length === 0 ? (
            <p className="text-xs font-semibold text-[#B0A49C]">Aucune campagne envoyée pour le moment.</p>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#FAF3EE] border-b border-[#EEE5DF] font-bold text-[#7A6E68] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Sujet de la campagne</th>
                  <th className="px-6 py-3 text-right">Total envois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE5DF]/60">
                {history.map(x => (
                  <tr key={x._id} className="hover:bg-[#FAF3EE]/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#1A1A1A]">{x.subject}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#E8462F]">{x.total_sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
