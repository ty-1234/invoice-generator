import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices';
import { clientsApi } from '../api/clients';

export default function Dashboard() {
  const { data: invoices } = useQuery({
    queryKey: ['invoices', { page: 1, limit: 5 }],
    queryFn: () => invoicesApi.list({ page: 1, limit: 5 }),
  });
  const { data: clients } = useQuery({
    queryKey: ['clients', { page: 1, limit: 5 }],
    queryFn: () => clientsApi.list({ page: 1, limit: 5 }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/invoices/new"
          className="block p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition"
        >
          <span className="text-3xl">📄</span>
          <h3 className="mt-2 font-semibold text-slate-900">New Invoice</h3>
          <p className="text-sm text-slate-500 mt-1">Create a new invoice</p>
        </Link>
        <Link
          to="/clients/new"
          className="block p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition"
        >
          <span className="text-3xl">👤</span>
          <h3 className="mt-2 font-semibold text-slate-900">Add Client</h3>
          <p className="text-sm text-slate-500 mt-1">Add a new client</p>
        </Link>
        <div className="block p-6 bg-white rounded-xl border border-slate-200">
          <span className="text-3xl">📋</span>
          <h3 className="mt-2 font-semibold text-slate-900">{invoices?.meta?.total ?? 0}</h3>
          <p className="text-sm text-slate-500 mt-1">Total Invoices</p>
        </div>
        <div className="block p-6 bg-white rounded-xl border border-slate-200">
          <span className="text-3xl">👥</span>
          <h3 className="mt-2 font-semibold text-slate-900">{clients?.meta?.total ?? 0}</h3>
          <p className="text-sm text-slate-500 mt-1">Total Clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {invoices?.data?.length ? (
              invoices.data.map((inv: { _id: string; number: string; total: number; status: string }) => (
                <Link
                  key={inv._id}
                  to={`/invoices/${inv._id}`}
                  className="block px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{inv.number}</span>
                    <span className="text-slate-600">${inv.total.toFixed(2)}</span>
                  </div>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${statusClass(inv.status)}`}>
                    {inv.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-6 py-8 text-slate-500 text-center">No invoices yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Recent Clients</h2>
            <Link to="/clients" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {clients?.data?.length ? (
              clients.data.map((c: { _id: string; name: string; email: string }) => (
                <Link
                  key={c._id}
                  to={`/clients/${c._id}/edit`}
                  className="block px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-slate-500">{c.email}</div>
                </Link>
              ))
            ) : (
              <p className="px-6 py-8 text-slate-500 text-center">No clients yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}
