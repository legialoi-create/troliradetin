import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  CheckCircle2,
  FolderArchive,
  Layers,
  FileCode2,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { generateSkillBundleZip } from '../utils/skillBundleZip';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SkillTab =
  | 'master'
  | 'sub1'
  | 'sub2'
  | 'sub3'
  | 'sub4'
  | 'sub5'
  | 'sub6'
  | 'readme';

const SKILL_FILES: Record<
  SkillTab,
  { title: string; filename: string; description: string; content: string }
> = {
  master: {
    title: 'Master Skill (Điều Phối)',
    filename: 'SKILL.md',
    description: 'Điều phối toàn diện 6 sub-skills chuyên biệt theo quy trình chuẩn',
    content: `---
name: themis-problem-suite
description: >
  Hệ thống Master Skill toàn diện tạo và thẩm định đề thi Tin học chuẩn Themis / VNOI / HSG.
  Điều phối 6 sub-skills chuyên biệt: Soạn đề bài chuẩn sư phạm, Lời giải C++ chống tràn số,
  Phân bổ 20 test Subtask, Biên dịch C++ Runner sinh output 100%, Thẩm định bộ test, và Đóng gói Themis ZIP/Word.
---

# Master Skill: Hệ Thống Thiết Kế Đề Thi Tin Học Chuẩn Themis (Themis Problem Suite)

Master Skill này là đầu mối điều phối trọn gói quy trình tạo, thẩm định và xuất bản đề thi Lập trình thi đấu (Competitive Programming) theo chuẩn hệ thống chấm tự động Themis, các kỳ thi Học sinh giỏi (HSG) các cấp và Olympic Tin học Việt Nam (VOI).

## 1. Bản Đồ 6 Sub-Skills Chuyên Sâu

| STT | Sub-Skill | Đường dẫn | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **01** | \`problem-authoring\` | \`subskills/01-problem-authoring/\` | Soạn đề bài chuẩn sư phạm, KaTeX LaTeX, cấu trúc vào/ra chặt chẽ. |
| **02** | \`cpp-solution-engineer\` | \`subskills/02-cpp-solution-engineer/\` | Code C++17 tối ưu, phân tích chặn trên, chống tràn số (long long, double, string). |
| **03** | \`subtask-allocator\` | \`subskills/03-subtask-allocator/\` | Phân chia tỷ lệ Subtask, sinh input 20 test cases (test mẫu, test biên, test kịch trần). |
| **04** | \`cpp-executor-runner\` | \`subskills/04-cpp-executor-runner/\` | Biên dịch g++ độc lập và thực thi stdin/stdout sinh output thực tế chuẩn xác 100%. |
| **05** | \`test-validator\` | \`subskills/05-test-validator/\` | Chấm điểm bộ test (thang 100), kiểm tra vi phạm subtask và tự động chuẩn hóa. |
| **06** | \`themis-packager\` | \`subskills/06-themis-packager/\` | Đóng gói thư mục Themis ZIP (test01 -> test20) và xuất tài liệu Word (.docx). |

## 2. Quy Trình Điều Phối Tự Động (Master Execution Workflow)

1. [01. problem-authoring]   -> Sinh đề bài, Input, Output, Ràng buộc, Ví dụ mẫu.
2. [02. cpp-solution-engineer]-> Phân tích cận trên -> Khai báo đúng kiểu biến -> Code C++17.
3. [03. subtask-allocator]   -> Phân bổ 20 test inputs theo đúng tỷ lệ Subtask.
4. [04. cpp-executor-runner]  -> Biên dịch g++ & chạy qua stdin -> Thu được 20 test output CHÍNH XÁC 100%.
5. [05. test-validator]       -> Kiểm định chất lượng test (Khớp ví dụ? Đủ 20 test? Ràng buộc?).
6. [06. themis-packager]      -> Đóng gói ZIP Themis + Xuất file Word (.docx) đề thi.
`,
  },
  sub1: {
    title: '01. Soạn Đề Bài',
    filename: 'subskills/01-problem-authoring/SKILL.md',
    description: 'Quy chuẩn đặt tên, mã bài, LaTeX KaTeX, bối cảnh sư phạm',
    content: `---
name: problem-authoring
description: Soạn thảo nội dung đề bài Tin học chuẩn thi HSG: bối cảnh, mã bài, LaTeX KaTeX, định dạng vào/ra chặt chẽ.
---

# Sub-Skill 01: Soạn Thảo Đề Bài Chuẩn Sư Phạm (Problem Authoring)

1. Quy cách cơ bản:
   - Mã bài (problemCode): Tối đa 6 ký tự viết hoa không dấu, không khoảng trắng (SUMARR, PRIME, SUBSEQ).
   - Tên file vào/ra: <MABAI>.INP và <MABAI>.OUT (hoặc .inp/.out).
   - Thời gian chạy (timeLimit): Mặc định 1.0s (hoặc 2.0s cho cây/đồ thị).
   - Bộ nhớ tối đa (memoryLimit): Mặc định 256MB.

2. Quy tắc công thức toán & KaTeX:
   - Toàn bộ biến số ($n$, $k$, $a_i$) và biểu thức toán kẹp giữa dấu $ ... $.
   - Công thức độc lập kẹp giữa $$ ... $$.
   - TUYỆT ĐỐI KHÔNG dùng dấu ** ở đầu hoặc cuối câu gây lỗi hiển thị.

3. Các mục bắt buộc trong đề thi:
   - Đề bài / Bối cảnh: Rõ ràng, giàu tính sư phạm hoặc toán học logic.
   - Dữ liệu vào (inputFormat): Số dòng, ý nghĩa từng dòng, khoảng trắng giữa các phần tử.
   - Dữ liệu ra (outputFormat): Định dạng in kết quả, số chữ số thập phân nếu có.
   - Ràng buộc & Subtask: Nêu rõ phân bổ phần trăm điểm và giới hạn biến.
   - Ví dụ mẫu: Input, Output và phần giải thích chi tiết các bước tính.
`,
  },
  sub2: {
    title: '02. Lời Giải C++ Chống Tràn Số',
    filename: 'subskills/02-cpp-solution-engineer/SKILL.md',
    description: 'Phân tích chặn trên toán học, ép kiểu 1LL, bắt buộc long long / double / string',
    content: `---
name: cpp-solution-engineer
description: Viết mã nguồn C++17 tối ưu, phân tích chặn trên, quy tắc chọn kiểu biến chống tràn số (long long, double, string).
---

# Sub-Skill 02: Kỹ Thuật Lời Giải C++ Chuẩn Xác (C++ Solution Engineer)

1. Nguyên tắc phân tích chặn trên:
   - Miền giá trị <= 2*10^9: Sử dụng int.
   - Miền giá trị > 2*10^9 hoặc tổng/tích tới 9*10^18: BẮT BUỘC dùng long long.
   - Ép kiểu phép nhân: 1LL * a * b hoặc (long long)a * b (tránh tràn số int tạm thời).
   - Số thực: double hoặc long double, xuất: cout << fixed << setprecision(k) << ans;
   - Xâu ký tự: string, dùng getline(cin, s) nếu có dấu cách.
   - Tên biến trong code C++ ($n, k, a_i$) phải khớp 100% với tên biến trong đề bài.

2. Khung mã nguồn C++17 chuẩn:
\`\`\`cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <iomanip>

using namespace std;

void solve() {
    long long n;
    if (!(cin >> n)) return;
    vector<long long> a(n);
    long long totalSum = 0;
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        totalSum += a[i];
    }
    cout << totalSum << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // freopen("SUMARR.inp", "r", stdin);
    // freopen("SUMARR.out", "w", stdout);
    solve();
    return 0;
}
\`\`\`
`,
  },
  sub3: {
    title: '03. Phân Bổ 20 Test & Subtask',
    filename: 'subskills/03-subtask-allocator/SKILL.md',
    description: 'Tỷ lệ % Subtask, test01 mẫu 100%, test biên góc, test chạm kịch trần',
    content: `---
name: subtask-allocator
description: Phân bổ Subtask theo tỷ lệ điểm và sinh 20 bộ test input chuẩn Themis: test mẫu, test biên, test chạm trần.
---

# Sub-Skill 03: Phân Bổ Subtask & Sinh 20 Bộ Test Cases (Subtask Allocator)

1. Tỷ lệ Subtask chuẩn cho 20 test:
   - Subtask 1 (20% - 4 test: test01 -> test04): Dữ liệu nhỏ, duyệt trâu O(N^3), O(2^N).
   - Subtask 2 (30% - 6 test: test05 -> test10): Dữ liệu trung bình O(N^2).
   - Subtask 3 (50% - 10 test: test11 -> test20): Dữ liệu tối đa O(N log N) hoặc O(N).

2. Quy tắc test cases:
   - test01: BẮT BUỘC trùng khớp 100% từng ký tự với sampleInput trong đề bài.
   - Có test biên bẫy góc: N = 1, mảng toàn số âm, mảng toàn số bằng nhau, dãy đã xếp tăng/giảm.
   - Có test chạm trần: Giá trị đạt cực đại của Subtask (N = 10^5, Ai = 10^9).
`,
  },
  sub4: {
    title: '04. C++ Executor Runner',
    filename: 'subskills/04-cpp-executor-runner/SKILL.md',
    description: 'Biên dịch g++ độc lập, pipe stdin/stdout sinh output thực tế 100%',
    content: `---
name: cpp-executor-runner
description: Biên dịch C++ độc lập và thực thi nạp input qua stdin để sinh output chuẩn xác 100%.
---

# Sub-Skill 04: Bộ Máy Thực Thi C++ Sinh Output 100% (C++ Executor Runner)

1. Tiền xử lý mã nguồn:
   - Tự động thay thế câu lệnh freopen(...) thành // [Auto-piped] freopen(...)
   - Cho phép chương trình tương tác qua stdin và stdout.

2. Biên dịch độc lập:
   g++ -O3 -std=c++17 <source>.cpp -o <binary>.bin

3. Chạy từng test qua STDIN:
   - Nạp chuỗi input vào luồng stdin.
   - Thiết lập Timeout (mặc định 2.0s).
   - Thu nhận kết quả từ stdout, cắt khoảng trắng thừa cuối dòng (trimEnd).
   - Lưu vào test output thực tế. Tuyệt đối không để AI đoán mò output.
`,
  },
  sub5: {
    title: '05. Thẩm Định Bộ Test',
    filename: 'subskills/05-test-validator/SKILL.md',
    description: 'Thang điểm 100, phát hiện sai sót và tự động chuẩn hóa (Auto-repair)',
    content: `---
name: test-validator
description: Thẩm định chất lượng bộ test theo thang điểm 100, kiểm tra khớp ví dụ mẫu và tự động chuẩn hóa.
---

# Sub-Skill 05: Thẩm Định & Tự Động Chuẩn Hóa Bộ Test (Test Validator)

1. Thang điểm đánh giá:
   - Trùng ví dụ mẫu (test01 == sample): -25 điểm nếu không khớp.
   - Đủ 20 test cases: -20 điểm nếu thiếu.
   - Phân bổ Subtask đúng tỷ lệ: -5 điểm cho mỗi vi phạm.
   - Đạt chuẩn: Điểm >= 80 điểm.

2. Tự động chuẩn hóa (Auto-repair):
   - Ép buộc test01 trùng 100% với ví dụ đề bài.
   - Tính toán quota subtask theo tỷ lệ phần trăm đề bài.
   - Gán lại nhãn subtask và ràng buộc cho toàn bộ 20 test.
`,
  },
  sub6: {
    title: '06. Đóng Gói Themis & Word',
    filename: 'subskills/06-themis-packager/SKILL.md',
    description: 'Cấu trúc thư mục Themis chuẩn (test01..test20, .INP, .OUT) và xuất file Word',
    content: `---
name: themis-packager
description: Đóng gói thư mục bộ test Themis chuẩn (test01..test20, MABAI.INP, MABAI.OUT) và xuất Word (.docx).
---

# Sub-Skill 06: Đóng Gói Bộ Test Themis & Xuất Bản File (Themis Packager)

1. Cấu trúc thư mục Themis:
   <MABAI>/
   ├── test01/
   │   ├── <MABAI>.INP
   │   └── <MABAI>.OUT
   ├── test02/
   ...
   ├── test20/
   ├── solution.cpp
   ├── problem.md
   ├── DeThi_GiaoVien.docx
   └── DeThi_HocSinh.docx

2. Xuất tài liệu Word (.docx):
   - Đề thi học sinh: Đề bài, ràng buộc, ví dụ mẫu.
   - Bản giáo viên: Kèm bảng 20 test cases, thuật toán, mã nguồn C++ mẫu.
`,
  },
  readme: {
    title: '📖 Hướng Dẫn Cài Đặt (README)',
    filename: 'README.md',
    description: 'Cách cài đặt 1 lần cho Claude Code, Cursor, ChatGPT, Gemini, Copilot',
    content: `# Hướng Dẫn Cài Đặt Trọn Gói Skill "Themis Problem Suite" (Cài 1 Lần Dùng Mãi)

Gói Skill này chứa toàn bộ hệ thống tạo và kiểm định đề thi Tin học chuẩn Themis, bao gồm **Master Skill** và **6 Sub-skills chuyên sâu** cùng các script tự động.

## 1. Dùng Cho Claude Code / Claude Desktop
- Tải file ZIP trọn gói và giải nén vào thư mục dự án của bạn (ví dụ: \`.claude/skills/themis_master_skill/\` hoặc ngay trong thư mục gốc \`skills/themis_master_skill/\`).
- Trong prompt với Claude, chỉ cần gõ:
  > "Sử dụng skill themis-problem-suite để tạo đề thi về chủ đề Quy hoạch động, mức độ Khá cho học sinh giỏi cấp Tỉnh."
  Claude sẽ tự động đọc \`SKILL.md\` và kích hoạt các sub-skills tương ứng.

## 2. Dùng Cho Cursor IDE / VS Code Copilot
- Đặt thư mục này vào \`.cursor/rules/themis-problem-suite/\` hoặc copy nội dung file \`SKILL.md\` vào file \`.cursorrules\`.
- Khi bạn yêu cầu ra đề trong Cursor Composer (Ctrl+I hoặc Cmd+I), Cursor sẽ tự động tuân thủ toàn bộ quy tắc về kiểu dữ liệu C++, chống tràn số và phân chia Subtask.

## 3. Dùng Cho Custom GPTs / Gemini Gems / ChatGPT Web
- Mở cài đặt Custom GPT hoặc Gemini Gem của bạn.
- Trong phần **Instructions (Hướng dẫn)**: Dán nội dung của file \`SKILL.md\`.
- Trong phần **Knowledge (Tài liệu bổ trợ)**: Tải lên các file trong thư mục \`subskills/\`.
`,
  },
};

export const SkillModal: React.FC<SkillModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SkillTab>('master');
  const [copied, setCopied] = useState(false);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);

  if (!isOpen) return null;

  const currentFile = SKILL_FILES[activeTab];

  const handleCopyCurrent = async () => {
    await navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCurrentFile = () => {
    const blob = new Blob([currentFile.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename.split('/').pop() || 'SKILL.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullBundle = async () => {
    try {
      setIsDownloadingBundle(true);
      const zipBlob = await generateSkillBundleZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'themis_master_skill_bundle.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi tải gói Skill ZIP:', err);
    } finally {
      setIsDownloadingBundle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-linear-to-r from-purple-50 via-indigo-50 to-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md ring-4 ring-purple-100">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Agent Skill Bundle: themis-problem-suite
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  1 Master + 6 Sub-skills
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Cài 1 lần dùng mãi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Toàn bộ quy chuẩn tạo đề, subtask, C++ runner và đóng gói Themis chia thành các sub-skills chuyên biệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Banner - 1-Click Install Download */}
        <div className="px-5 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Tải về cài 1 lần:</strong> Gói ZIP chứa Master Skill, 6 Sub-skills, README & Scripts tự động sẵn sàng cho Claude, Cursor, ChatGPT, Gemini.
            </span>
          </div>
          <button
            onClick={handleDownloadFullBundle}
            disabled={isDownloadingBundle}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-900 bg-amber-300 hover:bg-amber-200 active:bg-amber-400 rounded-lg shadow-sm transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 text-indigo-900" />
            <span>
              {isDownloadingBundle
                ? 'Đang tạo gói ZIP...'
                : 'Tải Trọn Gói Skill Bundle (.ZIP)'}
            </span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex overflow-x-auto space-x-1 sm:space-x-2 text-xs">
          {(
            [
              ['master', '🌟 Master Skill'],
              ['sub1', '01. Soạn Đề'],
              ['sub2', '02. C++ Chống Tràn'],
              ['sub3', '03. 20 Test & Subtask'],
              ['sub4', '04. C++ Runner'],
              ['sub5', '05. Thẩm Định'],
              ['sub6', '06. Đóng Gói'],
              ['readme', '📖 Hướng Dẫn Cài'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
                activeTab === key
                  ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* File Info Bar */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-800">{currentFile.title}:</span>{' '}
            <code className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-mono border border-purple-100">
              {currentFile.filename}
            </code>
            <span className="text-slate-500 ml-2 hidden md:inline">
              — {currentFile.description}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCurrent}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chép file này</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadCurrentFile}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải file .md</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs sm:text-sm bg-slate-900 text-slate-100 leading-relaxed selection:bg-purple-600 selection:text-white">
          <pre className="whitespace-pre-wrap wrap-break-word font-mono">
            {currentFile.content}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Thư mục hệ thống: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">/skills/themis_master_skill/</code>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadFullBundle}
              disabled={isDownloadingBundle}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Tải Full Bundle (.zip)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
