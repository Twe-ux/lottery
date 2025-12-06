import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';
import mongoose from 'mongoose';

async function testLogin() {
  try {
    await dbConnect();

    const email = 'admin@reviewlottery.com';
    const password = 'Admin123!';

    console.log('\n🔍 Test de connexion...\n');
    console.log('Email:', email);
    console.log('Mot de passe:', password);
    console.log('');

    // Rechercher l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé');
    console.log('   Nom:', user.name);
    console.log('   Rôle:', user.role);
    console.log('   Email vérifié:', user.emailVerified);
    console.log('');

    // Vérifier le mot de passe
    if (!user.password) {
      console.log('❌ L\'utilisateur n\'a pas de mot de passe');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('🔐 Vérification du mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      console.log('✅ Mot de passe VALIDE');
      console.log('');
      console.log('🎉 La connexion devrait fonctionner !');
      console.log('');
      console.log('Identifiants :');
      console.log('  Email:', email);
      console.log('  Mot de passe:', password);
    } else {
      console.log('❌ Mot de passe INVALIDE');
      console.log('');
      console.log('Le mot de passe ne correspond pas. Voulez-vous le réinitialiser ?');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testLogin();
