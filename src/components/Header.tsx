import React from 'react';
import {
  FileArchive,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  FolderTree,
  History,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ProblemData } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentProblem: ProblemData;
  onOpenGenerateModal: () => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
  onOpenHistory: () => void;
  historyCount: number;
  onResetToSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProblem,
  onOpenGenerateModal,
  onDownloadZip,
  isDownloading,
  onOpenHistory,
  historyCount,
  onResetToSample,
}) => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyCode = async () => {
    if (!currentProblem.solutionCpp) return;
    await navigator.clipboard.writeText(currentProblem.solutionCpp);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-4 ring-blue-50">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Trợ Lí Ra Đề C++
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Chuẩn Themis
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  20 Test .inp / .out
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Tự động sinh đề thi, mã nguồn chuẩn & bộ test Themis dạng file ZIP
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* History Button */}
            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              title="Danh sách đề đã tạo"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Lịch sử</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-300 text-slate-800 rounded-full text-xs font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Copy C++ Code */}
            <button
              id="btn-quick-copy-code"
              onClick={handleCopyCode}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép code</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Chép Code C++</span>
                </>
              )}
            </button>

            {/* AI Generate Button */}
            <button
              id="btn-open-generate-modal"
              onClick={onOpenGenerateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-all hover:shadow"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ra Đề Mới Bằng AI</span>
            </button>

            {/* Download 20-Test ZIP */}
            <button
              id="btn-header-download-zip"
              onClick={onDownloadZip}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs transition-all hover:shadow"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải ZIP 20 Test</span>
              <span className="sm:hidden">Tải ZIP</span>
            </button>

            {/* Ô Đăng Nhập bên phải ô Tải ZIP 20 Test */}
            {!isAuthenticated ? (
              <button
                id="btn-header-login"
                onClick={() => openLoginModal(undefined, 'Đăng nhập tài khoản Quản trị viên (Admin)')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-xs hover:shadow transition-all"
                title="Đăng nhập tài khoản Admin (legialoi)"
              >
                <LogIn className="w-4 h-4 text-amber-600" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              <div
                id="admin-user-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Admin</span>
                  <span className="font-mono text-emerald-950 font-bold text-xs">
                    {user?.username || 'legialoi'}
                  </span>
                </div>
                <button
                  id="btn-header-logout"
                  onClick={logout}
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  title="Đăng xuất khỏi tài khoản Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
