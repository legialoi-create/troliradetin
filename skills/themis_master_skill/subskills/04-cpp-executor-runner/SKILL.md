---
name: cpp-executor-runner
description: >
  Sub-skill chuyên trách biên dịch C++ độc lập và thực thi nạp input qua stdin để sinh output chuẩn xác 100%.
  Bao gồm thuật toán tiền xử lý mã nguồn (tắt freopen), bắt timeout, kiểm soát lỗi runtime và script tự động.
---

# Sub-Skill 04: Bộ Máy Thực Thi C++ Sinh Output 100% (C++ Executor Runner)

## 1. Cơ Chế Hoạt Động (Execution Mechanism)

Thay vì để AI đoán hoặc tính nhẩm kết quả đầu ra, bộ máy C++ Runner đảm bảo **tính chân lý tuyệt đối** của kết quả:

```
[Mã nguồn C++ (solutionCpp)] ──► [Tiền xử lý tắt freopen] ──► [Biên dịch g++ -O3 -std=c++17]
                                                                        │
                                                                        ▼
                                                                [File thực thi .bin]
                                                                        │
┌───────────────────────────────────────────────────────────────────────┴────────────────────────┐
│  Vòng lặp 20 Test Inputs:                                                                     │
│  Input(i) ──► Nạp qua STDIN ──► Chạy tối đa 2000ms ──► Thu nhận STDOUT ──► Lưu vào Output(i)  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Tiền Xử Lý Mã Nguồn C++ (Source Sanitization)
Để có thể truyền dữ liệu qua đường ống `stdin` / `stdout` từ môi trường quản lý:
- Tự động thay thế các câu lệnh `freopen` đang hoạt động:
  ```regex
  ^\s*freopen\s*\([^;]+;
  ```
  Thành:
  ```cpp
  // [Auto-piped] freopen("...", ...);
  ```

## 3. Lệnh Biên Dịch Chuẩn
```bash
g++ -O3 -std=c++17 <sourcePath>.cpp -o <binaryPath>.bin
```
- Nếu có lỗi biên dịch: Trả về chi tiết `compileError` (lỗi cú pháp, thiếu thư viện `#include`, sai kiểu dữ liệu).

## 4. Xử Lý Giới Hạn & Lỗi Thực Thi
- **Time Limit Exceeded (TLE)**: Thiết lập giới hạn thời gian (mặc định 2.0s mỗi test). Nếu vượt quá, ngắt tiến trình và ghi nhận `timeout`.
- **Runtime Error (RTE)**: Bắt mã lỗi (chia cho 0, truy cập mảng ngoài phạm vi `segmentation fault`).
- **Clean output**: Cắt bỏ khoảng trắng dư thừa ở cuối kết quả xuất ra (`trimEnd()`).
