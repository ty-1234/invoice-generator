import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientsApi } from '../api/clients';
import { useEffect } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id!),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created');
      navigate('/clients');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => clientsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Client updated');
      navigate('/clients');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', billingAddress: '' },
  });

  useEffect(() => {
    if (isEdit && client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        billingAddress: client.billingAddress || '',
      });
    }
  }, [isEdit, client, reset]);

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Edit Client' : 'Add Client'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Client name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="client@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            {...register('phone')}
            type="text"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
          <textarea
            {...register('billingAddress')}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Address"
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
