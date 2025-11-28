import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrize extends Document {
  commerceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  value?: number;
  stock?: number;
  isActive: boolean;
  displayOrder: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrizeSchema = new Schema<IPrize>(
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
    image: {
      type: String,
    },
    value: {
      type: Number,
    },
    stock: {
      type: Number,
      default: null, // null = illimité
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: '#3B82F6', // blue-500
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche par commerce
PrizeSchema.index({ commerceId: 1, isActive: 1 });

const Prize: Model<IPrize> = mongoose.models.Prize || mongoose.model<IPrize>('Prize', PrizeSchema);

export default Prize;
