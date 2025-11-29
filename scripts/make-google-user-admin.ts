import mongoose from 'mongoose';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';

async function makeGoogleUserAdmin() {
  try {
    await dbConnect();
    console.log('✓ Connected to MongoDB');

    // Trouver l'utilisateur Google
    const user = await User.findOne({ email: 'milone.thierry@gmail.com' });

    if (!user) {
      console.log('❌ User milone.thierry@gmail.com not found');
      console.log('Creating user...');

      // Créer l'utilisateur s'il n'existe pas
      const newUser = await User.create({
        email: 'milone.thierry@gmail.com',
        name: 'Thierry Milone',
        role: 'super_admin',
        permissions: ['all'],
        googleId: 'google-user-id', // Sera mis à jour lors de la prochaine connexion Google
      });

      console.log('✅ User created with super_admin role');
      console.log('Email:', newUser.email);
      console.log('Role:', newUser.role);
      console.log('Permissions:', newUser.permissions);
    } else {
      console.log('\n📋 Current user info:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('CommerceId:', user.commerceId);
      console.log('Permissions:', user.permissions);

      // Mettre à jour le rôle
      console.log('\n🔄 Updating user role to super_admin...');
      user.role = 'super_admin';
      user.permissions = ['all'];
      await user.save();

      console.log('✅ User role updated successfully!');
      console.log('\nNew user info:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Permissions:', user.permissions);
    }

    console.log('\n💡 You can now access all commerces, campaigns, and prizes!');
    console.log('Please log out and log back in for changes to take effect.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeGoogleUserAdmin();
