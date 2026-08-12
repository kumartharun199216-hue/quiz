import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatIndianDateTime, generateCorporateEmailStatement } from '../../utils/formatters';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Award, User, Clock, Mail, Copy, X } from 'lucide-react';

export default function AttemptDetailPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMailModal, setShowMailModal] = useState(false);

  useEffect(() => {
    loadAttemptAnalysis();
  }, [attemptId]);

  const loadAttemptAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/results/${attemptId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load attempt details.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Corporate result email statement copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        <span>Loading detailed candidate analysis...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Analysis Error</h3>
        <p className="text-xs text-rose-200">{error || 'Data not found.'}</p>
        <button
          onClick={() => navigate('/admin/results')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl"
        >
          Back to Results
        </button>
      </div>
    );
  }

  const { student, quiz, questionAnalysis } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <button onClick={() => navigate('/admin/results')} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Candidate Performance Analysis</h1>
          <p className="text-xs text-slate-400">Deep-dive question analysis and corporate mail templates</p>
        </div>
      </div>

      {/* Candidate & Quiz Overview Card */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{student?.name}</h2>
              <p className="text-xs font-mono text-slate-400">{student?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMailModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
            >
              <Mail className="w-4 h-4" />
              <span>Result Mail Template</span>
            </button>

            <span
              className={`px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider ${
                data.resultStatus === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              Result: {data.resultStatus}
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Quiz Name</span>
            <strong className="text-white font-semibold block truncate">{quiz?.title}</strong>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Final Score</span>
            <strong className="text-indigo-400 font-extrabold text-sm">{data.obtainedMarks} / {data.totalMarks}</strong>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Percentage</span>
            <strong className="text-white font-bold text-sm">{data.percentage}%</strong>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Correct</span>
            <strong className="text-emerald-400 font-bold text-sm">{data.correctAnswers}</strong>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Submitted At</span>
            <strong className="text-white font-mono text-[11px] block">{formatIndianDateTime(data.submittedAt)}</strong>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block mb-0.5">Passing Target</span>
            <strong className="text-amber-400 font-bold text-sm">{data.passingPercentage}%</strong>
          </div>
        </div>
      </div>

      {/* Detailed Question Analysis List */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-white">Question-by-Question Evaluation ({questionAnalysis.length})</h3>

        {questionAnalysis.map((item) => {
          const isCorrect = item.result === 'Correct';
          const isWrong = item.result === 'Wrong';

          return (
            <div
              key={item.questionId}
              className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                isCorrect
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : isWrong
                  ? 'bg-slate-900/90 border-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
                <h4 className="text-sm font-semibold text-white">
                  Q{item.questionNumber}. {item.questionText}
                </h4>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="font-mono text-slate-400">Marks: {item.marksEarned}/{item.questionMarks}</span>
                  {isCorrect && (
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  )}
                  {isWrong && (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-bold flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Wrong</span>
                    </span>
                  )}
                  {!isCorrect && !isWrong && (
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-bold">
                      Skipped
                    </span>
                  )}
                </div>
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {item.options.map((opt) => {
                  const isSelected = item.studentAnswer === opt.key;
                  const isRightAnswer = item.correctAnswer === opt.key;

                  let optionStyle = 'bg-slate-950/60 border-slate-800 text-slate-300';
                  if (isRightAnswer) {
                    optionStyle = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold';
                  } else if (isSelected && !isRightAnswer) {
                    optionStyle = 'bg-rose-950/60 border-rose-500/50 text-rose-300 font-semibold';
                  }

                  return (
                    <div key={opt.key} className={`p-2.5 rounded-xl border flex items-center space-x-2 ${optionStyle}`}>
                      <span className="font-bold shrink-0">{opt.key}.</span>
                      <span className="grow">{opt.text}</span>
                      {isRightAnswer && <span className="text-[10px] text-emerald-400 uppercase font-bold shrink-0">(Correct Key)</span>}
                      {isSelected && !isRightAnswer && <span className="text-[10px] text-rose-400 uppercase font-bold shrink-0">(Selected)</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Corporate Result Email Modal */}
      {showMailModal && (() => {
        const mailStatementText =
          data.resultEmailStatement ||
          generateCorporateEmailStatement({
            studentName: student?.name,
            studentEmail: student?.email,
            quizTitle: quiz?.title,
            obtainedMarks: data.obtainedMarks,
            totalMarks: data.totalMarks,
            percentage: data.percentage,
            passingPercentage: data.passingPercentage,
            resultStatus: data.resultStatus,
            submittedAt: data.submittedAt,
          });

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-extrabold text-white">
                    Corporate Result Email Template ({data.resultStatus})
                  </h3>
                </div>
                <button
                  onClick={() => setShowMailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Copy this corporate-style result communication statement to mail directly to <strong className="text-white">{student?.name}</strong> ({student?.email}).
              </p>

              <textarea
                readOnly
                rows="12"
                value={mailStatementText}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none leading-relaxed"
              />

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowMailModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => copyToClipboard(mailStatementText)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Email Statement</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
