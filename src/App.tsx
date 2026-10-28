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
import { SkillModal } from './components/SkillModal';
import { generateThemisTestZip, downloadBlob } from './utils/zipGenerator';
import { enrichAndEnforceSubtaskCompliance, sanitizeProblemData } from './utils/testValidator';
import { safeParseJsonResponse } from './utils/apiHelper';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';

const STORAGE_KEY_CURRENT = 'cpp_assistant_current_problem';
const STORAGE_KEY_HISTORY = 'cpp_assistant_problem_history';

type ActiveTab = 'statement' | 'solution' | 'tests' | 'zip';

class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMsg: error?.message || String(error || 'Lỗi hiển thị giao diện'),
    };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ViewErrorBoundary] Caught UI render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-amber-300 p-6 shadow-sm my-4 text-center space-y-3">
          <div className="text-sm font-bold text-amber-900">
            Đã tự động bảo vệ giao diện khỏi dữ liệu chưa đồng bộ
          </div>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Chi tiết: {this.state.errorMsg}
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMsg: '' });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Chuẩn Hóa Dữ Liệu & Tiếp Tục
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { requireAuth } = useAuth();
  const [currentProblem, setCurrentProblem] = useState<ProblemData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return enrichAndEnforceSubtaskCompliance(sanitizeProblemData(parsed));
      } catch (e) {
        console.error(e);
      }
    }
    return enrichAndEnforceSubtaskCompliance(sanitizeProblemData(SAMPLE_PROBLEM));
  });

  const [history, setHistory] = useState<ProblemData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => sanitizeProblemData(item));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [sanitizeProblemData(SAMPLE_PROBLEM)];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('statement');
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(currentProblem.topic || 'branching');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [modalInitialTopic, setModalInitialTopic] = useState<TopicId>('branching');
  const [modalInitialCode, setModalInitialCode] = useState('');
  const [modalInitialName, setModalInitialName] = useState('');
  const [modalInitialDifficulty, setModalInitialDifficulty] = useState<Difficulty>('easy');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegeneratingTests, setIsRegeneratingTests] = useState(false);
  const [isSyncingWithCpp, setIsSyncingWithCpp] = useState(false);
  const [isAutoRepairingCpp, setIsAutoRepairingCpp] = useState(false);
  const [isAuditingThreeLevel, setIsAuditingThreeLevel] = useState(false);
  const [cppSyncSuccessMsg, setCppSyncSuccessMsg] = useState<string | null>(null);
  const [cppErrorMsg, setCppErrorMsg] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setCppErrorMsg(msg);
    setTimeout(() => setCppErrorMsg(null), 7000);
  };

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

  const handleUpdateSolutionCode = (newCode: string) => {
    setCurrentProblem((prev) => ({
      ...prev,
      solutionCpp: newCode,
    }));
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
        setCppErrorMsg(null);
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
        if (data.problem) {
          handleUpdateProblem(data.problem);
        } else {
          handleUpdateTestCases(data.testCases);
        }
        setCppSyncSuccessMsg(
          'Đã dùng code C++ (generator.cpp) tạo lại 20 test cases và hoàn tất Thẩm định độc lập 3 cấp độ!'
        );
        setTimeout(() => setCppSyncSuccessMsg(null), 6000);
      } catch (err: any) {
        showErrorToast('Không thể sinh lại bộ test: ' + err.message);
      } finally {
        setIsRegeneratingTests(false);
      }
    }, 'Sinh lại 20 test bằng Code C++');
  };

  // Thẩm định độc lập 3 cấp độ (Zero-Trust Audit: generator.cpp + oracle_bf.cpp + solution.cpp)
  const handleAuditThreeLevelCpp = () => {
    requireAuth(async () => {
      try {
        setIsAuditingThreeLevel(true);
        setCppSyncSuccessMsg(null);
        setCppErrorMsg(null);
        const res = await fetch('/api/audit-3-level-cpp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: currentProblem }),
        });
        const data = await safeParseJsonResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Không thể thực hiện thẩm định 3 cấp độ.');
        }
        handleUpdateProblem(data.problem);
        setCppSyncSuccessMsg(
          data.message ||
            'Đã hoàn tất Thẩm định Độc lập 3 Cấp độ (Zero-Trust Audit) và sinh 20 test bằng Code C++!'
        );
        setTimeout(() => setCppSyncSuccessMsg(null), 8000);
      } catch (err: any) {
        showErrorToast('Lỗi thẩm định độc lập 3 cấp độ: ' + err.message);
      } finally {
        setIsAuditingThreeLevel(false);
      }
    }, 'Thẩm định độc lập 3 cấp độ & Sinh test bằng Code C++');
  };

  // GIẢI PHÁP 3: Biên dịch C++ bằng g++ và thực thi các bộ test để lấy Output chuẩn xác 100%
  const handleSyncWithCpp = (customCode?: string) => {
    requireAuth(async () => {
      try {
        setIsSyncingWithCpp(true);
        setCppSyncSuccessMsg(null);
        setCppErrorMsg(null);
        const problemPayload = customCode
          ? { ...currentProblem, solutionCpp: customCode }
          : currentProblem;
        const res = await fetch('/api/sync-tests-with-cpp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: problemPayload }),
        });
        const data = await safeParseJsonResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Lỗi khi biên dịch và thực thi C++.');
        }
        handleUpdateProblem(data.problem);
        setCppSyncSuccessMsg(data.message || 'Đã đồng bộ toàn bộ Output test cases từ code C++ chuẩn!');
        setTimeout(() => setCppSyncSuccessMsg(null), 6000);
      } catch (err: any) {
        showErrorToast('Lỗi đồng bộ Output bằng C++: ' + err.message);
      } finally {
        setIsSyncingWithCpp(false);
      }
    }, 'Chạy Code C++ chuẩn sinh Output');
  };

  // Header quick download
  const handleDownloadZip = () => {
    requireAuth(async () => {
      try {
        setIsDownloading(true);
        setCppErrorMsg(null);
        const blob = await generateThemisTestZip(currentProblem, {
          includeSolution: true,
          includeProblemDoc: true,
          fileCase: 'UPPERCASE',
        });
        downloadBlob(blob, `${currentProblem.problemCode}_TEST_THEMIS.zip`);
      } catch (err: any) {
        showErrorToast('Lỗi tải file ZIP: ' + err.message);
      } finally {
        setIsDownloading(false);
      }
    }, 'Tải gói ZIP 20 test Themis');
  };

  // AI Tự động sửa lỗi giải thuật C++ & Chạy lại test
  const handleAutoRepairCpp = () => {
    requireAuth(async () => {
      try {
        setIsAutoRepairingCpp(true);
        setCppSyncSuccessMsg(null);
        setCppErrorMsg(null);
        const res = await fetch('/api/auto-repair-cpp-solution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: currentProblem }),
        });
        const data = await safeParseJsonResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'AI chưa thể tự động sửa mã nguồn lần này.');
        }
        handleUpdateProblem(data.problem);
        setCppSyncSuccessMsg(data.message || 'AI đã sửa và tối ưu mã nguồn C++ thành công!');
        setTimeout(() => setCppSyncSuccessMsg(null), 8000);
      } catch (err: any) {
        showErrorToast('Lỗi tự động sửa mã nguồn: ' + err.message);
      } finally {
        setIsAutoRepairingCpp(false);
      }
    }, 'AI Tự Động Sửa Lỗi Code C++');
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
        onOpenSkillModal={() => setIsSkillModalOpen(true)}
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

        {/* Success toast notification for C++ execution */}
        {cppSyncSuccessMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{cppSyncSuccessMsg}</span>
            </div>
            <button
              onClick={() => setCppSyncSuccessMsg(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error toast notification */}
        {cppErrorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{cppErrorMsg}</span>
            </div>
            <button
              onClick={() => setCppErrorMsg(null)}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Content Views */}
        <ViewErrorBoundary
          onReset={() =>
            setCurrentProblem((prev) =>
              enrichAndEnforceSubtaskCompliance(sanitizeProblemData(prev))
            )
          }
        >
          <div className="transition-all">
            {activeTab === 'statement' && (
              <ProblemStatementView
                problem={currentProblem}
                onUpdateProblem={handleUpdateProblem}
                onNavigateToTests={() => setActiveTab('tests')}
              />
            )}
            {activeTab === 'solution' && (
              <SolutionView
                problem={currentProblem}
                onSyncWithCpp={handleSyncWithCpp}
                isSyncingWithCpp={isSyncingWithCpp}
                onAutoRepairCpp={handleAutoRepairCpp}
                isAutoRepairingCpp={isAutoRepairingCpp}
                onUpdateSolutionCode={handleUpdateSolutionCode}
              />
            )}
            {activeTab === 'tests' && (
              <TestCasesView
                problem={currentProblem}
                onUpdateTestCases={handleUpdateTestCases}
                onRegenerateTests={handleRegenerateTests}
                isRegenerating={isRegeneratingTests}
                onSyncWithCpp={handleSyncWithCpp}
                isSyncingWithCpp={isSyncingWithCpp}
                onAutoRepairCpp={handleAutoRepairCpp}
                isAutoRepairingCpp={isAutoRepairingCpp}
                onAuditThreeLevel={handleAuditThreeLevelCpp}
                isAuditingThreeLevel={isAuditingThreeLevel}
              />
            )}
            {activeTab === 'zip' && (
              <ZipPackagingView
                problem={currentProblem}
                history={history}
                isDownloading={isDownloading}
                setIsDownloading={setIsDownloading}
              />
            )}
          </div>
        </ViewErrorBoundary>
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
          const clean = enrichAndEnforceSubtaskCompliance(sanitizeProblemData(prob));
          setCurrentProblem(clean);
          setSelectedTopic(clean.topic);
        }}
        onDeleteProblem={(id) => {
          setHistory((prev) => prev.filter((p) => p.id !== id));
        }}
        onClearHistory={() => setHistory([])}
        onImportHistory={handleImportHistory}
      />

      {/* Skill Specification Modal */}
      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
      />

      {/* Admin Login Modal */}
      <LoginModal />
    </div>
  );
}
