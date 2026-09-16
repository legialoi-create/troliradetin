import React, { useState } from 'react';
import {
  FileArchive,
  Download,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  CheckCircle2,
  Settings2,
  ExternalLink,
  Layers,
  FileDown,
  BookOpen,
} from 'lucide-react';
import { ProblemData } from '../types';
import { generateThemisTestZip, downloadBlob } from '../utils/zipGenerator';
import { generateProblemWordBlob } from '../utils/wordGenerator';
import { downloadProblemMarkdown } from '../utils/markdownGenerator';
import { WordExportModal } from './WordExportModal';
import { useAuth } from '../context/AuthContext';

interface ZipPackagingViewProps {
  problem: ProblemData;
  isDownloading: boolean;
  setIsDownloading: (val: boolean) => void;
}

export const ZipPackagingView: React.FC<ZipPackagingViewProps> = ({
  problem,
  isDownloading,
  setIsDownloading,
}) => {
  const { requireAuth } = useAuth();
  const [includeSolution, setIncludeSolution] = useState(true);
  const [includeDoc, setIncludeDoc] = useState(true);
  const [includeWordStudentDoc, setIncludeWordStudentDoc] = useState(true);
  const [includeWordTeacherDoc, setIncludeWordTeacherDoc] = useState(true);
  const [fileCase, setFileCase] = useState<'UPPERCASE' | 'lowercase' | 'Original'>('UPPERCASE');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const tests = problem.testCases || [];
  const codeFormatted =
    fileCase === 'UPPERCASE'
      ? problem.problemCode.toUpperCase()
      : fileCase === 'lowercase'
      ? problem.problemCode.toLowerCase()
      : problem.problemCode;

  const handleDownload = () => {
    requireAuth(async () => {
      try {
        setIsDownloading(true);
        setDownloadSuccess(false);

        const zipBlob = await generateThemisTestZip(problem, {
          includeSolution,
          includeProblemDoc: includeDoc,
          includeWordStudentDoc,
          includeWordTeacherDoc,
          fileCase,
        });

        downloadBlob(zipBlob, `${codeFormatted}_TEST_THEMIS.zip`);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } catch (err: any) {
        console.error('Error creating ZIP:', err);
        alert('Không thể tạo file ZIP: ' + err.message);
      } finally {
        setIsDownloading(false);
      }
    }, 'Tải trọn bộ file ZIP chuẩn Themis');
  };

  // Tải riêng file Word chỉ chứa đề bài (để in phát học sinh)
  const handleDownloadStudentWord = () => {
    requireAuth(async () => {
      try {
        setDownloadingType('student');
        const wordBlob = await generateProblemWordBlob(problem, {
          documentType: 'only_problem',
          includeSolution: false,
          includeExplanation: false,
          includeMistakes: false,
          includeTestCasesSummary: false,
          schoolName: 'TỔ TIN HỌC',
          examTitle: `ĐỀ THI: ${problem.problemName.toUpperCase()} (${problem.problemCode})`,
        });
        downloadBlob(wordBlob, `${codeFormatted}_DeBai.docx`);
      } catch (err: any) {
        alert('Không thể xuất file Word đề bài: ' + err.message);
      } finally {
        setDownloadingType(null);
      }
    }, 'Tải đề bài Word cho học sinh');
  };

  // Tải riêng file Word: Đề, lỗi sai và hướng dẫn giải
  const handleDownloadTeacherWord = () => {
    requireAuth(async () => {
      try {
        setDownloadingType('teacher');
        const wordBlob = await generateProblemWordBlob(problem, {
          documentType: 'guide_and_mistakes',
          includeSolution: true,
          includeExplanation: true,
          includeMistakes: true,
          includeTestCasesSummary: false,
          schoolName: 'TỔ TIN HỌC',
          examTitle: `ĐỀ BÀI, LỖI SAI & HƯỚNG DẪN GIẢI: ${problem.problemName.toUpperCase()} (${problem.problemCode})`,
        });
        downloadBlob(wordBlob, `${codeFormatted}_HuongDan_LoiSai.docx`);
      } catch (err: any) {
        alert('Không thể xuất file Word hướng dẫn: ' + err.message);
      } finally {
        setDownloadingType(null);
      }
    }, 'Tải Word hướng dẫn & lỗi sai cho giáo viên');
  };

  // Tải riêng file Markdown (.md) chuẩn công thức toán LaTeX ($...$)
  const handleDownloadMarkdown = (docType: 'only_problem' | 'full' = 'full') => {
    requireAuth(() => {
      downloadProblemMarkdown(problem, {
        documentType: docType,
        includeSolution: true,
        includeAlgorithm: true,
        includeMistakes: true,
      });
    }, 'Tải file Markdown (.md)');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Sẵn sàng tải về
            </span>
            <span className="text-xs font-mono text-slate-500">
              Định dạng: *.zip ({tests.length} tests) & *.docx (Word)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Đóng Gói Trọn Bộ Test Chuẩn Themis ({codeFormatted}.zip)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            File ZIP chứa thư mục mang tên bài <strong>{codeFormatted}</strong>, bên trong gồm các thư mục <strong>test01</strong> đến <strong>test{tests.length < 10 ? '0' + tests.length : tests.length}</strong>. Trong mỗi thư mục chứa file <strong>{codeFormatted}.inp</strong> và <strong>{codeFormatted}.out</strong> theo đúng yêu cầu đề bài.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="flex items-center rounded-xl border border-blue-200 bg-blue-50/70 p-1 gap-1">
            <button
              id="btn-download-word-student"
              onClick={handleDownloadStudentWord}
              disabled={downloadingType !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-white hover:shadow-xs rounded-lg transition-all disabled:opacity-50"
              title="Tải riêng file Word chỉ chứa đề bài (để in phát học sinh)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>{downloadingType === 'student' ? 'Đang tạo...' : 'Tải Đề Word (Chỉ đề)'}</span>
            </button>

            <button
              id="btn-download-word-teacher"
              onClick={handleDownloadTeacherWord}
              disabled={downloadingType !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-white hover:shadow-xs rounded-lg transition-all disabled:opacity-50"
              title="Tải file Word gồm đề bài, các lỗi sai thường gặp và hướng dẫn giải"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{downloadingType === 'teacher' ? 'Đang tạo...' : 'Tải Word (Đề, Lỗi sai & HD)'}</span>
            </button>

            <button
              id="btn-open-word-modal"
              onClick={() => requireAuth(() => setIsWordModalOpen(true), 'Tùy chỉnh & xuất file Word')}
              className="p-2 text-blue-600 hover:bg-white hover:shadow-xs rounded-lg transition-all"
              title="Tùy chỉnh chi tiết xuất file Word..."
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-blue-200 mx-0.5" />

            <button
              id="btn-download-md-file"
              onClick={() => handleDownloadMarkdown('full')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white hover:text-blue-700 hover:shadow-xs rounded-lg transition-all"
              title="Tải riêng file Markdown (.md) chuẩn công thức toán LaTeX kẹp giữa 2 dấu $"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải Markdown (.md)</span>
            </button>
          </div>

          <button
            id="btn-download-zip-package"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Đang nén ZIP...' : 'Tải Về File *.ZIP Ngay'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong>Tải về thành công!</strong> File ZIP đã được lưu vào máy. Bạn có thể giải nén hoặc sao chép trực tiếp vào phần mềm Themis để tổ chức chấm thi.
          </div>
        </div>
      )}

      {/* Settings & Tree Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Packaging Options */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-600" />
              Tùy chọn đóng gói ZIP
            </h3>

            {/* Casing option */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kiểu chữ tên file & thư mục
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFileCase('UPPERCASE')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-mono ${
                    fileCase === 'UPPERCASE'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  IN HOA
                </button>
                <button
                  type="button"
                  onClick={() => setFileCase('lowercase')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-mono ${
                    fileCase === 'lowercase'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  thường
                </button>
                <button
                  type="button"
                  onClick={() => setFileCase('Original')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-mono ${
                    fileCase === 'Original'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Giữ nguyên
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={includeSolution}
                  onChange={(e) => setIncludeSolution(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Kèm mã nguồn lời giải ({codeFormatted}.cpp)
                  </span>
                  <span className="text-[11px] text-slate-500">Mã nguồn C++ mẫu để chấm thi và đối chiếu kết quả</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={includeDoc}
                  onChange={(e) => setIncludeDoc(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Kèm đề bài &amp; hướng dẫn chấm (DeBai.txt &amp; .md)
                  </span>
                  <span className="text-[11px] text-slate-500">Định dạng văn bản thuần và Markdown tiện đọc</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeWordStudentDoc}
                  onChange={(e) => setIncludeWordStudentDoc(e.target.checked)}
                  className="mt-0.5 rounded border-blue-400 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="font-bold text-blue-950 block">
                    Kèm file đề bài Word (chỉ chứa đề thôi)
                  </span>
                  <span className="text-[11px] text-blue-700 font-mono block">
                    {codeFormatted}_DeBai.docx
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block leading-tight">
                    Chỉ gồm tên bài, đặt vấn đề, input/output, bảng ví dụ &amp; subtask để in phát cho học sinh (không kèm lời giải hay lỗi sai).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeWordTeacherDoc}
                  onChange={(e) => setIncludeWordTeacherDoc(e.target.checked)}
                  className="mt-0.5 rounded border-indigo-400 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="font-bold text-indigo-950 block">
                    Kèm file Word: Đề, lỗi sai và hướng dẫn
                  </span>
                  <span className="text-[11px] text-indigo-700 font-mono block">
                    {codeFormatted}_HuongDan_LoiSai.docx
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block leading-tight">
                    Tài liệu dành cho giáo viên và ôn tập: gồm đề bài, danh sách các lỗi sai học sinh hay mắc phải, hướng dẫn thuật toán &amp; code C++.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Themis Instructions Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Cách dùng file ZIP trong Themis
            </h4>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Tải file ZIP về máy và giải nén.</li>
              <li>
                Bạn sẽ nhận được thư mục <code className="font-mono font-bold text-slate-800">{codeFormatted}</code>.
              </li>
              <li>
                Sao chép thư mục này vào thư mục <strong>TEST</strong> của kỳ thi trong Themis.
              </li>
              <li>
                Học sinh nộp bài với tên file{' '}
                <code className="font-mono font-bold text-blue-700">{codeFormatted}.cpp</code>. Themis sẽ tự động chấm điểm từng test case từ test01 đến test{tests.length < 10 ? '0' + tests.length : tests.length}.
              </li>
            </ol>
          </div>
        </div>

        {/* Right: Visual Directory Tree */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Cấu trúc nội dung file {codeFormatted}_TEST_THEMIS.zip
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Tổng cộng: {tests.length * 2 + (includeSolution ? 1 : 0) + (includeDoc ? 2 : 0) + (includeWordStudentDoc ? 1 : 0) + (includeWordTeacherDoc ? 1 : 0)} files
            </span>
          </div>

          <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin pl-2">
            {/* Root Folder */}
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <FolderOpen className="w-4 h-4" />
              <span>{codeFormatted}/</span>
            </div>

            {/* Solution and Docs if included */}
            {includeSolution && (
              <div className="flex items-center gap-2 pl-6 text-pink-300">
                <FileCode className="w-3.5 h-3.5 text-pink-400" />
                <span>{codeFormatted}.cpp</span>
                <span className="text-[10px] text-slate-500 font-sans">(Mã nguồn lời giải mẫu)</span>
              </div>
            )}

            {includeDoc && (
              <>
                <div className="flex items-center gap-2 pl-6 text-blue-300">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>DeBai.txt</span>
                  <span className="text-[10px] text-slate-500 font-sans">(Đề bài định dạng Text)</span>
                </div>
                <div className="flex items-center gap-2 pl-6 text-blue-300">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-cyan-300">DeBai.md</span>
                  <span className="text-[10px] text-cyan-300/80 font-sans font-mono">(Đề bài Markdown chuẩn công thức toán LaTeX $...$)</span>
                </div>
              </>
            )}

            {includeWordStudentDoc && (
              <div className="flex items-center gap-2 pl-6 text-emerald-300">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{codeFormatted}_DeBai.docx</span>
                <span className="text-[10px] text-emerald-400/80 font-sans">(File Word: Chỉ chứa đề bài phát học sinh)</span>
              </div>
            )}

            {includeWordTeacherDoc && (
              <div className="flex items-center gap-2 pl-6 text-indigo-300">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{codeFormatted}_HuongDan_LoiSai.docx</span>
                <span className="text-[10px] text-indigo-400/80 font-sans">(File Word: Đề, lỗi sai &amp; hướng dẫn giải)</span>
              </div>
            )}

            {/* Test Folders */}
            {tests.slice(0, 10).map((test) => (
              <div key={test.id} className="pl-6 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-amber-300">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>{test.testName}/</span>
                </div>
                <div className="pl-6 flex items-center gap-2 text-emerald-400 text-[11px]">
                  <FileText className="w-3 h-3 text-emerald-500" />
                  <span>{codeFormatted}.inp</span>
                </div>
                <div className="pl-6 flex items-center gap-2 text-amber-400 text-[11px]">
                  <FileText className="w-3 h-3 text-amber-500" />
                  <span>{codeFormatted}.out</span>
                </div>
              </div>
            ))}

            {tests.length > 10 && (
              <div className="pl-12 py-2 text-slate-500 text-[11px] italic">
                ... (và các thư mục từ test11 đến test{tests.length < 10 ? '0' + tests.length : tests.length} tương tự)
              </div>
            )}

            {tests.length > 10 && (
              <div className="pl-6 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-amber-300">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>test{tests.length < 10 ? '0' + tests.length : tests.length}/</span>
                </div>
                <div className="pl-6 flex items-center gap-2 text-emerald-400 text-[11px]">
                  <FileText className="w-3 h-3 text-emerald-500" />
                  <span>{codeFormatted}.inp</span>
                </div>
                <div className="pl-6 flex items-center gap-2 text-amber-400 text-[11px]">
                  <FileText className="w-3 h-3 text-amber-500" />
                  <span>{codeFormatted}.out</span>
                </div>
              </div>
            )}
          </div>
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
