import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  FolderArchive,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { CURRICULUM_TOPICS } from '../data/curriculum';
import { TopicId, Difficulty, ProblemData } from '../types';
import { safeParseJsonResponse } from '../utils/apiHelper';

interface GenerateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProblem: ProblemData) => void;
  initialTopic?: TopicId;
  initialProblemCode?: string;
  initialProblemName?: string;
  initialDifficulty?: Difficulty;
}

export const GenerateProblemModal: React.FC<GenerateProblemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTopic = 'branching',
  initialProblemCode = '',
  initialProblemName = '',
  initialDifficulty = 'easy',
}) => {
  const [topic, setTopic] = useState<TopicId>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [problemName, setProblemName] = useState(initialProblemName);
  const [problemCode, setProblemCode] = useState(initialProblemCode);
  const [customPrompt, setCustomPrompt] = useState('');
  const [testCount, setTestCount] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTopic(initialTopic);
      setDifficulty(initialDifficulty);
      setProblemName(initialProblemName);
      setProblemCode(initialProblemCode);
      setErrorMessage(null);
    }
  }, [isOpen, initialTopic, initialDifficulty, initialProblemName, initialProblemCode]);

  if (!isOpen) return null;

  const currentTopicObj = CURRICULUM_TOPICS.find((t) => t.id === topic) || CURRICULUM_TOPICS[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Đang khởi tạo trợ lí AI & cấu trúc sư phạm...');

    const timer1 = setTimeout(() => {
      setLoadingStep('Đang biên soạn đề bài chi tiết (Input, Output, Ràng buộc)...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setLoadingStep('Đang sinh mã nguồn C++ chuẩn & chú thích thuật toán...');
    }, 3500);

    const timer3 = setTimeout(() => {
      setLoadingStep(`Đang tính toán chính xác ${testCount} bộ test .inp và .out...`);
    }, 6000);

    try {
      const response = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          topicName: currentTopicObj.title,
          difficulty,
          customPrompt: customPrompt.trim(),
          problemCode: problemCode.trim().toUpperCase(),
          problemName: problemName.trim(),
          testCount,
        }),
      });

      const data = await safeParseJsonResponse(response);

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Không thể tạo đề bài. Vui lòng thử lại.';
        if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('quá tải')) {
          throw new Error('Máy chủ AI hiện đang chịu tải cao tạm thời (503). Bạn có thể bấm nút "Thử lại ngay" bên dưới để hệ thống tự động kết nối lại.');
        }
        throw new Error(errorMsg);
      }

      onSuccess(data.problem);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi gọi trợ lí AI.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ra Đề Lập Trình C++ & Bộ 20 Test Themis
              </h2>
              <p className="text-xs text-slate-500">
                AI sẽ tự động soạn đề, viết code C++ mẫu và sinh 20 test .inp/.out chuẩn xác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Thông báo hệ thống:</strong>
                  {errorMessage}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg font-bold text-xs transition-colors"
              >
                Thử lại ngay
              </button>
            </div>
          )}

          {/* 1. Lựa chọn Chủ đề theo lộ trình */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Chủ đề trong lộ trình sư phạm C++
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CURRICULUM_TOPICS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  disabled={isLoading}
                  className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                    topic === t.id
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.shortTitle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">#{t.order}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mức độ khó & Số lượng test */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Mức độ khó
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={isLoading}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      difficulty === d
                        ? d === 'easy'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : d === 'medium'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                          : 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d === 'easy' ? 'Cơ bản' : d === 'medium' ? 'Vừa sức' : 'Thử thách'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Quy cách bộ test (Themis)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={testCount}
                  onChange={(e) => setTestCount(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={20}>20 test (Chuẩn Themis: test01 ... test20)</option>
                  <option value={15}>15 test (test01 ... test15)</option>
                  <option value={10}>10 test (test01 ... test10)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Tên bài & Mã bài (Tùy chọn) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên bài toán (Để trống nếu muốn AI tự đặt)
              </label>
              <input
                type="text"
                placeholder="VD: Phân loại tam giác, Tính tiền điện..."
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã bài / Tên file (.inp & .out)
              </label>
              <input
                type="text"
                placeholder="VD: TAMGIAC, TIENDIEN, FIBO..."
                value={problemCode}
                onChange={(e) => setProblemCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="w-full text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 4. Yêu cầu chi tiết của giáo viên */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mô tả ý tưởng hoặc yêu cầu đặc biệt của giáo viên (Tùy chọn)
              </label>
              <span className="text-[11px] text-slate-400">Có thể để trống</span>
            </div>
            <textarea
              rows={3}
              placeholder="VD: 'Đề bài vui về bạn An đi mua sách được giảm giá theo số lượng', 'Cho dữ liệu n <= 10^5 cần dùng vòng lặp for đơn', 'Bẫy số âm và số 0 ở test biên'..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-900">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{loadingStep}</span>
              </div>
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-[11px] text-indigo-700">
                Hệ thống đang thẩm định tính đúng đắn của 20 bộ test để đảm bảo khớp 100% với lời giải C++.
              </p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              id="btn-submit-generate"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lí...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Sinh Đề & {testCount} Test Themis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
