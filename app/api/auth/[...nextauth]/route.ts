import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/db/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          commerceId: user.commerceId?.toString(),
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Pour Google OAuth
      if (account?.provider === 'google') {
        try {
          await dbConnect();

          // Vérifier si l'utilisateur existe déjà dans la DB
          let dbUser = await User.findOne({ email: user.email });

          if (dbUser) {
            // Utilisateur existant (admin) - lier le compte Google si nécessaire
            if (!dbUser.googleId) {
              dbUser.googleId = account.providerAccountId;
              dbUser.emailVerified = true;
              await dbUser.save();
            }

            // Mettre à jour les infos user pour les callbacks suivants
            user.id = dbUser._id.toString();
            user.role = dbUser.role;
            user.commerceId = dbUser.commerceId?.toString();
          } else {
            // Nouvel utilisateur Google
            // On ne crée PAS automatiquement un compte User en DB
            // On stocke juste les infos dans le token pour les clients
            // (les admins doivent être créés manuellement)
            user.id = account.providerAccountId; // Utiliser l'ID Google comme ID temporaire
            user.role = 'client'; // Rôle spécial pour les clients
            user.isTemporary = true; // Flag pour identifier les sessions temporaires
          }

          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.commerceId = user.commerceId;
        token.isTemporary = user.isTemporary;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.commerceId = token.commerceId as string;
        session.user.isTemporary = token.isTemporary as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
