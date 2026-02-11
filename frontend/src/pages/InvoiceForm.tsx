import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/invoices';
import { clientsApi } from '../api/clients';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price required'),
});

const schema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  issueDate: z.string().min(1, 'Issue date required'),
  dueDate: z.string().min(1, 'Due date required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
});

type FormData = z.infer<typeof schema>;

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: isEdit,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', { page: 1, limit: 100 }],
    queryFn: () => clientsApi.list({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
      navigate('/invoices');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      invoicesApi.update(id!, {
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency,
        notes: data.notes,
        terms: data.terms,
        lineItems: data.lineItems.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice updated');
      navigate('/invoices');
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      notes: '',
      terms: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');

  useEffect(() => {
    if (isEdit && invoice) {
      const clientId = typeof invoice.clientId === 'object' ? invoice.clientId?._id : invoice.clientId;
      reset({
        clientId: clientId ?? '',
        issueDate: invoice.issueDate?.split('T')[0] ?? '',
        dueDate: invoice.dueDate?.split('T')[0] ?? '',
        currency: invoice.currency ?? 'USD',
        notes: invoice.notes ?? '',
        terms: invoice.terms ?? '',
        lineItems: invoice.lineItems?.length
          ? invoice.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            }))
          : [{ description: '', quantity: 1, unitPrice: 0 }],
      });
    }
  }, [invoice, isEdit, reset]);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0
  );

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        clientId: data.clientId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency,
        notes: data.notes,
        terms: data.terms,
        lineItems: data.lineItems.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        })),
      });
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;
  const clients = clientsData?.data ?? [];

  if (isEdit && isLoading) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Edit Invoice' : 'New Invoice'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <select
              {...register('clientId')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select client</option>
              {clients.map((c: { _id: string; name: string }) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select
              {...register('currency')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date</label>
            <input
              {...register('issueDate')}
              type="date"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">Line Items</label>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add item
            </button>
          </div>
          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  {...register(`lineItems.${i}.description`)}
                  placeholder="Description"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  {...register(`lineItems.${i}.quantity`, { valueAsNumber: true })}
                  placeholder="Qty"
                  className="w-24 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  {...register(`lineItems.${i}.unitPrice`, { valueAsNumber: true })}
                  placeholder="Price"
                  className="w-28 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <span className="py-2.5 text-slate-600 w-20">
                  ${((lineItems[i]?.quantity ?? 0) * (lineItems[i]?.unitPrice ?? 0)).toFixed(2)}
                </span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-red-600 hover:text-red-700 p-2">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.lineItems && (
            <p className="mt-1 text-sm text-red-600">{errors.lineItems.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <p className="text-lg font-semibold">Subtotal: ${subtotal.toFixed(2)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Terms</label>
          <textarea
            {...register('terms')}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
