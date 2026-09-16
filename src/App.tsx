import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code2,
  Layers,
  FileArchive,
  Download,
  Sparkles,
  RefreshCw,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_PROBLEM, CURRICULUM_TOPICS } from './data/curriculum';
import { ProblemData, TopicId, Difficulty, TestCase, CurriculumTopic } from './types';
import { Header } from './components/Header';
import { CurriculumRoadmap } from './components/CurriculumRoadmap';
import { ProblemStatementView } from './components/ProblemStatementView';
import { SolutionView } from './components/SolutionView';
import { TestCasesView } from './components/TestCasesView';
import { ZipPackagingView } from './components/ZipPackagingView';
import { GenerateProblemModal } from './components/GenerateProblemModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { generateThemisTestZip, downloadBlob } from './utils/zipGenerator';
import { enrichAndEnforceSubtaskCompliance } from './utils/testValidator';
import { safeParseJsonResponse } from './utils/apiHelper';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';

const STORAGE_KEY_CURRENT = 'cpp_assistant_current_problem';
const STORAGE_KEY_HISTORY = 'cpp_assistant_problem_history';

type ActiveTab = 'statement' | 'solution' | 'tests' | 'zip';

export default function App() {
  const { requireAuth } = useAuth();
  const [currentProblem, setCurrentProblem] = useState<ProblemData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return enrichAndEnforceSubtaskCompliance(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    return enrichAndEnforceSubtaskCompliance(SAMPLE_PROBLEM);
  });

  const [history, setHistory] = useState<ProblemData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [SAMPLE_PROBLEM];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('statement');
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(currentProblem.topic || 'branching');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [modalInitialTopic, setModalInitialTopic] = useState<TopicId>('branching');
  const [modalInitialCode, setModalInitialCode] = useState('');
  const [modalInitialName, setModalInitialName] = useState('');
  const [modalInitialDifficulty, setModalInitialDifficulty] = useState<Difficulty>('easy');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegeneratingTests, setIsRegeneratingTests] = useState(false);

  // Safe localStorage helper to protect against QuotaExceededError
  const safeSaveHistory = (items: ProblemData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage quota reached, pruning older history entries...');
      try {
        const pruned = items.slice(0, 15);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(pruned));
      } catch (inner) {
        console.error('Could not save history to localStorage:', inner);
      }
    }
  };

  // Save current problem to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(currentProblem));
    } catch (e) {
      console.warn('Could not save current problem to localStorage:', e);
    }
  }, [currentProblem]);

  // Save history to localStorage
  useEffect(() => {
    safeSaveHistory(history);
  }, [history]);

  // Handle importing problems from backup JSON file
  const handleImportHistory = (imported: ProblemData[]) => {
    setHistory((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const combined = [...prev];
      for (const p of imported) {
        if (!existingIds.has(p.id)) {
          combined.unshift(p);
          existingIds.add(p.id);
        }
      }
      return combined.slice(0, 50);
    });

    if (imported.length > 0) {
      const first = imported[0];
      setCurrentProblem(first);
      if (first.topic) setSelectedTopic(first.topic);
      setActiveTab('statement');
    }
  };

  // Open modal prefilled for a curriculum topic or suggested problem
  const handleQuickGenerate = (
    topic: CurriculumTopic,
    suggestedProblem?: { name: string; code: string; brief: string; difficulty: Difficulty }
  ) => {
    requireAuth(() => {
      setSelectedTopic(topic.id);
      setModalInitialTopic(topic.id);
      if (suggestedProblem) {
        setModalInitialName(suggestedProblem.name);
        setModalInitialCode(suggestedProblem.code);
        setModalInitialDifficulty(suggestedProblem.difficulty);
      } else {
        setModalInitialName('');
        setModalInitialCode('');
        setModalInitialDifficulty('easy');
      }
      setIsGenerateModalOpen(true);
    }, `Tạo đề bài cho chuyên đề: ${topic.title}`);
  };

  const handleGenerateSuccess = (newProblem: ProblemData) => {
    const enriched = enrichAndEnforceSubtaskCompliance(newProblem);
    setCurrentProblem(enriched);
    setSelectedTopic(enriched.topic);
    setActiveTab('statement');

    // Add to history (avoid duplicates with same ID)
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== enriched.id);
      return [enriched, ...filtered].slice(0, 30);
    });
  };

  const handleUpdateProblem = (updatedProblem: ProblemData) => {
    const enriched = enrichAndEnforceSubtaskCompliance(updatedProblem);
    setCurrentProblem(enriched);
    if (enriched.topic) {
      setSelectedTopic(enriched.topic);
    }

    setHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== enriched.id);
      return [enriched, ...filtered].slice(0, 30);
    });
  };

  const handleUpdateTestCases = (newTests: TestCase[]) => {
    setCurrentProblem((prev) => {
      const updated = {
        ...prev,
        testCases: newTests,
      };
      return enrichAndEnforceSubtaskCompliance(updated);
    });
  };

  const handleRegenerateTests = () => {
    requireAuth(async () => {
      try {
        setIsRegeneratingTests(true);
        const res = await fetch('/api/generate-more-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem: currentProblem,
            count: currentProblem.testCases?.length || 20,
          }),
        });
        const data = await safeParseJsonResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Lỗi sinh lại test.');
        }
        handleUpdateTestCases(data.testCases);
      } catch (err: any) {
        alert('Không thể sinh lại bộ test: ' + err.message);
      } finally {
        setIsRegeneratingTests(false);
      }
    }, 'Sinh lại 20 test bằng AI');
  };

  // Header quick download
  const handleDownloadZip = () => {
    requireAuth(async () => {
      try {
        setIsDownloading(true);
        const blob = await generateThemisTestZip(currentProblem, {
          includeSolution: true,
          includeProblemDoc: true,
          fileCase: 'UPPERCASE',
        });
        downloadBlob(blob, `${currentProblem.problemCode}_TEST_THEMIS.zip`);
      } catch (err: any) {
        alert('Lỗi tải file ZIP: ' + err.message);
      } finally {
        setIsDownloading(false);
      }
    }, 'Tải gói ZIP 20 test Themis');
  };

  const handleResetToSample = () => {
    setCurrentProblem(SAMPLE_PROBLEM);
    setSelectedTopic('branching');
    setActiveTab('statement');
  };

  const testsCount = currentProblem.testCases?.length || 20;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentProblem={currentProblem}
        onOpenGenerateModal={() => {
          requireAuth(() => {
            setModalInitialTopic(selectedTopic);
            setModalInitialCode('');
            setModalInitialName('');
            setIsGenerateModalOpen(true);
          }, 'Ra đề mới bằng AI');
        }}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onResetToSample={handleResetToSample}
      />

      {/* Curriculum Roadmap Progression */}
      <CurriculumRoadmap
        selectedTopic={selectedTopic}
        onSelectTopic={(topicId) => setSelectedTopic(topicId)}
        onQuickGenerate={handleQuickGenerate}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Tab 1: Problem Statement */}
            <button
              id="tab-statement"
              onClick={() => setActiveTab('statement')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'statement'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Đề Bài</span>
            </button>

            {/* Tab 2: C++ Solution */}
            <button
              id="tab-solution"
              onClick={() => setActiveTab('solution')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'solution'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>2. Mã Nguồn C++</span>
            </button>

            {/* Tab 3: Test Cases */}
            <button
              id="tab-tests"
              onClick={() => setActiveTab('tests')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'tests'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Bộ Test ({testsCount})</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'tests' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                .inp/.out
              </span>
            </button>

            {/* Tab 4: ZIP Packaging */}
            <button
              id="tab-zip"
              onClick={() => setActiveTab('zip')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'zip'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              <span>4. Đóng Gói ZIP</span>
              <span className="hidden md:inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                Themis
              </span>
            </button>
          </div>

          {/* Right side info & actions */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 pr-2">
            <span className="hidden sm:inline">Bài hiện tại:</span>
            <strong className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded">
              {currentProblem.problemCode}
            </strong>
          </div>
        </div>

        {/* Tab Content Views */}
        <div className="transition-all">
          {activeTab === 'statement' && (
            <ProblemStatementView
              problem={currentProblem}
              onUpdateProblem={handleUpdateProblem}
              onNavigateToTests={() => setActiveTab('tests')}
            />
          )}
          {activeTab === 'solution' && <SolutionView problem={currentProblem} />}
          {activeTab === 'tests' && (
            <TestCasesView
              problem={currentProblem}
              onUpdateTestCases={handleUpdateTestCases}
              onRegenerateTests={handleRegenerateTests}
              isRegenerating={isRegeneratingTests}
            />
          )}
          {activeTab === 'zip' && (
            <ZipPackagingView
              problem={currentProblem}
              isDownloading={isDownloading}
              setIsDownloading={setIsDownloading}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Trợ Lí Ra Đề C++ & Bộ 20 Test Themis • Lộ trình sư phạm: Rẽ nhánh → Vòng lặp → Hàm → Mảng → Chuỗi → Cấu trúc dữ liệu
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Tương thích: Themis • CMS • VNOJ • Codeforces Polygon
          </div>
        </div>
      </footer>

      {/* AI Generate Modal */}
      <GenerateProblemModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={handleGenerateSuccess}
        initialTopic={modalInitialTopic}
        initialProblemCode={modalInitialCode}
        initialProblemName={modalInitialName}
        initialDifficulty={modalInitialDifficulty}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentProblemId={currentProblem.id}
        onSelectProblem={(prob) => {
          setCurrentProblem(prob);
          setSelectedTopic(prob.topic);
        }}
        onDeleteProblem={(id) => {
          setHistory((prev) => prev.filter((p) => p.id !== id));
        }}
        onClearHistory={() => setHistory([])}
        onImportHistory={handleImportHistory}
      />

      {/* Admin Login Modal */}
      <LoginModal />
    </div>
  );
}
