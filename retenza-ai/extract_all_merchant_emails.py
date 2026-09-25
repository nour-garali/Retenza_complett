#!/usr/bin/env python3
"""
Script final pour extraire TOUS les emails potentiels liés aux commerçants
"""

import bson
import json
import re
from pathlib import Path

def is_valid_email(email):
    """Vérifier si c'est un email valide"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, str(email)) is not None

def main():
    export_dir = Path("retenza-export/retenza_ai")
    
    print("📧 EXTRACTION COMPLÈTE DES EMAILS COMMERÇANTS")
    print("=" * 60)
    
    merchant_emails = set()
    detailed_info = {}
    
    # 1. USERS.BSON - Administrateurs et super admins
    users_file = export_dir / "users.bson"
    if users_file.exists():
        print("\n🔍 Analyse de users.bson")
        try:
            with open(users_file, 'rb') as f:
                documents = bson.decode_all(f.read())
            
            for doc in documents:
                email = doc.get('email')
                role = doc.get('role')
                
                if email and is_valid_email(email) and '@invalid.local' not in email:
                    if role in ['super_admin', 'admin', 'merchant']:
                        merchant_emails.add(email)
                        detailed_info[email] = {
                            'source': 'users.bson',
                            'role': role,
                            'type': 'Administrateur principal'
                        }
                        print(f"  ✅ {email} (Rôle: {role})")
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
    
    # 2. COMMERCES_SETTINGS.BSON - Emails comptables/contact
    settings_file = export_dir / "commerces_settings.bson"
    if settings_file.exists():
        print("\n🔍 Analyse de commerces_settings.bson")
        try:
            with open(settings_file, 'rb') as f:
                documents = bson.decode_all(f.read())
            
            for doc in documents:
                # Email comptable
                accountant_email = doc.get('accountant_email')
                if accountant_email and is_valid_email(accountant_email):
                    merchant_emails.add(accountant_email)
                    detailed_info[accountant_email] = {
                        'source': 'commerces_settings.bson',
                        'role': 'accountant',
                        'type': 'Email comptable',
                        'commerce_id': doc.get('commerce_id', 'N/A')
                    }
                    print(f"  ✅ {accountant_email} (Email comptable)")
                
                # Autres emails dans settings
                for key, value in doc.items():
                    if 'email' in key.lower() and is_valid_email(str(value)):
                        email = str(value)
                        if email not in merchant_emails:
                            merchant_emails.add(email)
                            detailed_info[email] = {
                                'source': 'commerces_settings.bson',
                                'role': key,
                                'type': f'Email {key}',
                                'commerce_id': doc.get('commerce_id', 'N/A')
                            }
                            print(f"  ✅ {email} (Champ: {key})")
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
    
    # 3. SUPPORT_TICKETS.BSON - Emails de clients contactant le support (possibles commerçants)
    support_file = export_dir / "support_tickets.bson"  
    if support_file.exists():
        print("\n🔍 Analyse de support_tickets.bson")
        try:
            with open(support_file, 'rb') as f:
                documents = bson.decode_all(f.read())
            
            support_emails = {}
            for doc in documents:
                email = doc.get('email')
                if email and is_valid_email(email) and '@example.com' not in email:
                    if email not in support_emails:
                        support_emails[email] = 0
                    support_emails[email] += 1
            
            # Emails avec plusieurs tickets support (probablement commerçants)
            for email, count in support_emails.items():
                if count >= 3:  # 3+ tickets = probablement commerçant
                    merchant_emails.add(email)
                    detailed_info[email] = {
                        'source': 'support_tickets.bson',
                        'role': 'support_user',
                        'type': f'Utilisateur support actif ({count} tickets)',
                        'ticket_count': count
                    }
                    print(f"  ✅ {email} ({count} tickets support)")
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
    
    # 4. AUDIT_LOGS.BSON - Acteurs non-temporaires
    audit_file = export_dir / "audit_logs.bson"
    if audit_file.exists():
        print("\n🔍 Analyse de audit_logs.bson")
        try:
            with open(audit_file, 'rb') as f:
                documents = bson.decode_all(f.read())
            
            audit_emails = {}
            for doc in documents:
                actor = doc.get('actor', {})
                if isinstance(actor, dict):
                    email = actor.get('email')
                    role = actor.get('role')
                    
                    if email and is_valid_email(email) and '@invalid.local' not in email:
                        if email not in audit_emails:
                            audit_emails[email] = {'count': 0, 'role': role}
                        audit_emails[email]['count'] += 1
            
            # Emails avec plusieurs actions audit (probablement commerçants actifs)
            for email, info in audit_emails.items():
                if info['count'] >= 5:  # 5+ actions = utilisateur actif
                    merchant_emails.add(email)
                    detailed_info[email] = {
                        'source': 'audit_logs.bson',
                        'role': info['role'],
                        'type': f'Utilisateur actif ({info["count"]} actions)',
                        'action_count': info['count']
                    }
                    print(f"  ✅ {email} ({info['count']} actions, rôle: {info['role']})")
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
    
    # RÉSULTATS FINAUX
    print(f"\n🎯 RÉSULTATS FINAUX")
    print("=" * 50)
    print(f"Total d'emails trouvés: {len(merchant_emails)}")
    
    print(f"\n📧 LISTE COMPLÈTE DES EMAILS DES COMMERÇANTS:")
    print("=" * 50)
    
    sorted_emails = sorted(merchant_emails)
    for i, email in enumerate(sorted_emails, 1):
        info = detailed_info.get(email, {})
        print(f"{i}. {email}")
        print(f"   📂 Source: {info.get('source', 'N/A')}")
        print(f"   👤 Type: {info.get('type', 'N/A')}")
        print(f"   🏷️  Rôle: {info.get('role', 'N/A')}")
        if info.get('commerce_id'):
            print(f"   🏪 Commerce ID: {info['commerce_id']}")
        print()
    
    print(f"\n📋 EMAILS POUR COPIER-COLLER:")
    print("=" * 30)
    for email in sorted_emails:
        print(email)
    
    # Sauvegarder dans un fichier
    with open('ALL_MERCHANT_EMAILS.txt', 'w', encoding='utf-8') as f:
        f.write("TOUS LES EMAILS DES COMMERÇANTS - RETENZA CONNECT\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("LISTE SIMPLE:\n")
        f.write("-" * 15 + "\n")
        for email in sorted_emails:
            f.write(f"{email}\n")
        
        f.write(f"\n\nDÉTAILS COMPLETS:\n")
        f.write("-" * 20 + "\n")
        for email in sorted_emails:
            info = detailed_info.get(email, {})
            f.write(f"\n{email}\n")
            f.write(f"  Source: {info.get('source', 'N/A')}\n")
            f.write(f"  Type: {info.get('type', 'N/A')}\n")
            f.write(f"  Rôle: {info.get('role', 'N/A')}\n")
            if info.get('commerce_id'):
                f.write(f"  Commerce ID: {info['commerce_id']}\n")
            if info.get('ticket_count'):
                f.write(f"  Tickets support: {info['ticket_count']}\n")
            if info.get('action_count'):
                f.write(f"  Actions audit: {info['action_count']}\n")
    
    print(f"\n💾 Fichier complet créé: ALL_MERCHANT_EMAILS.txt")
    
    return sorted_emails

if __name__ == "__main__":
    emails = main()