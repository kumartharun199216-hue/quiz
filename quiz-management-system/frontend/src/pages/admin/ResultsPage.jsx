import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatIndianDateTime, generateCorporateEmailStatement } from '../../utils/formatters';
import { BarChart3, Search, Eye, ChevronLeft, ChevronRight, Mail, Copy, X } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Corporate Result Email Template Modal State
  const [activeMailModal, setActiveMailModal] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/results', {
        params: { search, status: statusFilter, quizType: typeFilter, page, limit: 10 },
      });
      if (res.data.success) {
        setResults(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('[Fetch Results Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Corporate result email statement copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Candidate Assessment Results</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review student performance, pass/fail status, and corporate result email templates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or quiz..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="Technical">Technical</option>
            <option value="Aptitude">Aptitude</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Quiz Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">%</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading results...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No results found matching your criteria.
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.attemptId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{row.studentName}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{row.studentEmail}</td>
                    <td className="py-3.5 px-4 font-medium">{row.quizTitle}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-medium">{row.quizType}</span>
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
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {row.resultStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatIndianDateTime(row.submittedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          setActiveMailModal({
                            studentName: row.studentName,
                            resultStatus: row.resultStatus,
                            statement: row.resultEmailStatement || generateCorporateEmailStatement(row),
                          })
                        }
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
                        title="View Corporate Result Mail Template"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Mail Template</span>
                      </button>

                      <Link
                        to={`/admin/results/${row.attemptId}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Analysis</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.pages}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Corporate Result Email Modal */}
      {activeMailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">
                  Corporate Result Email Template ({activeMailModal.resultStatus})
                </h3>
              </div>
              <button
                onClick={() => setActiveMailModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy this corporate-style result communication statement to mail directly to <strong className="text-white">{activeMailModal.studentName}</strong>.
            </p>

            <textarea
              readOnly
              rows="12"
              value={activeMailModal.statement}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none leading-relaxed"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setActiveMailModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(activeMailModal.statement)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Email Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
