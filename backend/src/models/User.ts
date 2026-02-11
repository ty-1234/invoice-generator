import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
