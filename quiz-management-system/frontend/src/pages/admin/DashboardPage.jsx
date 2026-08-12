import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatIndianDateTime } from '../../utils/formatters';
import {
  BarChart3,
  HelpCircle,
  Users,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Percent,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, resultsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/results', {
          params: {
            search,
            status: statusFilter,
            quizType: typeFilter,
            page,
            limit: 10,
          },
        }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (resultsRes.data.success) {
        setResults(resultsRes.data.data);
        setPagination(resultsRes.data.pagination);
      }
    } catch (err) {
      console.error('[Dashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDashboardData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of assessment performance, system statistics, and student results</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Attempts</span>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats?.totalAttempts || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Across all registered quizzes</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quizzes</span>
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats?.totalQuizzes || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Active assessments in system</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats?.totalStudents || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Assigned candidates</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</span>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats?.averageScore || 0}%</p>
          <p className="text-xs text-slate-400 mt-1">Overall percentage average</p>
        </div>
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Completed</span>
            <p className="text-lg font-bold text-white">{stats?.completedAttempts || 0}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">In Progress</span>
            <p className="text-lg font-bold text-white">{stats?.inProgressAttempts || 0}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Expired</span>
            <p className="text-lg font-bold text-white">{stats?.expiredAttempts || 0}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Pass Rate</span>
            <p className="text-lg font-bold text-white">{stats?.passPercentage || 0}%</p>
          </div>
        </div>
      </div>

      {/* Results Table Section */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Quiz Results</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filterable list of student assessment submissions</p>
          </div>

          {/* Filters Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or quiz..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="Technical">Technical</option>
              <option value="Aptitude">Aptitude</option>
              <option value="General">General</option>
            </select>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Student Email</th>
                <th className="py-3.5 px-4">Quiz Name</th>
                <th className="py-3.5 px-4">Quiz Type</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Percentage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    Loading dashboard results...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                    No results found matching criteria.
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.attemptId} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{row.studentName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{row.studentEmail}</td>
                    <td className="py-3.5 px-4 font-medium">{row.quizTitle}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md font-medium text-[11px]">
                        {row.quizType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{row.scoreText}</td>
                    <td className="py-3.5 px-4 font-bold">{row.percentage}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.resultStatus === 'Passed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : row.resultStatus === 'Failed'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : row.attemptStatus === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {row.resultStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatIndianDateTime(row.submittedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/results/${row.attemptId}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
            <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total records)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
