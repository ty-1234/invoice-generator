import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { config } from '../config';
import { User } from '../models/User';

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string, expiresIn: number) => {
  const isProduction = config.env === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: expiresIn * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const user = await authService.register({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
  });

  const { tokens } = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  setTokenCookies(res, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { user, tokens } = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  setTokenCookies(res, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) {
    res.status(401).json({ message: 'Refresh token required' });
    return;
  }

  const tokens = await authService.refreshTokens(token);
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);

  res.json({
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  await authService.logout(token);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
};
