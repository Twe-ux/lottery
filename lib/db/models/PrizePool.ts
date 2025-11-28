import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrizePoolPrize {
  prizeId: mongoose.Types.ObjectId;
  probability: {
    mode: 'fixed' | 'star-based';
    fixedPercent?: number;
    starBased?: {
      star1: number;
      star2: number;
      star3: number;
      star4: number;
      star5: number;
    };
  };
}

export interface IPrizePool extends Document {
  commerceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  prizes: IPrizePoolPrize[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrizePoolSchema = new Schema<IPrizePool>(
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
    prizes: [
      {
        prizeId: {
          type: Schema.Types.ObjectId,
          ref: 'Prize',
          required: true,
        },
        probability: {
          mode: {
            type: String,
            enum: ['fixed', 'star-based'],
            default: 'fixed',
          },
          fixedPercent: {
            type: Number,
            min: 0,
            max: 100,
          },
          starBased: {
            star1: { type: Number, min: 0, max: 100, default: 0 },
            star2: { type: Number, min: 0, max: 100, default: 0 },
            star3: { type: Number, min: 0, max: 100, default: 0 },
            star4: { type: Number, min: 0, max: 100, default: 0 },
            star5: { type: Number, min: 0, max: 100, default: 0 },
          },
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche par commerce
PrizePoolSchema.index({ commerceId: 1 });

const PrizePool: Model<IPrizePool> =
  mongoose.models.PrizePool || mongoose.model<IPrizePool>('PrizePool', PrizePoolSchema);

export default PrizePool;
