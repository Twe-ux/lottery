import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'super_admin' | 'commerce_admin' | 'employee' | 'admin';
  commerceId?: mongoose.Types.ObjectId;
  permissions: string[];
  googleId?: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Optionnel pour les utilisateurs Google
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'commerce_admin', 'employee', 'admin'],
      default: 'commerce_admin',
    },
    commerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Commerce',
    },
    permissions: {
      type: [String],
      default: [],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Permet null/undefined pour les utilisateurs non-Google
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide par email
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
