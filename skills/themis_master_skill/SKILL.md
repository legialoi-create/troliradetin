---
name: themis-problem-suite
description: >
  Hệ thống Master Skill toàn diện tạo và thẩm định đề thi Tin học chuẩn Themis / VNOI / HSG.
  Điều phối 6 sub-skills chuyên biệt: Soạn đề bài chuẩn sư phạm, Lời giải C++ chống tràn số,
  Phân bổ 20 test Subtask, Biên dịch C++ Runner sinh output 100%, Thẩm định bộ test, và Đóng gói Themis ZIP/Word.
---

# Master Skill: Hệ Thống Thiết Kế Đề Thi Tin Học Chuẩn Themis (Themis Problem Suite)

Master Skill này là đầu mối điều phối trọn gói quy trình tạo, thẩm định và xuất bản đề thi Lập trình thi đấu (Competitive Programming) theo chuẩn hệ thống chấm tự động **Themis**, kỳ thi Học sinh giỏi (HSG) và Olympic Tin học (VOI).

Hệ thống được thiết kế theo kiến trúc module hóa: **1 Master Skill điều phối 6 Sub-skills độc lập** kèm theo mã nguồn Python/Shell chạy tự động.

---

## 1. Bản Đồ Các Sub-Skills (Sub-skills Architecture)

Khi thực hiện yêu cầu tạo đề, Master Skill sẽ kích hoạt và phối hợp 6 sub-skills theo thứ tự:

| Thứ tự | Sub-Skill | Thư mục | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **01** | `problem-authoring` | `subskills/01-problem-authoring/` | Soạn đề bài chuẩn sư phạm, KaTeX LaTeX, cấu trúc dữ liệu chặt chẽ. |
| **02** | `cpp-solution-engineer` | `subskills/02-cpp-solution-engineer/` | Viết code C++17 tối ưu, phân tích chặn trên, chống tràn số (`long long`, `double`, `string`). |
| **03** | `subtask-allocator` | `subskills/03-subtask-allocator/` | Phân chia tỷ lệ Subtask, sinh input 20 test cases (test mẫu, test biên, test kịch trần). |
| **04** | `cpp-executor-runner` | `subskills/04-cpp-executor-runner/` | Biên dịch `g++` độc lập và thực thi stdin/stdout sinh output thực tế chuẩn xác 100%. |
| **05** | `test-validator` | `subskills/05-test-validator/` | Chấm điểm bộ test (thang 100), kiểm tra vi phạm subtask và tự động chuẩn hóa. |
| **06** | `themis-packager` | `subskills/06-themis-packager/` | Đóng gói thư mục Themis ZIP (`test01` -> `test20`) và xuất tài liệu Word (.docx). |

---

## 2. Quy Trình Phối Hợp Tự Động (Master Execution Workflow)

```
[Yêu cầu tạo đề / Chủ đề / Độ khó]
                 │
                 ▼
    [01. problem-authoring] ──► Sinh đề bài, Input, Output, Ràng buộc, Ví dụ mẫu
                 │
                 ▼
 [02. cpp-solution-engineer] ──► Phân tích cận trên -> Khai báo đúng kiểu biến -> Code C++17
                 │
                 ▼
   [03. subtask-allocator] ──► Phân bổ 20 test inputs theo đúng tỷ lệ Subtask
                 │
                 ▼
  [04. cpp-executor-runner] ──► Biên dịch g++ & chạy qua stdin ──► Thu được 20 test output CHÍNH XÁC 100%
                 │
                 ▼
     [05. test-validator] ──► Kiểm định chất lượng test (Khớp ví dụ? Đủ 20 test? Ràng buộc?)
                 │
                 ▼
    [06. themis-packager] ──► Đóng gói ZIP Themis + Xuất file Word (.docx) đề thi
```

---

## 3. Quy Tắc Điều Phối Trọng Tâm

1. **Không đoán output**: Subskill 03 chỉ sinh `input` của test case. Subskill 04 bắt buộc biên dịch và chạy `solutionCpp` để sinh `output`. Tuyệt đối không để AI tự bịa output.
2. **Kiểu biến đồng bộ**: Subskill 02 bắt buộc đọc kỹ mục `constraints` từ Subskill 01 để phân tích khả năng tràn số nguyên $> 2 \cdot 10^9$. Nếu có nguy cơ, bắt buộc dùng `long long` và ép kiểu `1LL * a * b`.
3. **Tính toàn vẹn của Themis**: Subskill 06 kiểm tra cấu trúc thư mục đúng định dạng: `<MABAI>/test01/<MABAI>.INP` và `<MABAI>/test01/<MABAI>.OUT`.
