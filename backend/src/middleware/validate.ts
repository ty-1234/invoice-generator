import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    const extracted = errors.array().map((err) => {
      if (err.type === 'field') {
        return { field: err.path, message: err.msg };
      }
      return { message: err.msg };
    });

    next(new AppError('Validation failed', 400, true, extracted));
  };
};
