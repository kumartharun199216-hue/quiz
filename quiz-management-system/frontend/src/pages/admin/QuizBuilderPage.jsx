import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HelpCircle,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowLeft,
  X,
} from 'lucide-react';

export default function QuizBuilderPage() {
  const { id } = useParams(); // If id exists, edit mode
  const isEdit = !!id;
  const navigate = useNavigate();

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    quizType: 'Technical',
    duration: 30,
    passingPercentage: 50,
    hasSections: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    allowBackNavigation: true,
    enableNegativeMarking: false,
  });

  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    sectionId: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1,
    negativeMarks: 0,
  });

  useEffect(() => {
    if (isEdit) {
      loadQuizDetails();
    }
  }, [id]);

  const loadQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}`);
      if (res.data.success) {
        const q = res.data.data;
        setQuizForm({
          title: q.title || '',
          description: q.description || '',
          quizType: q.quizType || 'Technical',
          duration: q.duration || 30,
          passingPercentage: q.passingPercentage || 50,
          hasSections: q.hasSections || false,
          randomizeQuestions: q.randomizeQuestions || false,
          randomizeOptions: q.randomizeOptions || false,
          allowBackNavigation: q.allowBackNavigation !== undefined ? q.allowBackNavigation : true,
          enableNegativeMarking: q.enableNegativeMarking || false,
        });
        setSections(q.sections || []);
        setQuestions(q.questions || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');

    try {
      if (isEdit) {
        const res = await api.put(`/quizzes/${id}`, quizForm);
        if (res.data.success) {
          setSaveSuccess('Quiz details updated successfully.');
        }
      } else {
        const res = await api.post('/quizzes', quizForm);
        if (res.data.success) {
          const newQuizId = res.data.data._id;
          navigate(`/admin/quizzes/${newQuizId}/edit`);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    try {
      const res = await api.post(`/quizzes/${id}/sections`, {
        title: sectionTitle,
        description: sectionDesc,
      });

      if (res.data.success) {
        setSections([...sections, res.data.data]);
        setShowSectionModal(false);
        setSectionTitle('');
        setSectionDesc('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (secId) => {
    if (!window.confirm('Delete section? Associated questions will become unsectioned.')) return;
    try {
      await api.delete(`/sections/${secId}`);
      setSections(sections.filter((s) => s._id !== secId));
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      sectionId: sections.length > 0 ? sections[0]._id : '',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      marks: 1,
      negativeMarks: 0,
    });
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    const optA = q.options?.find((o) => o.key === 'A')?.text || '';
    const optB = q.options?.find((o) => o.key === 'B')?.text || '';
    const optC = q.options?.find((o) => o.key === 'C')?.text || '';
    const optD = q.options?.find((o) => o.key === 'D')?.text || '';

    setQuestionForm({
      sectionId: q.sectionId || '',
      questionText: q.questionText,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: q.correctAnswer,
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    const formattedOptions = [
      { key: 'A', text: questionForm.optionA.trim() },
      { key: 'B', text: questionForm.optionB.trim() },
      { key: 'C', text: questionForm.optionC.trim() },
      { key: 'D', text: questionForm.optionD.trim() },
    ];

    const payload = {
      sectionId: questionForm.sectionId || null,
      questionText: questionForm.questionText.trim(),
      options: formattedOptions,
      correctAnswer: questionForm.correctAnswer,
      marks: parseFloat(questionForm.marks),
      negativeMarks: parseFloat(questionForm.negativeMarks),
    };

    try {
      if (editingQuestionId) {
        const res = await api.put(`/questions/${editingQuestionId}`, payload);
        if (res.data.success) {
          setQuestions(questions.map((q) => (q._id === editingQuestionId ? res.data.data : q)));
        }
      } else {
        const res = await api.post(`/quizzes/${id}/questions`, payload);
        if (res.data.success) {
          setQuestions([...questions, res.data.data]);
        }
      }
      setShowQuestionModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${qId}`);
      setQuestions(questions.filter((q) => q._id !== qId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{isEdit ? 'Edit Quiz & Builder' : 'Create New Quiz'}</h1>
            <p className="text-xs text-slate-400">Configure quiz settings, sections, dynamic questions, and scoring parameters</p>
          </div>
        </div>

        <button
          onClick={handleQuizSave}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30"
        >
          <Save className="w-4 h-4" />
          <span>Save Quiz Settings</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Basic Info & Settings Form */}
      <form onSubmit={handleQuizSave} className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Basic Information & Quiz Rules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Quiz Title</label>
              <input
                type="text"
                required
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="e.g. JavaScript Assessment"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                rows="3"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Brief description for candidates..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Quiz Type</label>
                <select
                  value={quizForm.quizType}
                  onChange={(e) => setQuizForm({ ...quizForm, quizType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quizForm.duration}
                  onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Passing Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={quizForm.passingPercentage}
                onChange={(e) => setQuizForm({ ...quizForm, passingPercentage: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium">
          <label className="flex items-center space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.hasSections}
              onChange={(e) => setQuizForm({ ...quizForm, hasSections: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0"
            />
            <span className="text-slate-200">Enable Sections</span>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.randomizeQuestions}
              onChange={(e) => setQuizForm({ ...quizForm, randomizeQuestions: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0"
            />
            <span className="text-slate-200">Randomize Questions</span>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.randomizeOptions}
              onChange={(e) => setQuizForm({ ...quizForm, randomizeOptions: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0"
            />
            <span className="text-slate-200">Randomize Options</span>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.allowBackNavigation}
              onChange={(e) => setQuizForm({ ...quizForm, allowBackNavigation: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0"
            />
            <span className="text-slate-200">Allow Back Navigation</span>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.enableNegativeMarking}
              onChange={(e) => setQuizForm({ ...quizForm, enableNegativeMarking: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0"
            />
            <span className="text-slate-200">Enable Negative Marking</span>
          </label>
        </div>
      </form>

      {/* Sections Section */}
      {isEdit && quizForm.hasSections && (
        <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Quiz Sections</span>
            </h3>
            <button
              onClick={() => setShowSectionModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No sections added yet.</p>
            ) : (
              sections.map((sec) => (
                <div key={sec._id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{sec.title}</h4>
                    {sec.description && <p className="text-xs text-slate-400">{sec.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteSection(sec._id)}
                    className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dynamic Questions Builder */}
      {isEdit && (
        <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Questions ({questions.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Dynamically add and edit multiple-choice questions</p>
            </div>

            <button
              onClick={openAddQuestion}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">No Questions Added Yet</p>
                <p className="text-xs text-slate-500 mt-1">Click "+ Add Question" to start adding questions to this quiz.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q._id} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-white text-sm">{q.questionText}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                      <button onClick={() => openEditQuestion(q)} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border ${
                          opt.key === q.correctAnswer
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <strong className="mr-2">{opt.key}.</strong>
                        <span>{opt.text}</span>
                        {opt.key === q.correctAnswer && <span className="ml-2 text-[10px] uppercase font-bold text-emerald-400">(Correct)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowSectionModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Add Section</h3>

            <form onSubmit={handleAddSection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Section Title</label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. JavaScript Basics"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={sectionDesc}
                  onChange={(e) => setSectionDesc(e.target.value)}
                  placeholder="Optional section details..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs">
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowQuestionModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingQuestionId ? 'Edit Question' : 'Add Dynamic Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-5 text-xs">
              {sections.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Assign Section</label>
                  <select
                    value={questionForm.sectionId}
                    onChange={(e) => setQuestionForm({ ...questionForm, sectionId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  >
                    <option value="">No Section (General)</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Question Text</label>
                <textarea
                  rows="3"
                  required
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  placeholder="Enter the question text here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={questionForm.optionA}
                    onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={questionForm.optionB}
                    onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={questionForm.optionC}
                    onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={questionForm.optionD}
                    onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Correct Answer & Marks */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Correct Answer</label>
                  <select
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-emerald-400 font-bold focus:outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={questionForm.negativeMarks}
                    onChange={(e) => setQuestionForm({ ...questionForm, negativeMarks: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
