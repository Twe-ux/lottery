import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';

async function resetPassword() {
  try {
    await dbConnect();

    // Réinitialiser le mot de passe pour dev@coworkingcafe.fr
    const email = 'dev@coworkingcafe.fr';
    const newPassword = 'Admin123!';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé:', email);

    // Hasher et mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('\n✅ Mot de passe réinitialisé avec succès !');
    console.log('Email:', email);
    console.log('Nouveau mot de passe:', newPassword);
    console.log('\n⚠️  IMPORTANT : Changez ce mot de passe après votre première connexion !');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetPassword();
