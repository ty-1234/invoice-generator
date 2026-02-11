import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface UserItem {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export default function Users() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, limit: 10 }],
    queryFn: () => api.get<{ data: UserItem[]; meta: { page: number; totalPages: number; total: number; hasPrevPage: boolean; hasNextPage: boolean } }>(`/users?page=${page}&limit=10`),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Users</h1>
      <p className="text-slate-500 mb-4">Admin-only page. View all registered users.</p>

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
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((user: UserItem) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'}`}>
                          {user.role}
                        </span>
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
          <div className="p-12 text-center text-slate-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
