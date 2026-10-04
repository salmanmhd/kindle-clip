import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  author: string | null;
  titleKey: string;
  highlightCount: number;
  lastReadIndex: number;
}

const BookSchema = new Schema<IBook>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  author: { type: String, default: null },
  titleKey: { type: String, required: true },
  highlightCount: { type: Number, default: 0 },
  lastReadIndex: { type: Number, default: 0 }
});

BookSchema.index({ userId: 1, titleKey: 1 }, { unique: true });

export const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
