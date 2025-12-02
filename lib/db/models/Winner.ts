import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWinner extends Document {
  participationId: mongoose.Types.ObjectId;
  reviewId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  commerceId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  clientEmail: string;
  clientName: string;
  claimCode: string;
  claimQrCode?: string;
  status: 'pending' | 'claimed' | 'expired';
  expiresAt: Date;
  claimedAt?: Date;
  claimedBy?: string;
  prizeSnapshot: {
    name: string;
    description?: string;
    value?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WinnerSchema = new Schema<IWinner>(
  {
    participationId: {
      type: Schema.Types.ObjectId,
      ref: 'Participation',
      required: true,
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    commerceId: {
      type: Schema.Types.ObjectId,
      ref: 'Commerce',
      required: true,
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    claimCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    claimQrCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'claimed', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    claimedAt: {
      type: Date,
    },
    claimedBy: {
      type: String,
    },
    prizeSnapshot: {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      value: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes pour recherche et unicité
WinnerSchema.index({ claimCode: 1 }, { unique: true });
WinnerSchema.index({ commerceId: 1, status: 1 });
WinnerSchema.index({ expiresAt: 1 });
WinnerSchema.index({ campaignId: 1 });

const Winner: Model<IWinner> =
  mongoose.models.Winner || mongoose.model<IWinner>('Winner', WinnerSchema);

export default Winner;
