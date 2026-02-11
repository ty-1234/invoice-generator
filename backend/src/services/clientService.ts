import mongoose from 'mongoose';
import { Client } from '../models/Client';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

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

export const createClient = async (userId: string, input: CreateClientInput) => {
  return Client.create({
    userId: new mongoose.Types.ObjectId(userId),
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone?.trim(),
    billingAddress: input.billingAddress?.trim(),
  });
};

export const getClients = async (
  user: IUser,
  page = 1,
  limit = 20
): Promise<PaginatedResult<unknown>> => {
  const skip = (page - 1) * limit;
  const filter = user.role === 'admin' ? {} : { userId: user._id };
  const [data, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Client.countDocuments(filter),
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

export const getClientById = async (clientId: string, user: IUser) => {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  if (user.role !== 'admin' && client.userId.toString() !== user._id.toString()) {
    throw new AppError('Access denied', 403);
  }
  return client;
};

export const updateClient = async (clientId: string, user: IUser, input: UpdateClientInput) => {
  const client = await getClientById(clientId, user);
  Object.assign(client, {
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
    ...(input.phone !== undefined && { phone: input.phone?.trim() }),
    ...(input.billingAddress !== undefined && { billingAddress: input.billingAddress?.trim() }),
  });
  await client.save();
  return client;
};

export const deleteClient = async (clientId: string, user: IUser) => {
  const client = await getClientById(clientId, user);
  await Client.deleteOne({ _id: client._id });
};
