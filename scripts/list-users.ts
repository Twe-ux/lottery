import mongoose from 'mongoose';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';
import Commerce from '../lib/db/models/Commerce';

async function listUsers() {
  try {
    await dbConnect();
    console.log('✓ Connected to MongoDB');

    // Lister tous les utilisateurs
    const users = await User.find().select('email name role commerceId permissions');
    console.log('\n👥 Users in database:', users.length);

    if (users.length > 0) {
      users.forEach((user, i) => {
        console.log(`\n${i + 1}. ${user.email}`);
        console.log('   Name:', user.name);
        console.log('   Role:', user.role);
        console.log('   CommerceId:', user.commerceId);
        console.log('   Permissions:', user.permissions);
      });
    } else {
      console.log('No users found in database');
    }

    // Lister tous les commerces
    const commerces = await Commerce.find().select('name slug ownerId');
    console.log('\n\n🏪 Commerces in database:', commerces.length);

    if (commerces.length > 0) {
      commerces.forEach((commerce, i) => {
        console.log(`\n${i + 1}. ${commerce.name} (${commerce.slug})`);
        console.log('   ID:', commerce._id);
        console.log('   OwnerId:', commerce.ownerId);
      });
    } else {
      console.log('No commerces found in database');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
