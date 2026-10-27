---
name: themis-problem-generator
description: >
  Chuyên gia tạo và thẩm định đề thi Tin học chuẩn Themis / VNOI / HSG các cấp (Trường, Huyện, Tỉnh, Quốc gia).
  Tự động sinh đề bài chuẩn sư phạm, phân chia Subtask chặt chẽ, tạo lời giải C++17 tối ưu với kiểu biến chuẩn xác 100%
  (tránh tràn số nguyên long long, double, string), biên dịch g++ và thực thi chạy sinh 20 bộ test Themis chuẩn xác,
  thẩm định bộ test, đóng gói ZIP Themis và xuất file Word (.docx) chuyên nghiệp.
---

# Kỹ Năng: Thiết Kế & Thẩm Định Đề Thi Tin Học Chuẩn Themis (Themis Problem Generator)

Kỹ năng này hướng dẫn toàn bộ quy trình thiết kế, sinh tự động, thẩm định và đóng gói đề thi lập trình thi đấu (Competitive Programming) theo chuẩn hệ thống chấm tự động **Themis**, các kỳ thi Học sinh giỏi (HSG) các cấp và kỳ thi Olympic Tin học Việt Nam (VNOI/VOI).

---

## 1. Mục Tiêu & Nguyên Tắc Cốt Lõi

1. **Chuẩn Sư Phạm & Thể Thức Thi Đấu**:
   - Đề bài có cốt truyện thực tế hoặc toán học rõ ràng, súc tích.
   - Mã bài (`problemCode`) viết hoa, tối đa 6 ký tự (VD: `SUMARR`, `PRIME`, `SUBSEQ`).
   - Tên file dữ liệu vào/ra chuẩn Themis: `<MABAI>.INP` và `<MABAI>.OUT` (hoặc `.inp`/`.out`).
   - Thời gian thực thi (`timeLimit`): mặc định `1.0s` (hoặc `2.0s` cho bài nặng).
   - Bộ nhớ tối đa (`memoryLimit`): mặc định `256MB` (hoặc `512MB`).

2. **Đồng Bộ Kiểu Biến 100% (Data Types & Tránh Tràn Số)**:
   - **Bắt buộc phân tích chặn trên dữ liệu**:
     * Khi biến, tích, tổng có thể vượt quá $2 \cdot 10^9$ (ví dụ: $n \le 10^9$ tính tổng mảng, $n \le 10^{12}, 10^{18}$, tổng $10^5 \times 10^9 = 10^{14}$): BẮT BUỘC dùng `long long` (hoặc `unsigned long long`), kèm ép kiểu khi nhân `1LL * a * b` hoặc `(long long)a * b`.
     * Với số thực: dùng `double` hoặc `long double`, xuất kết quả kèm `fixed << setprecision(k)`.
     * Với xâu ký tự: dùng `string`, xử lý đọc dòng `getline(cin, s)` cẩn thận khi có khoảng trắng.
     * Tên biến trong mã nguồn C++ ($n$, $k$, $a_i$, $dp$,...) phải trùng khớp hoàn toàn với tên biến mô tả trong Đề bài và Ràng buộc.

3. **Nguyên Tắc Output Chuẩn Xác 100% Bằng C++ Engine**:
   - Không đoán trước output bằng văn bản ngẫu nhiên.
   - Toàn bộ kết quả `output` của từng test case (và `sampleOutput`) phải được **biên dịch mã nguồn C++ bằng `g++ -O3 -std=c++17` và chạy trực tiếp với dữ liệu đầu vào qua stdin**.

4. **Bộ Test Chuẩn Themis (20 Test Cases)**:
   - `test01`: Khớp tuyệt đối 100% với ví dụ mẫu (`sampleInput`/`sampleOutput`).
   - Phân bổ chính xác theo các Subtask trong phần Ràng buộc.
   - Có đầy đủ các loại test: test nhỏ, test bẫy biên ($n=1, n=0$, mảng toàn số âm, phần tử trùng nhau), test ngẫu nhiên, test tối đa chạm trần cận trên của Subtask cao nhất.

---

## 2. Cấu Trúc Đề Bài Chuẩn (Standard Problem Schema)

Mỗi bài toán phải tuân theo cấu trúc dữ liệu JSON đầy đủ:

```typescript
interface ProblemData {
  id: string;                       // ID định danh duy nhất (prob-...)
  title: string;                    // Tên bài toán (VD: "Dãy Con Liên Tiếp")
  problemCode: string;              // Mã bài <= 6 ký tự (VD: "SUBCON")
  topic: string;                    // Chủ đề (Quy hoạch động, Mảng, Đồ thị,...)
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;                // Thời gian (giây, VD: 1.0)
  memoryLimit: number;              // Bộ nhớ (MB, VD: 256)
  description: string;              // Bối cảnh và yêu cầu bài toán
  inputFormat: string;              // Định dạng dữ liệu vào
  outputFormat: string;             // Định dạng dữ liệu ra
  constraints: string;              // Ràng buộc & phân chia Subtask (kèm LaTeX)
  sampleInput: string;              // Dữ liệu vào ví dụ mẫu
  sampleOutput: string;             // Dữ liệu ra ví dụ mẫu
  sampleExplanation?: string;       // Giải thích ví dụ mẫu
  solutionCpp: string;              // Mã nguồn C++ chuẩn hoàn chỉnh
  solutionExplanation?: string;     // Giải thích thuật toán, độ phức tạp O(...)
  testCases: TestCase[];            // Đúng 20 test cases
}

interface TestCase {
  id: number;                       // 1 đến 20
  testName: string;                 // "test01" đến "test20"
  input: string;                    // Dữ liệu đầu vào
  output: string;                   // Dữ liệu đầu ra do C++ sinh ra
  isSample?: boolean;               // test01 là true
  subtask?: number;                 // Subtask tương ứng (1, 2, 3...)
  subtaskConstraint?: string;       // Diễn giải ràng buộc của subtask
  note?: string;                    // Ghi chú tính chất của test
}
```

---

## 3. Quy Tắc Biên Soạn Ràng Buộc & Phân Chia Subtask

Trong mục `constraints`, bắt buộc chia thành các Subtask rõ ràng theo định dạng chuẩn:

```markdown
- Có $20\%$ số test tương ứng với $20\%$ số điểm có $n \le 100$.
- Có $30\%$ số test tiếp theo tương ứng với $30\%$ số điểm có $100 < n \le 10^3$.
- Có $50\%$ số test còn lại tương ứng với $50\%$ số điểm có $10^3 < n \le 10^5$.
```

### Phân Bổ 20 Test Case Tương Ứng:
- **Subtask 1 (20% - 4 test: test01 -> test04)**: Dữ liệu nhỏ, thuật toán thô $O(N^3)$ hoặc duyệt trâu $O(2^N)$ qua được. `test01` là test ví dụ mẫu.
- **Subtask 2 (30% - 6 test: test05 -> test10)**: Dữ liệu trung bình, thuật toán $O(N^2)$ qua được.
- **Subtask 3 (50% - 10 test: test11 -> test20)**: Dữ liệu tối đa, bắt buộc thuật toán tối ưu $O(N \log N)$ hoặc $O(N)$ mới đạt trọn điểm. Có test chạm trần $N = 10^5$.

---

## 4. Tiêu Chuẩn Viết Mã Nguồn C++ (`solutionCpp`)

1. **Thư viện & Định dạng**:
   - Sử dụng `#include <iostream>`, `#include <vector>`, `#include <algorithm>`, v.v.
   - Thêm `ios_base::sync_with_stdio(false); cin.tie(NULL);` trong hàm `main()`.
   - Có 2 dòng lệnh mở file đọc/ghi cho Themis:
     ```cpp
     // freopen("MABAI.inp", "r", stdin);
     // freopen("MABAI.out", "w", stdout);
     ```
     *(Lưu ý: Comment 2 dòng này bằng `//` để C++ Engine có thể pipe qua stdin/stdout khi test)*.

2. **Kiểu Biến & An Toàn Bộ Nhớ**:
   - Khai báo biến `long long` cho tất cả các biến đếm, tích lũy, tổng mảng:
     ```cpp
     long long sum = 0;
     long long ans = 0;
     long long product = 1LL * a * b; // Ép kiểu 1LL chống tràn số
     ```
   - Xử lý số thực:
     ```cpp
     cout << fixed << setprecision(2) << ans << "\n";
     ```
   - Chú thích tiếng Việt giải thích rõ thuật toán, độ phức tạp thời gian $O(...)$ và không gian $O(...)$.

---

## 5. Quy Trình C++ Engine: Biên Dịch & Chạy Sinh Test

Khi có mã nguồn C++ và danh sách dữ liệu `input`:

1. **Chuẩn hóa mã nguồn**:
   - Thay thế các dòng `freopen(...)` còn kích hoạt thành `// [Auto-piped] freopen(...)` để chương trình nhận dữ liệu qua luồng `stdin` và xuất ra `stdout`.
2. **Biên dịch**:
   ```bash
   g++ -O3 -std=c++17 <sourcePath>.cpp -o <binPath>.bin
   ```
   - Nếu biên dịch thất bại, lưu thông báo lỗi `compileError` để người dùng sửa đổi.
3. **Thực thi lần lượt từng test**:
   - Truyền nội dung `input` vào `stdin`.
   - Bắt toàn bộ dữ liệu từ `stdout`.
   - Cắt bỏ khoảng trắng dư ở cuối (`trimEnd()`).
   - Cài đặt thời gian timeout tối đa cho mỗi test (mặc định 2000ms).
   - Ghi lại `output` thực tế chính xác vào từng test case.
   - Chạy kiểm tra thêm với `sampleInput` để cập nhật `sampleOutput` khớp tuyệt đối.

---

## 6. Thẩm Định Bộ Test (Test Validation & Quality Score)

Thang điểm đánh giá chất lượng bộ test (0 - 100 điểm):
- **Kiểm tra khớp ví dụ**: `test01` phải giống 100% với `sampleInput` và `sampleOutput` (-25 điểm nếu không khớp).
- **Kiểm tra số lượng**: Đạt chuẩn đúng 20 test cases (-20 điểm nếu thiếu).
- **Kiểm tra phân chia subtask**: Số test cho từng subtask khớp với tỷ lệ phần trăm trong đề bài.
- **Tự Động Chuẩn Hóa (`enrichAndEnforceSubtaskCompliance`)**:
  - Tự động gán lại `test01` thành test ví dụ.
  - Phân bổ lại nhãn `subtask` và ràng buộc `subtaskConstraint` cho toàn bộ 20 test.
  - Đánh dấu trạng thái `validationStatus: "pass"`.

---

## 7. Đóng Gói Themis & Xuất Bản File

### A. Cấu trúc gói ZIP Themis chuẩn:
Khi tải về, thư mục ZIP phải có cấu trúc:
```text
MABAI/
├── test01/
│   ├── MABAI.INP
│   └── MABAI.OUT
├── test02/
│   ├── MABAI.INP
│   └── MABAI.OUT
...
├── test20/
│   ├── MABAI.INP
│   └── MABAI.OUT
├── solution.cpp
└── problem.md
```

### B. Định dạng tài liệu Word (.docx) chuẩn đề thi:
- Tiêu đề kỳ thi, Tên bài, Mã bài, Bảng thông số (Thời gian, Bộ nhớ, File vào, File ra).
- Các mục: **Đề bài**, **Dữ liệu vào**, **Dữ liệu ra**, **Ràng buộc**, **Ví dụ mẫu** (bảng 2 cột Input / Output), **Lời giải & Thuật toán**, **Mã nguồn C++**.

---

## 8. Tinh Chỉnh Từng Phần (Section Refine Workflow)

Khi giáo viên yêu cầu sửa đổi một phần cụ thể (ví dụ: "Sửa ràng buộc $n \le 10^9$ thành $n \le 10^5$" hoặc "Đổi bối cảnh bài toán"):
1. Giữ nguyên cấu trúc các phần không liên quan.
2. Cập nhật phần được yêu cầu.
3. Đồng bộ lại các phần bị ảnh hưởng (ví dụ: sửa ràng buộc -> phải sửa lại kiểu biến trong C++ và phân bổ Subtask).
4. **Biên dịch và chạy lại C++ Engine** để tạo lại toàn bộ output mới cho 20 test cases.
