import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getUsers = async (
  page = 1,
  limit = 20
): Promise<PaginatedResult<unknown>> => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
