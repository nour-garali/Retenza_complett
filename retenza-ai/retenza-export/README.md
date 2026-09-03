# Export MongoDB — Retenza AI

> **Base** : `retenza_ai` | **Serveur local** : `mongodb://localhost:27017`  
> **Collections** : 29 | **Total documents** : 40 283  
> **Date d'export** : 2026-08-14T23:34:15.072Z

---

## ⚠️ Instructions d'import dans MongoDB Atlas

### Commande de restauration complète

```bash
mongorestore \
  --uri="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/" \
  --db=retenza_ai \
  --drop \
  ./retenza-export/retenza_ai
```

> **Remplace** `<USER>`, `<PASSWORD>`, `<CLUSTER>` par tes informations Atlas.  
> L'option `--drop` vide les collections avant import (recommandé pour un import propre).  
> Retire `--drop` si tu veux fusionner avec des données existantes.

---

## 📦 Collections et structure

### `ProductAssociations` — 6 documents

**Champs principaux** : `_id`, `produitA`, `commerce_id`, `produitB`, `confiance`, `dateCalcul`, `lift`, `support`, `support_total`

### `analyses_ia` — 438 documents

**Champs principaux** : `_id`, `client_id`, `recency`, `frequency`, `monetary`, `monetary_total`, `freq_recente`, `freq_historique`, `delta_frequence`, `baisse_frequence_detectee`, `date_calcul_delta`, `recency_score`, `frequency_score`, `monetary_score`, `score_global_sa`, `segment_gmm`, `probability_gmm`, `probabilities_gmm`, `churn_score`, `churn_risk_label`, `nom`, `email`, `client_db_id`, `date_naissance`, `influence_score`, `referral_code`, `commerce_id`, `date_analyse`, `fraud_block_reason`, `is_fraud_blocked`, `trust_score`, `trust_score_updated_at`, `score_f`, `score_m`, `score_r`

### `audit_logs` — 223 documents

**Champs principaux** : `_id`, `occurred_at`, `actor`, `action`, `target`, `ip`, `user_agent`, `metadata`, `previous_hash`, `entry_hash`

### `avis_clients` — 14 documents

**Champs principaux** : `_id`, `commerce_id`, `client_email`, `client_status`, `review_text`, `source`, `client_history`, `history_source`, `result`, `model_used`, `duration_ms`, `created_at`

### `campagnes_envoyees` — 9 059 documents

**Champs principaux** : `_id`, `commerce_id`, `client_email`, `client_nom`, `segment`, `churn_score`, `churn_risk_label`, `subject`, `body`, `sent_at`, `status`, `category`

### `chatbot_conversations` — 18 documents

**Champs principaux** : `_id`, `session_id`, `commerce_id`, `email`, `messages`, `updated_at`

### `chatbot_language_feedbacks` — 6 documents

**Champs principaux** : `_id`, `timestamp`, `email`, `commerce_id`, `session_id`, `message_idx`, `reason`

### `chatbot_message_feedbacks` — 13 documents

**Champs principaux** : `_id`, `timestamp`, `email`, `commerce_id`, `session_id`, `message_idx`, `feedback`, `text`

### `chatbot_status` — 4 documents

**Champs principaux** : `_id`, `email`, `nom`, `commerce_id`, `warnings`, `is_blocked`, `blocked_at`, `block_reason`, `warnings_history`

### `clients` — 446 documents

**Champs principaux** : `_id`, `id`, `commerce_id`, `nom`, `email`, `telephone`, `date_naissance`, `created_at`, `archetype_real`, `device_id_creation`, `ip_creation_compte`, `is_fraud_blocked`, `trust_score`, `fraud_block_reason`, `trust_score_updated_at`

### `commandes` — 195 documents

**Champs principaux** : `_id`, `commerce_id`, `client_email`, `numero_commande`, `statut`, `date_commande`, `date_expedition`, `date_livraison_estimee`, `date_livraison_reelle`, `numero_suivi`, `transporteur`, `produits`, `montant_total`, `adresse_livraison`

### `commerces` — 3 documents

**Champs principaux** : `_id`, `commerce_id`, `brand_id`, `created_at`, `name`, `status`, `updated_at`, `nom`

### `commerces_settings` — 4 documents

**Champs principaux** : `_id`, `commerce_id`, `cooldown_days`, `updated_at`, `brand_id`, `smart_automation_enabled`, `accountant_email`, `automation_rules`, `cooldown_reset_at`, `monthly_export_enabled`, `send_hour_end`, `send_hour_start`, `send_hours_enabled`, `absence_heure_limite`, `absence_multiplier`, `absence_reduction`, `absence_template`, `cross_sell_auto_recommend`, `cross_sell_min_confidence`, `fraud_max_basket_multiplier`, `fraud_max_daily_purchases`, `marketing_costs`, `shop_anniversary_date`, `shop_anniversary_discount_percent`, `shop_anniversary_mode`, `shop_anniversary_promo_code`, `daily_run_hour`

### `heures_creuses_settings` — 3 documents

**Champs principaux** : `_id`, `commerce_id`, `analysis_window_days`, `audience`, `enabled`, `max_detected_slots`, `minimum_history_days`, `offer`, `opening_hours`, `purchase_source`, `slot_duration_minutes`, `threshold_percent`, `timezone`, `updated_at`, `geo_radius_km`, `min_slot_transactions`

### `heures_creuses_snapshots` — 3 documents

**Champs principaux** : `_id`, `commerce_id`, `calculated_at`, `slots`, `source`, `window`, `total_transactions_analyzed`

### `job_runs` — 21 146 documents

**Champs principaux** : `_id`, `job_name`, `started_at`, `status`, `finished_at`

### `kpis_boutiques` — 2 documents

**Champs principaux** : `_id`, `commerce_id`, `clients_actifs_30j`, `clients_revenus_30j`, `date_calcul`, `taux_retour_30j`

### `login_attempts` — 0 documents

*(collection vide)*

### `mfa_challenges` — 19 documents

**Champs principaux** : `_id`, `token_hash`, `user_id`, `expires_at`

### `mfa_pending` — 3 documents

**Champs principaux** : `_id`, `user_id`, `expires_at`, `secret`

### `parrainages` — 3 documents

**Champs principaux** : `_id`, `commerce_id`, `parrain_email`, `parrain_nom`, `filleul_email`, `filleul_nom`, `status`, `date_parrainage`, `date_completion`, `amount_generated`, `referral_code`

### `points_fidelite` — 448 documents

**Champs principaux** : `_id`, `client_email`, `commerce_id`, `client_nom`, `date_creation`, `derniere_maj`, `palier_fid10_notifie`, `palier_fid20_notifie`, `palier_fidvip_notifie`, `points_cumules`, `points_disponibles`, `points_utilises`

### `points_transactions` — 1 081 documents

**Champs principaux** : `_id`, `commerce_id`, `client_email`, `client_nom`, `type`, `points`, `montant_transaction`, `solde_avant`, `solde_apres`, `date`, `description`

### `scheduler_status` — 1 documents

**Champs principaux** : `_id`, `last_run`

### `sessions` — 1 documents

**Champs principaux** : `_id`, `token_hash`, `user_id`, `created_at`, `expires_at`, `last_seen_at`, `ip`, `user_agent`

### `support_tickets` — 12 documents

**Champs principaux** : `_id`, `commerce_id`, `commerce_name`, `created_at`, `email`, `messages_count`, `reason`, `session_id`, `status`, `summary`, `updated_at`, `last_message_at`, `unread_by_admin`, `unread_count`, `admin_last_read_at`

### `system_health` — 2 documents

**Champs principaux** : `_id`, `service_name`, `checked_at`, `status`

### `transactions` — 7 129 documents

**Champs principaux** : `_id`, `id`, `commerce_id`, `client_id`, `date_transaction`, `montant`

### `users` — 1 documents

**Champs principaux** : `_id`, `email`, `commerce_ids`, `created_at`, `is_active`, `password_hash`, `role`, `updated_at`, `mfa_enabled`, `mfa_recovery_codes_hashes`, `mfa_secret_encrypted`, `mfa_verified_at`, `last_login_at`

---

## 🔗 Relations logiques entre collections

| Champ source | → | Champ cible | Description |
|---|---|---|---|
| `transactions.client_id` | → | `clients.id` | Liaison achat ↔ client |
| `transactions.commerce_id` | → | `commerces.commerce_id` | Liaison achat ↔ commerce |
| `clients.commerce_id` | → | `commerces.commerce_id` | Client appartient à un commerce |
| `analyses_ia.client_id` | → | `clients.email` | Analyse RFM/GMM d'un client |
| `analyses_ia.commerce_id` | → | `commerces.commerce_id` | Analyse appartient à un commerce |
| `campagnes_envoyees.client_email` | → | `clients.email` | Email envoyé à un client |
| `campagnes_envoyees.commerce_id` | → | `commerces.commerce_id` | Campagne d'un commerce |
| `points_fidelite.client_email` | → | `clients.email` | Points de fidélité d'un client |
| `points_transactions.client_email` | → | `clients.email` | Historique points d'un client |
| `avis_clients.client_email` | → | `clients.email` | Avis lié à un client |
| `avis_clients.commerce_id` | → | `commerces.commerce_id` | Avis appartient à un commerce |
| `chatbot_conversations.commerce_id` | → | `commerces.commerce_id` | Session chatbot d'un commerce |
| `chatbot_conversations.email` | → | `clients.email` | Session chatbot d'un client |
| `support_tickets.commerce_id` | → | `commerces.commerce_id` | Ticket d'un commerce |
| `support_tickets.email` | → | `clients.email` | Ticket d'un client |
| `commerces_settings.commerce_id` | → | `commerces.commerce_id` | Paramètres d'un commerce |
| `heures_creuses_settings.commerce_id` | → | `commerces.commerce_id` | Config heures creuses d'un commerce |
| `heures_creuses_snapshots.commerce_id` | → | `commerces.commerce_id` | Snapshot heures creuses |
| `ProductAssociations.commerce_id` | → | `commerces.commerce_id` | Règles market basket analysis |
| `parrainages.commerce_id` | → | `commerces.commerce_id` | Parrainage d'un commerce |
| `kpis_boutiques.commerce_id` | → | `commerces.commerce_id` | KPI d'un commerce |
| `mfa_challenges.user_id` | → | `users._id` | Challenge MFA d'un utilisateur |
| `mfa_pending.user_id` | → | `users._id` | Config MFA en attente |
| `sessions.user_id` | → | `users._id` | Session de connexion admin |
| `commandes.client_email` | → | `clients.email` | Commande liée à un client |
| `commandes.commerce_id` | → | `commerces.commerce_id` | Commande d'un commerce |

---

## 📋 Fichiers dans cet export

```
retenza-export/
├── retenza_ai/                  ← Données BSON (mongodump)
│   ├── clients.bson
│   ├── clients.metadata.json
│   ├── transactions.bson
│   ├── ... (1 fichier .bson + 1 .metadata.json par collection)
├── indexes.md                   ← Liste lisible de tous les index
├── README.md                    ← Ce fichier
└── db_info.json                 ← Données brutes JSON (structure + exemples)
```

---

## 🔧 Pré-requis pour l'import

1. **Installer MongoDB Database Tools** : https://www.mongodb.com/try/download/database-tools
2. **Avoir un cluster Atlas** avec une base `retenza_ai` (sera créée automatiquement)
3. **Autoriser l'IP** dans Atlas → Security → Network Access

---

## 📌 Variables d'environnement à reconfigurer dans `.env`

Après import, le collaborateur devra mettre à jour ces variables dans son `.env` :

```env
MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/
DB_NAME=retenza_ai
```
