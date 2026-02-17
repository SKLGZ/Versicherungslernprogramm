import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BookOpen, 
  BrainCircuit, 
  Calculator, 
  CheckCircle, 
  ChevronRight, 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  Target, 
  XCircle,
  Menu,
  X,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  Trash2
} from "lucide-react";

// --- Types & Constants ---

// Simulating 2026 Constants for the AI Context
const CONTEXT_2026 = `
HEUTE: 15. Mai 2026.
WICHTIG: Du bist ein strenger aber fairer IHK-Prüfungstutor für den §34d GewO (Versicherungsfachmann).
Nutze ausschließlich Daten und Fakten, die für 2026 relevant sind (z.B. erhöhte BBG in der GRV/GKV).
Referenzmaterial: "Proximus" Fachbuch Stil - strukturiert, praxisnah, prüfungsrelevant.
Deine Persönlichkeit: Professionell, motivierend, präzise (wie Sachkundeguru, aber mit tieferer Analyse).
`;

const MODULES = [
  { id: "recht", title: "Rechtliche Grundlagen", icon: BookOpen, desc: "VVG, GewO, VAG, Datenschutz" },
  { id: "grv", title: "Gesetzliche Rentenversicherung", icon: GraduationCap, desc: "SGB VI, Rentenarten, Besteuerung" },
  { id: "lebens", title: "Lebensversicherung & bAV", icon: Target, desc: "Schichtenmodell, Fonds, Risikoprüfung" },
  { id: "kranken", title: "Kranken- & Pflegeversicherung", icon: ShieldCheck, desc: "GKV vs. PKV, Beihilfe, Pflegegrade" },
  { id: "sach", title: "Sach- & Vermögensversicherung", icon: LayoutDashboard, desc: "Hausrat, Wohngebäude, Haftpflicht" },
  { id: "auto", title: "Kraftfahrtversicherung", icon: Calculator, desc: "KH, Kasko, Typklassen, SF-Klassen" }
];

type ViewState = "dashboard" | "module";
type Mode = "theory" | "quiz" | "calc" | "chat";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  id?: string;
}

interface QuestionResult {
  questionId: string;
  question: string;
  moduleId: string;
  correct: boolean;
  timestamp: number;
  selectedIndex: number;
  correctIndex: number;
}

interface ModuleProgress {
  moduleId: string;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  lastAccessed: number;
}

interface CalcScenario {
  title: string;
  scenario: string;
  task: string;
  solutionSteps: string[];
  finalAnswer: string;
}

// --- LocalStorage Helper Functions ---

const STORAGE_KEYS = {
  RESULTS: 'versicherung_quiz_results',
  PROGRESS: 'versicherung_module_progress'
};

const saveQuestionResult = (result: QuestionResult) => {
  try {
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
    results.push(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    
    // Update module progress
    updateModuleProgress(result.moduleId, result.correct);
  } catch (e) {
    console.error('Failed to save result:', e);
  }
};

const getQuestionResults = (): QuestionResult[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  } catch {
    return [];
  }
};

const updateModuleProgress = (moduleId: string, correct: boolean) => {
  try {
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}');
    
    if (!progress[moduleId]) {
      progress[moduleId] = {
        moduleId,
        questionsAttempted: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        lastAccessed: Date.now()
      };
    }
    
    progress[moduleId].questionsAttempted++;
    if (correct) {
      progress[moduleId].correctAnswers++;
    } else {
      progress[moduleId].incorrectAnswers++;
    }
    progress[moduleId].lastAccessed = Date.now();
    
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to update progress:', e);
  }
};

const getModuleProgress = (moduleId: string): ModuleProgress | null => {
  try {
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}');
    return progress[moduleId] || null;
  } catch {
    return null;
  }
};

const getAllProgress = (): { [key: string]: ModuleProgress } => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}');
  } catch {
    return {};
  }
};

const clearAllProgress = () => {
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
};

// --- API Helper ---

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const LoadingSpinner = ({ text = "Lade Inhalte..." }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
    <RefreshCw className="w-8 h-8 mb-4 animate-spin text-blue-600" />
    <p className="font-medium">{text}</p>
  </div>
);

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>("theory");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeModule = MODULES.find(m => m.id === activeModuleId);

  const handleModuleSelect = (id: string) => {
    setActiveModuleId(id);
    setView("module");
    setActiveMode("theory");
    setSidebarOpen(false);
  };

  const goHome = () => {
    setView("dashboard");
    setActiveModuleId(null);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span>Profi §34d</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Versicherungs<br/>Profi 2026</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          <button 
            onClick={goHome}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Lernfelder
          </div>

          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModuleSelect(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeModuleId === m.id ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800'}`}
            >
              <m.icon size={16} className={activeModuleId === m.id ? 'text-blue-400' : 'text-slate-500'} />
              {m.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen p-4 md:p-8">
        {view === "dashboard" ? (
          <Dashboard onSelect={handleModuleSelect} />
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Module Header */}
            <header className="mb-8">
              <button onClick={goHome} className="text-sm text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1">
                &larr; Zurück zur Übersicht
              </button>
              <h2 className="text-3xl font-bold text-slate-900">{activeModule?.title}</h2>
              <p className="text-slate-500 mt-1">{activeModule?.desc}</p>
              
              {/* Mode Switcher */}
              <div className="flex flex-wrap gap-2 mt-6">
                <ModeButton active={activeMode === "theory"} onClick={() => setActiveMode("theory")} icon={BookOpen} label="Theorie & Wissen" />
                <ModeButton active={activeMode === "quiz"} onClick={() => setActiveMode("quiz")} icon={CheckCircle} label="Prüfungstraining" />
                <ModeButton active={activeMode === "calc"} onClick={() => setActiveMode("calc")} icon={Calculator} label="Rechen-Labor" />
                <ModeButton active={activeMode === "chat"} onClick={() => setActiveMode("chat")} icon={MessageSquare} label="Tutor Chat" />
              </div>
            </header>

            {/* Content View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] p-6 md:p-8">
              {activeMode === "theory" && <TheoryView module={activeModule!} />}
              {activeMode === "quiz" && <QuizView module={activeModule!} />}
              {activeMode === "calc" && <CalculationView module={activeModule!} />}
              {activeMode === "chat" && <ChatView module={activeModule!} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-Components ---

const ModeButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all
      ${active 
        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1" 
        : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const Dashboard = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const allProgress = getAllProgress();
  const allResults = getQuestionResults();
  
  const totalQuestions = allResults.length;
  const correctAnswers = allResults.filter(r => r.correct).length;
  const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  const handleClearProgress = () => {
    if (confirm('Möchten Sie wirklich alle Fortschritte löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearAllProgress();
      window.location.reload();
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Willkommen zurück, Experte.</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Dein Lernfortschritt für die Prüfung 2026. Bereit für die nächste Einheit im Stil von Proximus?
        </p>
      </div>

      {/* Progress Statistics */}
      {totalQuestions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{totalQuestions}</span>
            </div>
            <p className="text-blue-100 text-sm font-medium">Fragen beantwortet</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{correctAnswers}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Richtige Antworten</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{totalQuestions - correctAnswers}</span>
            </div>
            <p className="text-red-100 text-sm font-medium">Falsche Antworten</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{successRate}%</span>
            </div>
            <p className="text-purple-100 text-sm font-medium">Erfolgsquote</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map((m) => {
          const progress = allProgress[m.id];
          const moduleResults = allResults.filter(r => r.moduleId === m.id);
          const moduleCorrect = moduleResults.filter(r => r.correct).length;
          const moduleTotal = moduleResults.length;
          const moduleRate = moduleTotal > 0 ? Math.round((moduleCorrect / moduleTotal) * 100) : 0;
          
          return (
            <div 
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <m.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{m.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{m.desc}</p>
                
                {/* Module Progress */}
                {progress && (
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{moduleTotal} Fragen</span>
                      <span className={moduleRate >= 70 ? 'text-green-600 font-semibold' : 'text-slate-600'}>{moduleRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${moduleRate >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${moduleRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm group-hover:underline">
                  Starten <ChevronRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Clear Progress Button */}
      {totalQuestions > 0 && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleClearProgress}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Fortschritt zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
};

// --- Content Views ---

const TheoryView = ({ module }: { module: any }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const generateTheory = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const ai = getAI();
      const prompt = `
        ${CONTEXT_2026}
        THEMA: ${module.title} - ${topic}
        AUFGABE: Erstelle eine ausführliche, gut strukturierte Lernzusammenfassung im Stil des "Proximus" Fachbuchs.
        FORMAT: Markdown. Nutze Fettungen für Schlüsselbegriffe. Füge ein kurzes "Praxis-Beispiel" hinzu.
        INHALT: Beachte aktuelle Werte für 2026 (z.B. Steuerfreibeträge, BBG).
      `;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setContent(result.text || "Fehler bei der Generierung.");
    } catch (e) {
      console.error(e);
      setContent("Entschuldigung, ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Wissensdatenbank (Wiki)</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Zu welchem Unterthema möchtest du lernen? (z.B. 'Pflichtverletzung', 'Rentenformel')"
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateTheory()}
          />
          <button 
            onClick={generateTheory}
            disabled={loading || !topic}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generiere..." : "Lernen"}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text="Erstelle Lerninhalte mit aktuellen 2026er Daten..." />}

      {content && !loading && (
        <div className="prose prose-slate max-w-none markdown-body">
          <div dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(content) }} />
        </div>
      )}
      
      {!content && !loading && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Gib ein Thema ein, um eine Lerneinheit zu starten.</p>
        </div>
      )}
    </div>
  );
};

const QuizView = ({ module }: { module: any }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [examMode, setExamMode] = useState(false);
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [showExamResults, setShowExamResults] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<{questionIndex: number, selectedIndex: number, correct: boolean}[]>([]);
  const [questionOrder, setQuestionOrder] = useState<'sequential' | 'random'>('random');

  const startQuiz = async (isExamMode: boolean = false) => {
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setExamMode(isExamMode);
    setShowExamResults(false);
    setAnswerHistory([]);
    
    if (isExamMode) {
      setExamStartTime(Date.now());
    }

    try {
      const ai = getAI();
      const questionCount = isExamMode ? 10 : 5;
      const prompt = `
        ${CONTEXT_2026}
        THEMA: ${module.title}
        AUFGABE: Erstelle ${questionCount} anspruchsvolle Multiple-Choice-Fragen für die Sachkundeprüfung.
        ${isExamMode ? 'PRÜFUNGSMODUS: Fragen sollten realistische Prüfungssituationen widerspiegeln.' : ''}
        FORMAT: JSON Array.
        STRUKTUR:
        [
          {
            "question": "Fragetext...",
            "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
            "correctIndex": 0, // 0-3
            "explanation": "Erklärung warum A richtig ist und warum B,C,D falsch sind."
          }
        ]
        STIL: IHK-Niveau, fallbasiert wenn möglich.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      let data = JSON.parse(result.text || "[]");
      
      // Add IDs to questions
      data = data.map((q: Question, idx: number) => ({
        ...q,
        id: `${module.id}_${Date.now()}_${idx}`
      }));
      
      // Shuffle questions if random order
      if (questionOrder === 'random' && !isExamMode) {
        data = data.sort(() => Math.random() - 0.5);
      }
      
      setQuestions(data);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Laden der Fragen.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    
    const isCorrect = index === questions[currentIndex].correctIndex;
    
    // Save to answer history
    setAnswerHistory(prev => [...prev, {
      questionIndex: currentIndex,
      selectedIndex: index,
      correct: isCorrect
    }]);
    
    // Save result to localStorage
    const result: QuestionResult = {
      questionId: questions[currentIndex].id || `${module.id}_${currentIndex}`,
      question: questions[currentIndex].question,
      moduleId: module.id,
      correct: isCorrect,
      timestamp: Date.now(),
      selectedIndex: index,
      correctIndex: questions[currentIndex].correctIndex
    };
    saveQuestionResult(result);
    
    if (!examMode) {
      setShowResult(true);
    }
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    // In exam mode, auto-advance after short delay
    if (examMode) {
      setTimeout(() => {
        nextQuestion();
      }, 500);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // End of quiz
      if (examMode) {
        setShowExamResults(true);
      } else {
        const successRate = Math.round((score / questions.length) * 100);
        alert(`Quiz beendet! Du hast ${score} von ${questions.length} richtig (${successRate}%).`);
        setQuestions([]); // Reset to allow restart
      }
    }
  };

  const getElapsedTime = () => {
    if (!examStartTime) return '0:00';
    const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingSpinner text="Generiere Prüfungsfragen..." />;

  // Exam Results View
  if (showExamResults) {
    const successRate = Math.round((score / questions.length) * 100);
    const passed = successRate >= 70;
    const elapsedTime = getElapsedTime();
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className={`text-center py-12 px-6 rounded-2xl mb-8 ${passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-500' : 'bg-red-500'}`}>
            {passed ? <Award className="w-10 h-10 text-white" /> : <XCircle className="w-10 h-10 text-white" />}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-900' : 'text-red-900'}`}>
            {passed ? 'Prüfung bestanden!' : 'Nicht bestanden'}
          </h2>
          <p className={`text-lg mb-6 ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {score} von {questions.length} Fragen richtig ({successRate}%)
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Zeit: {elapsedTime}</span>
            </div>
          </div>
        </div>
        
        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Fragenübersicht</h3>
          {questions.map((q, idx) => {
            const answer = answerHistory[idx];
            const isCorrect = answer?.correct;
            
            return (
              <div key={idx} className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrect ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 mb-2">Frage {idx + 1}: {q.question}</p>
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-medium">Deine Antwort:</span> {q.options[answer?.selectedIndex]}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Richtige Antwort:</span> {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => startQuiz(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Neue Prüfung starten
          </button>
          <button 
            onClick={() => setQuestions([])}
            className="bg-white border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Prüfungstraining</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Wähle einen Modus für <strong>{module.title}</strong>. 
          Fragen basieren auf aktuellen IHK-Standards 2026.
        </p>
        
        {/* Mode Selection */}
        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          <div 
            onClick={() => startQuiz(false)}
            className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-slate-900 mb-1">Übungsmodus</h4>
                <p className="text-sm text-slate-600">5 Fragen mit sofortiger Erklärung nach jeder Antwort</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>
          
          <div 
            onClick={() => startQuiz(true)}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1 text-white">
                <h4 className="font-bold mb-1">Prüfungssimulation</h4>
                <p className="text-sm text-purple-100">10 Fragen im echten Prüfungsformat mit Zeiterfassung</p>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white" />
            </div>
          </div>
        </div>
        
        {/* Question Order Setting */}
        <div className="max-w-md mx-auto mb-6">
          <label className="text-sm font-medium text-slate-700 mb-2 block">Fragenreihenfolge:</label>
          <select 
            value={questionOrder}
            onChange={(e) => setQuestionOrder(e.target.value as 'sequential' | 'random')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="random">Zufällig</option>
            <option value="sequential">Fortlaufend</option>
          </select>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6 text-sm text-slate-500 font-medium">
        <span>Frage {currentIndex + 1} von {questions.length}</span>
        <div className="flex items-center gap-4">
          <span>Score: {score}</span>
          {examMode && <span className="flex items-center gap-1"><Clock size={14} /> {getElapsedTime()}</span>}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">{q.question}</h3>
      </div>

      <div className="space-y-3 mb-8">
        {q.options.map((opt, idx) => {
          let stateClass = "border-slate-200 hover:bg-slate-50 hover:border-blue-300";
          if (showResult || (examMode && selectedOption !== null)) {
            if (idx === q.correctIndex) stateClass = "bg-green-50 border-green-500 text-green-900";
            else if (idx === selectedOption) stateClass = "bg-red-50 border-red-500 text-red-900";
            else stateClass = "border-slate-100 opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={showResult || (examMode && selectedOption !== null)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${stateClass}`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${(showResult || (examMode && selectedOption !== null)) && idx === q.correctIndex ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}
              `}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {showResult && !examMode && (
        <div className="animate-fade-in bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
            {selectedOption === q.correctIndex ? (
              <CheckCircle className="text-green-500 w-5 h-5" />
            ) : (
              <XCircle className="text-red-500 w-5 h-5" />
            )}
            Erklärung
          </div>
          <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {showResult && !examMode && (
        <div className="flex justify-end">
          <button 
            onClick={nextQuestion}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            {currentIndex < questions.length - 1 ? "Nächste Frage" : "Ergebnis anzeigen"}
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const CalculationView = ({ module }: { module: any }) => {
  const [scenario, setScenario] = useState<CalcScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const generateCalc = async () => {
    setLoading(true);
    setShowSolution(false);
    setScenario(null);

    try {
      const ai = getAI();
      const prompt = `
        ${CONTEXT_2026}
        THEMA: ${module.title} - Rechenaufgaben
        AUFGABE: Erstelle ein komplexes, realistisches Rechenbeispiel (Sachkundeguru Level+).
        BEISPIELE: Pro-Rata-Temporis, Unterversicherung, Rentenlücke, Schadenquote, Schichtenmodell-Steuer.
        FORMAT: JSON Object.
        {
          "title": "Titel der Aufgabe",
          "scenario": "Die genaue Situationsbeschreibung mit allen Zahlen (Versicherungssumme, Schadenhöhe, Werte von 2026 nutzen).",
          "task": "Was genau soll berechnet werden?",
          "solutionSteps": ["Schritt 1: Erklärung + Rechnung", "Schritt 2..."],
          "finalAnswer": "Das Endergebnis (z.B. 4.500,00 EUR)"
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Using Pro for better math logic
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scenario: { type: Type.STRING },
              task: { type: Type.STRING },
              solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalAnswer: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(result.text || "{}");
      setScenario(data);
    } catch (e) {
      console.error(e);
      alert("Fehler bei der Generierung.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {!scenario && !loading && (
        <div className="text-center py-12">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Rechen-Labor</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Trainiere komplexe Berechnungen für {module.title}. 
            Der Generator erstellt einzigartige Fälle mit den Werten von 2026.
          </p>
          <button 
            onClick={generateCalc}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            Aufgabe generieren
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Konstruiere Fallbeispiel und berechne Lösung..." />}

      {scenario && (
        <div className="animate-fade-in space-y-8">
          <div className="bg-white border-l-4 border-indigo-500 pl-6 py-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{scenario.title}</h2>
            <div className="prose prose-slate text-slate-700">
              <p className="whitespace-pre-line">{scenario.scenario}</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Target size={20} /> Deine Aufgabe:
            </h3>
            <p className="text-indigo-800 font-medium text-lg">{scenario.task}</p>
          </div>

          <div className="flex justify-center py-4">
            {!showSolution ? (
              <button 
                onClick={() => setShowSolution(true)}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
              >
                Lösung anzeigen
              </button>
            ) : (
              <button 
                onClick={generateCalc}
                className="bg-white border border-slate-300 text-slate-600 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Nächste Aufgabe
              </button>
            )}
          </div>

          {showSolution && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Lösungsweg</h3>
              <div className="space-y-4">
                {scenario.solutionSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="pt-1 text-slate-700">{step}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Endergebnis</span>
                <span className="text-2xl font-bold text-green-600">{scenario.finalAnswer}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChatView = ({ module }: { module: any }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    {role: 'model', text: `Hallo! Ich bin dein AI-Tutor Sven. Frag mich alles zum Thema "${module.title}". Ich erkläre es dir so einfach oder so detailliert wie im Proximus Buch.`}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setInput("");
    setLoading(true);

    try {
      const ai = getAI();
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: CONTEXT_2026 + ` Fokus: ${module.title}. Antworte kurz und prägnant, außer der User fragt nach Details.`
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, {role: 'model', text: result.text || "Keine Antwort."}]);
    } catch (e) {
      setMessages(prev => [...prev, {role: 'model', text: "Fehler: Konnte keine Verbindung zum Tutor herstellen."}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              <div className="markdown-body text-sm" dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(m.text) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-5 py-3 rounded-bl-none flex gap-2 items-center text-slate-500">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
        <input 
          type="text"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Stelle eine Frage..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button 
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
