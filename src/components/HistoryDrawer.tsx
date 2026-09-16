import React, { useState, useRef } from 'react';
import {
  X,
  History,
  Trash2,
  Download,
  Upload,
  ArrowRight,
  Search,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { ProblemData } from '../types';
import { enrichAndEnforceSubtaskCompliance } from '../utils/testValidator';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProblemData[];
  currentProblemId: string;
  onSelectProblem: (problem: ProblemData) => void;
  onDeleteProblem: (id: string) => void;
  onClearHistory: () => void;
  onImportHistory?: (imported: ProblemData[]) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  currentProblemId,
  onSelectProblem,
  onDeleteProblem,
  onClearHistory,
  onImportHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter problems by search query
  const filteredHistory = history.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.problemName || '').toLowerCase().includes(q) ||
      (p.problemCode || '').toLowerCase().includes(q) ||
      (p.topicName || '').toLowerCase().includes(q)
    );
  });

  // Export all saved problems as JSON file
  const handleExportJson = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NganHangDe_Themis_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Không thể xuất file sao lưu: ' + err.message);
    }
  };

  // Import JSON backup file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        const validProblems: ProblemData[] = [];
        for (const item of list) {
          if (item && item.problemName && item.problemCode) {
            validProblems.push(enrichAndEnforceSubtaskCompliance(item));
          }
        }

        if (validProblems.length === 0) {
          alert('File JSON không chứa dữ liệu đề bài hợp lệ.');
          return;
        }

        if (onImportHistory) {
          onImportHistory(validProblems);
        }

        setImportStatus(`Đã nhập thành công ${validProblems.length} bài!`);
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        alert('Lỗi đọc file JSON: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Ngân Hàng Đề Đã Tạo ({history.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50"
              >
                Xoá tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar: Search + Backup Export/Import */}
        <div className="p-3 border-b border-slate-200 bg-white space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài, mã bài..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Backup buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              disabled={history.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title="Sao lưu toàn bộ ngân hàng đề thành file .json để lưu trữ lâu dài hoặc chuyển sang máy khác"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Xuất sao lưu (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              title="Nhập ngân hàng đề từ file .json đã sao lưu trước đó"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nhập file (.json)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {importStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* Drawer List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {searchQuery
                ? 'Không tìm thấy đề bài nào khớp với từ khoá.'
                : 'Chưa có đề bài nào được lưu trong ngân hàng đề.'}
            </div>
          ) : (
            filteredHistory.map((prob) => {
              const isCurrent = prob.id === currentProblemId;
              const dateStr = prob.createdAt
                ? new Date(prob.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })
                : '';

              return (
                <div
                  key={prob.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.2 rounded">
                          {prob.topicName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          {prob.problemCode}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {prob.problemName}
                      </h4>
                    </div>

                    <button
                      onClick={() => onDeleteProblem(prob.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Xoá đề này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>{prob.testCases?.length || 20} tests • {dateStr}</span>
                    <button
                      onClick={() => {
                        onSelectProblem(prob);
                        onClose();
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {isCurrent ? 'Đang mở' : 'Xem đề này'} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
