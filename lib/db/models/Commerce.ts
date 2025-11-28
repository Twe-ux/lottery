import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommerce extends Document {
  name: string;
  slug: string;
  googlePlaceId: string;
  googleBusinessUrl: string;
  logo?: string;
  primaryColor?: string;
  ownerId: mongoose.Types.ObjectId;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    validUntil: Date;
  };
  settings: {
    probabilityMode: 'fixed' | 'star-based';
    defaultExpirationDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommerceSchema = new Schema<ICommerce>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googlePlaceId: {
      type: String,
      required: false,
    },
    googleBusinessUrl: {
      type: String,
      required: false,
    },
    logo: {
      type: String,
    },
    primaryColor: {
      type: String,
      default: '#000000',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
      },
      validUntil: {
        type: Date,
        required: true,
      },
    },
    settings: {
      probabilityMode: {
        type: String,
        enum: ['fixed', 'star-based'],
        default: 'fixed',
      },
      defaultExpirationDays: {
        type: Number,
        default: 30,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche par slug
CommerceSchema.index({ slug: 1 }, { unique: true });

const Commerce: Model<ICommerce> =
  mongoose.models.Commerce || mongoose.model<ICommerce>('Commerce', CommerceSchema);

export default Commerce;
