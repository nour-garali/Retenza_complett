# Index MongoDB — Base `retenza_ai`

> Généré automatiquement. Ne pas modifier manuellement.

| Collection | Nombre de documents | Index |
|---|---|---|
| **ProductAssociations** | 6 | `_id_` → `_id:1`<br>`**idx_association_unique** *(unique)*` → `commerce_id:1`, `produitA:1`, `produitB:1`<br>`idx_confiance_desc` → `commerce_id:1`, `confiance:-1`<br>`idx_date_calcul` → `dateCalcul:1` |
| **analyses_ia** | 438 | `_id_` → `_id:1` |
| **audit_logs** | 223 | `_id_` → `_id:1` |
| **avis_clients** | 14 | `_id_` → `_id:1` |
| **campagnes_envoyees** | 9 059 | `_id_` → `_id:1` |
| **chatbot_conversations** | 18 | `_id_` → `_id:1` |
| **chatbot_language_feedbacks** | 6 | `_id_` → `_id:1` |
| **chatbot_message_feedbacks** | 13 | `_id_` → `_id:1` |
| **chatbot_status** | 4 | `_id_` → `_id:1` |
| **clients** | 446 | `_id_` → `_id:1`<br>`commerce_id_1` → `commerce_id:1`<br>`**id_1** *(unique)*` → `id:1` |
| **commandes** | 195 | `_id_` → `_id:1` |
| **commerces** | 3 | `_id_` → `_id:1` |
| **commerces_settings** | 4 | `_id_` → `_id:1` |
| **heures_creuses_settings** | 3 | `_id_` → `_id:1` |
| **heures_creuses_snapshots** | 3 | `_id_` → `_id:1` |
| **job_runs** | 21 146 | `_id_` → `_id:1` |
| **kpis_boutiques** | 2 | `_id_` → `_id:1` |
| **login_attempts** | 0 | `_id_` → `_id:1`<br>`expires_at_1` → `expires_at:1` |
| **mfa_challenges** | 19 | `_id_` → `_id:1` |
| **mfa_pending** | 3 | `_id_` → `_id:1` |
| **parrainages** | 3 | `_id_` → `_id:1` |
| **points_fidelite** | 448 | `_id_` → `_id:1` |
| **points_transactions** | 1 081 | `_id_` → `_id:1` |
| **scheduler_status** | 1 | `_id_` → `_id:1` |
| **sessions** | 1 | `_id_` → `_id:1`<br>`expires_at_1` → `expires_at:1` |
| **support_tickets** | 12 | `_id_` → `_id:1` |
| **system_health** | 2 | `_id_` → `_id:1` |
| **transactions** | 7 129 | `_id_` → `_id:1`<br>`commerce_id_1` → `commerce_id:1`<br>`client_id_1` → `client_id:1` |
| **users** | 1 | `_id_` → `_id:1`<br>`**email_1** *(unique)*` → `email:1` |

---

## Détail par collection

### `ProductAssociations`

- **Documents** : 6
- **Champs** : `_id`, `produitA`, `commerce_id`, `produitB`, `confiance`, `dateCalcul`, `lift`, `support`, `support_total`
- **Index** :
  - `_id_` → `{"_id":1}`
  - `idx_association_unique` → `{"commerce_id":1,"produitA":1,"produitB":1}` *(unique)*
  - `idx_confiance_desc` → `{"commerce_id":1,"confiance":-1}`
  - `idx_date_calcul` → `{"dateCalcul":1}`

### `analyses_ia`

- **Documents** : 438
- **Champs** : `_id`, `client_id`, `recency`, `frequency`, `monetary`, `monetary_total`, `freq_recente`, `freq_historique`, `delta_frequence`, `baisse_frequence_detectee`, `date_calcul_delta`, `recency_score`, `frequency_score`, `monetary_score`, `score_global_sa`, `segment_gmm`, `probability_gmm`, `probabilities_gmm`, `churn_score`, `churn_risk_label`, `nom`, `email`, `client_db_id`, `date_naissance`, `influence_score`, `referral_code`, `commerce_id`, `date_analyse`, `fraud_block_reason`, `is_fraud_blocked`, `trust_score`, `trust_score_updated_at`, `score_f`, `score_m`, `score_r`
- **Index** :
  - `_id_` → `{"_id":1}`

### `audit_logs`

- **Documents** : 223
- **Champs** : `_id`, `occurred_at`, `actor`, `action`, `target`, `ip`, `user_agent`, `metadata`, `previous_hash`, `entry_hash`
- **Index** :
  - `_id_` → `{"_id":1}`

### `avis_clients`

- **Documents** : 14
- **Champs** : `_id`, `commerce_id`, `client_email`, `client_status`, `review_text`, `source`, `client_history`, `history_source`, `result`, `model_used`, `duration_ms`, `created_at`
- **Index** :
  - `_id_` → `{"_id":1}`

### `campagnes_envoyees`

- **Documents** : 9 059
- **Champs** : `_id`, `commerce_id`, `client_email`, `client_nom`, `segment`, `churn_score`, `churn_risk_label`, `subject`, `body`, `sent_at`, `status`, `category`
- **Index** :
  - `_id_` → `{"_id":1}`

### `chatbot_conversations`

- **Documents** : 18
- **Champs** : `_id`, `session_id`, `commerce_id`, `email`, `messages`, `updated_at`
- **Index** :
  - `_id_` → `{"_id":1}`

### `chatbot_language_feedbacks`

- **Documents** : 6
- **Champs** : `_id`, `timestamp`, `email`, `commerce_id`, `session_id`, `message_idx`, `reason`
- **Index** :
  - `_id_` → `{"_id":1}`

### `chatbot_message_feedbacks`

- **Documents** : 13
- **Champs** : `_id`, `timestamp`, `email`, `commerce_id`, `session_id`, `message_idx`, `feedback`, `text`
- **Index** :
  - `_id_` → `{"_id":1}`

### `chatbot_status`

- **Documents** : 4
- **Champs** : `_id`, `email`, `nom`, `commerce_id`, `warnings`, `is_blocked`, `blocked_at`, `block_reason`, `warnings_history`
- **Index** :
  - `_id_` → `{"_id":1}`

### `clients`

- **Documents** : 446
- **Champs** : `_id`, `id`, `commerce_id`, `nom`, `email`, `telephone`, `date_naissance`, `created_at`, `archetype_real`, `device_id_creation`, `ip_creation_compte`, `is_fraud_blocked`, `trust_score`, `fraud_block_reason`, `trust_score_updated_at`
- **Index** :
  - `_id_` → `{"_id":1}`
  - `commerce_id_1` → `{"commerce_id":1}`
  - `id_1` → `{"id":1}` *(unique)*

### `commandes`

- **Documents** : 195
- **Champs** : `_id`, `commerce_id`, `client_email`, `numero_commande`, `statut`, `date_commande`, `date_expedition`, `date_livraison_estimee`, `date_livraison_reelle`, `numero_suivi`, `transporteur`, `produits`, `montant_total`, `adresse_livraison`
- **Index** :
  - `_id_` → `{"_id":1}`

### `commerces`

- **Documents** : 3
- **Champs** : `_id`, `commerce_id`, `brand_id`, `created_at`, `name`, `status`, `updated_at`, `nom`
- **Index** :
  - `_id_` → `{"_id":1}`

### `commerces_settings`

- **Documents** : 4
- **Champs** : `_id`, `commerce_id`, `cooldown_days`, `updated_at`, `brand_id`, `smart_automation_enabled`, `accountant_email`, `automation_rules`, `cooldown_reset_at`, `monthly_export_enabled`, `send_hour_end`, `send_hour_start`, `send_hours_enabled`, `absence_heure_limite`, `absence_multiplier`, `absence_reduction`, `absence_template`, `cross_sell_auto_recommend`, `cross_sell_min_confidence`, `fraud_max_basket_multiplier`, `fraud_max_daily_purchases`, `marketing_costs`, `shop_anniversary_date`, `shop_anniversary_discount_percent`, `shop_anniversary_mode`, `shop_anniversary_promo_code`, `daily_run_hour`
- **Index** :
  - `_id_` → `{"_id":1}`

### `heures_creuses_settings`

- **Documents** : 3
- **Champs** : `_id`, `commerce_id`, `analysis_window_days`, `audience`, `enabled`, `max_detected_slots`, `minimum_history_days`, `offer`, `opening_hours`, `purchase_source`, `slot_duration_minutes`, `threshold_percent`, `timezone`, `updated_at`, `geo_radius_km`, `min_slot_transactions`
- **Index** :
  - `_id_` → `{"_id":1}`

### `heures_creuses_snapshots`

- **Documents** : 3
- **Champs** : `_id`, `commerce_id`, `calculated_at`, `slots`, `source`, `window`, `total_transactions_analyzed`
- **Index** :
  - `_id_` → `{"_id":1}`

### `job_runs`

- **Documents** : 21 146
- **Champs** : `_id`, `job_name`, `started_at`, `status`, `finished_at`
- **Index** :
  - `_id_` → `{"_id":1}`

### `kpis_boutiques`

- **Documents** : 2
- **Champs** : `_id`, `commerce_id`, `clients_actifs_30j`, `clients_revenus_30j`, `date_calcul`, `taux_retour_30j`
- **Index** :
  - `_id_` → `{"_id":1}`

### `login_attempts`

- **Documents** : 0
- **Champs** : ``
- **Index** :
  - `_id_` → `{"_id":1}`
  - `expires_at_1` → `{"expires_at":1}` *(TTL: 0s)*

### `mfa_challenges`

- **Documents** : 19
- **Champs** : `_id`, `token_hash`, `user_id`, `expires_at`
- **Index** :
  - `_id_` → `{"_id":1}`

### `mfa_pending`

- **Documents** : 3
- **Champs** : `_id`, `user_id`, `expires_at`, `secret`
- **Index** :
  - `_id_` → `{"_id":1}`

### `parrainages`

- **Documents** : 3
- **Champs** : `_id`, `commerce_id`, `parrain_email`, `parrain_nom`, `filleul_email`, `filleul_nom`, `status`, `date_parrainage`, `date_completion`, `amount_generated`, `referral_code`
- **Index** :
  - `_id_` → `{"_id":1}`

### `points_fidelite`

- **Documents** : 448
- **Champs** : `_id`, `client_email`, `commerce_id`, `client_nom`, `date_creation`, `derniere_maj`, `palier_fid10_notifie`, `palier_fid20_notifie`, `palier_fidvip_notifie`, `points_cumules`, `points_disponibles`, `points_utilises`
- **Index** :
  - `_id_` → `{"_id":1}`

### `points_transactions`

- **Documents** : 1 081
- **Champs** : `_id`, `commerce_id`, `client_email`, `client_nom`, `type`, `points`, `montant_transaction`, `solde_avant`, `solde_apres`, `date`, `description`
- **Index** :
  - `_id_` → `{"_id":1}`

### `scheduler_status`

- **Documents** : 1
- **Champs** : `_id`, `last_run`
- **Index** :
  - `_id_` → `{"_id":1}`

### `sessions`

- **Documents** : 1
- **Champs** : `_id`, `token_hash`, `user_id`, `created_at`, `expires_at`, `last_seen_at`, `ip`, `user_agent`
- **Index** :
  - `_id_` → `{"_id":1}`
  - `expires_at_1` → `{"expires_at":1}` *(TTL: 0s)*

### `support_tickets`

- **Documents** : 12
- **Champs** : `_id`, `commerce_id`, `commerce_name`, `created_at`, `email`, `messages_count`, `reason`, `session_id`, `status`, `summary`, `updated_at`, `last_message_at`, `unread_by_admin`, `unread_count`, `admin_last_read_at`
- **Index** :
  - `_id_` → `{"_id":1}`

### `system_health`

- **Documents** : 2
- **Champs** : `_id`, `service_name`, `checked_at`, `status`
- **Index** :
  - `_id_` → `{"_id":1}`

### `transactions`

- **Documents** : 7 129
- **Champs** : `_id`, `id`, `commerce_id`, `client_id`, `date_transaction`, `montant`
- **Index** :
  - `_id_` → `{"_id":1}`
  - `commerce_id_1` → `{"commerce_id":1}`
  - `client_id_1` → `{"client_id":1}`

### `users`

- **Documents** : 1
- **Champs** : `_id`, `email`, `commerce_ids`, `created_at`, `is_active`, `password_hash`, `role`, `updated_at`, `mfa_enabled`, `mfa_recovery_codes_hashes`, `mfa_secret_encrypted`, `mfa_verified_at`, `last_login_at`
- **Index** :
  - `_id_` → `{"_id":1}`
  - `email_1` → `{"email":1}` *(unique)*

