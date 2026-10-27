---
name: problem-authoring
description: >
  Sub-skill chuyên trách soạn thảo nội dung đề bài Tin học chuẩn thi HSG: bối cảnh, quy cách đặt mã bài,
  công thức toán học LaTeX chuẩn KaTeX, định dạng vào/ra chặt chẽ và ví dụ mẫu trực quan.
---

# Sub-Skill 01: Soạn Thảo Đề Bài Chuẩn Sư Phạm (Problem Authoring)

## 1. Quy Cách Đặt Tên & Mã Bài
- **Mã bài (`problemCode`)**: Tối đa 6 ký tự viết hoa không dấu, không khoảng trắng (Ví dụ: `SUMARR`, `PRIME`, `DIVIS`, `MAXSUB`).
- **Tên file vào/ra**: Bắt buộc là `<MABAI>.INP` và `<MABAI>.OUT` (hoặc viết thường `.inp` / `.out`).
- **Thời gian chạy (`timeLimit`)**: Mặc định 1.0 giây (hoặc 2.0 giây cho đồ thị/cây lớn).
- **Bộ nhớ (`memoryLimit`)**: Mặc định 256 MB.

## 2. Quy Tắc Định Dạng Văn Bản & Công Thức Toán Học
1. **Công thức toán học (LaTeX)**:
   - Toàn bộ biến số ($n$, $k$, $a_i$, $x, y$), biểu thức toán ($1 \le n \le 10^5$, $10^{18}$) BẮT BUỘC kẹp giữa 2 dấu `$ ... $`.
   - Các công thức độc lập nhiều dòng kẹp giữa `$$ ... $$`.
2. **Quy tắc Anti-Markdown Slop**:
   - Tuyệt đối KHÔNG sử dụng ký tự `**` ở đầu/cuối tiêu đề hoặc đoạn văn gây lỗi hiển thị.
   - Trình bày mạch lạc, sư phạm, không lặp từ rườm rà.

## 3. Cấu Trúc Các Mục Bắt Buộc Trong Đề Bài
1. **Đề bài / Bối cảnh (`description`)**: Nêu rõ bài toán thực tế hoặc giả thuyết logic, dẫn dắt học sinh đến yêu cầu cần giải quyết.
2. **Dữ liệu vào (`inputFormat`)**: Mô tả chính xác số dòng, ý nghĩa từng dòng, các phần tử cách nhau bởi dấu cách.
3. **Dữ liệu ra (`outputFormat`)**: Mô tả kết quả cần in ra màn hình hoặc ghi vào file, số chữ số thập phân (nếu là số thực).
4. **Ràng buộc & Subtask (`constraints`)**: Nêu chặn dưới và chặn trên của biến, phân chia rõ các Subtask.
5. **Ví dụ mẫu (`sampleInput`, `sampleOutput`, `sampleExplanation`)**: Cung cấp ít nhất 1 ví dụ cụ thể, có giải thích từng bước tính toán.
