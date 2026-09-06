'use strict';

const Commerce = require('../models/Commerce');
const Purchase = require('../models/Purchase');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/merchant/billing
 *
 * Retourne les données de facturation à la performance pour le mois
 * calendaire en cours, basées sur les achats validés de ce commerce.
 *
 * NB: "revenueThisMonth" = CA total des achats validés du mois civil,
 * PAS le CA spécifiquement attribué aux relances IA (ce calcul est dans
 * le service Python). Le label côté frontend doit refléter cette nuance.
 */
exports.getBillingStats = asyncHandler(async (req, res) => {
  const commerceId = req.user.commerce;

  if (!commerceId) {
    return res.status(400).json({
      success: false,
      message: 'Aucun commerce associé à ce compte.',
    });
  }

  // ── Charger le commerce (pour commissionRate) ──────────────────────────
  const commerce = await Commerce.findById(commerceId).select('commissionRate merchant name');
  if (!commerce) {
    return res.status(404).json({ success: false, message: 'Commerce introuvable.' });
  }

  // Vérification que le commerçant connecté est bien propriétaire
  if (commerce.merchant.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorisé.' });
  }

  // ── Bornes du mois calendaire en cours ────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  // Premier jour du mois suivant = nextChargeDate (prélèvement mensuel)
  const nextChargeDate = startOfNextMonth.toISOString().split('T')[0]; // format YYYY-MM-DD

  // ── Calcul du CA du mois via Purchase.aggregate() ─────────────────────
  const [result] = await Purchase.aggregate([
    {
      $match: {
        commerce: commerce._id,
        status: 'validated',
        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      },
    },
    {
      $group: {
        _id: null,
        revenueThisMonth: { $sum: '$amount' },
        purchaseCount: { $sum: 1 },
      },
    },
  ]);

  const revenueThisMonth = result ? Math.round((result.revenueThisMonth ?? 0) * 100) / 100 : 0;
  const purchaseCount    = result ? result.purchaseCount : 0;
  const hasDataThisMonth = purchaseCount > 0;

  // Taux de commission — depuis le modèle Commerce (défaut 0.08 si non défini)
  const commissionRate = commerce.commissionRate ?? 0.08;

  // Commission = CA × taux, arrondi à 2 décimales
  const commissionThisMonth = Math.round(revenueThisMonth * commissionRate * 100) / 100;

  return res.json({
    success: true,
    data: {
      revenueThisMonth,
      commissionRate,
      commissionThisMonth,
      nextChargeDate,
      hasDataThisMonth,
      purchaseCount,
      // Contexte pour le frontend
      periodLabel: `${now.toLocaleString('fr-FR', { month: 'long' })} ${now.getFullYear()}`,
    },
  });
});
