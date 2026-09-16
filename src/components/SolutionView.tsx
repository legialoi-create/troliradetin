import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  FileCode,
} from 'lucide-react';
import { ProblemData } from '../types';

interface SolutionViewProps {
  problem: ProblemData;
}

export const SolutionView: React.FC<SolutionViewProps> = ({ problem }) => {
  const [copied, setCopied] = useState(false);
  const [useFreopen, setUseFreopen] = useState(false);

  // Generate code with or without active freopen
  const formattedCode = React.useMemo(() => {
    const raw = problem.solutionCpp || '';
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
  }, [problem.solutionCpp, useFreopen]);

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
          </div>

          <div className="flex items-center space-x-2">
            {/* Themis Freopen Toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 mr-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={useFreopen}
                onChange={(e) => setUseFreopen(e.target.checked)}
                className="rounded border-slate-600 text-blue-500 focus:ring-0"
              />
              <span>Mở đọc ghi file Themis (.inp / .out)</span>
            </label>

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

        {/* Code Content with Line Numbers */}
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
                  Tối ưu cho người mới
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
            Học sinh mới nên tập phân tích giới hạn N trong đề bài để ước lượng số phép tính không vượt quá 10^8 phép tính/giây.
          </div>
        </div>
      </div>

      {/* Common Student Pitfalls */}
      {problem.commonMistakes && problem.commonMistakes.length > 0 && (
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
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
