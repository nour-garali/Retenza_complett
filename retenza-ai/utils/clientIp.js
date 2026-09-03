'use strict';

/**
 * getClientIp(req)
 * ─────────────────
 * Retourne l'adresse IP réelle du client en tenant compte des proxys
 * inverses (load-balancer, Nginx, etc.) qui transmettent l'IP originale
 * via l'en-tête X-Forwarded-For.
 *
 * Règle de priorité :
 *   1. X-Forwarded-For (première IP de la liste = IP client d'origine)
 *   2. req.ip (défini par Express si app.set('trust proxy', ...) est actif)
 *   3. req.socket.remoteAddress (adresse TCP brute — toujours disponible)
 *
 * Retourne null si aucune valeur n'est disponible plutôt que de lever
 * une exception, conformément à la contrainte "null plutôt qu'échouer".
 *
 * Note de sécurité : X-Forwarded-For peut être falsifié par un client
 * malveillant. À ce stade (collecte brute uniquement), c'est acceptable.
 * En phase de scoring, préférer la valeur fournie par un reverse-proxy
 * de confiance (ex: Nginx) via un en-tête non-forwardable.
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getClientIp(req) {
    try {
        // X-Forwarded-For peut contenir plusieurs IP séparées par des virgules ;
        // la première est l'IP d'origine du client (les suivantes sont des proxys).
        const xForwardedFor = req.headers && req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            const firstIp = String(xForwardedFor).split(',')[0].trim();
            if (firstIp) return firstIp;
        }

        // req.ip est défini par Express lorsque trust proxy est activé.
        if (req.ip) return req.ip;

        // Fallback : adresse TCP brute.
        if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;

        return null;
    } catch {
        return null;
    }
}

module.exports = { getClientIp };
