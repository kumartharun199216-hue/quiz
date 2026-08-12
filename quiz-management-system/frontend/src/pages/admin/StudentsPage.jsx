import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: { search, page, limit: 10 },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('[Fetch Students Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleToggleStatus = async (studentObj) => {
    try {
      const res = await api.patch(`/students/${studentObj._id}/status`);
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Student Management</h1>
          <p className="text-slate-400 text-sm mt-1">View candidates, assigned quizzes, completion counts, and active status</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Quizzes</th>
                <th className="py-3.5 px-4">Completed Quizzes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading student list...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{s.email}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-300">{s.assignedQuizzes || 0}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{s.completedQuizzes || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          s.status === 'ACTIVE'
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700/60 text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.pages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
