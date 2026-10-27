---
name: subtask-allocator
description: >
  Sub-skill chuyên trách phân bổ Subtask theo tỷ lệ điểm và sinh 20 bộ test input chuẩn Themis:
  test ví dụ 100%, test biên, test bẫy cực trị và test chạm trần subtask cao nhất.
---

# Sub-Skill 03: Phân Bổ Subtask & Sinh 20 Bộ Test Cases (Subtask Allocator)

## 1. Nguyên Tắc Phân Bổ Tỷ Lệ Subtask Chuẩn Thi HSG
Mỗi bài toán tin học chuẩn Themis thường có 20 test cases (mỗi test 1 điểm hoặc 0.5 điểm, tổng 20 điểm hoặc 100 điểm):

| Subtask | Tỷ lệ điểm / số test | Mô tả thuật toán mục tiêu | Dải test cases (20 test) |
| :--- | :--- | :--- | :--- |
| **Subtask 1** | $20\%$ (4 test) | Duyệt trâu / Thô $O(N^3), O(2^N)$ | `test01` đến `test04` |
| **Subtask 2** | $30\%$ (6 test) | Thuật toán trung gian $O(N^2)$ | `test05` đến `test10` |
| **Subtask 3** | $50\%$ (10 test) | Thuật toán tối ưu $O(N \log N), O(N)$ | `test11` đến `test20` |

*(Lưu ý: Nếu đề bài chia 2 subtask hoặc 4 subtask, tính số lượng test tương ứng với tỷ lệ % x 20).*

## 2. Tiêu Chuẩn Bộ 20 Test Input

1. **`test01` (Bắt Buộc Tuyệt Đối)**:
   - Dữ liệu `input` của `test01` BẮT BUỘC trùng khớp 100% từng ký tự với `sampleInput` trong đề bài.
   - Thuộc Subtask 1, đánh dấu `isSample: true`.
2. **Test Biên & Bẫy Góc (Edge Cases)**:
   - $N = 1$ hoặc giá trị nhỏ nhất của đề bài.
   - Toàn bộ mảng là các số âm, hoặc toàn số $0$, hoặc toàn số bằng nhau.
   - Mảng đã được sắp xếp tăng dần hoặc giảm dần (bẫy QuickSort, Two Pointers).
3. **Test Chạm Trần (Max Constraints)**:
   - Phải có ít nhất 2 - 3 test trong Subtask cuối chạm kịch trần giá trị lớn nhất:
     * Ví dụ $N = 10^5$, giá trị $A_i = 10^9$.
     * Nhằm kiểm tra thời gian thực thi (Time Limit) và bộ nhớ (Memory Limit).

## 3. Định Dạng Dữ Liệu Input
- Đúng số lượng dòng mô tả ở `inputFormat`.
- Không thừa khoảng trắng đầu/cuối dòng.
- Không thừa dòng trống không cần thiết.
