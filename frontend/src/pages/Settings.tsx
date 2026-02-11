import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
        <h2 className="font-semibold text-slate-900 mb-2">About</h2>
        <p className="text-slate-600 text-sm">
          Invoice Generator for Freelancers. Manage your clients and invoices in one place.
        </p>
      </div>
    </div>
  );
}
