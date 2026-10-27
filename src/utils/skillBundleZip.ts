import JSZip from 'jszip';

export async function generateSkillBundleZip(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('themis_master_skill') || zip;

  // Master SKILL.md
  root.file(
    'SKILL.md',
    `---
name: themis-problem-suite
description: >
  Hệ thống Master Skill toàn diện tạo và thẩm định đề thi Tin học chuẩn Themis / VNOI / HSG.
  Điều phối 6 sub-skills chuyên biệt: Soạn đề bài chuẩn sư phạm, Lời giải C++ chống tràn số,
  Phân bổ 20 test Subtask, Biên dịch C++ Runner sinh output 100%, Thẩm định bộ test, và Đóng gói Themis ZIP/Word.
---

# Master Skill: Hệ Thống Thiết Kế Đề Thi Tin Học Chuẩn Themis (Themis Problem Suite)

Master Skill này là đầu mối điều phối trọn gói quy trình tạo, thẩm định và xuất bản đề thi Lập trình thi đấu (Competitive Programming) theo chuẩn hệ thống chấm tự động Themis, kỳ thi Học sinh giỏi (HSG) và Olympic Tin học (VOI).

## 1. Bản Đồ Các Sub-Skills (Sub-skills Architecture)

Khi thực hiện yêu cầu tạo đề, Master Skill sẽ kích hoạt và phối hợp 6 sub-skills theo thứ tự:

| Thứ tự | Sub-Skill | Thư mục | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **01** | \`problem-authoring\` | \`subskills/01-problem-authoring/\` | Soạn đề bài chuẩn sư phạm, KaTeX LaTeX, cấu trúc dữ liệu chặt chẽ. |
| **02** | \`cpp-solution-engineer\` | \`subskills/02-cpp-solution-engineer/\` | Viết code C++17 tối ưu, phân tích chặn trên, chống tràn số (long long, double, string). |
| **03** | \`subtask-allocator\` | \`subskills/03-subtask-allocator/\` | Phân chia tỷ lệ Subtask, sinh input 20 test cases (test mẫu, test biên, test kịch trần). |
| **04** | \`cpp-executor-runner\` | \`subskills/04-cpp-executor-runner/\` | Biên dịch g++ độc lập và thực thi stdin/stdout sinh output thực tế chuẩn xác 100%. |
| **05** | \`test-validator\` | \`subskills/05-test-validator/\` | Chấm điểm bộ test (thang 100), kiểm tra vi phạm subtask và tự động chuẩn hóa. |
| **06** | \`themis-packager\` | \`subskills/06-themis-packager/\` | Đóng gói thư mục Themis ZIP (test01 -> test20) và xuất tài liệu Word (.docx). |

## 2. Quy Trình Phối Hợp Tự Động (Master Execution Workflow)

1. [01. problem-authoring]: Sinh đề bài, Input, Output, Ràng buộc, Ví dụ mẫu.
2. [02. cpp-solution-engineer]: Phân tích cận trên -> Khai báo đúng kiểu biến -> Code C++17.
3. [03. subtask-allocator]: Phân bổ 20 test inputs theo đúng tỷ lệ Subtask.
4. [04. cpp-executor-runner]: Biên dịch g++ & chạy qua stdin -> Thu được 20 test output CHÍNH XÁC 100%.
5. [05. test-validator]: Kiểm định chất lượng test (Khớp ví dụ? Đủ 20 test? Ràng buộc?).
6. [06. themis-packager]: Đóng gói ZIP Themis + Xuất file Word (.docx) đề thi.
`
  );

  // README.md
  root.file(
    'README.md',
    `# Hướng Dẫn Cài Đặt Trọn Gói Skill "Themis Problem Suite" (Cài 1 Lần Dùng Mãi)

Gói Skill này chứa toàn bộ hệ thống tạo và kiểm định đề thi Tin học chuẩn Themis, bao gồm **Master Skill** và **6 Sub-skills chuyên sâu** cùng các script tự động.

## 1. Dùng Cho Claude Code / Claude Desktop
- Giải nén thư mục \`themis_master_skill\` vào thư mục dự án của bạn (ví dụ: \`.claude/skills/themis_master_skill/\` hoặc ngay trong thư mục gốc \`skills/themis_master_skill/\`).
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
`
  );

  // Subskill 01
  const sub1 = root.folder('subskills')?.folder('01-problem-authoring');
  sub1?.file(
    'SKILL.md',
    `---
name: problem-authoring
description: Soạn thảo nội dung đề bài Tin học chuẩn thi HSG, LaTeX KaTeX, cấu trúc vào/ra chặt chẽ.
---

# Sub-Skill 01: Soạn Thảo Đề Bài Chuẩn Sư Phạm (Problem Authoring)

1. Mã bài (problemCode): Tối đa 6 ký tự viết hoa không dấu (VD: SUMARR, PRIME, SUBSEQ).
2. Tên file vào/ra: <MABAI>.INP và <MABAI>.OUT (hoặc .inp/.out).
3. Thời gian chạy: 1.0s (hoặc 2.0s cho bài lớn), Bộ nhớ: 256MB.
4. Công thức toán (LaTeX): Biến số ($n$, $k$, $a_i$) kẹp giữa $ ... $. Biểu thức lớn kẹp $$ ... $$.
5. Định dạng văn bản: Không dùng dấu ** thừa đầu/cuối câu.
6. Mục bắt buộc: Đề bài, Dữ liệu vào, Dữ liệu ra, Ràng buộc & Subtask, Ví dụ mẫu kèm giải thích chi tiết.
`
  );

  // Subskill 02
  const sub2 = root.folder('subskills')?.folder('02-cpp-solution-engineer');
  sub2?.file(
    'SKILL.md',
    `---
name: cpp-solution-engineer
description: Viết mã nguồn C++17 chuẩn thi đấu, phân tích chặn trên, chống tràn số (long long, double, string).
---

# Sub-Skill 02: Kỹ Thuật Lời Giải C++ Chuẩn Xác (C++ Solution Engineer)

1. Phân tích chặn trên & Kiểu dữ liệu:
   - Nếu giá trị, tổng, tích vượt quá 2 * 10^9: BẮT BUỘC dùng \`long long\`.
   - Ép kiểu phép nhân: \`1LL * a * b\` hoặc \`(long long)a * b\` để tránh tràn số kiểu int.
   - Số thực: \`double\` hoặc \`long double\`, xuất \`cout << fixed << setprecision(k)\`.
   - Xâu ký tự: \`string\`, đọc \`getline(cin, s)\` nếu có khoảng trắng.
2. Cấu trúc C++17 hoàn chỉnh:
   - \`ios_base::sync_with_stdio(false); cin.tie(NULL);\`
   - Comment đọc ghi file Themis: \`// freopen("MABAI.inp", "r", stdin); // freopen("MABAI.out", "w", stdout);\`
3. Giải thích độ phức tạp thời gian O(...) và không gian O(...).
`
  );

  // Subskill 03
  const sub3 = root.folder('subskills')?.folder('03-subtask-allocator');
  sub3?.file(
    'SKILL.md',
    `---
name: subtask-allocator
description: Phân bổ Subtask theo tỷ lệ điểm và sinh 20 bộ test input chuẩn Themis.
---

# Sub-Skill 03: Phân Bổ Subtask & Sinh 20 Bộ Test Cases (Subtask Allocator)

1. Tỷ lệ Subtask chuẩn (20 test):
   - Subtask 1: 20% (4 test: test01 - test04) - Thuật toán thô O(N^3), duyệt trâu. Test 01 là test ví dụ mẫu.
   - Subtask 2: 30% (6 test: test05 - test10) - Thuật toán O(N^2).
   - Subtask 3: 50% (10 test: test11 - test20) - Thuật toán tối ưu O(N log N) hoặc O(N).
2. Test 01 bắt buộc trùng khớp 100% từng ký tự với sampleInput trong đề bài.
3. Có đủ test nhỏ, test biên bẫy góc (N=1, mảng âm, phần tử bằng nhau), test kịch trần Subtask cao nhất.
`
  );

  // Subskill 04
  const sub4 = root.folder('subskills')?.folder('04-cpp-executor-runner');
  sub4?.file(
    'SKILL.md',
    `---
name: cpp-executor-runner
description: Biên dịch C++ độc lập và thực thi nạp input qua stdin để sinh output chuẩn xác 100%.
---

# Sub-Skill 04: Bộ Máy Thực Thi C++ Sinh Output 100% (C++ Executor Runner)

1. Tiền xử lý: Tắt các lệnh freopen để pipe qua stdin/stdout.
2. Biên dịch: \`g++ -O3 -std=c++17 solution.cpp -o solution.bin\`
3. Chạy từng test input qua stdin với timeout 2.0s, bắt stdout làm output chính thức.
4. Cắt bỏ khoảng trắng cuối dòng (trimEnd).
`
  );

  // Subskill 05
  const sub5 = root.folder('subskills')?.folder('05-test-validator');
  sub5?.file(
    'SKILL.md',
    `---
name: test-validator
description: Thẩm định chất lượng bộ test theo thang điểm 100 và tự động sửa lỗi chuẩn hóa.
---

# Sub-Skill 05: Thẩm Định & Tự Động Chuẩn Hóa Bộ Test (Test Validator)

1. Thang điểm 100:
   - Khớp ví dụ mẫu: test01 trùng 100% ví dụ mẫu (-25 điểm nếu sai).
   - Đủ 20 test (-20 điểm nếu thiếu).
   - Đúng phân bổ Subtask (-5 điểm mỗi vi phạm).
   - Đạt chuẩn khi điểm >= 80.
2. Tự động chuẩn hóa (Auto-repair):
   - Gán lại test01 thành test ví dụ mẫu.
   - Phân bổ lại nhãn subtask theo tỷ lệ phần trăm đề bài.
`
  );

  // Subskill 06
  const sub6 = root.folder('subskills')?.folder('06-themis-packager');
  sub6?.file(
    'SKILL.md',
    `---
name: themis-packager
description: Đóng gói thư mục bộ test Themis chuẩn (test01..test20, MABAI.INP, MABAI.OUT), đóng gói tổng hợp DeThi_HSG_FullPackage.zip và xuất Word docx.
---

# Sub-Skill 06: Đóng Gói Bộ Test Themis & Xuất Bản File (Themis Packager)

1. Cấu trúc thư mục Themis đơn (<MABAI>_Themis_20Tests.zip):
   <MABAI>/
   ├── test01/ (<MABAI>.INP, <MABAI>.OUT)
   ...
   ├── test20/ (<MABAI>.INP, <MABAI>.OUT)
   ├── <MABAI>.cpp
   ├── oracle_bf.cpp
   ├── generator.cpp
   ├── validator.py
   ├── <MABAI>_DeBai.docx
   └── <MABAI>_HuongDanCham.docx
2. Đóng gói tổng hợp toàn đề (DeThi_HSG_FullPackage.zip):
   Gom toàn bộ các bài toán và báo cáo thẩm định vào 01 file .zip duy nhất để tải về 1 lần trọn vẹn.
`
  );

  // Subskill 07: Thẩm Định Độc Lập 3 Cấp Độ & Sinh Test Bằng Code (Zero-Trust Audit)
  const sub7 = root.folder('subskills')?.folder('07-tham-dinh-test-hsg');
  sub7?.file(
    'SKILL.md',
    `---
name: tham-dinh-test-hsg
description: >
  Thẩm định độc lập 3 cấp độ (Zero-Trust Independent Audit), dò tối ưu hóa thuật toán nâng cao
  và dùng code tạo 20 test tuyệt đối không nhẩm tay.
---

# Sub-Skill 07: Thẩm Định Độc Lập 3 Cấp Độ & Sinh Test Bằng Code (Zero-Trust Audit)

## 1. Nguyên Tắc Tối Thượng (100% Accuracy & Zero-Trust)
1. TUYỆT ĐỐI KHÔNG NHẨM TEST BẰNG TAY HOẶC AI: Mọi dữ liệu .INP và .OUT, thời gian chạy (ms) đều phải sinh và kiểm chứng qua biên dịch thực tế.
2. THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ:
   - Cấp độ 1 (Code Sinh Test - generator.cpp): Phân bổ chuẩn tỷ lệ Subtask và tỷ lệ bẫy kỹ thuật:
     * 20% Test Biên cực tiểu & Đặc biệt (Min / Corner Cases)
     * 30% Test Cấu trúc & Bẫy thuật toán (Killer / Anti-Greedy Cases)
     * 30% Test Ngẫu nhiên phân phối chuẩn (Controlled Random)
     * 20% Test Cực đại kịch trần ở cuối mỗi Subtask (Max / Anti-TLE Cases)
   - Cấp độ 2 (Đối Chiếu Chéo 2 Mô Hình & Stress-Test):
     * Model 1 (oracle_bf.cpp): Code vét cạn trực tiếp từ định nghĩa toán học đề bài.
     * Model 2 (<MABAI>.cpp): Code C++17 tối ưu hóa nâng cao chuẩn HSG.
     * Chạy Stress-Test tự động đối chiếu chéo 2 mô hình trên Subtask 1 và bộ test ngẫu nhiên nhỏ.
   - Cấp độ 3 (Hiệu Năng Thực Thi & Kiểm Định Biên):
     * Đảm bảo code tối ưu chạy hoàn tất mỗi test trong thời gian < 50% Time Limit (< 0.5s cho giới hạn 1.0s), chống tràn số với long long / __int128_t.
`
  );

  // Scripts
  const scripts = root.folder('scripts');
  scripts?.file(
    'run_cpp_tests.py',
    `#!/usr/bin/env python3
import sys, os, re, subprocess, tempfile

def sanitize_cpp(code: str) -> str:
    return re.sub(r'^\\s*freopen\\s*\\([^;]+;', r'// [Auto-piped] \\g<0>', code, flags=re.MULTILINE)

def compile_and_run(cpp_code: str, test_inputs: list) -> list:
    cleaned = sanitize_cpp(cpp_code)
    with tempfile.TemporaryDirectory() as tmpdir:
        src = os.path.join(tmpdir, "solution.cpp")
        bin_path = os.path.join(tmpdir, "solution.bin")
        with open(src, "w", encoding="utf-8") as f:
            f.write(cleaned)
        proc = subprocess.run(["g++", "-O3", "-std=c++17", src, "-o", bin_path], capture_output=True, text=True)
        if proc.returncode != 0:
            print("[COMPILE ERROR]:", proc.stderr, file=sys.stderr)
            return []
        outputs = []
        for inp in test_inputs:
            try:
                res = subprocess.run([bin_path], input=inp, capture_output=True, text=True, timeout=2.0)
                outputs.append(res.stdout.rstrip())
            except Exception as e:
                outputs.append(f"[ERROR: {e}]")
        return outputs

if __name__ == "__main__":
    print("Themis C++ 3-Level Audit & Test Runner ready.")
`
  );

  scripts?.file(
    'stress_test_audit.py',
    `#!/usr/bin/env python3
# Script Thẩm Định Độc Lập 3 Cấp Độ: generator.cpp + oracle_bf.cpp vs solution.cpp
import subprocess, tempfile, os, sys

def run_three_level_audit(gen_cpp: str, oracle_cpp: str, opt_cpp: str, num_stress: int = 100):
    with tempfile.TemporaryDirectory() as tmpdir:
        paths = {}
        for name, code in [("gen", gen_cpp), ("oracle", oracle_cpp), ("opt", opt_cpp)]:
            src = os.path.join(tmpdir, f"{name}.cpp")
            bin_p = os.path.join(tmpdir, f"{name}.bin")
            with open(src, "w", encoding="utf-8") as f:
                f.write(code)
            subprocess.run(["g++", "-O3", "-std=c++17", src, "-o", bin_p], check=True)
            paths[name] = bin_p

        for s in range(1, num_stress + 1):
            seed = 100 + s
            inp = subprocess.run([paths["gen"]], input=f"{seed}\\n", capture_output=True, text=True, check=True).stdout
            out_ora = subprocess.run([paths["oracle"]], input=inp, capture_output=True, text=True, check=True).stdout.strip()
            out_opt = subprocess.run([paths["opt"]], input=inp, capture_output=True, text=True, check=True).stdout.strip()
            if out_ora != out_opt:
                raise RuntimeError(f"Counter-example at stress #{s}:\\nInput:\\n{inp}\\nOracle: {out_ora}\\nOpt: {out_opt}")
        print(f"[PASS] Matched 100% across {num_stress} random stress tests!")

if __name__ == "__main__":
    print("Zero-Trust 3-Level Stress Tester ready.")
`
  );

  scripts?.file(
    'package_themis.py',
    `#!/usr/bin/env python3
import sys, json, zipfile

def build_zip(json_path: str, out_zip: str):
    with open(json_path, 'r', encoding='utf-8') as f:
        prob = json.load(f)
    code = prob.get("problemCode", "BAI1").upper().strip()
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for idx, tc in enumerate(prob.get("testCases", []), 1):
            zf.writestr(f"{code}/test{idx:02d}/{code}.INP", tc.get("input", ""))
            zf.writestr(f"{code}/test{idx:02d}/{code}.OUT", tc.get("output", ""))
        if prob.get("solutionCpp"):
            zf.writestr(f"{code}/{code}.cpp", prob["solutionCpp"])
    print(f"Packed {out_zip}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        build_zip(sys.argv[1], sys.argv[2])
`
  );

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
