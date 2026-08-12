import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Sparkles, Lock, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function StudentLoginPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginStudentData } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockedState, setBlockedState] = useState(null); // 'QUIZ_COMPLETED' | 'QUIZ_EXPIRED'

  useEffect(() => {
    // Reset previous student tokens when visiting a quiz link
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBlockedState(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/student/login', {
        email,
        password,
        assignmentToken: token,
      });

      if (res.data.success) {
        loginStudentData(res.data.token, res.data.student);
        localStorage.setItem('activeAssignmentToken', token);
        localStorage.setItem('activeQuizData', JSON.stringify(res.data.quiz));

        if (res.data.attemptId) {
          localStorage.setItem('activeAttemptId', res.data.attemptId);
        }

        navigate('/student/instructions');
      }
    } catch (err) {
      if (err.message.includes('Quiz Already Completed')) {
        setBlockedState('QUIZ_COMPLETED');
      } else if (err.message.includes('Assignment Expired') || err.message.includes('24-hour')) {
        setBlockedState('ASSIGNMENT_EXPIRED');
      } else if (err.message.includes('Quiz Expired')) {
        setBlockedState('QUIZ_EXPIRED');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Quiz Login</h1>
          <p className="text-xs text-slate-400 mt-1">Enter credentials sent to your email to start the exam</p>
        </div>

        {blockedState === 'QUIZ_COMPLETED' && (
          <div className="p-6 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-center space-y-2 mb-6">
            <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Quiz Already Completed</h3>
            <p className="text-xs text-amber-200">
              You have already completed this quiz. Multiple attempts are not allowed.
            </p>
          </div>
        )}

        {blockedState === 'ASSIGNMENT_EXPIRED' && (
          <div className="p-6 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-center space-y-2 mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Quiz Assignment Expired</h3>
            <p className="text-xs text-rose-200">
              The 24-hour window to take this assessment has passed. Please contact your administrator for a new invitation.
            </p>
          </div>
        )}

        {blockedState === 'QUIZ_EXPIRED' && (
          <div className="p-6 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-center space-y-2 mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Quiz Expired</h3>
            <p className="text-xs text-rose-200">The allowed time for this quiz has expired.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center space-x-3 text-xs text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!blockedState && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Student Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Validating Token...' : 'Access Examination'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
