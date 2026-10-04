import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
  settings: {
    theme: 'paper' | 'sepia' | 'night';
    fontScale: number;
    lineHeight: number;
    dailyEmail: boolean;
    timezone: string;
  };
  unsubscribeToken: string;
  lastDailyEmailDate: string | null;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  settings: {
    theme: { type: String, enum: ['paper', 'sepia', 'night'], default: 'paper' },
    fontScale: { type: Number, default: 1 },
    lineHeight: { type: Number, default: 1.6 },
    dailyEmail: { type: Boolean, default: false },
    timezone: { type: String, default: 'UTC' }
  },
  unsubscribeToken: { type: String, required: true },
  lastDailyEmailDate: { type: String, default: null }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
