import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Check,
  RotateCcw,
  Layers,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Wand2,
} from 'lucide-react';
import { ProblemData } from '../types';
import { safeParseJsonResponse } from '../utils/apiHelper';

export interface SectionRefineBoxProps {
  sectionKey: 'description' | 'inputFormat' | 'outputFormat' | 'constraints' | 'sample';
  sectionTitle: string;
  problem: ProblemData;
  onUpdateProblem?: (updatedProblem: ProblemData) => void;
  onNavigateToTests?: () => void;
  placeholder: string;
  suggestedPrompts: string[];
}

export const SectionRefineBox: React.FC<SectionRefineBoxProps> = ({
  sectionKey,
  sectionTitle,
  problem,
  onUpdateProblem,
  onNavigateToTests,
  placeholder,
  suggestedPrompts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch('/api/refine-problem-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          sectionKey,
          sectionTitle,
          userPrompt: trimmed,
        }),
      });

      const data = await safeParseJsonResponse(res);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể cập nhật mục này. Vui lòng thử lại.');
      }

      if (data.problem && onUpdateProblem) {
        onUpdateProblem(data.problem);
      }

      setSuccessMessage(
        data.message || `Đã cập nhật mục "${sectionTitle}" và tạo lại bộ test mới phù hợp!`
      );
      setPromptText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi gọi AI điều chỉnh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChip = (chip: string) => {
    setPromptText((prev) => {
      if (!prev.trim()) return chip;
      return `${prev}. ${chip}`;
    });
  };

  return (
    <div className="mt-3">
      {/* Collapsed Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 rounded-xl px-3 py-1.5 transition-all shadow-2xs"
          title={`Gợi ý cho AI viết lại hoặc sửa đổi ${sectionTitle}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 transition-transform group-hover:scale-110" />
          <span>Gợi ý AI sửa đổi mục này & sinh lại test mới</span>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 ml-0.5" />
        </button>
      )}

      {/* Expanded Refinement Panel */}
      {isOpen && (
        <div className="bg-gradient-to-b from-indigo-50/60 to-slate-50 rounded-xl border border-indigo-200/90 p-4 shadow-xs space-y-3 transition-all animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-indigo-100/80 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">
                Gợi ý AI sửa đổi: <span className="text-indigo-700">{sectionTitle}</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-600" />
                Tự động tạo lại 20 test mới
              </span>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setErrorMessage(null);
              }}
              disabled={isLoading}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
              title="Đóng hộp gợi ý"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Nhập yêu cầu sửa đổi của bạn vào ô bên dưới. AI sẽ điều chỉnh lại{' '}
            <strong className="text-slate-800 font-semibold">{sectionTitle}</strong>, đồng bộ hóa
            lời giải C++ và tự động tính toán sinh lại bộ 20 test cases chuẩn Themis tương ứng.
          </p>

          {/* Preset Suggested Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500">
              Gợi ý nhanh (bấm để thêm vào nội dung):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  disabled={isLoading}
                  className="text-[11px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-300 rounded-lg px-2.5 py-1 transition-colors text-left disabled:opacity-50"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isLoading}
              placeholder={placeholder}
              className="w-full text-xs text-slate-800 bg-white border border-indigo-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 leading-relaxed resize-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Test01 sẽ khớp 100% ví dụ mới, các test tiếp theo tuân thủ đúng Subtask.</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMessage(null);
                }}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !promptText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật & sinh 20 test...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cập nhật mục này & Sinh lại 20 test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Notice with Link to Tests Tab */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>

              {onNavigateToTests && (
                <button
                  type="button"
                  onClick={onNavigateToTests}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>Xem bộ 20 test mới</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
