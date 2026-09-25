#!/usr/bin/env python3
"""
Script pour rechercher les emails des commerçants dans toutes les collections
"""

import bson
import json
import re
from pathlib import Path

def is_valid_email(email):
    """Vérifier si c'est un email valide"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, str(email)) is not None

def extract_emails_from_value(value, prefix=""):
    """Extraire récursivement les emails d'une valeur"""
    emails = []
    
    if isinstance(value, str) and is_valid_email(value):
        emails.append(f"{prefix}: {value}")
    elif isinstance(value, dict):
        for k, v in value.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            emails.extend(extract_emails_from_value(v, new_prefix))
    elif isinstance(value, list):
        for i, item in enumerate(value):
            new_prefix = f"{prefix}[{i}]" if prefix else f"[{i}]"
            emails.extend(extract_emails_from_value(item, new_prefix))
    
    return emails

def search_all_collections():
    """Rechercher dans toutes les collections BSON"""
    
    export_dir = Path("retenza-export/retenza_ai")
    
    print("🔍 RECHERCHE D'EMAILS DANS TOUTES LES COLLECTIONS")
    print("=" * 60)
    
    all_emails = {}  # Collection -> [emails]
    merchant_candidates = []
    
    # Collections à examiner en priorité
    priority_collections = [
        'users.bson',
        'commerces_settings.bson', 
        'campagnes_envoyees.bson',
        'support_tickets.bson',
        'audit_logs.bson'
    ]
    
    # Examiner d'abord les collections prioritaires
    for filename in priority_collections:
        filepath = export_dir / filename
        if not filepath.exists():
            continue
            
        print(f"\n📁 Examen de {filename}")
        print("-" * 40)
        
        try:
            with open(filepath, 'rb') as f:
                data = f.read()
                documents = bson.decode_all(data)
                
            print(f"Documents: {len(documents)}")
            
            collection_emails = []
            
            for doc in documents:
                emails = extract_emails_from_value(doc)
                collection_emails.extend(emails)
                
                # Rechercher des patterns spécifiques pour les commerçants
                if isinstance(doc, dict):
                    # Pattern 1: Role merchant ou admin
                    if doc.get('role') in ['merchant', 'admin', 'super_admin']:
                        email = doc.get('email')
                        if email and is_valid_email(email):
                            merchant_candidates.append({
                                'email': email,
                                'role': doc.get('role'),
                                'source': filename,
                                'firstName': doc.get('firstName', ''),
                                'lastName': doc.get('lastName', ''),
                                'commerce_id': doc.get('commerce_id', ''),
                            })
                    
                    # Pattern 2: Actor dans audit_logs avec role admin/merchant
                    if 'actor' in doc and isinstance(doc['actor'], dict):
                        actor = doc['actor']
                        if actor.get('role') in ['merchant', 'admin', 'super_admin']:
                            email = actor.get('email')
                            if email and is_valid_email(email):
                                merchant_candidates.append({
                                    'email': email,
                                    'role': actor.get('role'),
                                    'source': filename,
                                    'user_id': actor.get('user_id', ''),
                                })
                    
                    # Pattern 3: Commerce avec contact
                    if 'contact' in doc and isinstance(doc['contact'], dict):
                        contact = doc['contact']
                        email = contact.get('email')
                        if email and is_valid_email(email):
                            merchant_candidates.append({
                                'email': email,
                                'role': 'commerce_contact',
                                'source': filename,
                                'commerce_name': doc.get('name', ''),
                            })
            
            if collection_emails:
                all_emails[filename] = list(set(collection_emails))
                print(f"Emails trouvés: {len(collection_emails)}")
                
                # Afficher quelques exemples
                for email in collection_emails[:5]:
                    print(f"  - {email}")
                if len(collection_emails) > 5:
                    print(f"  ... et {len(collection_emails) - 5} autres")
        
        except Exception as e:
            print(f"❌ Erreur {filename}: {e}")
    
    # Résultats
    print(f"\n🎯 CANDIDATS COMMERÇANTS TROUVÉS:")
    print("=" * 50)
    
    unique_merchants = {}
    for candidate in merchant_candidates:
        email = candidate['email']
        if email not in unique_merchants:
            unique_merchants[email] = candidate
        else:
            # Merger les infos
            existing = unique_merchants[email]
            for k, v in candidate.items():
                if v and not existing.get(k):
                    existing[k] = v
    
    merchant_emails = []
    for i, (email, info) in enumerate(unique_merchants.items(), 1):
        # Filtrer les emails temporaires/invalides
        if '@invalid.local' in email or '@example.com' in email:
            continue
            
        print(f"{i}. {email}")
        print(f"   👤 Rôle: {info.get('role', 'N/A')}")
        print(f"   📂 Source: {info.get('source', 'N/A')}")
        if info.get('firstName') or info.get('lastName'):
            print(f"   🏷️  Nom: {info.get('firstName', '')} {info.get('lastName', '')}")
        if info.get('commerce_name'):
            print(f"   🏪 Commerce: {info.get('commerce_name')}")
        print()
        
        merchant_emails.append(email)
    
    print(f"\n📧 EMAILS FINAUX DES COMMERÇANTS ({len(merchant_emails)}):")
    print("=" * 40)
    for email in sorted(merchant_emails):
        print(email)
    
    # Sauvegarder
    with open('merchants_emails_final.txt', 'w', encoding='utf-8') as f:
        f.write("EMAILS DES COMMERÇANTS RETENZA CONNECT\n")
        f.write("=" * 40 + "\n\n")
        f.write("EMAILS TROUVÉS:\n")
        for email in sorted(merchant_emails):
            f.write(f"{email}\n")
        
        f.write("\n\nDÉTAILS:\n")
        for email, info in unique_merchants.items():
            if '@invalid.local' not in email and '@example.com' not in email:
                f.write(f"\n{email}\n")
                f.write(f"  Rôle: {info.get('role', 'N/A')}\n")
                f.write(f"  Source: {info.get('source', 'N/A')}\n")
                if info.get('firstName') or info.get('lastName'):
                    f.write(f"  Nom: {info.get('firstName', '')} {info.get('lastName', '')}\n")
    
    print(f"\n💾 Résultats sauvegardés dans: merchants_emails_final.txt")
    
    return merchant_emails

if __name__ == "__main__":
    emails = search_all_collections()