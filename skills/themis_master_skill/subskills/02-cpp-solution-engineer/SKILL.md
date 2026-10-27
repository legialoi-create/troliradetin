---
name: cpp-solution-engineer
description: >
  Sub-skill chuyên trách viết mã nguồn C++17 chuẩn thi đấu, phân tích toán học chặn trên,
  quy tắc chọn kiểu biến bắt buộc tránh tràn số nguyên (long long, double, string) và cơ chế đọc/ghi file Themis.
---

# Sub-Skill 02: Kỹ Thuật Lời Giải C++ Chuẩn Xác (C++ Solution Engineer)

## 1. Nguyên Tắc Phân Tích Chặn Trên & Kiểu Dữ Liệu (Critical)

| Miền giá trị của biến / tổng / tích | Kiểu dữ liệu C++ bắt buộc | Lưu ý xử lý phép nhân & cộng |
| :--- | :--- | :--- |
| $\le 2 \cdot 10^9$ (Số nguyên thông thường) | `int` | Chú ý nếu cộng/nhân có thể vượt quá $2 \cdot 10^9$ |
| $> 2 \cdot 10^9$ hoặc tới $9 \cdot 10^{18}$ (Tổng mảng, tích, $N \le 10^{12}$) | `long long` | BẮT BUỘC ép kiểu: `1LL * a * b` hoặc `(long long)a * b` |
| Tới $1.8 \cdot 10^{19}$ (Số không âm rất lớn) | `unsigned long long` | Không dùng khi có phép trừ ra số âm |
| Số thực (cần độ chính xác cao) | `double` hoặc `long double` | Xuất `cout << fixed << setprecision(k) << res;` |
| Xâu ký tự / Chuỗi | `string` | Dùng `cin >> s;` hoặc `getline(cin, s);` nếu có khoảng trắng |

### Quy Tắc Chống Tràn Số (Anti-Overflow Checklist):
1. **Tổng mảng**: Mảng $N = 10^5$, mỗi phần tử $A_i = 10^9 \implies$ Tổng $= 10^{14} > 2 \cdot 10^9$. Biến tổng `sum` và mảng tiền tố `prefix_sum` BẮT BUỘC là `long long`.
2. **Tích hai số**: $a, b \le 10^9 \implies a \times b = 10^{18}$. Dù gán vào biến `long long`, nếu viết `a * b` thì trình biên dịch C++ vẫn tính trên kiểu `int` trước dẫn đến tràn số. BẮT BUỘC viết: `1LL * a * b`.
3. **Đếm cặp / hoán vị**: $N(N-1)/2$ với $N = 10^5 \implies$ Kết quả $= 5 \cdot 10^9$. BẮT BUỘC dùng `long long`.

## 2. Tiêu Chuẩn Viết Code C++17 Hoàn Chỉnh

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <iomanip>

using namespace std;

// Tên hàm giải quyết bài toán rõ nghĩa
void solve() {
    long long n;
    if (!(cin >> n)) return;
    
    vector<long long> a(n);
    long long totalSum = 0;
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        totalSum += a[i];
    }
    
    cout << totalSum << "\n";
}

int main() {
    // Tối ưu tốc độ vào ra dữ liệu (I/O)
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Đọc ghi file theo chuẩn Themis (Comment để C++ runner pipe qua stdin/stdout)
    // freopen("SUMARR.inp", "r", stdin);
    // freopen("SUMARR.out", "w", stdout);
    
    solve();
    return 0;
}
```

## 3. Chú Thích & Giải Thích Thuật Toán
- Ghi rõ độ phức tạp thời gian: $O(N)$, $O(N \log N)$, $O(N^2)$, v.v.
- Ghi rõ độ phức tạp không gian bộ nhớ: $O(N)$, $O(1)$, v.v.
- Giải thích phương pháp: Tham lam, Quy hoạch động, Hai con trỏ, Cây phân đoạn (Segment Tree), v.v.
