import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout() {
  const { admin, isSuperAdmin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quizzes', path: '/admin/quizzes', icon: HelpCircle },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Results', path: '/admin/results', icon: BarChart3 },
    ...(isSuperAdmin ? [{ name: 'Admins', path: '/admin/admins', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">QuizMaster</h1>
            <span className="text-xs text-indigo-400 font-medium">Assessment Platform</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-semibold border border-slate-700">
            {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin User'}</p>
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                isSuperAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {admin?.role || 'ADMIN'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-base">QuizMaster</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-30 bg-slate-950 p-6 flex flex-col justify-between border-b border-slate-800">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium text-base ${
                      isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowSettingsModal(true);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-slate-900"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-900 p-4 md:p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">System Settings</h3>
                <p className="text-xs text-slate-400">Environment & Security Configuration</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Admin Account</span>
                <p className="text-white font-medium mt-1">{admin?.email}</p>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5">{admin?.role}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">JWT Security</span>
                <p className="text-emerald-400 font-medium mt-1">24-Hour Expiry Enabled</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Email Service</span>
                <p className="text-indigo-300 font-medium mt-1">Nodemailer SMTP Active</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
