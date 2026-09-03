"""Script one-shot : corrige les noms lisibles dans la collection commerces."""
import chatbot_config as config
from pymongo import MongoClient

client = MongoClient(config.MONGO_URI)
db = client[config.DB_NAME]

updates = [
    ("commerce_local_1", "Boutique Tunis"),
    ("commerce_local_2", "Boutique Sousse"),
    ("commerce_local",   "Boutique Retenza"),
]

for cid, cname in updates:
    r = db.commerces.update_one(
        {"commerce_id": cid},
        {"$set": {"name": cname, "nom": cname}}
    )
    print(f"{cid} -> {cname} : matched={r.matched_count}, modified={r.modified_count}")

# Vérification
docs = list(db.commerces.find({}, {"_id": 0, "commerce_id": 1, "name": 1, "nom": 1}))
print("Apres correction:", docs)
