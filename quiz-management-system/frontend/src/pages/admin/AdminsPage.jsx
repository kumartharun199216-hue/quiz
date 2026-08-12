import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export default function AdminsPage() {
  const { isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  const [newPassword, setNewPassword] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admins');
      if (res.data.success) {
        setAdmins(res.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await api.post('/admins', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      });

      if (res.data.success) {
        setSuccessMsg('Admin account created successfully.');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADMIN', status: 'ACTIVE' });
        fetchAdmins();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (adminObj) => {
    if (adminObj.isInitialSuperAdmin || adminObj.email === 'admin@quiz.com') {
      alert('The initial Super Admin cannot be deactivated.');
      return;
    }

    try {
      const newStatus = adminObj.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await api.patch(`/admins/${adminObj._id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchAdmins();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (adminObj) => {
    if (adminObj.isInitialSuperAdmin || adminObj.email === 'admin@quiz.com') {
      alert('The initial Super Admin cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete admin "${adminObj.name}"?`)) return;

    try {
      const res = await api.delete(`/admins/${adminObj._id}`);
      if (res.data.success) {
        fetchAdmins();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await api.patch(`/admins/${selectedAdmin._id}/reset-password`, { newPassword });
      if (res.data.success) {
        setSuccessMsg(`Password reset for ${selectedAdmin.name}.`);
        setShowResetModal(false);
        setNewPassword('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center text-rose-300">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-1">Super Admin privileges are required to access Admin Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>Admin Management</span>
            <span className="px-2.5 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
              Super Admin Only
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform administrators, assign roles, and configure credentials</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Admin</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading admin accounts...
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center space-x-2">
                      <span>{a.name}</span>
                      {a.isInitialSuperAdmin && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full border border-amber-500/30 font-bold">
                          Initial Super Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{a.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          a.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(a)}
                        disabled={a.isInitialSuperAdmin || a.email === 'admin@quiz.com'}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors disabled:opacity-30 ${
                          a.status === 'ACTIVE'
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAdmin(a);
                          setShowResetModal(true);
                        }}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(a)}
                        disabled={a.isInitialSuperAdmin || a.email === 'admin@quiz.com'}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors disabled:opacity-30"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Create New Admin</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30"
                >
                  Save Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">Target: {selectedAdmin.name} ({selectedAdmin.email})</p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
