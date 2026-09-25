#!/usr/bin/env python3
"""
Script simple pour lire les fichiers BSON et extraire les emails
"""

import bson
import json
from pymongo import MongoClient
from pathlib import Path

def extract_from_bson_dump():
    """Extraire les données depuis le dump BSON"""
    
    print("📋 EXTRACTION DEPUIS LES EXPORTS BSON")
    print("=" * 50)
    
    # Chemins des fichiers
    export_dir = Path("retenza-export/retenza_ai")
    users_file = export_dir / "users.bson"
    commerces_file = export_dir / "commerces.bson"
    
    merchants_emails = []
    commerces_data = []
    
    # Fonction pour lire un fichier BSON avec différentes méthodes
    def read_bson_safe(file_path):
        documents = []
        try:
            # Méthode 1: Utiliser bson.decode_all
            with open(file_path, 'rb') as f:
                data = f.read()
                documents = bson.decode_all(data)
            print(f"✅ Lecture réussie avec decode_all: {len(documents)} documents")
            return documents
        except Exception as e1:
            print(f"❌ decode_all failed: {e1}")
            
            try:
                # Méthode 2: Lecture chunk par chunk
                with open(file_path, 'rb') as f:
                    documents = []
                    while True:
                        try:
                            doc = bson.decode(f.read())
                            documents.append(doc)
                        except bson.errors.InvalidBSON:
                            # Fin du fichier
                            break
                        except Exception:
                            continue
                print(f"✅ Lecture réussie chunk by chunk: {len(documents)} documents")
                return documents
            except Exception as e2:
                print(f"❌ Chunk reading failed: {e2}")
                return []
    
    # Lire les users
    if users_file.exists():
        print(f"\n🔍 Lecture de {users_file}")
        users = read_bson_safe(users_file)
        
        for user in users:
            if user.get('role') == 'merchant':
                email = user.get('email')
                if email:
                    merchants_emails.append({
                        'email': email,
                        'firstName': user.get('firstName', ''),
                        'lastName': user.get('lastName', ''),
                        'status': user.get('status', 'unknown'),
                        'isActive': user.get('isActive', False),
                        'phone': user.get('phone', ''),
                        'createdAt': user.get('createdAt', ''),
                    })
    
    # Lire les commerces  
    if commerces_file.exists():
        print(f"\n🔍 Lecture de {commerces_file}")
        commerces = read_bson_safe(commerces_file)
        
        for commerce in commerces:
            contact = commerce.get('contact', {})
            if contact and contact.get('email'):
                commerces_data.append({
                    'name': commerce.get('name', 'N/A'),
                    'email': contact.get('email'),
                    'phone': contact.get('phone', ''),
                    'address': contact.get('address', ''),
                    'city': contact.get('city', ''),
                    'status': commerce.get('status', 'unknown'),
                    'category': commerce.get('category', ''),
                })
    
    return merchants_emails, commerces_data

def main():
    try:
        merchants, commerces = extract_from_bson_dump()
        
        print(f"\n📊 RÉSULTATS:")
        print(f"Commerçants (users): {len(merchants)}")
        print(f"Commerces: {len(commerces)}")
        
        if merchants:
            print(f"\n📧 EMAILS DES COMMERÇANTS (USERS):")
            print("=" * 40)
            for i, merchant in enumerate(merchants, 1):
                print(f"{i}. {merchant['email']}")
                if merchant['firstName'] or merchant['lastName']:
                    print(f"   👤 {merchant['firstName']} {merchant['lastName']}")
                print(f"   📊 Statut: {merchant['status']}")
                print(f"   📱 Téléphone: {merchant['phone']}")
                print()
        
        if commerces:
            print(f"\n🏪 EMAILS DES COMMERCES:")
            print("=" * 30)
            for i, commerce in enumerate(commerces, 1):
                print(f"{i}. {commerce['email']}")
                print(f"   🏪 {commerce['name']}")
                print(f"   📊 {commerce['status']}")
                print(f"   📍 {commerce['city']}")
                print()
        
        # Créer une liste combinée unique
        all_emails = set()
        
        for merchant in merchants:
            all_emails.add(merchant['email'])
        
        for commerce in commerces:
            all_emails.add(commerce['email'])
        
        print(f"\n📧 TOUS LES EMAILS UNIQUES ({len(all_emails)}):")
        print("=" * 30)
        for email in sorted(all_emails):
            print(email)
        
        # Sauvegarder dans un fichier
        with open('merchants_emails_extract.txt', 'w', encoding='utf-8') as f:
            f.write("EMAILS DES COMMERÇANTS RETENZA\n")
            f.write("=" * 30 + "\n\n")
            for email in sorted(all_emails):
                f.write(f"{email}\n")
        
        print(f"\n💾 Emails sauvegardés dans: merchants_emails_extract.txt")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()