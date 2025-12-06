import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';

async function checkUsers() {
  try {
    await dbConnect();

    const users = await User.find({});

    console.log(`\n📊 Nombre total d'utilisateurs : ${users.length}\n`);

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', user.email);
      console.log('👤 Nom:', user.name);
      console.log('🔑 Rôle:', user.role);
      console.log('🔒 A un mot de passe:', !!user.password);
      console.log('🆔 ID:', user._id);
      console.log('✅ Email vérifié:', user.emailVerified);

      // Tester le mot de passe par défaut
      if (user.password) {
        const testPassword = 'Admin123!';
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`🔐 Mot de passe "${testPassword}" fonctionne:`, isMatch);
      }

      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkUsers();
