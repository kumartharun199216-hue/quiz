import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatIndianDateTime } from '../../utils/formatters';
import { Send, ArrowLeft, Mail, CheckCircle2, Copy, AlertCircle, FileText, X } from 'lucide-react';

export default function QuizAssignPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [emailsInput, setEmailsInput] = useState('');
  const [assignedList, setAssignedList] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Template Modal for existing assignments
  const [activeTemplateModal, setActiveTemplateModal] = useState(null);

  useEffect(() => {
    loadQuizAndAssignments();
  }, [id]);

  const loadQuizAndAssignments = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get(`/quizzes/${id}/assignments`),
      ]);
      if (qRes.data.success) setQuiz(qRes.data.data);
      if (aRes.data.success) setAssignedList(aRes.data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    const emails = emailsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));

    if (emails.length === 0) {
      setError('Please enter at least one valid student email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post(`/quizzes/${id}/assign`, { emails });
      if (res.data.success) {
        setResults(res.data.data);
        setEmailsInput('');
        loadQuizAndAssignments();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    alert(message);
  };

  const generateStatementText = (email, password, quizTitle, link, assignedAt, expiresAt) => {
    const assignedStr = formatIndianDateTime(assignedAt || new Date());
    const expiresStr = formatIndianDateTime(expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000));
    return `You have been invited to take a quiz.\n\nQuiz:\n${quizTitle}\n\nLogin Email:\n${email}\n\nPassword:\n${password}\n\nQuiz Link:\n${link}\n\nAssigned Date & Time:\n${assignedStr}\n\nAssignment Expiry Date & Time:\n${expiresStr} (Valid for 24 hours)`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <button onClick={() => navigate('/admin/quizzes')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Assign Quiz to Candidates</h1>
          <p className="text-xs text-slate-400">
            Target Quiz: <strong className="text-indigo-400">{quiz?.title}</strong> ({quiz?.duration} Mins)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Assignment Form */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          <span>Enter Candidate Email Addresses</span>
        </h2>

        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Student Emails (Comma or newline separated)
            </label>
            <textarea
              rows="4"
              required
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="student1@gmail.com, student2@gmail.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Assigning & Generating Templates...' : 'Assign Quiz & Generate Email Templates'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Email Invitation Templates Section */}
      {results && results.length > 0 && (
        <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3 text-emerald-400 font-bold border-b border-slate-700/60 pb-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white">Quiz Assigned Successfully!</h3>
              <p className="text-xs text-slate-300 font-normal">
                Copy and paste the exact statement template below to send directly to candidate(s):
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {results.map((r, index) => (
              <div key={r.token || index} className="bg-slate-950 border border-slate-700/70 rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      {index + 1}
                    </span>
                    <span className="text-white font-bold text-sm">{r.email}</span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(r.emailStatement, 'Email statement copied! You can now paste it into your email program.')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Complete Email Statement</span>
                  </button>
                </div>

                {/* Styled Email Template Display Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-3 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600 selection:text-white">
                  {r.emailStatement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Assignments Table */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Existing Quiz Assignments ({assignedList.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Student Email</th>
                <th className="py-3 px-4">Assignment Token</th>
                <th className="py-3 px-4">Assigned Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Email Template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {assignedList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    No active assignments for this quiz.
                  </td>
                </tr>
              ) : (
                assignedList.map((a) => {
                  const link = `${window.location.origin}/quiz/${a.assignmentToken}`;
                  const templateText = generateStatementText(a.email, 'Use registered password', quiz?.title || 'Quiz', link, a.assignedAt, a.expiresAt);

                  return (
                    <tr key={a._id} className="hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-semibold text-white">{a.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 truncate max-w-xs">{a.assignmentToken}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatIndianDateTime(a.assignedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px]">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setActiveTemplateModal({ email: a.email, statement: templateText })}
                          className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg inline-flex items-center space-x-1 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Template</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(link, 'Quiz link copied!')}
                          className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg inline-flex items-center"
                          title="Copy Link Only"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for View Template */}
      {activeTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <button onClick={() => setActiveTemplateModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span>Email Statement Template</span>
            </h3>
            <p className="text-xs text-slate-400">Target Candidate: <strong className="text-white">{activeTemplateModal.email}</strong></p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
              {activeTemplateModal.statement}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setActiveTemplateModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(activeTemplateModal.statement, 'Statement copied to clipboard!')}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
