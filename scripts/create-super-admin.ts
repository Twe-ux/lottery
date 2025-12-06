import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';

async function createSuperAdmin() {
  try {
    await dbConnect();

    const email = 'admin@reviewlottery.com';
    const password = 'Admin123!'; // Changez ce mot de passe après la première connexion
    const name = 'Super Admin';

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà.');
      console.log('Email:', existingUser.email);
      console.log('Nom:', existingUser.name);
      console.log('Rôle:', existingUser.role);

      // Demander si on veut réinitialiser le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();

      console.log('\n✅ Mot de passe réinitialisé avec succès !');
      console.log('Email:', email);
      console.log('Mot de passe:', password);
      console.log('\n⚠️  IMPORTANT : Changez ce mot de passe après votre première connexion !');
    } else {
      // Créer le nouveau super admin
      const hashedPassword = await bcrypt.hash(password, 10);

      const superAdmin = new User({
        email,
        password: hashedPassword,
        name,
        role: 'super_admin',
        permissions: ['all'],
        emailVerified: true,
      });

      await superAdmin.save();

      console.log('\n✅ Super Admin créé avec succès !');
      console.log('Email:', email);
      console.log('Mot de passe:', password);
      console.log('\n⚠️  IMPORTANT : Changez ce mot de passe après votre première connexion !');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createSuperAdmin();
