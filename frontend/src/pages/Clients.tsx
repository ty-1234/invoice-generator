import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clients';
import type { Client } from '../types';

export default function Clients() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, limit: 10 }],
    queryFn: () => clientsApi.list({ page, limit: 10 }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <Link
          to="/clients/new"
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          Add Client
        </Link>
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Phone</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((client: Client) => (
                    <tr key={client._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium">{client.name}</td>
                      <td className="px-6 py-4 text-slate-600">{client.email}</td>
                      <td className="px-6 py-4 text-slate-600">{client.phone || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/clients/${client._id}/edit`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
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
            <p>No clients yet.</p>
            <Link to="/clients/new" className="mt-2 inline-block text-primary-600 hover:text-primary-700 font-medium">
              Add your first client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
