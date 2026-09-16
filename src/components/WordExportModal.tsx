import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileText,
  CheckCircle2,
  Settings2,
  Check,
  Download,
  School,
} from 'lucide-react';
import { ProblemData } from '../types';
import { generateProblemWordBlob, getExampleFileNames } from '../utils/wordGenerator';
import { downloadBlob } from '../utils/zipGenerator';

interface WordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: ProblemData;
}

export const WordExportModal: React.FC<WordExportModalProps> = ({
  isOpen,
  onClose,
  problem,
}) => {
  const defaultNum =
    problem.problemCode === 'WOOD' ? '4' :
    problem.problemCode === 'TAMGIAC' ? '1' :
    problem.problemCode === 'KTSNT' ? '2' :
    problem.problemCode === 'FIBO' ? '3' :
    problem.problemCode === 'SECONDMAX' ? '4' :
    problem.problemCode === 'PALIN' ? '5' :
    problem.problemCode === 'NGOACDUNG' ? '6' : '1';

  // Default formatted base name: e.g. WOOD -> Wood, TAMGIAC -> Tamgiac, vn -> Vn
  const defaultBaseName =
    problem.problemCode.length > 0
      ? problem.problemCode.charAt(0).toUpperCase() + problem.problemCode.slice(1).toLowerCase()
      : 'BaiTap';

  const [problemNumber, setProblemNumber] = useState(defaultNum);
  const [fileBaseName, setFileBaseName] = useState(defaultBaseName);
  const [exampleHeaderFormat, setExampleHeaderFormat] = useState<
    'TitleCase' | 'UpperCase' | 'AllUpper' | 'LowerCase'
  >('TitleCase');
  const [submissionFormat, setSubmissionFormat] = useState<'cpp_py' | 'cpp_only'>('cpp_py');
  const [ioSectionStyle, setIoSectionStyle] = useState<'vietnamese' | 'english'>('vietnamese');

  const [includeSchoolHeader, setIncludeSchoolHeader] = useState(false);
  const [includeSolution, setIncludeSolution] = useState(true);
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [includeMistakes, setIncludeMistakes] = useState(true);
  const [includeTestCasesSummary, setIncludeTestCasesSummary] = useState(false);
  const [schoolName, setSchoolName] = useState('SỞ GD&ĐT - TRƯỜNG THPT CHUYÊN');
  const [examTitle, setExamTitle] = useState('KỲ THI CHỌN ĐỘI TUYỂN TIN HỌC');
  const [isExporting, setIsExporting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [savedFileName, setSavedFileName] = useState('');

  if (!isOpen) return null;

  const cleanTitle = problem.problemName.replace(/^Bài\s*\d+[.:]\s*/i, '').trim();

  const exampleFiles = getExampleFileNames(
    problem.problemCode,
    fileBaseName,
    exampleHeaderFormat
  );

  const submissionFileName =
    submissionFormat === 'cpp_py'
      ? `${exampleFiles.base.toLowerCase()}.cpp hoặc ${exampleFiles.base.toLowerCase()}.py`
      : `${exampleFiles.base.toUpperCase()}.CPP`;

  // Quick preset helpers
  const applyPresetOnlyProblem = () => {
    setIncludeSolution(false);
    setIncludeExplanation(false);
    setIncludeMistakes(false);
    setIncludeTestCasesSummary(false);
  };

  const applyPresetGuideAndMistakes = () => {
    setIncludeSolution(true);
    setIncludeExplanation(true);
    setIncludeMistakes(true);
    setIncludeTestCasesSummary(false);
  };

  const applyPresetFull = () => {
    setIncludeSolution(true);
    setIncludeExplanation(true);
    setIncludeMistakes(true);
    setIncludeTestCasesSummary(true);
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const isOnlyProblem = !includeSolution && !includeExplanation && !includeMistakes && !includeTestCasesSummary;
      const docType = isOnlyProblem ? 'only_problem' : 'guide_and_mistakes';
      const fileName = isOnlyProblem ? `${problem.problemCode}_DeBai.docx` : `${problem.problemCode}_HuongDan_LoiSai.docx`;

      const blob = await generateProblemWordBlob(problem, {
        documentType: docType,
        problemNumber: problemNumber.trim() || defaultNum,
        fileBaseName: fileBaseName.trim() || defaultBaseName,
        exampleHeaderFormat,
        submissionFileName,
        ioSectionStyle,
        includeSchoolHeader,
        includeSolution,
        includeExplanation,
        includeMistakes,
        includeTestCasesSummary,
        schoolName: schoolName.trim(),
        examTitle: examTitle.trim(),
      });

      downloadBlob(blob, fileName);
      setSavedFileName(fileName);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Không thể xuất file Word: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Xuất Đề Bài Ra File Microsoft Word (.docx)
              </h3>
              <p className="text-xs text-slate-500">
                Định dạng .docx chuẩn font Times New Roman, bảng biểu và lề in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {successNotice ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm">Đã tải file Word thành công!</div>
              <p className="text-xs text-emerald-700 font-mono">
                {savedFileName || `${problem.problemCode}_DeBai.docx`}
              </p>
            </div>
          ) : (
            <>
              {/* Quick Preset Selector */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Chế độ xuất nhanh:
                  </span>
                  <span className="text-[11px] text-blue-700 font-medium">
                    Chọn cấu hình mẫu
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={applyPresetOnlyProblem}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      !includeSolution && !includeExplanation && !includeMistakes && !includeTestCasesSummary
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-100/50'
                    }`}
                  >
                    📄 Chỉ chứa đề
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetGuideAndMistakes}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      includeSolution && includeExplanation && includeMistakes && !includeTestCasesSummary
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-100/50'
                    }`}
                  >
                    📘 Đề, lỗi sai &amp; HD
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetFull}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      includeSolution && includeExplanation && includeMistakes && includeTestCasesSummary
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                    }`}
                  >
                    📋 Toàn bộ + Test
                  </button>
                </div>
              </div>

              {/* Problem Number & Title Line Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số thứ tự bài:
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-2 rounded-l-lg border border-r-0 border-slate-200">
                        Bài
                      </span>
                      <input
                        type="text"
                        value={problemNumber}
                        onChange={(e) => setProblemNumber(e.target.value)}
                        className="w-full text-xs font-bold text-blue-700 bg-white border border-slate-200 rounded-r-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 4"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Xem trước tiêu đề bài:
                    </label>
                    <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between font-serif gap-2 truncate">
                      <span className="font-bold text-blue-900 truncate">
                        Bài {problemNumber || defaultNum}. {cleanTitle}
                      </span>
                      <span className="font-bold text-blue-900 font-mono text-[11px] shrink-0">
                        Tên file: {submissionFileName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional School / National Header Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeSchoolHeader}
                      onChange={(e) => setIncludeSchoolHeader(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800">
                      Kèm tiêu đề Quốc hiệu &amp; Trường / Sở GD&amp;ĐT ở đầu trang
                    </span>
                  </label>
                </div>

                {includeSchoolHeader && (
                  <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tên Trường / Sở GD&ĐT
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: SỞ GD&ĐT HÀ NỘI - TRƯỜNG THPT CHUYÊN..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tiêu đề kỳ thi
                      </label>
                      <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: KỲ THI CHỌN ĐỘI TUYỂN TIN HỌC..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TÊN FILE VÍ DỤ INPUT / OUTPUT THEO YÊU CẦU */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    Tiêu đề bảng Ví dụ (Tên_bài.inp / Tên_bài.out):
                  </label>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-semibold">
                    {exampleFiles.inp} | {exampleFiles.out}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mã / Tên bài đặt cho file:
                    </label>
                    <input
                      type="text"
                      value={fileBaseName}
                      onChange={(e) => setFileBaseName(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: Wood, Tamgiac, Vn..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kiểu viết hoa / thường:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setExampleHeaderFormat('TitleCase')}
                        className={`px-2 py-1 rounded border font-mono font-medium transition-all ${
                          exampleHeaderFormat === 'TitleCase'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {fileBaseName.charAt(0).toUpperCase() + fileBaseName.slice(1).toLowerCase()}.inp
                      </button>
                      <button
                        type="button"
                        onClick={() => setExampleHeaderFormat('UpperCase')}
                        className={`px-2 py-1 rounded border font-mono font-medium transition-all ${
                          exampleHeaderFormat === 'UpperCase'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {fileBaseName.toUpperCase()}.inp
                      </button>
                      <button
                        type="button"
                        onClick={() => setExampleHeaderFormat('AllUpper')}
                        className={`px-2 py-1 rounded border font-mono font-medium transition-all ${
                          exampleHeaderFormat === 'AllUpper'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {fileBaseName.toUpperCase()}.INP
                      </button>
                      <button
                        type="button"
                        onClick={() => setExampleHeaderFormat('LowerCase')}
                        className={`px-2 py-1 rounded border font-mono font-medium transition-all ${
                          exampleHeaderFormat === 'LowerCase'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {fileBaseName.toLowerCase()}.inp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview Box of Example Table */}
                <div className="bg-white rounded-lg border border-slate-300 p-2.5 font-serif space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans">
                    <span className="font-bold text-slate-800 font-serif">Ví dụ:</span>
                    <span className="italic text-[10px] text-slate-400">Xem trước hiển thị trong Word</span>
                  </div>
                  <table className="w-full text-xs border-collapse border border-black font-mono">
                    <thead>
                      <tr className="bg-slate-50 font-serif font-bold text-black text-center text-[11px]">
                        <th className="border border-black px-3 py-1.5 w-1/2 text-center font-bold">
                          {exampleFiles.inp}
                        </th>
                        <th className="border border-black px-3 py-1.5 w-1/2 text-center font-bold">
                          {exampleFiles.out}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-black align-top bg-white">
                        <td className="border border-black px-2.5 py-1.5 w-1/2 whitespace-pre leading-tight text-[11px]">
                          {(problem.sampleInput || '').trim() || '5 10\n2 3 5 2 4'}
                        </td>
                        <td className="border border-black px-2.5 py-1.5 w-1/2 whitespace-pre leading-tight text-[11px]">
                          {(problem.sampleOutput || '').trim() || '3'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Additional Formatting Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Đề mục Dữ liệu vào / Dữ liệu ra:
                    </label>
                    <select
                      value={ioSectionStyle}
                      onChange={(e) => setIoSectionStyle(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="vietnamese">Dữ liệu vào: &amp; Dữ liệu ra: (Chuẩn đề HSG)</option>
                      <option value="english">INPUT &amp; OUTPUT (Kiểu quốc tế)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tên file nộp bài ở tiêu đề:
                    </label>
                    <select
                      value={submissionFormat}
                      onChange={(e) => setSubmissionFormat(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="cpp_py">{exampleFiles.base.toLowerCase()}.cpp hoặc {exampleFiles.base.toLowerCase()}.py (Chuẩn đề)</option>
                      <option value="cpp_only">{exampleFiles.base.toUpperCase()}.CPP (Chỉ C++)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung kèm theo trong file Word:
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <input
                    type="checkbox"
                    checked={includeSolution}
                    onChange={(e) => setIncludeSolution(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Kèm mã nguồn lời giải C++ ({problem.problemCode}.cpp)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Được đóng khung viền bằng font Consolas chuẩn code
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <input
                    type="checkbox"
                    checked={includeExplanation}
                    onChange={(e) => setIncludeExplanation(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Kèm hướng dẫn giải &amp; phân tích thuật toán
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Độ phức tạp thời gian/bộ nhớ và các lưu ý thuật toán
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <input
                    type="checkbox"
                    checked={includeMistakes}
                    onChange={(e) => setIncludeMistakes(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-indigo-950 block">
                      Kèm các lỗi sai học sinh thường mắc phải &amp; bẫy subtask
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Lỗi tràn số 32-bit (int vs long long), bẫy mảng, đọc file, trường hợp biên (N=1, 0, số âm)
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <input
                    type="checkbox"
                    checked={includeTestCasesSummary}
                    onChange={(e) => setIncludeTestCasesSummary(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Kèm bảng danh mục {problem.testCases?.length || 20} bộ test Themis
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Liệt kê test01 đến test20 kèm input/output tóm tắt
                    </span>
                  </div>
                </label>
              </div>

              {/* Info Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Chuẩn xuất Microsoft Word (.docx) sư phạm:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • Cột Ví dụ hiển thị chuẩn tên file <code className="bg-slate-200/80 px-1 rounded font-bold font-mono">{exampleFiles.inp}</code> và <code className="bg-slate-200/80 px-1 rounded font-bold font-mono">{exampleFiles.out}</code> theo đúng quy cách đề thi.<br />
                  • Bỏ toàn bộ <code className="bg-slate-200/80 px-1 rounded">**</code>, công thức toán viết dạng LaTeX <code className="bg-slate-200/80 px-1 rounded">$...$</code>.<br />
                  • Căn lề trái 2.5cm, lề phải/trên/dưới 2.0cm chuẩn thể thức đề thi.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!successNotice && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end space-x-2 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              id="btn-confirm-download-word"
              onClick={handleDownload}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang tạo Word...' : 'Tải File Word (.docx)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
