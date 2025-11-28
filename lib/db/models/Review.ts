import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  campaignId: mongoose.Types.ObjectId;
  commerceId: mongoose.Types.ObjectId;
  clientEmail: string;
  clientName: string;
  clientGoogleId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string;
  googleReviewId?: string;
  googleReviewUrl?: string;
  status: 'pending' | 'posted' | 'failed';
  postedAt?: Date;
  participationId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
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
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientGoogleId: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
    },
    googleReviewId: {
      type: String,
    },
    googleReviewUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'posted', 'failed'],
      default: 'pending',
    },
    postedAt: {
      type: Date,
    },
    participationId: {
      type: Schema.Types.ObjectId,
      ref: 'Participation',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche et unicité
ReviewSchema.index({ campaignId: 1, clientEmail: 1 });
ReviewSchema.index({ commerceId: 1, status: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
