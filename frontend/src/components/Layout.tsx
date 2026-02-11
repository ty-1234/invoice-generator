import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive ? 'bg-primary-100 text-primary-800' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-primary-600">Invoice Generator</h1>
          <p className="text-sm text-slate-500 mt-0.5">For Freelancers</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" className={navClass} end>Dashboard</NavLink>
          <NavLink to="/invoices" className={navClass}>Invoices</NavLink>
          <NavLink to="/clients" className={navClass}>Clients</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/users" className={navClass}>Users</NavLink>
          )}
          <NavLink to="/settings" className={navClass}>Settings</NavLink>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
