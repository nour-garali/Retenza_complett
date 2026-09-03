"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Loader2, ShieldAlert, Store, Activity } from "lucide-react";

export default function SuperAdmin() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch('/api/super-admin/overview')
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <PageHeader title="Supervision Plateforme" subtitle="Console Super Admin Retenza" />
        <div className="flex-1 p-8">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 font-bold text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Accès Super Admin refusé : {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader title="Supervision Plateforme" subtitle="Console d'Administration Globale Multi-Boutiques" />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {!data ? (
          <div className="flex items-center justify-center py-24 text-[#7A6E68] gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8462F]" />
            <span className="text-xs font-bold">Chargement des métriques système...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card title="Commerces Inscrits" value={data.commerces.total} icon={<Store className="w-4 h-4 text-[#E8462F]" />} />
              <Card title="Commerces Actifs" value={data.commerces.active} icon={<Activity className="w-4 h-4 text-emerald-600" />} />
              <Card title="Commerces Suspendus" value={data.commerces.suspended} icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} />
            </div>

            <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="font-extrabold text-[#1A1A1A] text-sm">Santé Système &amp; Microservices</h2>
              <pre className="overflow-auto rounded-xl bg-[#FAF3EE] border border-[#EEE5DF] p-5 text-xs text-[#1A1A1A] font-mono leading-relaxed">
                {JSON.stringify(data.health, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card(props: { title: string; value: any; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#EEE5DF] bg-white p-6 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#7A6E68] uppercase tracking-wider">{props.title}</span>
        {props.icon}
      </div>
      <p className="text-3xl font-black text-[#1A1A1A] mt-1">{props.value}</p>
    </div>
  );
}
