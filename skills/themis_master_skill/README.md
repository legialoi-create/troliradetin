# Hướng Dẫn Cài Đặt Trọn Gói Skill "Themis Problem Suite" (1 Lần Dùng Mãi)

Gói Skill này chứa toàn bộ hệ thống tạo và kiểm định đề thi Tin học chuẩn Themis, bao gồm **Master Skill** và **6 Sub-skills chuyên sâu** cùng các script tự động.

---

## Cách Cài Đặt 1 Lần Cho Các Nền Tảng AI

### 1. Dùng Cho Claude Code / Claude Desktop
- Giải nén thư mục `themis_master_skill` vào thư mục dự án của bạn (ví dụ: `.claude/skills/themis_master_skill/` hoặc ngay trong thư mục gốc `skills/themis_master_skill/`).
- Trong prompt với Claude, chỉ cần gõ:
  > `"Sử dụng skill themis-problem-suite để tạo đề thi về chủ đề Quy hoạch động, mức độ Khá cho học sinh giỏi cấp Tỉnh."`
  Claude sẽ tự động đọc `SKILL.md` và kích hoạt các sub-skills tương ứng.

### 2. Dùng Cho Cursor IDE / VS Code Copilot
- Đặt thư mục này vào `.cursor/rules/themis-problem-suite/` hoặc copy nội dung file `SKILL.md` vào file `.cursorrules`.
- Khi bạn yêu cầu ra đề trong Cursor Composer (Ctrl+I hoặc Cmd+I), Cursor sẽ tự động tuân thủ toàn bộ quy tắc về kiểu dữ liệu C++, chống tràn số và phân chia Subtask.

### 3. Dùng Cho Custom GPTs / Gemini Gems / ChatGPT Web
- Mở cài đặt Custom GPT hoặc Gemini Gem của bạn.
- Trong phần **Instructions (Hướng dẫn)**: Dán nội dung của file `SKILL.md`.
- Trong phần **Knowledge (Tài liệu bổ trợ)**: Tải lên các file trong thư mục `subskills/`.

---

## Cấu Trúc Gói Skill
```text
themis_master_skill/
├── SKILL.md                          <- File Master Skill điều phối chính
├── README.md                         <- Hướng dẫn cài đặt
├── subskills/                        <- 6 Sub-skills chuyên sâu
│   ├── 01-problem-authoring/         <- Soạn đề bài, KaTeX, cấu trúc vào/ra
│   ├── 02-cpp-solution-engineer/     <- Code C++17, chống tràn số long long
│   ├── 03-subtask-allocator/         <- Phân bổ 20 test inputs theo Subtask
│   ├── 04-cpp-executor-runner/       <- Chạy C++ độc lập sinh output 100%
│   ├── 05-test-validator/            <- Chấm điểm & chuẩn hóa bộ test
│   └── 06-themis-packager/           <- Đóng gói Themis ZIP & Word docx
└── scripts/                          <- Script Python chạy độc lập
    ├── run_cpp_tests.py              <- Tự động biên dịch & chạy test
    └── package_themis.py             <- Đóng gói file ZIP Themis
```
