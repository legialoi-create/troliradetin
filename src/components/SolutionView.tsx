import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Sparkles,
  Edit3,
  Save,
  Play,
  Terminal,
  RotateCcw,
  X,
} from 'lucide-react';
import { ProblemData } from '../types';
import { safeParseJsonResponse } from '../utils/apiHelper';

interface SolutionViewProps {
  problem: ProblemData;
  onSyncWithCpp?: (customCode?: string) => void | Promise<void>;
  isSyncingWithCpp?: boolean;
  onAutoRepairCpp?: () => void | Promise<void>;
  isAutoRepairingCpp?: boolean;
  onUpdateSolutionCode?: (newCode: string) => void;
}

export const SolutionView: React.FC<SolutionViewProps> = ({
  problem,
  onSyncWithCpp,
  isSyncingWithCpp = false,
  onAutoRepairCpp,
  isAutoRepairingCpp = false,
  onUpdateSolutionCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [useFreopen, setUseFreopen] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editableCode, setEditableCode] = useState(problem.solutionCpp || '');

  // Custom Input Sandbox states
  const [customInput, setCustomInput] = useState(problem.sampleInput || '');
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<
    'idle' | 'running' | 'success' | 'compile_error' | 'timeout' | 'runtime_error'
  >('idle');
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxTimeMs, setSandboxTimeMs] = useState<number | null>(null);

  useEffect(() => {
    setEditableCode(problem.solutionCpp || '');
    setIsEditingCode(false);
  }, [problem.id, problem.solutionCpp]);

  useEffect(() => {
    setCustomInput(problem.sampleInput || '');
    setSandboxOutput(null);
    setSandboxStatus('idle');
    setSandboxError(null);
  }, [problem.id, problem.sampleInput]);

  // Generate code with or without active freopen
  const formattedCode = React.useMemo(() => {
    const rawVal = isEditingCode ? editableCode : problem.solutionCpp || '';
    const raw = typeof rawVal === 'string' ? rawVal : String(rawVal || '');
    if (!useFreopen) return raw;

    // Uncomment freopen lines if they are commented
    return raw
      .replace(
        /\/\/\s*freopen\("([^"]+)\.inp",\s*"r",\s*stdin\);/g,
        'freopen("$1.inp", "r", stdin);'
      )
      .replace(
        /\/\/\s*freopen\("([^"]+)\.out",\s*"w",\s*stdout\);/g,
        'freopen("$1.out", "w", stdout);'
      );
  }, [problem.solutionCpp, editableCode, isEditingCode, useFreopen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCpp = () => {
    const blob = new Blob([formattedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${problem.problemCode}.cpp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAndSyncCode = async () => {
    if (onUpdateSolutionCode) {
      onUpdateSolutionCode(editableCode);
    }
    setIsEditingCode(false);
    if (onSyncWithCpp) {
      await onSyncWithCpp(editableCode);
    }
  };

  const handleRunSandbox = async () => {
    try {
      setSandboxStatus('running');
      setSandboxError(null);
      const codeToRun = isEditingCode ? editableCode : problem.solutionCpp;
      const res = await fetch('/api/run-custom-cpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solutionCpp: codeToRun,
          customInput,
        }),
      });
      const data = await safeParseJsonResponse(res);
      setSandboxTimeMs(data.timeMs ?? 0);

      if (data.status === 'compile_error') {
        setSandboxStatus('compile_error');
        setSandboxError(data.compileError || 'Lỗi biên dịch C++');
        setSandboxOutput('');
      } else if (data.status === 'timeout') {
        setSandboxStatus('timeout');
        setSandboxError('Quá thời gian chạy (> 3.5 giây - TLE)');
        setSandboxOutput('');
      } else if (data.status === 'runtime_error') {
        setSandboxStatus('runtime_error');
        setSandboxError(data.stderr || data.error || 'Lỗi Runtime Error');
        setSandboxOutput(data.output || '');
      } else {
        setSandboxStatus('success');
        setSandboxOutput(data.output ?? '');
      }
    } catch (err: any) {
      setSandboxStatus('runtime_error');
      setSandboxError(err.message || 'Không thể kết nối máy chủ biên dịch C++.');
    }
  };

  const lines = formattedCode.split('\n');

  return (
    <div className="space-y-6">
      {/* Code Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {/* Code Header Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 text-xs font-mono font-bold text-slate-300">
              {problem.problemCode}.cpp
            </span>
            <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800">
              C++17 / C++20
            </span>
            {problem.executedByCpp && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Đã sinh 100% Output bằng g++ ({problem.cppExecutionTimeMs}ms)
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Edit / Save Code Toggle */}
            {isEditingCode ? (
              <>
                <button
                  onClick={handleSaveAndSyncCode}
                  disabled={isSyncingWithCpp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors border border-blue-500 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu & Chạy Đồng Bộ 20 Test</span>
                </button>
                <button
                  onClick={() => {
                    setEditableCode(problem.solutionCpp || '');
                    setIsEditingCode(false);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingCode(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                title="Chỉnh sửa trực tiếp mã nguồn C++ và biên dịch lại"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Sửa Code C++</span>
              </button>
            )}

            {/* AI Auto Repair Button */}
            {onAutoRepairCpp && !isEditingCode && (
              <button
                id="btn-auto-repair-cpp-from-solution"
                onClick={onAutoRepairCpp}
                disabled={isAutoRepairingCpp || isSyncingWithCpp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors border border-amber-500 disabled:opacity-50"
                title="AI phân tích và sửa lỗi tràn số nguyên (long long), lỗi mảng hoặc tối ưu giải thuật"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAutoRepairingCpp ? 'animate-spin' : ''}`} />
                <span>{isAutoRepairingCpp ? 'AI Đang Sửa Code...' : 'AI Sửa Lỗi & Tối Ưu Code'}</span>
              </button>
            )}

            {/* Run C++ Button */}
            {onSyncWithCpp && !isEditingCode && (
              <button
                id="btn-sync-cpp-from-solution"
                onClick={() => onSyncWithCpp()}
                disabled={isSyncingWithCpp || isAutoRepairingCpp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors border border-emerald-500 disabled:opacity-50"
                title="Biên dịch code C++ này và chạy lại toàn bộ test cases để cập nhật 100% Output chính xác"
              >
                <Cpu className={`w-3.5 h-3.5 ${isSyncingWithCpp ? 'animate-spin' : ''}`} />
                <span>{isSyncingWithCpp ? 'Đang chạy g++...' : 'Chạy C++ Sinh Output 20 Test'}</span>
              </button>
            )}

            {/* Themis Freopen Toggle */}
            {!isEditingCode && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={useFreopen}
                  onChange={(e) => setUseFreopen(e.target.checked)}
                  className="rounded border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Mở đọc ghi file Themis (.inp / .out)</span>
              </label>
            )}

            {/* Copy button */}
            <button
              id="btn-copy-solution-code"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chép code</span>
                </>
              )}
            </button>

            {/* Download .cpp file */}
            <button
              id="btn-download-cpp-file"
              onClick={handleDownloadCpp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Tải .cpp</span>
            </button>
          </div>
        </div>

        {/* Code Content or Editor */}
        {isEditingCode ? (
          <div className="p-4 bg-slate-900">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>
                Đang chỉnh sửa mã nguồn <strong className="text-white">{problem.problemCode}.cpp</strong>. Sau khi sửa xong, bấm <strong>"Lưu & Chạy Đồng Bộ 20 Test"</strong> để biên dịch g++ và cập nhật lại toàn bộ output.
              </span>
            </div>
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              rows={22}
              spellCheck={false}
              className="w-full font-mono text-xs bg-slate-950 text-emerald-300 p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[550px] scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="w-10 pr-4 text-right select-none text-slate-600 text-[11px] align-top">
                      {idx + 1}
                    </td>
                    <td className="text-slate-200 whitespace-pre">
                      {line.startsWith('//') ? (
                        <span className="text-slate-500 italic">{line}</span>
                      ) : line.startsWith('#include') ? (
                        <span className="text-pink-400 font-semibold">{line}</span>
                      ) : (
                        line
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive C++ Sandbox Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phòng Thí Nghiệm C++ (Chạy Thử Nhanh Với Input Tùy Chỉnh)
              </h3>
              <p className="text-xs text-slate-500">
                Biên dịch trực tiếp bằng <code className="font-mono text-slate-700">g++ -O3 -std=c++17</code> và kiểm tra kết quả đầu ra tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomInput(problem.sampleInput || '')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nạp Input Ví Dụ</span>
            </button>
            <button
              type="button"
              onClick={handleRunSandbox}
              disabled={sandboxStatus === 'running'}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{sandboxStatus === 'running' ? 'Đang biên dịch & chạy...' : 'Chạy Thử (g++)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
              Dữ liệu vào thử nghiệm (stdin):
            </label>
            <textarea
              rows={5}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Nhập dữ liệu đầu vào để kiểm tra..."
              className="w-full font-mono text-xs bg-slate-900 text-emerald-300 p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed resize-y"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 font-mono">
                Kết quả xuất ra (stdout):
              </span>
              {sandboxTimeMs !== null && sandboxStatus !== 'idle' && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    sandboxStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {sandboxStatus === 'success'
                    ? `✓ Thành công (${sandboxTimeMs}ms)`
                    : sandboxStatus === 'compile_error'
                    ? '✗ Lỗi biên dịch'
                    : sandboxStatus === 'timeout'
                    ? '✗ Quá thời gian (TLE)'
                    : '✗ Lỗi thực thi'}
                </span>
              )}
            </div>

            <div className="w-full min-h-[118px] font-mono text-xs bg-slate-900 text-amber-300 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {sandboxStatus === 'idle' ? (
                <span className="text-slate-500 italic">
                  Bấm nút "Chạy Thử (g++)" để xem kết quả thực thi...
                </span>
              ) : sandboxStatus === 'running' ? (
                <span className="text-slate-400 animate-pulse">
                  Đang biên dịch bằng g++ -O3 -std=c++17 và thực thi...
                </span>
              ) : sandboxError ? (
                <span className="text-rose-400">{sandboxError}</span>
              ) : (
                sandboxOutput || <span className="text-slate-500">(Không có dữ liệu in ra)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Analysis & Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Explanation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Phân tích thuật toán & Tư duy giải bài
          </h3>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            {problem.algorithmExplanation}
          </div>
        </div>

        {/* Complexity specs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Đánh giá độ phức tạp
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-600">Độ phức tạp thời gian (Time)</div>
                  <div className="text-xs font-bold text-blue-900 font-mono mt-0.5">
                    {problem.timeComplexity || 'O(N)'}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  Tối ưu chuẩn thi HSG
                </span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-600">Độ phức tạp bộ nhớ (Space)</div>
                  <div className="text-xs font-bold text-purple-900 font-mono mt-0.5">
                    {problem.spaceComplexity || 'O(1)'}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  Bộ nhớ tối thiểu
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Học sinh nên tập phân tích giới hạn N và miền giá trị trong đề bài để chọn kiểu biến (int / long long) và ước lượng số phép tính không vượt quá 10^8 phép tính/giây.
          </div>
        </div>
      </div>

      {/* Common Student Pitfalls */}
      {Array.isArray(problem.commonMistakes) && problem.commonMistakes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Lưu ý sư phạm: Các lỗi học sinh mới học C++ hay mắc phải
          </h3>
          <ul className="space-y-2">
            {problem.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-amber-950 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{String(mistake ?? '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
