import sys
import json
import os

# Garder une référence vers le VRAI stdout uniquement pour les messages SSE
_real_stdout = sys.stdout

# Rediriger TOUS les print() du projet Python vers stderr pour ne pas corrompre le flux SSE
sys.stdout = sys.stderr

import chatbot_config as config
import chatbot_classifier as classifier

# Force UTF-8 pour Windows
try:
    _real_stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass

def send_sse(data_dict):
    _real_stdout.write("data: " + json.dumps(data_dict) + "\n\n")
    _real_stdout.flush()

def main():
    try:
        raw_payload = sys.stdin.read()
        if not raw_payload or not raw_payload.strip():
            raw_payload = sys.argv[1] if len(sys.argv) > 1 else "{}"
        payload = json.loads(raw_payload)
    except Exception as e:
        sys.stdout.write("data: " + json.dumps({"type": "token", "content": f"Désolé, une erreur d'analyse est survenue : {str(e)}"}) + "\n\n")
        sys.stdout.write("data: " + json.dumps({"type": "done"}) + "\n\n")
        sys.stdout.flush()
        return

    user_message = payload.get("user_message", "").strip()
    email = payload.get("email", "guest@retenza.com")
    commerce_id = payload.get("commerce_id", "commerce_local_1")
    commerce_name = payload.get("commerce_name", "Boutique Tunis")
    client_name = payload.get("client_name", "Ghofrane")
    history = payload.get("history", [])

    if not user_message:
        send_sse({"type": "token", "content": "Bonjour ! Comment puis-je vous aider aujourd'hui ?"})
        send_sse({"type": "done"})
        return

    # 1. Vérification FAQ en cache (<10ms)
    cached_faq = classifier.get_cached_faq_response(user_message, commerce_name)
    if cached_faq:
        send_sse({"type": "token", "content": cached_faq})
        send_sse({"type": "done"})
        return

    # 2. Modération du message
    mod_result = classifier.classify_message(user_message)
    if mod_result and mod_result.get("is_inappropriate"):
        send_sse({
            "type": "moderation",
            "category": mod_result.get("category"),
            "severity": mod_result.get("severity"),
            "reason": mod_result.get("reason"),
            "is_inappropriate": True
        })

    # 3. Récupération du contexte MongoDB
    client_context = classifier.get_client_context_info(email, commerce_id)

    # 4. Formater les messages pour le LLM
    formatted_messages = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        formatted_messages.append({"role": role, "text": msg.get("content", "")})
    formatted_messages.append({"role": "user", "text": user_message})

    # 5. Formater le Prompt Système
    sav_instruction = classifier._SAV_INSTRUCTION if any(k in user_message.lower() for k in ["cassé", "problème", "déçu", "délai", "retard", "scandaleux"]) else ""
    
    system_prompt = config.CHATBOT_RESPONSE_PROMPT.format(
        client_name=client_name,
        client_email=email,
        commerce_name=commerce_name,
        intents_label="Requête client",
        format_instruction="",
        sav_instruction=sav_instruction,
        client_context=client_context
    )

    session_id = payload.get("session_id") or f"session_{email.lower().strip()}"
    full_bot_response = ""

    # 6. Streaming des tokens
    try:
        token_stream = classifier._llm_chat_stream(system_prompt, formatted_messages, temperature=0.7)
        for token in token_stream:
            if token:
                full_bot_response += token
                send_sse({"type": "token", "content": token})
    except Exception as e:
        err_msg = f"\n\n[Désolé, une erreur temporaire est survenue : {str(e)}]"
        full_bot_response += err_msg
        send_sse({"type": "token", "content": err_msg})

    # 7. Sauvegarde du message utilisateur et de la réponse bot dans MongoDB chatbot_conversations
    try:
        if user_message and session_id:
            from datetime import datetime
            from pymongo import MongoClient
            client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=1500)
            db = client[config.DB_NAME]
            now_iso = datetime.now().isoformat()

            user_doc = {"role": "user", "channel": "bot", "text": user_message, "timestamp": now_iso}
            bot_doc = {"role": "assistant", "channel": "bot", "text": full_bot_response, "timestamp": now_iso}

            db.chatbot_conversations.update_one(
                {"email": email.lower().strip(), "commerce_id": commerce_id, "session_id": session_id},
                {
                    "$push": {"messages": {"$each": [user_doc, bot_doc]}},
                    "$set": {"updated_at": now_iso},
                    "$setOnInsert": {
                        "created_at": now_iso,
                        "title": user_message[:40] if user_message else "Nouvelle conversation"
                    }
                },
                upsert=True
            )
    except Exception as save_err:
        pass

    send_sse({"type": "done"})

if __name__ == "__main__":
    main()
