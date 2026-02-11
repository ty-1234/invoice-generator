import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const register = async (input: RegisterInput): Promise<IUser> => {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name.trim(),
    role: 'user',
  });

  return user as IUser;
};

export const login = async (input: LoginInput): Promise<{ user: IUser; tokens: TokenPair }> => {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await generateTokenPair(user._id.toString(), user.email, user.role);

  return { user: user as IUser, tokens };
};

export const refreshTokens = async (refreshToken: string): Promise<TokenPair> => {
  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
    userId: string;
    email: string;
    role: string;
  };

  await RefreshToken.deleteOne({ token: refreshToken });

  return generateTokenPair(decoded.userId, decoded.email, decoded.role);
};

export const logout = async (refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
};

async function generateTokenPair(
  userId: string,
  email: string,
  role: string
): Promise<TokenPair> {
  const accessToken = jwt.sign(
    { userId, email, role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpires } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires } as jwt.SignOptions
  );

  const decoded = jwt.decode(refreshToken) as { exp?: number };
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt,
  });

  const accessDecoded = jwt.decode(accessToken) as { exp?: number };
  const expiresIn = accessDecoded?.exp ? accessDecoded.exp - Math.floor(Date.now() / 1000) : 900;

  return { accessToken, refreshToken, expiresIn };
}
