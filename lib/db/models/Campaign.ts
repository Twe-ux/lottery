import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  commerceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  prizePoolId: mongoose.Types.ObjectId;
  qrCodeUrl: string;
  qrCodeImage?: string;
  settings: {
    expirationDays: number;
    maxParticipations?: number;
  };
  stats: {
    totalScans: number;
    totalReviews: number;
    totalWinners: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    commerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Commerce',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    prizePoolId: {
      type: Schema.Types.ObjectId,
      ref: 'PrizePool',
      required: true,
    },
    qrCodeUrl: {
      type: String,
      required: false,
    },
    qrCodeImage: {
      type: String,
    },
    settings: {
      expirationDays: {
        type: Number,
        default: 30,
      },
      maxParticipations: {
        type: Number,
      },
    },
    stats: {
      totalScans: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      totalWinners: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche par commerce et statut
CampaignSchema.index({ commerceId: 1, isActive: 1 });

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
