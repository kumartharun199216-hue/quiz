import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Clock,
  CheckCircle2,
  Bookmark,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Send,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';

export default function QuizEnginePage() {
  const navigate = useNavigate();
  const attemptId = localStorage.getItem('activeAttemptId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptData, setAttemptData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [answersMap, setAnswersMap] = useState({}); // { questionId: { selectedOption, status } }
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Flow views: 'EXAM' | 'END_SUMMARY' | 'FINAL_CONFIRM' | 'SUBMITTED'
  const [viewState, setViewState] = useState('EXAM');
  const [isSaving, setIsSaving] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch Attempt State & Safe Questions
  useEffect(() => {
    if (!attemptId) {
      navigate('/student/instructions');
      return;
    }
    loadAttemptDetails();
  }, [attemptId]);

  const loadAttemptDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attempts/${attemptId}`);
      if (res.data.success) {
        const { attemptId: aId, status, remainingSeconds: remSec, currentQuestion, answers, quiz, questions: qList } = res.data.data;

        if (status === 'COMPLETED') {
          setViewState('SUBMITTED');
          setLoading(false);
          return;
        }

        if (status === 'EXPIRED') {
          setError('Quiz Expired. The allowed time for this quiz has expired.');
          setLoading(false);
          return;
        }

        setAttemptData(res.data.data);
        setQuestions(qList || []);
        setRemainingSeconds(remSec || 0);

        // Build answers map
        const aMap = {};
        (answers || []).forEach((ans) => {
          aMap[ans.questionId] = {
            selectedOption: ans.selectedOption || '',
            status: ans.status || 'NOT_VISITED',
          };
        });
        setAnswersMap(aMap);

        const initialIdx = currentQuestion >= 0 && currentQuestion < qList.length ? currentQuestion : 0;
        setCurrentIndex(initialIdx);

        const currentQ = qList[initialIdx];
        if (currentQ && aMap[currentQ._id]) {
          setSelectedOption(aMap[currentQ._id].selectedOption);
        }
      }
    } catch (err) {
      if (err.message.includes('Completed')) {
        setViewState('SUBMITTED');
      } else {
        setError(err.message || 'Failed to load examination.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time Countdown Timer
  useEffect(() => {
    if (remainingSeconds <= 0 || viewState === 'SUBMITTED') return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, viewState]);

  // Sync selectedOption when currentIndex changes
  useEffect(() => {
    const q = questions[currentIndex];
    if (q) {
      const existing = answersMap[q._id];
      setSelectedOption(existing ? existing.selectedOption : '');
    }
  }, [currentIndex, questions, answersMap]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save answer to backend helper
  const saveAnswerToBackend = async (qId, option, status, nextIdx) => {
    setIsSaving(true);
    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId: qId,
        selectedOption: option,
        status,
        currentQuestion: nextIdx,
      });

      setAnswersMap((prev) => ({
        ...prev,
        [qId]: { selectedOption: option, status },
      }));
    } catch (err) {
      console.warn('[Auto-save warning]', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (actionType) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    let newStatus = 'NOT_VISITED';
    if (actionType === 'SUBMIT') {
      newStatus = selectedOption ? 'ANSWERED' : 'SKIPPED';
    } else if (actionType === 'REVIEW') {
      newStatus = 'REVIEW_LATER';
    } else if (actionType === 'SKIP') {
      newStatus = 'SKIPPED';
    }

    const nextIdx = currentIndex + 1;
    await saveAnswerToBackend(currentQ._id, selectedOption, newStatus, nextIdx < questions.length ? nextIdx : currentIndex);

    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
    } else {
      setViewState('END_SUMMARY');
    }
  };

  const handleSelectQuestion = (idx) => {
    setCurrentIndex(idx);
    setViewState('EXAM');
    setMobileDrawerOpen(false);
  };

  const handleAutoSubmit = async () => {
    try {
      await api.post(`/attempts/${attemptId}/submit`);
      setViewState('SUBMITTED');
    } catch (err) {
      setViewState('SUBMITTED');
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSaving(true);
      const res = await api.post(`/attempts/${attemptId}/submit`);
      if (res.data.success) {
        setViewState('SUBMITTED');
      }
    } catch (err) {
      alert(err.message || 'Submission failed.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-bold">Loading examination engine...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Examination Error</h2>
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  // VIEW 1: SUBMITTED CONFIRMATION SCREEN (STRICT ZERO LEAK RESULT)
  if (viewState === 'SUBMITTED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white">Quiz Submitted Successfully</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Your responses have been securely recorded into the system.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
            Thank you for completing the examination.
          </div>
        </div>
      </div>
    );
  }

  // Summary statistics for navigator
  const currentQ = questions[currentIndex];
  let answeredCount = 0;
  let reviewCount = 0;
  let skippedCount = 0;

  questions.forEach((q) => {
    const st = answersMap[q._id]?.status;
    if (st === 'ANSWERED') answeredCount++;
    else if (st === 'REVIEW_LATER') reviewCount++;
    else if (st === 'SKIPPED') skippedCount++;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Examination Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base md:text-lg leading-tight truncate max-w-xs md:max-w-md">
              {attemptData?.quiz?.title || 'Online Assessment'}
            </h1>
            <span className="text-[11px] text-slate-400">Candidate Exam Mode</span>
          </div>
        </div>

        {/* Server-Synced Timer */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${
            remainingSeconds < 300
              ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-indigo-300'
          }`}>
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Time Remaining: {formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-2 bg-slate-800 text-slate-200 rounded-xl"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column: Examination Area */}
        <div className="md:col-span-3 space-y-6">
          {viewState === 'EXAM' && currentQ && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
              <div className="space-y-6">
                {/* Question Info */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {isSaving && <span className="text-[10px] text-slate-500 animate-pulse">Auto-saving response...</span>}
                </div>

                {/* Question Text */}
                <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  {currentQ.questionText}
                </h2>

                {/* 4 Large Radio Option Cards */}
                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {currentQ.options?.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    return (
                      <label
                        key={opt.key}
                        onClick={() => setSelectedOption(opt.key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-semibold'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-sm">{opt.text}</span>
                        </div>
                        <input
                          type="radio"
                          name="quizOption"
                          value={opt.key}
                          checked={isSelected}
                          onChange={() => setSelectedOption(opt.key)}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Submit, Review Later, Skip */}
              <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAction('REVIEW')}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition-all"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Review Later</span>
                  </button>

                  <button
                    onClick={() => handleAction('SKIP')}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip Question</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {currentIndex > 0 && attemptData?.quiz?.allowBackNavigation !== false && (
                    <button
                      onClick={() => setCurrentIndex(currentIndex - 1)}
                      className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleAction('SUBMIT')}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>Submit & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: END OF QUESTIONS SUMMARY */}
          {viewState === 'END_SUMMARY' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center border border-indigo-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">You have reached the end of the quiz</h2>
                <p className="text-xs text-slate-400">Review your question summary below before making final submission</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Total Questions</span>
                  <strong className="text-xl font-extrabold text-white">{questions.length}</strong>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Answered</span>
                  <strong className="text-xl font-extrabold text-emerald-400">{answeredCount}</strong>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Review Later</span>
                  <strong className="text-xl font-extrabold text-amber-400">{reviewCount}</strong>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Skipped</span>
                  <strong className="text-xl font-extrabold text-rose-400">{skippedCount}</strong>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4 pt-4">
                <button
                  onClick={() => setViewState('EXAM')}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Review Questions</span>
                </button>

                <button
                  onClick={() => setViewState('FINAL_CONFIRM')}
                  className="inline-flex items-center space-x-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: FINAL SUBMISSION CONFIRMATION MODAL */}
          {viewState === 'FINAL_CONFIRM' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-w-lg mx-auto text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white">You are ready to submit your quiz</h3>
                <p className="text-xs text-slate-400 mt-1">Once submitted, you cannot attempt this quiz again.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p>Total Questions: <strong>{questions.length}</strong></p>
                <p>Answered: <strong className="text-emerald-400">{answeredCount}</strong></p>
                <p>Review Later: <strong className="text-amber-400">{reviewCount}</strong></p>
                <p>Skipped: <strong className="text-rose-400">{skippedCount}</strong></p>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">Your score will not be displayed to you upon submission.</p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setViewState('END_SUMMARY')}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30"
                >
                  {isSaving ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column / Drawer: Question Navigator Grid */}
        <div className={`md:block ${mobileDrawerOpen ? 'block' : 'hidden'} bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-fit space-y-6`}>
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Question Navigator</h3>
            <p className="text-[11px] text-slate-400">Click any number to jump to question</p>
          </div>

          {/* Navigator Grid */}
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const userAns = answersMap[q._id];
              const st = userAns?.status || 'NOT_VISITED';
              const isCurrent = idx === currentIndex && viewState === 'EXAM';

              let tileStyle = 'bg-slate-950 text-slate-400 border-slate-800';
              if (st === 'ANSWERED') {
                tileStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
              } else if (st === 'REVIEW_LATER') {
                tileStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
              } else if (st === 'SKIPPED') {
                tileStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
              }

              if (isCurrent) {
                tileStyle += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900';
              }

              return (
                <button
                  key={q._id}
                  onClick={() => handleSelectQuestion(idx)}
                  className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${tileStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Status Legend (No Correctness Exposed!) */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span>
              <span>Review Later</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50"></span>
              <span>Skipped</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800"></span>
              <span>Not Visited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
