import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { ProblemData, TestCase } from '../types';
import {
  validateProblemTestCases,
  enrichAndEnforceSubtaskCompliance,
} from '../utils/testValidator';

interface TestCasesViewProps {
  problem: ProblemData;
  onUpdateTestCases: (tests: TestCase[]) => void;
  onRegenerateTests: () => Promise<void>;
  isRegenerating: boolean;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({
  problem,
  onUpdateTestCases,
  onRegenerateTests,
  isRegenerating,
}) => {
  const tests = problem.testCases || [];
  const [selectedTestId, setSelectedTestId] = useState<number>(tests[0]?.id || 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [editOutput, setEditOutput] = useState('');
  const [copiedInp, setCopiedInp] = useState(false);
  const [copiedOut, setCopiedOut] = useState(false);
  const [showCheckDetails, setShowCheckDetails] = useState(false);

  // Compute live validation report
  const validationReport = useMemo(() => {
    return validateProblemTestCases(problem);
  }, [problem]);

  const currentTest = tests.find((t) => t.id === selectedTestId) || tests[0];
  const currentTestDetail = validationReport.testDetails.find((t) => t.testId === currentTest?.id);

  React.useEffect(() => {
    if (currentTest) {
      setEditInput(currentTest.input);
      setEditOutput(currentTest.output);
      setIsEditing(false);
    }
  }, [selectedTestId, problem]);

  const handleCopy = async (content: string, type: 'inp' | 'out') => {
    await navigator.clipboard.writeText(content);
    if (type === 'inp') {
      setCopiedInp(true);
      setTimeout(() => setCopiedInp(false), 1500);
    } else {
      setCopiedOut(true);
      setTimeout(() => setCopiedOut(false), 1500);
    }
  };

  const handleSaveEdit = () => {
    if (!currentTest) return;
    const updated = tests.map((t) => {
      if (t.id === currentTest.id) {
        return {
          ...t,
          input: editInput.trim(),
          output: editOutput.trim(),
        };
      }
      return t;
    });
    onUpdateTestCases(updated);
    setIsEditing(false);
  };

  const handleAddTest = () => {
    const nextNum = tests.length + 1;
    const newTest: TestCase = {
      id: nextNum,
      testName: `test${nextNum < 10 ? '0' + nextNum : nextNum}`,
      input: '',
      output: '',
      note: `Test thủ công ${nextNum}`,
      subtask: 3,
    };
    const updated = [...tests, newTest];
    onUpdateTestCases(updated);
    setSelectedTestId(nextNum);
    setIsEditing(true);
    setEditInput('');
    setEditOutput('');
  };

  const handleDeleteTest = (idToDelete: number) => {
    if (tests.length <= 1) return;
    const filtered = tests
      .filter((t) => t.id !== idToDelete)
      .map((t, idx) => {
        const num = idx + 1;
        return {
          ...t,
          id: num,
          testName: `test${num < 10 ? '0' + num : num}`,
        };
      });
    onUpdateTestCases(filtered);
    setSelectedTestId(filtered[0].id);
  };

  // Auto fix & enforce subtasks
  const handleAutoFixSubtasks = () => {
    const enriched = enrichAndEnforceSubtaskCompliance(problem);
    onUpdateTestCases(enriched.testCases);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Định dạng Themis tiêu chuẩn
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {tests.length} Bộ Test (test01 đến test{tests.length < 10 ? '0' + tests.length : tests.length})
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {validationReport.subtasks.length} Phân đoạn Subtask
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Cấu trúc bộ test của bài: <span className="text-blue-700 font-mono">{problem.problemCode}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi test được lưu trong thư mục riêng: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{problem.problemCode}/testXX/{problem.problemCode}.inp</code> và <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{problem.problemCode}.out</code>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddTest}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Thêm test</span>
          </button>

          <button
            id="btn-regenerate-tests"
            onClick={onRegenerateTests}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Đang tính toán...' : 'Sinh lại 20 test'}</span>
          </button>
        </div>
      </div>

      {/* Subtask & Constraints Verification Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                validationReport.isValid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Thẩm Định & Rà Soát Ràng Buộc Subtask
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    validationReport.isValid
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {validationReport.isValid ? '✓ 100% ĐẠT CHUẨN ĐỀ BÀI' : '⚠ CẦN RÀ SOÁT'}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Điểm thẩm định: {validationReport.score}/100
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{validationReport.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoFixSubtasks}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
              title="Tự động đồng bộ test ví dụ và phân bổ chuẩn các Subtask"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Tự động chuẩn hóa Subtask</span>
            </button>
            <button
              onClick={() => setShowCheckDetails(!showCheckDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>{showCheckDetails ? 'Thu gọn tiêu chí' : 'Xem chi tiết tiêu chí'}</span>
            </button>
          </div>
        </div>

        {/* Subtasks Allocation Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {validationReport.subtasks.map((st) => (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all ${
                st.status === 'pass'
                  ? 'bg-slate-50/70 border-slate-200/80 hover:border-blue-300'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-slate-900">{st.name}</span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {st.percentage}% số điểm
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium line-clamp-2 min-h-[32px]">
                {st.condition}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Phạm vi: <strong className="text-slate-800 font-mono">{st.testRange}</strong>
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {st.actualTestCount} test ({Math.round((st.actualTestCount / validationReport.totalTests) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable Criteria Checklist */}
        {showCheckDetails && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Bảng kiểm tra 4 tiêu chí chất lượng khảo thí Themis
            </div>
            {validationReport.checks.map((chk) => (
              <div
                key={chk.id}
                className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/70"
              >
                {chk.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{chk.name}</div>
                  <div className="text-slate-500 mt-0.5">{chk.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Test Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of 20 Tests */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách {tests.length} Test
            </span>
            <span className="text-[11px] text-slate-400">Bấm để xem chi tiết</span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {tests.map((test, index) => {
              const isSelected = test.id === selectedTestId;
              const isSample = index === 0;
              const isEdge = index >= 12 && index <= 16;
              const isBig = index >= 17;
              const detail = validationReport.testDetails[index];
              const subId = test.subtask || detail?.subtaskId || 1;

              return (
                <button
                  key={test.id}
                  onClick={() => setSelectedTestId(test.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderOpen
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span>{test.testName}</span>
                        <span
                          className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-md ${
                            subId === 1
                              ? 'bg-sky-100 text-sky-800'
                              : subId === 2
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          Sub {subId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {test.note || `Test số ${test.id}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSample && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-medium">
                        Ví dụ
                      </span>
                    )}
                    {isEdge && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                        Biên
                      </span>
                    )}
                    {isBig && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-medium">
                        Max N
                      </span>
                    )}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Test Inspector */}
        <div className="lg:col-span-8 space-y-4">
          {currentTest ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              {/* Test Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-xs">
                    {currentTest.id < 10 ? '0' + currentTest.id : currentTest.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      Thư mục: {problem.problemCode}/{currentTest.testName}/
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ghi chú: <strong className="text-slate-700">{currentTest.note || 'Không có ghi chú'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sửa test này</span>
                    </button>
                  )}

                  {tests.length > 1 && (
                    <button
                      onClick={() => handleDeleteTest(currentTest.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xoá test này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subtask & Verification Metrics Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Subtask {currentTest.subtask || currentTestDetail?.subtaskId || 1}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {currentTest.subtaskConstraint || currentTestDetail?.subtaskName}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đạt chuẩn ràng buộc
                  </span>
                </div>

                {/* Input Metrics */}
                {currentTestDetail && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 flex-wrap">
                    <span>
                      Dữ liệu vào: <strong className="text-slate-800">{currentTestDetail.metrics.inputLines} dòng</strong> ({currentTestDetail.metrics.tokenCount} phần tử)
                    </span>
                    {currentTestDetail.metrics.firstNumber !== undefined && (
                      <span>
                        Tham số $N$: <strong className="text-slate-800">{currentTestDetail.metrics.firstNumber}</strong>
                      </span>
                    )}
                    {currentTestDetail.metrics.maxNumber !== undefined && (
                      <span>
                        Giá trị max: <strong className="text-slate-800">{currentTestDetail.metrics.maxNumber.toLocaleString('vi-VN')}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Sample match indicator for test01 */}
                {currentTest.id === 1 && (
                  <div className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 p-2 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Test01 trùng khớp 100% với Dữ liệu vào & ra ví dụ của đề bài.</span>
                  </div>
                )}
              </div>

              {/* Pair of Files: .inp and .out */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File .INP */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col">
                  <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {problem.problemCode}.inp
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(isEditing ? editInput : currentTest.input, 'inp')}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                    >
                      {copiedInp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col min-h-[220px]">
                    {isEditing ? (
                      <textarea
                        rows={10}
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full h-full bg-slate-800/80 text-emerald-300 font-mono text-xs p-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                        placeholder="Nội dung file .inp"
                      />
                    ) : (
                      <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[350px] scrollbar-thin">
                        {currentTest.input || '(Trống)'}
                      </pre>
                    )}
                  </div>
                </div>

                {/* File .OUT */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col">
                  <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {problem.problemCode}.out
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(isEditing ? editOutput : currentTest.output, 'out')}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                    >
                      {copiedOut ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col min-h-[220px]">
                    {isEditing ? (
                      <textarea
                        rows={10}
                        value={editOutput}
                        onChange={(e) => setEditOutput(e.target.value)}
                        className="w-full h-full bg-slate-800/80 text-amber-300 font-mono text-xs p-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
                        placeholder="Nội dung file .out"
                      />
                    ) : (
                      <pre className="text-xs font-mono text-amber-300 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[350px] scrollbar-thin">
                        {currentTest.output || '(Trống)'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Themis format guidance */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Chuẩn chấm Themis:</strong> Khi giải nén file ZIP, giáo viên chỉ cần copy thư mục{' '}
                  <code className="font-mono font-bold text-slate-800">{problem.problemCode}</code> vào thư mục TEST của Themis. Phần mềm chấm sẽ tự động duyệt qua từng thư mục test01, test02... nạp dữ liệu .inp và so khớp kết quả với .out.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Chưa có test case nào. Bấm nút Thêm test để bắt đầu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
