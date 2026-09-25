/**
 * Script pour extraire tous les emails des commerçants depuis la base de données MongoDB
 * Usage: node get_merchant_emails.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Commerce = require('./models/Commerce');

async function getAllMerchantEmails() {
  try {
    // Connexion à la base de données
    console.log('🔗 Connexion à MongoDB...');
    await connectDB();
    
    // Récupérer tous les utilisateurs avec role = 'merchant'
    const merchants = await User.find({ role: 'merchant' })
      .populate('commerce', 'name status isConfigured')
      .select('email firstName lastName phone status isActive commerce createdAt')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Total des commerçants trouvés: ${merchants.length}\n`);

    if (merchants.length === 0) {
      console.log('❌ Aucun commerçant trouvé dans la base de données.');
      process.exit(0);
    }

    // Afficher la liste complète
    console.log('📋 LISTE COMPLÈTE DES EMAILS DES COMMERÇANTS:');
    console.log('=' .repeat(80));
    
    merchants.forEach((merchant, index) => {
      const commerceName = merchant.commerce?.name || 'Commerce non configuré';
      const status = merchant.status || 'non défini';
      const commerceStatus = merchant.commerce?.status || 'non défini';
      const isActive = merchant.isActive ? '✅' : '❌';
      
      console.log(`${index + 1}. ${merchant.email}`);
      console.log(`   👤 Nom: ${merchant.firstName} ${merchant.lastName}`);
      console.log(`   🏪 Commerce: ${commerceName}`);
      console.log(`   📊 Statut Compte: ${status} ${isActive}`);
      console.log(`   🏢 Statut Commerce: ${commerceStatus}`);
      console.log(`   📱 Téléphone: ${merchant.phone || 'Non renseigné'}`);
      console.log(`   📅 Créé le: ${new Date(merchant.createdAt).toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    // Afficher uniquement les emails (facile à copier)
    console.log('\n📧 EMAILS UNIQUEMENT (pour copier-coller):');
    console.log('=' .repeat(50));
    const emailList = merchants.map(m => m.email).join('\n');
    console.log(emailList);

    // Statistiques
    const activeCount = merchants.filter(m => m.isActive && m.status === 'active').length;
    const pendingCount = merchants.filter(m => m.status === 'pending_activation').length;
    const suspendedCount = merchants.filter(m => m.status === 'suspended').length;
    const configuredCount = merchants.filter(m => m.commerce?.isConfigured).length;

    console.log('\n📈 STATISTIQUES:');
    console.log('=' .repeat(30));
    console.log(`Total commerçants: ${merchants.length}`);
    console.log(`Actifs: ${activeCount}`);
    console.log(`En attente d'activation: ${pendingCount}`);
    console.log(`Suspendus: ${suspendedCount}`);
    console.log(`Commerces configurés: ${configuredCount}`);

    // Exporter vers un fichier CSV
    const fs = require('fs');
    const csvContent = [
      'Email,Prénom,Nom,Téléphone,Statut Compte,Commerce,Statut Commerce,Date Création',
      ...merchants.map(m => [
        m.email,
        m.firstName,
        m.lastName,
        m.phone || '',
        m.status,
        m.commerce?.name || '',
        m.commerce?.status || '',
        new Date(m.createdAt).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const csvFilename = `merchants_emails_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(csvFilename, csvContent);
    console.log(`\n💾 Export CSV créé: ${csvFilename}`);

    console.log('\n✅ Extraction terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔒 Connexion fermée.');
    process.exit(0);
  }
}

// Lancer le script
getAllMerchantEmails();