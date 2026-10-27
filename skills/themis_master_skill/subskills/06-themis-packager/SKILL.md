---
name: themis-packager
description: >
  Sub-skill chuyên trách đóng gói thư mục bộ test Themis chuẩn (test01..test20, MABAI.INP, MABAI.OUT),
  kèm theo tài liệu Word (.docx) và Markdown (.md) cho giáo viên và học sinh.
---

# Sub-Skill 06: Đóng Gói Bộ Test Themis & Xuất Bản File (Themis Packager)

## 1. Cấu Trúc Thư Mục Themis Chuẩn Tuyệt Đối

Khi nạp vào phần mềm Themis trên máy chấm thi của trường hoặc hội đồng thi, cấu trúc thư mục bắt buộc như sau:

```text
<MABAI>/
├── test01/
│   ├── <MABAI>.INP
│   └── <MABAI>.OUT
├── test02/
│   ├── <MABAI>.INP
│   └── <MABAI>.OUT
├── ...
├── test20/
│   ├── <MABAI>.INP
│   └── <MABAI>.OUT
├── solution.cpp             (Mã nguồn C++ mẫu có freopen)
├── problem.md               (Đề bài định dạng Markdown)
├── DeThi_GiaoVien.docx      (Đề thi đầy đủ lời giải & phân tích subtask)
└── DeThi_HocSinh.docx       (Đề thi chỉ có đề bài, ràng buộc & ví dụ mẫu)
```

### Lưu ý quan trọng:
- Tên thư mục con: `test01`, `test02`, ... đến `test20` (đánh số 2 chữ số có số 0 ở đầu).
- Tên file bên trong: `<MABAI>.INP` và `<MABAI>.OUT` (viết hoa phần mở rộng theo thiết lập Themis).

## 2. Tiêu Chuẩn Xuất File Word (.docx)
1. **Phần đầu**: Tên đơn vị / Trường, Tiêu đề kỳ thi, Tên bài, Bảng thông số kỹ thuật (Mã bài, Thời gian chạy, Bộ nhớ, File dữ liệu).
2. **Nội dung đề bài**: Đề bài, Dữ liệu vào, Dữ liệu ra, Ràng buộc & Subtask.
3. **Bảng ví dụ mẫu**: Khung viền rõ ràng, chia 2 cột Input và Output.
4. **Bản Giáo Viên (Teacher Doc)**: Bổ sung Bảng phân bổ 20 test cases, Thuật toán & Mã nguồn C++ chuẩn.
