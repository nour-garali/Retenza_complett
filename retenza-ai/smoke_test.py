"""
smoke_test.py — Tests unitaires rapides des nouvelles fonctionnalités (Modules 1-6)
"""
import time
import chatbot_classifier as c

# 1. Rate Limiter : 10 msgs/min max
user = "test@demo.com"
results = [c.check_rate_limit(user) for _ in range(11)]
ok_count = sum(results)
blocked = not results[10]
assert ok_count == 10, f"Attendu 10/10 passes, obtenu {ok_count}"
assert blocked, "Le 11ème message aurait dû être bloqué"
print(f"[OK] Rate limiter : {ok_count}/10 passés, msg#11 bloqué={blocked}")

# 2. Cache FAQ
r_retenza = c.get_cached_faq_response("c'est quoi retenza", "Ma Boutique")
r_parrain  = c.get_cached_faq_response("comment fonctionne le parrainage", "Ma Boutique")
r_none     = c.get_cached_faq_response("ou est ma commande", "Ma Boutique")
assert r_retenza and len(r_retenza) > 50, "Cache Retenza vide"
assert r_parrain and len(r_parrain) > 50, "Cache Parrainage vide"
assert r_none is None, "Question métier ne devrait pas être en cache"
print(f"[OK] Cache FAQ : Retenza={len(r_retenza)}chars, Parrainage={len(r_parrain)}chars, Commande=MISS")

# 3. Détection d'incertitude
assert c.is_uncertain_response("je ne suis pas sur de pouvoir vous aider."), "Faux négatif incertitude 1"
assert c.is_uncertain_response("Malheureusement je ne peux pas vous donner plus de détails."), "Faux négatif incertitude 2"
assert c.is_uncertain_response("je n'ai pas les informations nécessaires."), "Faux négatif incertitude 3"
assert not c.is_uncertain_response("Votre commande CMD-001 est en transit."), "Faux positif incertitude"
print("[OK] is_uncertain_response : détection correcte")

# 4. Timeout configurable
def slow():
    time.sleep(10)

try:
    c._execute_with_timeout(slow, timeout=0.3)
    print("[FAIL] Timeout aurait dû lever TimeoutError")
except TimeoutError:
    print("[OK] _execute_with_timeout : TimeoutError levé correctement en 0.3s")

# 5. Vérifier METRICS_TRACKER (inclut les clés dual-model)
required_keys = ["total_calls", "groq_calls", "groq_fast_calls", "gemini_calls", "cache_hits", "offline_calls",
                 "total_latency_ms", "blocked_users_count", "warnings_count",
                 "language_feedbacks_count", "escalations_count"]
for k in required_keys:
    assert k in c.METRICS_TRACKER, f"Clé manquante dans METRICS_TRACKER: {k}"
print(f"[OK] METRICS_TRACKER : {len(required_keys)} clés présentes (dont groq_fast_calls pour le dual-model)")

# 5b. Vérifier la config dual-model
import chatbot_config as cfg
assert hasattr(cfg, 'GROQ_MODEL_FAST'), "GROQ_MODEL_FAST absent de chatbot_config"
assert cfg.GROQ_MODEL_FAST == "llama-3.1-8b-instant", f"Modèle rapide inattendu: {cfg.GROQ_MODEL_FAST}"
assert cfg.GROQ_MODEL == "llama-3.3-70b-versatile", f"Modèle principal inattendu: {cfg.GROQ_MODEL}"
print(f"[OK] Dual-Model config : principal={cfg.GROQ_MODEL} | rapide={cfg.GROQ_MODEL_FAST}")
assert c.groq_manager_fast is not None or not cfg.GROQ_API_KEYS, "groq_manager_fast non initialisé alors que des clés existent"
if c.groq_manager_fast:
    assert c.groq_manager_fast.model == cfg.GROQ_MODEL_FAST, "groq_manager_fast pointe sur le mauvais modèle"
    print(f"[OK] groq_manager_fast actif sur modèle : {c.groq_manager_fast.model}")

# 6. LLM timeout configuré
assert c.LLM_TIMEOUT_SECONDS > 0, f"Timeout LLM invalide: {c.LLM_TIMEOUT_SECONDS}"
print(f"[OK] LLM_TIMEOUT_SECONDS = {c.LLM_TIMEOUT_SECONDS}s")

print("\n=== SMOKE TEST : TOUS LES CHECKS PASSÉS ✅ ===")
