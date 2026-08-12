import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { HelpCircle, Clock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function QuizInstructionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);

  useEffect(() => {
    const quizData = localStorage.getItem('activeQuizData');
    if (quizData) {
      setQuizInfo(JSON.parse(quizData));
    }
  }, []);

  const handleStartOrResume = async () => {
    setLoading(true);
    setError('');

    try {
      const assignmentToken = localStorage.getItem('activeAssignmentToken');
      const res = await api.post('/attempts/start', { assignmentToken });

      if (res.data.success) {
        localStorage.setItem('activeAttemptId', res.data.attemptId);
        navigate('/student/engine');
      }
    } catch (err) {
      if (err.message.includes('Quiz Already Completed')) {
        setError('Quiz Already Completed. You cannot attempt this quiz again.');
      } else if (err.message.includes('Quiz Expired')) {
        setError('Quiz Expired. The allowed time for this assessment has expired.');
      } else {
        setError(err.message || 'Failed to start quiz attempt.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Online Examination Platform
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2">{quizInfo?.title || 'Online Assessment'}</h1>
          <p className="text-xs text-slate-400 mt-1">{quizInfo?.description || 'Please read the instructions carefully before commencing.'}</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center space-x-3 text-xs text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-xs text-slate-400 font-medium">Duration</span>
            <p className="text-lg font-bold text-white">{quizInfo?.duration || 30} Minutes</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <HelpCircle className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-xs text-slate-400 font-medium">Navigation</span>
            <p className="text-lg font-bold text-white">One Q per Page</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xs text-slate-400 font-medium">Attempt Limit</span>
            <p className="text-lg font-bold text-white">Single Attempt</p>
          </div>
        </div>

        {/* Instructions list */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <h3 className="font-bold text-white text-sm">Important Examination Rules:</h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400">
            <li>You must see and answer <strong>one question at a time</strong>.</li>
            <li>You can select an answer and click <strong>Submit</strong> to save and move next.</li>
            <li>You can click <strong>Review Later</strong> to flag questions for review before final submission.</li>
            <li>You can click <strong>Skip</strong> to revisit unanswered questions later.</li>
            <li>Refreshing or navigating away will automatically <strong>resume your active timer and answers</strong>.</li>
            <li>The server timer is strictly enforced. Upon expiration, your attempt will be auto-submitted.</li>
            <li>Individual correct answers, current scores, and pass/fail statuses will <strong>NEVER</strong> be displayed to students.</li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleStartOrResume}
            disabled={loading}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Initializing Engine...' : 'Start Assessment Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
