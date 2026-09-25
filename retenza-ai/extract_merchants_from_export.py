#!/usr/bin/env python3
"""
Script pour extraire les emails des commerçants depuis les exports BSON
"""

import bson
import json
from pathlib import Path

def read_bson_file(file_path):
    """Lire un fichier BSON et retourner les documents"""
    documents = []
    try:
        with open(file_path, 'rb') as f:
            while True:
                try:
                    doc = bson.decode(f.read(bson.decode(f.read(4))[0]))
                    documents.append(doc)
                except:
                    break
    except:
        # Essayer avec bson.decode_all
        try:
            with open(file_path, 'rb') as f:
                documents = bson.decode_all(f.read())
        except Exception as e:
            print(f"Erreur lecture {file_path}: {e}")
    return documents

def main():
    export_dir = Path("retenza-export/retenza_ai")
    
    print("📋 EXTRACTION DES EMAILS DES COMMERÇANTS")
    print("=" * 50)
    
    # 1. Lire le fichier users.bson pour les commerçants
    users_file = export_dir / "users.bson"
    commerces_file = export_dir / "commerces.bson"
    
    merchants = []
    commerces = []
    
    if users_file.exists():
        print("🔍 Lecture du fichier users.bson...")
        try:
            with open(users_file, 'rb') as f:
                content = f.read()
                # Essayer de décoder par chunks
                pos = 0
                while pos < len(content):
                    try:
                        size = int.from_bytes(content[pos:pos+4], 'little')
                        if size <= 0 or pos + size > len(content):
                            break
                        doc_bytes = content[pos:pos+size]
                        doc = bson.BSON(doc_bytes).decode()
                        if doc.get('role') == 'merchant':
                            merchants.append(doc)
                        pos += size
                    except:
                        pos += 1
                        
        except Exception as e:
            print(f"Erreur: {e}")
    
    if commerces_file.exists():
        print("🔍 Lecture du fichier commerces.bson...")
        try:
            with open(commerces_file, 'rb') as f:
                content = f.read()
                pos = 0
                while pos < len(content):
                    try:
                        size = int.from_bytes(content[pos:pos+4], 'little')
                        if size <= 0 or pos + size > len(content):
                            break
                        doc_bytes = content[pos:pos+size]
                        doc = bson.BSON(doc_bytes).decode()
                        commerces.append(doc)
                        pos += size
                    except:
                        pos += 1
                        
        except Exception as e:
            print(f"Erreur: {e}")
    
    print(f"\n📊 Commerçants trouvés: {len(merchants)}")
    print(f"📊 Commerces trouvés: {len(commerces)}")
    
    if merchants:
        print("\n📧 EMAILS DES COMMERÇANTS:")
        print("=" * 30)
        
        for i, merchant in enumerate(merchants, 1):
            email = merchant.get('email', 'N/A')
            firstName = merchant.get('firstName', '')
            lastName = merchant.get('lastName', '')
            status = merchant.get('status', 'N/A')
            
            print(f"{i}. {email}")
            if firstName or lastName:
                print(f"   👤 {firstName} {lastName}")
            print(f"   📊 Statut: {status}")
            print()
    
    if commerces:
        print("\n🏪 INFORMATIONS COMMERCES:")
        print("=" * 30)
        
        for commerce in commerces:
            name = commerce.get('name', 'N/A')
            contact = commerce.get('contact', {})
            email = contact.get('email') if contact else None
            status = commerce.get('status', 'N/A')
            
            if email:
                print(f"🏪 {name}")
                print(f"   📧 {email}")
                print(f"   📊 {status}")
                print()

if __name__ == "__main__":
    main()