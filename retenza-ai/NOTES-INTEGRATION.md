# Notes d'Intégration - Module Retenza AI

Ce fichier documente l'intégration du module d'Intelligence Artificielle de Retenza (Analyse comportementale RFM, prédiction de churn via XGBoost, clustering GMM et Chatbot). Il est destiné à la future connexion avec l'application mobile et le back-office administrateur.

## 1. Comment lancer le module Retenza AI de façon autonome

Le module est composé d'une partie Node.js et de scripts/services Python.

### Prérequis
- Node.js installé.
- Python 3.8+ installé.
- Un serveur MongoDB en cours d'exécution.

### Installation des dépendances
**Partie Node.js (Serveur principal / API)**
```bash
cd retenza-ai
npm install
```

**Partie Python (Analyse de données et ML)**
Il est recommandé d'utiliser un environnement virtuel :
```bash
cd retenza-ai
python -m venv venv
# Windows : venv\Scripts\activate
# macOS/Linux : source venv/bin/activate
pip install -r requirements.txt
```

### Variables d'environnement attendues
Un fichier `.env` doit être créé à la racine du dossier `retenza-ai` contenant les configurations, par exemple :
```env
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=retenza_ai
PORT=3000
```
*(Vérifiez les fichiers `config.py` ou `server.js` pour d'éventuelles autres variables requises)*

### Démarrage
Pour démarrer le serveur de l'API Node.js :
```bash
npm start
```
Pour exécuter l'analyse RFM en Python de façon ponctuelle :
```bash
python main.py
```

---

## 2. Endpoints et Scripts Existants

### Serveur Node.js (API REST)
Le backend Node expose plusieurs routes (visibles dans le dossier `routes/`) :
- **`/auth`** : `authRoutes.js` (Gestion de l'authentification).
- **`/rfm`** : `rfmRoutes.js` (Récupération des scores de fidélité et analyses RFM).
- **`/chatbot`** : `chatbotRoutes.js` (Endpoints pour la communication avec le chatbot).
- **`/loyalty`** : `loyaltyRoutes.js` (Gestion des programmes de fidélité).
- **`/cross-sell`** : `crossSellRoutes.js` (Recommandations de produits supplémentaires).
- **`/super-admin`** : `superAdminRoutes.js` (Gestion globale de la plateforme).

### Scripts Python (Intelligence Artificielle)
- **`main.py` / `rfm.py`** : Scripts pour exécuter l'algorithme d'analyse Récence, Fréquence, Montant et générer le score de fidélité global ($S_a$).
- **`xgboost_churn.py`** : Algorithme prédictif pour identifier les clients à risque d'attrition (churn).
- **`gmm.py`** : Script pour effectuer du clustering via les Modèles de Mélange Gaussien (GMM) afin de segmenter les clients.
- **`chatbot_*.py`** : Différents modules gérant la logique IA du Chatbot (classification, SAV, commandes).

---

## 3. Communication future avec le Mobile et l'Admin

Actuellement, aucune connexion n'est active. À l'avenir, l'application mobile (Flutter/React Native) et le tableau de bord web pourront interagir avec ce module de la façon suivante :

1. **Tableau de Bord Administrateur** : 
   - Fera des requêtes HTTP `GET` vers les routes de l'API (ex: `/rfm`) pour afficher les dashboards et les métriques des clients.
   - Accédera aux prédictions de churn générées par le modèle XGBoost pour lancer des campagnes de fidélisation ciblées.

2. **Application Mobile (Client)** :
   - Fera des requêtes HTTP `POST` ou établira des WebSockets vers les routes du chatbot (`/chatbot`) pour permettre aux utilisateurs de gérer leurs commandes ou leur SAV de manière interactive.
   - Les recommandations de produits (cross-sell) pourront être affichées dynamiquement sur l'application.

> **Note importante** : Ce module a été intégré tel quel depuis le dépôt de la collègue en charge de l'IA. Il doit rester inchangé pour faciliter les mises à jour futures. Les appels API se feront de manière découplée, en traitant le serveur Node.js du dossier `retenza-ai` comme un microservice indépendant.
