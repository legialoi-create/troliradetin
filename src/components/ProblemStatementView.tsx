import React, { useState } from 'react';
import { InlineMath } from 'react-katex';
import {
  FileText,
  Clock,
  HardDrive,
  FileInput,
  FileOutput,
  Copy,
  Check,
  Printer,
  Sparkles,
  Share2,
  FileDown,
  Download,
  ChevronDown,
  BookOpen,
  FileCode,
} from 'lucide-react';
import { ProblemData } from '../types';
import { WordExportModal } from './WordExportModal';
import { generateProblemWordBlob, cleanMarkdownAndStandardizeLatex } from '../utils/wordGenerator';
import { generateProblemMarkdown, downloadProblemMarkdown } from '../utils/markdownGenerator';
import { downloadBlob } from '../utils/zipGenerator';
import { SectionRefineBox } from './SectionRefineBox';
import { useAuth } from '../context/AuthContext';

interface ProblemStatementViewProps {
  problem: ProblemData;
  onUpdateProblem?: (updatedProblem: ProblemData) => void;
  onNavigateToTests?: () => void;
}

/**
 * Renders problem text with LaTeX math badges ($...$) and clean bold styling without raw **
 */
const renderFormattedText = (rawText: string) => {
  if (!rawText) return null;
  const standardized = cleanMarkdownAndStandardizeLatex(rawText);
  const lines = standardized.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const isBullet = /^[-*+]\s+/.test(trimmed);
        const isNumbered = /^\d+[.)]\s+/.test(trimmed);
        let textToParse = trimmed;
        if (isBullet) {
          textToParse = trimmed.replace(/^[-*+]\s+/, '');
        }

        // Tokenize by **bold**, $latex$, and `code`
        const regex = /(\*\*([^*]+)\*\*)|(\$([^$]+)\$)|(`([^`]+)`)/g;
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(textToParse)) !== null) {
          if (match.index > lastIndex) {
            const plain = textToParse.slice(lastIndex, match.index).replace(/\*\*/g, '');
            if (plain) elements.push(<span key={`${lineIdx}-p-${lastIndex}`}>{plain}</span>);
          }

          if (match[1]) {
            // Bold without **
            const boldInner = match[2].replace(/\*\*/g, '');
            elements.push(
              <strong key={`${lineIdx}-b-${match.index}`} className="font-bold text-slate-900">
                {boldInner}
              </strong>
            );
          } else if (match[3]) {
            // Math formula wrapped in $...$
            const mathFormula = match[4].trim();
            elements.push(
              <span
                key={`${lineIdx}-m-${match.index}`}
                className="inline-flex items-center text-blue-900 bg-blue-50/70 border border-blue-200/60 px-1.5 py-0.5 rounded text-[14px] mx-0.5 align-middle"
              >
                <InlineMath math={mathFormula} renderError={(error) => <span title={error.message}>{mathFormula}</span>} />
              </span>
            );
          } else if (match[5]) {
            elements.push(
              <code
                key={`${lineIdx}-c-${match.index}`}
                className="font-mono text-xs text-blue-700 bg-slate-100 px-1.5 py-0.5 rounded"
              >
                {match[6]}
              </code>
            );
          }

          lastIndex = regex.lastIndex;
        }

        if (lastIndex < textToParse.length) {
          const trailing = textToParse.slice(lastIndex).replace(/\*\*/g, '');
          if (trailing) elements.push(<span key={`${lineIdx}-tr-${lastIndex}`}>{trailing}</span>);
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-3">
              <span className="text-blue-600 font-bold select-none">•</span>
              <div className="flex-1">{elements}</div>
            </div>
          );
        }

        return (
          <div key={lineIdx} className={isNumbered ? 'pl-3' : ''}>
            {elements}
          </div>
        );
      })}
    </div>
  );
};

export const ProblemStatementView: React.FC<ProblemStatementViewProps> = ({
  problem,
  onUpdateProblem,
  onNavigateToTests,
}) => {
  const { requireAuth } = useAuth();
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [wordSuccess, setWordSuccess] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [downloadingMarkdown, setDownloadingMarkdown] = useState<string | null>(null);

  const handleCopy = async (text: string, type: 'input' | 'output' | 'all') => {
    await navigator.clipboard.writeText(text);
    if (type === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else if (type === 'output') {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [downloadingWordType, setDownloadingWordType] = useState<string | null>(null);

  // Quick 1-click download for Word document (Chỉ đề bài phát học sinh)
  const handleDownloadWordOnly = () => {
    requireAuth(async () => {
      try {
        setDownloadingWordType('student');
        const blob = await generateProblemWordBlob(problem, {
          documentType: 'only_problem',
          includeSolution: false,
          includeExplanation: false,
          includeMistakes: false,
          includeTestCasesSummary: false,
          schoolName: 'TỔ TIN HỌC - ĐỀ THI HSG',
          examTitle: `ĐỀ BÀI: ${problem.problemName.toUpperCase()} (${problem.problemCode})`,
        });
        downloadBlob(blob, `${problem.problemCode}_DeBai.docx`);
        setWordSuccess(true);
        setTimeout(() => setWordSuccess(false), 2500);
      } catch (err: any) {
        alert('Không thể xuất file Word: ' + err.message);
      } finally {
        setDownloadingWordType(null);
      }
    }, 'Tải đề bài Word (.docx) cho học sinh');
  };

  // Tải file Word: Đề bài, lỗi sai & hướng dẫn giải
  const handleDownloadWordGuide = () => {
    requireAuth(async () => {
      try {
        setDownloadingWordType('guide');
        const blob = await generateProblemWordBlob(problem, {
          documentType: 'guide_and_mistakes',
          includeSolution: true,
          includeExplanation: true,
          includeMistakes: true,
          includeTestCasesSummary: false,
          schoolName: 'TỔ TIN HỌC - TÀI LIỆU ÔN TẬP',
          examTitle: `ĐỀ BÀI, LỖI SAI & HƯỚNG DẪN: ${problem.problemName.toUpperCase()} (${problem.problemCode})`,
        });
        downloadBlob(blob, `${problem.problemCode}_HuongDan_LoiSai.docx`);
        setWordSuccess(true);
        setTimeout(() => setWordSuccess(false), 2500);
      } catch (err: any) {
        alert('Không thể xuất file Word: ' + err.message);
      } finally {
        setDownloadingWordType(null);
      }
    }, 'Tải Word hướng dẫn & lỗi sai cho giáo viên');
  };

  // Tải file Markdown (.md) chuẩn công thức toán LaTeX ($...$)
  const handleDownloadMarkdown = (docType: 'only_problem' | 'full' = 'full') => {
    requireAuth(() => {
      try {
        setDownloadingMarkdown(docType);
        downloadProblemMarkdown(problem, {
          documentType: docType,
          includeSolution: true,
          includeAlgorithm: true,
          includeMistakes: true,
        });
      } catch (err: any) {
        alert('Không thể xuất file Markdown: ' + err.message);
      } finally {
        setTimeout(() => setDownloadingMarkdown(null), 1000);
      }
    }, 'Tải tài liệu Markdown (.md)');
  };

  // Sao chép toàn bộ đề bài và công thức toán dạng Markdown (LaTeX $...$)
  const handleCopyMarkdown = () => {
    requireAuth(async () => {
      const md = generateProblemMarkdown(problem, {
        documentType: 'full',
        includeSolution: true,
        includeAlgorithm: true,
        includeMistakes: true,
      });
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }, 'Sao chép Markdown (LaTeX)');
  };

  const fullProblemText = `BÀI TOÁN: ${problem.problemName} (${problem.problemCode})
Thời gian thực thi: ${problem.timeLimit} | Bộ nhớ: ${problem.memoryLimit}
File bài làm: ${problem.problemCode}.cpp | File vào: ${problem.problemCode}.inp | File ra: ${problem.problemCode}.out

1. ĐẶT VẤN ĐỀ
${problem.description}

2. DỮ LIỆU VÀO (${problem.problemCode}.inp)
${problem.inputFormat}

3. DỮ LIỆU RA (${problem.problemCode}.out)
${problem.outputFormat}

4. RÀNG BUỘC (CONSTRAINTS)
${problem.constraints}

5. VÍ DỤ
[Input]
${problem.sampleInput}
[Output]
${problem.sampleOutput}

Giải thích: ${problem.sampleExplanation}
`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Exam Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {problem.topicName}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  problem.difficulty === 'easy'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : problem.difficulty === 'medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {problem.difficulty === 'easy' ? 'Độ khó: Cơ bản' : problem.difficulty === 'medium' ? 'Độ khó: Vừa sức' : 'Độ khó: Thử thách'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {problem.problemName}
            </h2>
            <div className="text-sm font-mono text-slate-500 font-semibold mt-0.5">
              MÃ BÀI: <span className="text-blue-700">{problem.problemCode}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Word Button (.docx) */}
            <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden border border-blue-600 bg-blue-600">
              <button
                id="btn-quick-download-word-student"
                onClick={handleDownloadWordOnly}
                disabled={downloadingWordType !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50"
                title="Tải file Word chỉ chứa đề bài (để in phát học sinh)"
              >
                {wordSuccess && downloadingWordType === null ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-emerald-100">Đã tải!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-blue-100" />
                    <span>{downloadingWordType === 'student' ? 'Đang xuất...' : 'Tải Đề Word (Chỉ đề)'}</span>
                  </>
                )}
              </button>

              <button
                id="btn-quick-download-word-guide"
                onClick={handleDownloadWordGuide}
                disabled={downloadingWordType !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-100 bg-blue-700 hover:bg-blue-800 hover:text-white border-l border-blue-500 transition-colors disabled:opacity-50"
                title="Tải file Word gồm đề bài, các lỗi sai thường gặp và hướng dẫn giải"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-200" />
                <span>{downloadingWordType === 'guide' ? 'Đang xuất...' : 'Đề, Lỗi sai & HD'}</span>
              </button>

              <button
                id="btn-word-options-dropdown"
                onClick={() => requireAuth(() => setIsWordModalOpen(true), 'Tùy chỉnh & xuất file Word')}
                className="px-2 py-2 text-xs text-blue-100 hover:text-white hover:bg-blue-800 border-l border-blue-500 transition-colors"
                title="Tùy chỉnh chi tiết xuất file Word (tiêu đề trường, đáp án, font...)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download Markdown (.md) with LaTeX $...$ */}
            <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden border border-slate-300 bg-white hover:border-slate-400 transition-colors">
              <button
                id="btn-quick-download-markdown"
                onClick={() => handleDownloadMarkdown('full')}
                disabled={downloadingMarkdown !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
                title="Tải file Markdown (.md) hoàn chỉnh, công thức toán viết dạng LaTeX kẹp giữa 2 dấu $"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>{downloadingMarkdown === 'full' ? 'Đang xuất...' : 'Tải Markdown (.md)'}</span>
              </button>

              <button
                id="btn-quick-download-markdown-only"
                onClick={() => handleDownloadMarkdown('only_problem')}
                disabled={downloadingMarkdown !== null}
                className="px-2 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-700 hover:bg-slate-50 border-l border-slate-200 transition-colors"
                title="Tải file Markdown chỉ chứa đề bài (để đăng lên hệ thống chấm / phát học sinh)"
              >
                Chỉ đề
              </button>
            </div>

            {/* Copy Markdown */}
            <button
              id="btn-copy-markdown"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              title="Sao chép toàn bộ đề bài định dạng Markdown với công thức toán chuẩn LaTeX ($...$)"
            >
              {copiedMarkdown ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              <span>{copiedMarkdown ? 'Đã chép .md!' : 'Chép .md (LaTeX)'}</span>
            </button>

            {/* Copy Plaintext Statement */}
            <button
              onClick={() => handleCopy(fullProblemText, 'all')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Sao chép văn bản thuần"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedAll ? 'Đã chép text' : 'Chép text'}</span>
            </button>

            {/* Print Problem Statement */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In đề bài</span>
            </button>
          </div>
        </div>

        {/* Specification Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Thời gian chạy</div>
              <div className="text-xs font-bold text-slate-800">{problem.timeLimit || '1.0s'}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Bộ nhớ tối đa</div>
              <div className="text-xs font-bold text-slate-800">{problem.memoryLimit || '256 MB'}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileInput className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">File dữ liệu vào</div>
              <div className="text-xs font-bold font-mono text-slate-800">{problem.problemCode}.inp</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <FileOutput className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">File kết quả ra</div>
              <div className="text-xs font-bold font-mono text-slate-800">{problem.problemCode}.out</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Problem Statement Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Section 1: Problem Description */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            1. Đặt vấn đề
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {renderFormattedText(problem.description)}
          </div>
          <SectionRefineBox
            sectionKey="description"
            sectionTitle="1. Đặt vấn đề"
            problem={problem}
            onUpdateProblem={onUpdateProblem}
            onNavigateToTests={onNavigateToTests}
            placeholder="Ví dụ: Đổi ngữ cảnh sang bài toán chia kẹo cho học sinh; viết cốt truyện thực tế, sinh động và lôi cuốn hơn..."
            suggestedPrompts={[
              'Đổi ngữ cảnh sang chia kẹo / phần thưởng cho học sinh',
              'Đổi ngữ cảnh sang người nông dân thu hoạch nông sản',
              'Viết đề bài ngắn gọn, trực tiếp và súc tích hơn',
              'Bổ sung tình huống thực tế hấp dẫn cho học sinh',
            ]}
          />
        </div>

        {/* Section 2: Input Format */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            2. Dữ liệu vào ({problem.problemCode}.inp)
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {renderFormattedText(problem.inputFormat)}
          </div>
          <SectionRefineBox
            sectionKey="inputFormat"
            sectionTitle="2. Dữ liệu vào"
            problem={problem}
            onUpdateProblem={onUpdateProblem}
            onNavigateToTests={onNavigateToTests}
            placeholder="Ví dụ: Dòng 1 gồm 2 số N và K, dòng 2 gồm N số nguyên cách nhau một dấu cách..."
            suggestedPrompts={[
              'Dòng 1: Hai số N và K; Dòng 2: N số nguyên cách nhau dấu cách',
              'Tất cả các số nhập trên cùng một dòng cách nhau dấu cách',
              'Thêm số lượng test case T (T <= 10) ở dòng đầu tiên',
              'Quy định rõ mỗi phần tử nhập trên một dòng riêng biệt',
            ]}
          />
        </div>

        {/* Section 3: Output Format */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            3. Dữ liệu ra ({problem.problemCode}.out)
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {renderFormattedText(problem.outputFormat)}
          </div>
          <SectionRefineBox
            sectionKey="outputFormat"
            sectionTitle="3. Dữ liệu ra"
            problem={problem}
            onUpdateProblem={onUpdateProblem}
            onNavigateToTests={onNavigateToTests}
            placeholder="Ví dụ: Nếu không tìm thấy kết quả thì in ra -1; in kết quả trên một dòng cách nhau bởi dấu cách..."
            suggestedPrompts={[
              'Nếu không tìm thấy kết quả thỏa mãn thì in ra -1',
              'In kết quả trên một dòng cách nhau bởi một dấu cách',
              'Làm tròn lấy đúng 2 chữ số sau dấu phẩy',
              'In thêm chữ YES hoặc NO ở dòng đầu tiên',
            ]}
          />
        </div>

        {/* Section 4: Constraints & Subtasks */}
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            4. Ràng buộc dữ liệu & Subtask
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {renderFormattedText(problem.constraints)}
          </div>
          <SectionRefineBox
            sectionKey="constraints"
            sectionTitle="4. Ràng buộc & Subtask"
            problem={problem}
            onUpdateProblem={onUpdateProblem}
            onNavigateToTests={onNavigateToTests}
            placeholder="Ví dụ: Chia 3 Subtask: 30% có N <= 100; 30% có N <= 1000; 40% có N <= 10^5..."
            suggestedPrompts={[
              'Chia 3 Subtask: 30% N <= 100, 30% N <= 1000, 40% N <= 10^5',
              'Tăng giới hạn N lên 2*10^5 đòi hỏi thuật toán O(N log N)',
              'Giảm giới hạn N <= 20 để học sinh làm thuật toán quay lui',
              'Các số có giá trị lên tới 10^9 (yêu cầu dùng biến 64-bit long long)',
            ]}
          />
        </div>

        {/* Section 5: Sample Test */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            5. Ví dụ minh hoạ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sample Input */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Dữ liệu vào ({problem.problemCode}.inp)
                </span>
                <button
                  onClick={() => handleCopy(problem.sampleInput, 'input')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInput ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono bg-slate-900 text-slate-100 overflow-x-auto">
                {problem.sampleInput}
              </pre>
            </div>

            {/* Sample Output */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Dữ liệu ra ({problem.problemCode}.out)
                </span>
                <button
                  onClick={() => handleCopy(problem.sampleOutput, 'output')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOutput ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono bg-slate-900 text-slate-100 overflow-x-auto">
                {problem.sampleOutput}
              </pre>
            </div>
          </div>

          {/* Sample Explanation */}
          {problem.sampleExplanation && (
            <div className="mt-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
              <strong className="text-blue-900 font-semibold block mb-1">
                Giải thích ví dụ:
              </strong>
              {renderFormattedText(problem.sampleExplanation)}
            </div>
          )}

          <SectionRefineBox
            sectionKey="sample"
            sectionTitle="5. Ví dụ minh hoạ"
            problem={problem}
            onUpdateProblem={onUpdateProblem}
            onNavigateToTests={onNavigateToTests}
            placeholder="Ví dụ: Đổi ví dụ sang bộ số nhỏ dễ tính tay hơn, bổ sung giải thích chi tiết từng bước..."
            suggestedPrompts={[
              'Đổi ví dụ thành bộ dữ liệu nhỏ đơn giản hơn (ví dụ N = 5)',
              'Đổi ví dụ thành trường hợp đặc biệt / không tìm thấy nghiệm (-1)',
              'Bổ sung giải thích ví dụ chi tiết từng bước tính toán',
            ]}
          />
        </div>
      </div>

      {/* Word Export Modal */}
      <WordExportModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        problem={problem}
      />
    </div>
  );
};
