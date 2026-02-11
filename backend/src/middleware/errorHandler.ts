import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: unknown[];

  constructor(message: string, statusCode = 500, isOperational = true, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const errors = err instanceof AppError ? err.errors : undefined;

  if (!isOperational && config.env !== 'test') {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  }

  const response: Record<string, unknown> = {
    message,
    ...(errors && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
