import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImport extends Document {
  userId: mongoose.Types.ObjectId;
  fileHash: string;
  fileName: string;
  createdAt: Date;
  stats: {
    newCount: number;
    duplicateCount: number;
    mergedCount: number;
    previouslyRemovedCount: number;
    skippedCount: number;
    failedCount: number;
  };
  perBook: {
    bookId: mongoose.Types.ObjectId;
    title: string;
    newCount: number;
  }[];
}

const ImportSchema = new Schema<IImport>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  fileHash: { type: String, required: true },
  fileName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  stats: {
    newCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    mergedCount: { type: Number, default: 0 },
    previouslyRemovedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 }
  },
  perBook: [
    {
      bookId: { type: Schema.Types.ObjectId, required: true, ref: 'Book' },
      title: { type: String, required: true },
      newCount: { type: Number, required: true }
    }
  ]
});

export const Import: Model<IImport> = mongoose.models.Import || mongoose.model<IImport>('Import', ImportSchema);
