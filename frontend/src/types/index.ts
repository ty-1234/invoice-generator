export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
}

export interface LineItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  clientId: { _id: string; name: string; email: string } | string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  lineItems: LineItem[];
}

export interface PaginatedResponse<T> {
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
