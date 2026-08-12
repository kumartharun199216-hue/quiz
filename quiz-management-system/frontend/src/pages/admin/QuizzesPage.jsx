import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HelpCircle,
  Plus,
  Edit,
  Copy,
  Eye,
  Send,
  BarChart2,
  Trash2,
  Clock,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewQuizData, setPreviewQuizData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      if (res.data.success) {
        setQuizzes(res.data.data);
      }
    } catch (err) {
      console.error('[Fetch Quizzes Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/quizzes/${id}/duplicate`);
      if (res.data.success) {
        fetchQuizzes();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${title}" and all its questions/attempts?`)) return;
    try {
      const res = await api.delete(`/quizzes/${id}`);
      if (res.data.success) {
        fetchQuizzes();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePreview = async (id) => {
    try {
      const res = await api.get(`/quizzes/${id}/preview`);
      if (res.data.success) {
        setPreviewQuizData(res.data.data);
        setShowPreviewModal(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Quiz Management</h1>
          <p className="text-slate-400 text-sm mt-1">Create, configure, preview, assign, and manage online assessments</p>
        </div>

        <Link
          to="/admin/quizzes/create"
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quiz</span>
        </Link>
      </div>

      {/* Quizzes Table */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Quiz Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Questions</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading quizzes...
                  </td>
                </tr>
              ) : quizzes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No quizzes found. Click "+ Create Quiz" to build your first quiz!
                  </td>
                </tr>
              ) : (
                quizzes.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>
                        <span className="text-sm">{q.title}</span>
                        {q.description && <p className="text-[11px] text-slate-400 truncate max-w-xs">{q.description}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md font-medium">{q.quizType}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-300">{q.questionCount || 0}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">{q.duration} mins</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{q.attemptCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          q.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Link
                        to={`/admin/quizzes/${q._id}/edit`}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg inline-block transition-colors"
                        title="Edit Quiz"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDuplicate(q._id)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                        title="Duplicate Quiz"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handlePreview(q._id)}
                        className="p-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                        title="Preview Quiz"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/admin/quizzes/${q._id}/assign`}
                        className="p-1.5 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-lg inline-block transition-colors"
                        title="Assign Quiz"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(q._id, q.title)}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
                        title="Delete Quiz"
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

      {/* Quiz Preview Modal (Simulating Student Exam Engine with Admin Answer Overlay) */}
      {showPreviewModal && previewQuizData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Admin Simulator Preview
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{previewQuizData.quiz?.title}</h2>
                <p className="text-xs text-slate-400">Duration: {previewQuizData.quiz?.duration} Mins | Total Questions: {previewQuizData.questions?.length}</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {previewQuizData.questions?.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No questions created for this quiz yet.</p>
              ) : (
                previewQuizData.questions?.map((q, idx) => (
                  <div key={q._id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-indigo-400 text-sm">Question {idx + 1} of {previewQuizData.questions.length}</span>
                      <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">Marks: {q.marks}</span>
                    </div>

                    <h4 className="text-base font-semibold text-white leading-relaxed">{q.questionText}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt) => {
                        const isCorrect = opt.key === q.correctAnswer;
                        return (
                          <div
                            key={opt.key}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                              isCorrect
                                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-semibold'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] uppercase font-extrabold text-emerald-400 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
