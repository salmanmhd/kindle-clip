import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHighlight extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  kind: 'highlight' | 'note';
  text: string;
  normText: string;
  textHash: string;
  locStart: number;
  locEnd: number;
  page: number | null;
  note: string | null;
  favorite: boolean;
  highlightedAt: Date | null;
  source: 'kindle' | 'manual';
  deletedAt: Date | null;
  lastShownAt: Date | null;
  emailedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const HighlightSchema = new Schema<IHighlight>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    bookId: { type: Schema.Types.ObjectId, required: true, ref: 'Book' },
    kind: { type: String, enum: ['highlight', 'note'], required: true },
    text: { type: String, required: true },
    normText: { type: String, required: true },
    textHash: { type: String, required: true },
    locStart: { type: Number, required: true },
    locEnd: { type: Number, required: true },
    page: { type: Number, default: null },
    note: { type: String, default: null },
    favorite: { type: Boolean, default: false },
    highlightedAt: { type: Date, default: null },
    source: { type: String, enum: ['kindle', 'manual'], required: true, default: 'kindle' },
    deletedAt: { type: Date, default: null },
    lastShownAt: { type: Date, default: null },
    emailedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

HighlightSchema.index({ userId: 1, bookId: 1, textHash: 1 }, { unique: true });
HighlightSchema.index({ userId: 1, bookId: 1, locStart: 1 });
HighlightSchema.index({ userId: 1, favorite: 1 });
HighlightSchema.index({ userId: 1, deletedAt: 1 });

export const Highlight: Model<IHighlight> = mongoose.models.Highlight || mongoose.model<IHighlight>('Highlight', HighlightSchema);
