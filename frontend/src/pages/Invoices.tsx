import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices';
import type { Invoice } from '../types';

const statusClass: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function Invoices() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page, limit: 10, status: statusFilter || undefined }],
    queryFn: () => invoicesApi.list({ page, limit: 10, status: statusFilter || undefined }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <Link
          to="/invoices/new"
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          New Invoice
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : data?.data?.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Number</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Due Date</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Total</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((inv: Invoice) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium">{inv.number}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {typeof inv.clientId === 'object' ? inv.clientId?.name : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusClass[inv.status] ?? 'bg-slate-100'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {inv.currency} {inv.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.meta && data.meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.meta.hasPrevPage}
                    className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.meta.hasNextPage}
                    className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <p>No invoices yet.</p>
            <Link to="/invoices/new" className="mt-2 inline-block text-primary-600 hover:text-primary-700 font-medium">
              Create your first invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
