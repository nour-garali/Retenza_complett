const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectUri = process.env.MONGODB_CONNECT_URI || 'mongodb://localhost:27017/retenza_connect';
const aiUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retenza_ai';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
    console.log('===================================================================');
    console.log('🔄 Démarrage de la synchronisation ETL (retenza_connect -> retenza_ai)');
    console.log('===================================================================');
    
    if (isDryRun) {
        console.log('\n⚠️ MODE DRY-RUN ACTIF : Lecture seule. Aucune donnée ne sera modifiée dans retenza_ai.\n');
    }

    const connectClient = new MongoClient(connectUri, { serverSelectionTimeoutMS: 30000, tls: true });
    const aiClient = new MongoClient(aiUri, { serverSelectionTimeoutMS: 30000, tls: true });

    try {
        await connectClient.connect();
        const connectDb = connectClient.db();

        let aiDb;
        if (!isDryRun) {
            await aiClient.connect();
            aiDb = aiClient.db();
        }

        console.log('✅ Connecté aux bases de données avec succès.\n');

        // ==========================================
        // 1. Synchronisation des Clients
        // ==========================================
        console.log('▶ Phase 1: Extraction & Mapping des Clients');
        
        // On cherche toutes les associations (LoyaltyAccount) et on fait la jointure avec le Client
        const loyaltyCursor = connectDb.collection('loyaltyaccounts').aggregate([
            {
                $lookup: {
                    from: 'clients',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'clientData'
                }
            },
            { $unwind: '$clientData' }
        ]);

        const clientsToUpsert = [];
        let clientsCount = 0;

        for await (const doc of loyaltyCursor) {
            const clientDoc = doc.clientData;
            
            const ops = {
                updateOne: {
                    filter: { email: clientDoc.email, commerce_id: doc.commerce.toString() },
                    update: {
                        $set: {
                            email: clientDoc.email,
                            nom: clientDoc.lastName,
                            prenom: clientDoc.firstName,
                            commerce_id: doc.commerce.toString(),
                            client_db_id: clientDoc._id.toString()
                        },
                        $setOnInsert: {
                            device_id_creation: null,
                            ip_creation_compte: null,
                            rgpd_opt_out: false
                        }
                    },
                    upsert: true
                }
            };
            clientsToUpsert.push(ops);
            clientsCount++;
        }

        console.log(`  > ${clientsCount} profils clients-boutique détectés dans retenza_connect.`);
        
        if (isDryRun) {
            console.log('  > [DRY-RUN] Exemple du document exact généré pour un Client :');
            if (clientsToUpsert.length > 0) {
                console.log(JSON.stringify(clientsToUpsert[0].updateOne.update, null, 4).replace(/^/gm, '    '));
            }
        } else {
            if (clientsToUpsert.length > 0) {
                const res = await aiDb.collection('clients').bulkWrite(clientsToUpsert);
                console.log(`  > Terminé : ${res.upsertedCount} créés, ${res.modifiedCount} mis à jour.`);
            } else {
                console.log('  > Aucun client à traiter.');
            }
        }
        console.log('');

        // ==========================================
        // 2. Synchronisation des Transactions (Achats validés)
        // ==========================================
        console.log('▶ Phase 2: Extraction & Mapping des Achats/Commandes');
        
        const purchasesCursor = connectDb.collection('purchases').aggregate([
            { $match: { status: 'validated' } },
            {
                $lookup: {
                    from: 'clients',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'clientData'
                }
            },
            { $unwind: '$clientData' }
        ]);

        const commandesToUpsert = [];
        let commandesCount = 0;

        for await (const purchase of purchasesCursor) {
            const clientDoc = purchase.clientData;
            const dateStr = purchase.validatedAt ? purchase.validatedAt.toISOString().split('T')[0] : null;

            if (!dateStr) continue;

            const ops = {
                updateOne: {
                    filter: { transaction_id: purchase._id.toString() }, // Clé d'idempotence
                    update: {
                        $set: {
                            transaction_id: purchase._id.toString(),
                            commerce_id: purchase.commerce.toString(),
                            client_email: clientDoc.email,
                            montant: purchase.amount,
                            date: dateStr
                        }
                    },
                    upsert: true
                }
            };
            commandesToUpsert.push(ops);
            commandesCount++;
        }

        console.log(`  > ${commandesCount} achats validés détectés dans retenza_connect.`);

        if (isDryRun) {
            console.log('  > [DRY-RUN] Exemple du document exact généré pour une Commande :');
            if (commandesToUpsert.length > 0) {
                console.log(JSON.stringify(commandesToUpsert[0].updateOne.update, null, 4).replace(/^/gm, '    '));
            }
        } else {
            if (commandesToUpsert.length > 0) {
                const res = await aiDb.collection('commandes').bulkWrite(commandesToUpsert);
                console.log(`  > Terminé : ${res.upsertedCount} insérées, ${res.modifiedCount} mises à jour.`);
            } else {
                console.log('  > Aucune commande à traiter.');
            }
        }
        console.log('');

        console.log('✅ Fin du script.');

    } catch (err) {
        console.error('❌ Erreur lors de l\'exécution du script :', err);
    } finally {
        await connectClient.close();
        if (!isDryRun) await aiClient.close();
        process.exit(0);
    }
}

main();
