import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db/connect';
import User from '../lib/db/models/User';
import Commerce from '../lib/db/models/Commerce';
import Prize from '../lib/db/models/Prize';
import Campaign from '../lib/db/models/Campaign';

async function seed() {
  try {
    await dbConnect();
    console.log('✓ Connected to MongoDB');

    // Créer un utilisateur super admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const existingUser = await User.findOne({ email: 'admin@reviewlottery.com' });

    if (!existingUser) {
      const admin = await User.create({
        email: 'admin@reviewlottery.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super_admin',
        permissions: ['all'],
      });
      console.log('✓ Admin user created: admin@reviewlottery.com / admin123');
    } else {
      // Mettre à jour le mot de passe si l'utilisateur existe déjà
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('✓ Admin user password updated: admin@reviewlottery.com / admin123');
    }

    // Créer un commerce de démonstration
    const existingCommerce = await Commerce.findOne({ slug: 'cafe-demo' });

    if (!existingCommerce) {
      const adminUser = await User.findOne({ email: 'admin@reviewlottery.com' });

      const commerce = await Commerce.create({
        name: 'Café Démo',
        slug: 'cafe-demo',
        googlePlaceId: 'ChIJDemo123456',
        googleBusinessUrl: 'https://maps.google.com/?cid=demo',
        logo: '',
        primaryColor: '#8B4513',
        ownerId: adminUser!._id,
        subscription: {
          plan: 'pro',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        },
        settings: {
          probabilityMode: 'fixed',
          defaultExpirationDays: 30,
        },
      });
      console.log('✓ Demo commerce created: cafe-demo');

      // Créer des lots de démonstration
      const prizes = [
        {
          commerceId: commerce._id,
          name: 'Café offert',
          description: 'Un café au choix',
          value: 3,
          probability: {
            mode: 'fixed' as const,
            fixedPercent: 40,
          },
          stock: null,
          isActive: true,
          displayOrder: 1,
          color: '#8B4513',
        },
        {
          commerceId: commerce._id,
          name: '-10% sur commande',
          description: 'Réduction de 10% sur votre prochaine commande',
          value: 5,
          probability: {
            mode: 'fixed' as const,
            fixedPercent: 35,
          },
          stock: 100,
          isActive: true,
          displayOrder: 2,
          color: '#3B82F6',
        },
        {
          commerceId: commerce._id,
          name: 'Dessert offert',
          description: 'Un dessert maison au choix',
          value: 6,
          probability: {
            mode: 'fixed' as const,
            fixedPercent: 20,
          },
          stock: 50,
          isActive: true,
          displayOrder: 3,
          color: '#EF4444',
        },
        {
          commerceId: commerce._id,
          name: 'Menu complet offert',
          description: 'Menu entrée + plat + dessert',
          value: 25,
          probability: {
            mode: 'fixed' as const,
            fixedPercent: 5,
          },
          stock: 10,
          isActive: true,
          displayOrder: 4,
          color: '#10B981',
        },
      ];

      const createdPrizes = await Prize.insertMany(prizes);
      console.log('✓ Demo prizes created (4 prizes)');

      // Créer une campagne active
      const campaign = await Campaign.create({
        commerceId: commerce._id,
        name: 'Campagne de Noël 2024',
        description: 'Collectez des avis et gagnez des cadeaux !',
        prizes: createdPrizes.map((p) => p._id),
        isActive: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        qrCodeUrl: '',
        settings: {
          expirationDays: 30,
          requireGoogleReview: false,
          minRatingForSpin: 1,
          maxParticipationsPerEmail: 1,
        },
        stats: {
          totalParticipations: 0,
          totalReviews: 0,
          totalWinners: 0,
          avgRating: 0,
        },
      });
      console.log('✓ Demo campaign created');
    } else {
      console.log('✓ Demo commerce already exists');

      // Vérifier si une campagne existe déjà, sinon en créer une
      const existingCampaign = await Campaign.findOne({
        commerceId: existingCommerce._id,
        isActive: true
      });

      if (!existingCampaign) {
        // Récupérer les lots existants
        const existingPrizes = await Prize.find({ commerceId: existingCommerce._id });

        if (existingPrizes.length > 0) {
          const campaign = await Campaign.create({
            commerceId: existingCommerce._id,
            name: 'Campagne de Noël 2024',
            description: 'Collectez des avis et gagnez des cadeaux !',
            prizes: existingPrizes.map((p) => p._id),
            isActive: true,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-12-31'),
            qrCodeUrl: '',
            settings: {
              expirationDays: 30,
              requireGoogleReview: false,
              minRatingForSpin: 1,
              maxParticipationsPerEmail: 1,
            },
            stats: {
              totalParticipations: 0,
              totalReviews: 0,
              totalWinners: 0,
              avgRating: 0,
            },
          });
          console.log('✓ Demo campaign created for existing commerce');
        }
      } else {
        console.log('✓ Demo campaign already exists');
      }
    }

    console.log('\n✓ Seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@reviewlottery.com');
    console.log('  Password: admin123');
    console.log('\nDemo commerce slug: cafe-demo');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
