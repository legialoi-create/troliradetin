---
name: test-validator
description: >
  Sub-skill chuyên trách thẩm định chất lượng bộ test theo thang điểm 100, kiểm tra khớp ví dụ mẫu,
  phát hiện vi phạm subtask và tự động chuẩn hóa (Auto-repair & Compliance Enforcer).
---

# Sub-Skill 05: Thẩm Định & Tự Động Chuẩn Hóa Bộ Test (Test Validator)

## 1. Hệ Thống Tiêu Chí Đánh Giá (Quality Score 0 - 100)

| Tiêu chí kiểm định | Yêu cầu chuẩn | Trừ điểm nếu vi phạm |
| :--- | :--- | :--- |
| **Khớp ví dụ mẫu (Sample Match)** | `test01` phải trùng 100% từng ký tự với `sampleInput` và `sampleOutput` | **-25 điểm** |
| **Đủ số lượng test (Count Check)** | Đúng 20 test cases đầy đủ input và output | **-20 điểm** (nếu thiếu hoặc rỗng) |
| **Tính hợp lệ của Subtask** | Phân bổ tỷ lệ % đúng số test, dữ liệu test tuân thủ ràng buộc của Subtask | **-5 điểm** mỗi vi phạm |
| **Trạng thái đạt chuẩn** | Tổng điểm $\ge 80$ điểm | Đánh giá Đạt chuẩn (`isValid = true`) |

## 2. Thuật Toán Tự Động Chuẩn Hóa (Auto-Repair Workflow)

Khi giáo viên bấm **"Tự động chuẩn hóa & đồng bộ test"** hoặc khi hệ thống phát hiện sai sót:
1. **Ép buộc Test 01**:
   ```typescript
   tests[0].input = problem.sampleInput.trim();
   tests[0].output = problem.sampleOutput.trim();
   tests[0].isSample = true;
   tests[0].note = "Test ví dụ trùng khớp 100% đề bài";
   ```
2. **Phân bổ lại Hạn ngạch (Subtask Quotas)**:
   - Đọc tỷ lệ % từ phần `constraints`.
   - Tính toán số lượng test cho từng Subtask (ví dụ: $20\% \to 4$ test, $30\% \to 6$ test, $50\% \to 10$ test).
   - Tự động gán nhãn `subtask: 1, 2, 3...` và cập nhật chuỗi `subtaskConstraint`.
3. **Cập nhật báo cáo**:
   - Trả về đối tượng `validationReport` chi tiết để hiển thị thanh điểm trực quan trên giao diện.
