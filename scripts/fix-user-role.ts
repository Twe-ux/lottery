import mongoose from 'mongoose';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';
import Commerce from '../lib/db/models/Commerce';

async function fixUserRole() {
  try {
    await dbConnect();
    console.log('✓ Connected to MongoDB');

    // Trouver l'utilisateur
    const user = await User.findOne({ email: 'milone.thierry@gmail.com' });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('\n📋 Current user info:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('CommerceId:', user.commerceId);

    // Trouver tous les commerces
    const commerces = await Commerce.find();
    console.log('\n📊 Found', commerces.length, 'commerces in database');

    if (commerces.length > 0) {
      console.log('\nCommerces:');
      commerces.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name} (${c._id}) - Owner: ${c.ownerId}`);
      });
    }

    // Mettre à jour le rôle en super_admin
    console.log('\n🔄 Updating user role to super_admin...');
    user.role = 'super_admin';
    user.permissions = ['all'];
    await user.save();

    console.log('✅ User role updated successfully!');
    console.log('\nNew user info:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Permissions:', user.permissions);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserRole();
