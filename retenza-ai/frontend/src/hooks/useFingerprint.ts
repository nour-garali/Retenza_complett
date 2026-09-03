/**
 * useFingerprint.ts
 * ─────────────────
 * Hook React qui génère un identifiant d'appareil stable (visitorId)
 * via FingerprintJS open-source (@fingerprintjs/fingerprintjs).
 *
 * Usage :
 *   const { visitorId, fpLoading } = useFingerprint();
 *   // visitorId : string | null (null pendant le chargement ou en cas d'erreur)
 *   // fpLoading : boolean
 *
 * Ce hook :
 *   - Ne fait aucun appel réseau (FingerprintJS open-source fonctionne
 *     entièrement côté client, sans serveur Fingerprint Inc.)
 *   - Met le résultat en cache dans sessionStorage pour éviter de recalculer
 *     à chaque rendu.
 *   - Retourne null sans lever d'exception si l'API n'est pas disponible
 *     (navigateur sans JS, SSR, etc.).
 *
 * ⚠️  Ce visitorId est collecté brut uniquement — aucune logique de blocage
 *     ou de comparaison n'est implémentée à ce stade.
 */

import { useEffect, useState } from 'react';

const SESSION_KEY = 'retenza_fp_visitor_id';

export function useFingerprint() {
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [fpLoading, setFpLoading] = useState<boolean>(true);

    useEffect(() => {
        // Ne s'exécute que côté client
        if (typeof window === 'undefined') {
            setFpLoading(false);
            return;
        }

        // Cache sessionStorage : évite de recalculer à chaque montage du composant
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) {
            setVisitorId(cached);
            setFpLoading(false);
            return;
        }

        let cancelled = false;

        async function initFp() {
            try {
                const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                if (!cancelled) {
                    sessionStorage.setItem(SESSION_KEY, result.visitorId);
                    setVisitorId(result.visitorId);
                }
            } catch (err) {
                // FingerprintJS non disponible ou bloqué : on retourne null silencieusement
                console.warn('[Fingerprint] Impossible de générer le visitorId :', err);
            } finally {
                if (!cancelled) setFpLoading(false);
            }
        }

        initFp();

        return () => {
            cancelled = true;
        };
    }, []);

    return { visitorId, fpLoading };
}
