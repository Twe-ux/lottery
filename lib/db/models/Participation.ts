import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParticipation extends Document {
  reviewId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  commerceId: mongoose.Types.ObjectId;
  clientEmail: string;
  clientName: string;
  prizeWonId: mongoose.Types.ObjectId;
  spinResult: {
    angle: number;
    segment: number;
  };
  createdAt: Date;
}

const ParticipationSchema = new Schema<IParticipation>(
  {
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
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    prizeWonId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    spinResult: {
      angle: {
        type: Number,
        required: true,
      },
      segment: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche
ParticipationSchema.index({ campaignId: 1, clientEmail: 1 });
ParticipationSchema.index({ commerceId: 1 });

const Participation: Model<IParticipation> =
  mongoose.models.Participation ||
  mongoose.model<IParticipation>('Participation', ParticipationSchema);

export default Participation;
