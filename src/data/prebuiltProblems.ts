import { ProblemData } from '../types';

export const PREBUILT_PROBLEMS: Record<string, ProblemData> = {
  // 1. Cấu trúc rẽ nhánh: TAMGIAC
  TAMGIAC: {
    id: 'prebuilt-tamgiac',
    topic: 'branching',
    topicName: 'Cấu trúc rẽ nhánh',
    problemName: 'Phân loại tam giác',
    problemCode: 'TAMGIAC',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'easy',
    description: `Cho ba số nguyên dương a, b, c là độ dài ba cạnh. Hãy kiểm tra xem ba cạnh này có tạo thành một tam giác hay không. Nếu có, hãy phân loại:
- DEU: Tam giác đều (3 cạnh bằng nhau)
- VUONG CAN: Vừa vuông vừa cân
- VUONG: Tam giác vuông (theo định lý Pytago)
- CAN: Tam giác cân (có 2 cạnh bằng nhau)
- THUONG: Tam giác thường
Nếu không tạo thành tam giác, in ra 'KHONG PHAI TAM GIAC'.`,
    inputFormat: `Một dòng duy nhất chứa 3 số nguyên dương a, b, c cách nhau bởi dấu cách (1 <= a, b, c <= 10^4).`,
    outputFormat: `In ra loại tam giác tương ứng: DEU, VUONG CAN, VUONG, CAN, THUONG hoặc KHONG PHAI TAM GIAC.`,
    constraints: `- 60% số test có a, b, c <= 100.
- 40% số test có a, b, c <= 10^4.`,
    sampleInput: `3 4 5`,
    sampleOutput: `VUONG`,
    sampleExplanation: `Với 3 cạnh 3, 4, 5 thoả mãn bất đẳng thức tam giác và 3^2 + 4^2 = 5^2 nên là tam giác vuông.`,
    solutionCpp: `#include <iostream>
using namespace std;

int main() {
    // freopen("TAMGIAC.inp", "r", stdin);
    // freopen("TAMGIAC.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;

    if (a + b <= c || a + c <= b || b + c <= a) {
        cout << "KHONG PHAI TAM GIAC\\n";
        return 0;
    }

    bool vuong = (a * a + b * b == c * c) || 
                 (a * a + c * c == b * b) || 
                 (b * b + c * c == a * a);
    bool deu = (a == b && b == c);
    bool can = (a == b || b == c || a == c);

    if (deu) cout << "DEU\\n";
    else if (vuong && can) cout << "VUONG CAN\\n";
    else if (vuong) cout << "VUONG\\n";
    else if (can) cout << "CAN\\n";
    else cout << "THUONG\\n";

    return 0;
}`,
    algorithmExplanation: `1. Kiểm tra điều kiện tam giác: a + b > c && a + c > b && b + c > a.
2. Kiểm tra Pytago bằng kiểu long long tránh tràn số.
3. Phân loại theo thứ tự ưu tiên: DEU -> VUONG CAN -> VUONG -> CAN -> THUONG.`,
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Quên kiểm tra bất đẳng thức tam giác trước tiên.',
      'Tràn số khi tính a*a + b*b trong biến int 32-bit.',
      'Nhầm thứ tự if-else giữa DEU và CAN.',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '3 4 5', output: 'VUONG', isSample: true, note: 'Bộ 3-4-5' },
      { id: 2, testName: 'test02', input: '5 5 5', output: 'DEU', note: 'Tam giác đều' },
      { id: 3, testName: 'test03', input: '5 5 8', output: 'CAN', note: 'Tam giác cân a = b' },
      { id: 4, testName: 'test04', input: '1 2 3', output: 'KHONG PHAI TAM GIAC', note: 'Biên suy biến 1+2=3' },
      { id: 5, testName: 'test05', input: '1 2 10', output: 'KHONG PHAI TAM GIAC', note: 'Không tạo thành tam giác' },
      { id: 6, testName: 'test06', input: '5 12 13', output: 'VUONG', note: 'Bộ Pytago 5-12-13' },
      { id: 7, testName: 'test07', input: '13 5 12', output: 'VUONG', note: 'Cạnh huyền c không ở cuối' },
      { id: 8, testName: 'test08', input: '7 10 7', output: 'CAN', note: 'Tam giác cân a = c' },
      { id: 9, testName: 'test09', input: '8 9 9', output: 'CAN', note: 'Tam giác cân b = c' },
      { id: 10, testName: 'test10', input: '4 5 6', output: 'THUONG', note: 'Tam giác thường' },
      { id: 11, testName: 'test11', input: '8 15 17', output: 'VUONG', note: 'Bộ 8-15-17' },
      { id: 12, testName: 'test12', input: '10 10 19', output: 'CAN', note: 'Tam giác cân rất dẹt' },
      { id: 13, testName: 'test13', input: '100 100 100', output: 'DEU', note: 'Tam giác đều 100' },
      { id: 14, testName: 'test14', input: '10 20 35', output: 'KHONG PHAI TAM GIAC', note: 'Không tạo thành tam giác' },
      { id: 15, testName: 'test15', input: '20 21 29', output: 'VUONG', note: 'Bộ 20-21-29' },
      { id: 16, testName: 'test16', input: '99 100 101', output: 'THUONG', note: '3 số liên tiếp' },
      { id: 17, testName: 'test17', input: '500 500 800', output: 'CAN', note: 'Cạnh 500' },
      { id: 18, testName: 'test18', input: '1000 1000 1000', output: 'DEU', note: 'Cạnh 1000' },
      { id: 19, testName: 'test19', input: '6000 8000 10000', output: 'VUONG', note: 'Biên 10^4' },
      { id: 20, testName: 'test20', input: '9999 10000 19998', output: 'THUONG', note: 'Biên lớn nhất' },
    ],
    createdAt: Date.now(),
  },

  // 2. Cấu trúc lặp: KTSNT
  KTSNT: {
    id: 'prebuilt-ktsnt',
    topic: 'loop',
    topicName: 'Cấu trúc lặp',
    problemName: 'Kiểm tra số nguyên tố',
    problemCode: 'KTSNT',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'easy',
    description: `Một số nguyên dương n > 1 được gọi là số nguyên tố nếu nó chỉ có đúng hai ước số dương là 1 và chính nó.
Cho số nguyên n, hãy kiểm tra xem n có phải là số nguyên tố hay không.`,
    inputFormat: `Một dòng duy nhất chứa số nguyên n (-10^9 <= n <= 10^9).`,
    outputFormat: `In ra 'YES' nếu n là số nguyên tố, ngược lại in ra 'NO'.`,
    constraints: `- 50% số test có n <= 1000.
- 50% số test có n <= 10^9.`,
    sampleInput: `7`,
    sampleOutput: `YES`,
    sampleExplanation: `Số 7 chỉ chia hết cho 1 và 7 nên là số nguyên tố.`,
    solutionCpp: `#include <iostream>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0)
            return false;
    }
    return true;
}

int main() {
    // freopen("KTSNT.inp", "r", stdin);
    // freopen("KTSNT.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long n;
    if (cin >> n) {
        if (isPrime(n)) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}`,
    algorithmExplanation: `1. Các số <= 1 không phải là số nguyên tố.
2. Duyệt kiểm tra các ước từ 2 đến sqrt(n). Để tối ưu, kiểm tra chia hết cho 2, 3 rồi bước nhảy 6 (i và i+2).
3. Độ phức tạp O(sqrt(n)) hoàn toàn chạy dưới 0.01 giây với n <= 10^9.`,
    timeComplexity: 'O(sqrt(N))',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Cho rằng 0 và 1 là số nguyên tố.',
      'Chạy vòng lặp từ 2 đến n thay vì sqrt(n) dẫn đến quá thời gian (Time Limit Exceeded) khi n = 10^9.',
      'Không xử lý trường hợp số âm.',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '7', output: 'YES', isSample: true, note: 'Ví dụ mẫu' },
      { id: 2, testName: 'test02', input: '1', output: 'NO', note: 'Biên số 1' },
      { id: 3, testName: 'test03', input: '2', output: 'YES', note: 'Số nguyên tố chẵn duy nhất' },
      { id: 4, testName: 'test04', input: '0', output: 'NO', note: 'Số 0' },
      { id: 5, testName: 'test05', input: '-5', output: 'NO', note: 'Số âm' },
      { id: 6, testName: 'test06', input: '9', output: 'NO', note: 'Hợp số lẻ' },
      { id: 7, testName: 'test07', input: '13', output: 'YES', note: 'Số nguyên tố nhỏ' },
      { id: 8, testName: 'test08', input: '97', output: 'YES', note: 'Số nguyên tố 2 chữ số lớn nhất' },
      { id: 9, testName: 'test09', input: '100', output: 'NO', note: 'Hợp số tròn trăm' },
      { id: 10, testName: 'test10', input: '101', output: 'YES', note: 'Số nguyên tố 3 chữ số nhỏ nhất' },
      { id: 11, testName: 'test11', input: '561', output: 'NO', note: 'Số Carmichael hợp số' },
      { id: 12, testName: 'test12', input: '997', output: 'YES', note: 'Số nguyên tố 3 chữ số lớn nhất' },
      { id: 13, testName: 'test13', input: '1000', output: 'NO', note: 'Số 1000' },
      { id: 14, testName: 'test14', input: '10007', output: 'YES', note: 'Nguyên tố 5 chữ số' },
      { id: 15, testName: 'test15', input: '999983', output: 'YES', note: 'Nguyên tố gần 10^6' },
      { id: 16, testName: 'test16', input: '1000000', output: 'NO', note: 'Hợp số 10^6' },
      { id: 17, testName: 'test17', input: '1000000007', output: 'YES', note: 'Số modulo nguyên tố kinh điển' },
      { id: 18, testName: 'test18', input: '1000000009', output: 'YES', note: 'Số nguyên tố lớn' },
      { id: 19, testName: 'test19', input: '1000000000', output: 'NO', note: 'Biên 10^9 hợp số' },
      { id: 20, testName: 'test20', input: '999999937', output: 'YES', note: 'Số nguyên tố lớn nhất < 10^9' },
    ],
    createdAt: Date.now(),
  },

  // 3. Hàm & Đệ quy: FIBO
  FIBO: {
    id: 'prebuilt-fibo',
    topic: 'function',
    topicName: 'Hàm & Đệ quy',
    problemName: 'Số Fibonacci thứ n',
    problemCode: 'FIBO',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'easy',
    description: `Dãy số Fibonacci được định nghĩa như sau:
F(1) = 1, F(2) = 1, và F(n) = F(n-1) + F(n-2) với n >= 3.
Hãy viết hàm tính số Fibonacci thứ n.`,
    inputFormat: `Một dòng chứa số nguyên dương n (1 <= n <= 90).`,
    outputFormat: `In ra số Fibonacci thứ n.`,
    constraints: `- 50% số test có n <= 30.
- 50% số test có 30 < n <= 90.`,
    sampleInput: `6`,
    sampleOutput: `8`,
    sampleExplanation: `Dãy Fibonacci: 1, 1, 2, 3, 5, 8. Số thứ 6 là 8.`,
    solutionCpp: `#include <iostream>
using namespace std;

// Hàm tính số Fibonacci thứ n sử dụng vòng lặp
unsigned long long getFibonacci(int n) {
    if (n <= 2) return 1;
    unsigned long long f1 = 1, f2 = 1, fn = 0;
    for (int i = 3; i <= n; i++) {
        fn = f1 + f2;
        f1 = f2;
        f2 = fn;
    }
    return fn;
}

int main() {
    // freopen("FIBO.inp", "r", stdin);
    // freopen("FIBO.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        cout << getFibonacci(n) << "\\n";
    }
    return 0;
}`,
    algorithmExplanation: `1. Sử dụng hàm getFibonacci(n) để tách biệt logic tính toán.
2. Với n <= 90, giá trị F(90) xấp xỉ 2.88 x 10^18 nằm vừa vặn trong kiểu số nguyên không dấu 64-bit (unsigned long long).
3. Dùng vòng lặp với 2 biến lưu trạng thái để đạt độ phức tạp thời gian O(N) và bộ nhớ O(1), tránh đệ quy ngây thơ O(2^N) bị tràn thời gian.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Dùng đệ quy thuần túy fibo(n-1) + fibo(n-2) khiến chương trình bị treo (TLE) khi n >= 40.',
      'Dùng kiểu int (32-bit) dẫn đến tràn số khi n >= 47.',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '6', output: '8', isSample: true, note: 'Ví dụ' },
      { id: 2, testName: 'test02', input: '1', output: '1', note: 'Biên n=1' },
      { id: 3, testName: 'test03', input: '2', output: '1', note: 'Biên n=2' },
      { id: 4, testName: 'test04', input: '3', output: '2', note: 'n=3' },
      { id: 5, testName: 'test05', input: '4', output: '3', note: 'n=4' },
      { id: 6, testName: 'test06', input: '5', output: '5', note: 'n=5' },
      { id: 7, testName: 'test07', input: '7', output: '13', note: 'n=7' },
      { id: 8, testName: 'test08', input: '10', output: '55', note: 'n=10' },
      { id: 9, testName: 'test09', input: '15', output: '610', note: 'n=15' },
      { id: 10, testName: 'test10', input: '20', output: '6765', note: 'n=20' },
      { id: 11, testName: 'test11', input: '25', output: '75025', note: 'n=25' },
      { id: 12, testName: 'test12', input: '30', output: '832040', note: 'n=30' },
      { id: 13, testName: 'test13', input: '40', output: '102334155', note: 'n=40' },
      { id: 14, testName: 'test14', input: '46', output: '1836311903', note: 'Gần giới hạn int' },
      { id: 15, testName: 'test15', input: '47', output: '2971215073', note: 'Vượt qua int (cần long long)' },
      { id: 16, testName: 'test16', input: '50', output: '12586269025', note: 'n=50' },
      { id: 17, testName: 'test17', input: '60', output: '1548008755920', note: 'n=60' },
      { id: 18, testName: 'test18', input: '70', output: '190392490709135', note: 'n=70' },
      { id: 19, testName: 'test19', input: '80', output: '23416728348467685', note: 'n=80' },
      { id: 20, testName: 'test20', input: '90', output: '2880067194370816120', note: 'Biên n=90' },
    ],
    createdAt: Date.now(),
  },

  // 4. Mảng: SECONDMAX
  SECONDMAX: {
    id: 'prebuilt-secondmax',
    topic: 'array',
    topicName: 'Mảng (1 Chiều & 2 Chiều)',
    problemName: 'Tìm số lớn thứ nhì trong mảng',
    problemCode: 'SECONDMAX',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'easy',
    description: `Cho mảng gồm n số nguyên a1, a2, ..., an. Hãy tìm giá trị lớn thứ nhì phân biệt trong mảng.
Nếu trong mảng không tồn tại giá trị lớn thứ nhì (tất cả các phần tử đều bằng nhau), in ra 'NOT FOUND'.`,
    inputFormat: `Dòng 1: Số nguyên dương n (2 <= n <= 10^5).
Dòng 2: n số nguyên a1, a2, ..., an (-10^9 <= ai <= 10^9).`,
    outputFormat: `In ra giá trị lớn thứ nhì hoặc 'NOT FOUND'.`,
    constraints: `- 60% số test có n <= 1000.
- 40% số test có n <= 10^5.`,
    sampleInput: `5\n3 7 2 7 5`,
    sampleOutput: `5`,
    sampleExplanation: `Mảng có giá trị lớn nhất là 7. Giá trị lớn thứ nhì phân biệt là 5.`,
    solutionCpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // freopen("SECONDMAX.inp", "r", stdin);
    // freopen("SECONDMAX.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long firstMax = -2e18, secondMax = -2e18;
    bool found = false;

    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        if (x > firstMax) {
            secondMax = firstMax;
            firstMax = x;
        } else if (x < firstMax && x > secondMax) {
            secondMax = x;
            found = true;
        }
    }

    if (secondMax > -2e18) {
        cout << secondMax << "\\n";
    } else {
        cout << "NOT FOUND\\n";
    }

    return 0;
}`,
    algorithmExplanation: `1. Duyệt qua mảng một lượt (1 pass O(N)).
2. Duy trì 2 biến firstMax và secondMax.
3. Khi gặp x > firstMax: cập nhật secondMax = firstMax, rồi firstMax = x.
4. Khi gặp x < firstMax nhưng x > secondMax: cập nhật secondMax = x.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Sắp xếp mảng rồi lấy phần tử ở vị trí n-2 mà quên mất mảng có các phần tử trùng nhau (vd: 7 7 7).',
      'Khởi tạo giá trị ban đầu là 0 khiến sai kết quả khi mảng chứa toàn số âm.',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '5\n3 7 2 7 5', output: '5', isSample: true, note: 'Ví dụ' },
      { id: 2, testName: 'test02', input: '3\n5 5 5', output: 'NOT FOUND', note: 'Tất cả bằng nhau' },
      { id: 3, testName: 'test03', input: '2\n10 20', output: '10', note: 'Mảng 2 phần tử' },
      { id: 4, testName: 'test04', input: '4\n-10 -5 -20 -1', output: '-5', note: 'Toàn số âm' },
      { id: 5, testName: 'test05', input: '5\n1 2 3 4 5', output: '4', note: 'Dãy tăng' },
      { id: 6, testName: 'test06', input: '5\n5 4 3 2 1', output: '4', note: 'Dãy giảm' },
      { id: 7, testName: 'test07', input: '6\n10 10 10 5 10 10', output: '5', note: 'Nhiều max trùng' },
      { id: 8, testName: 'test08', input: '4\n0 0 0 0', output: 'NOT FOUND', note: 'Toàn 0' },
      { id: 9, testName: 'test09', input: '5\n-100 -200 -100 -300 -100', output: '-200', note: 'Số âm trùng' },
      { id: 10, testName: 'test10', input: '6\n100 200 150 200 180 190', output: '190', note: 'Đa dạng' },
      { id: 11, testName: 'test11', input: '7\n1 9 2 8 3 7 4', output: '8', note: 'Xáo trộn' },
      { id: 12, testName: 'test12', input: '5\n1000 999 998 997 996', output: '999', note: 'Liên tiếp' },
      { id: 13, testName: 'test13', input: '4\n-1000000000 1000000000 0 -5', output: '0', note: 'Cực trị' },
      { id: 14, testName: 'test14', input: '6\n1000000000 999999999 1000000000 5 0 -10', output: '999999999', note: '10^9' },
      { id: 15, testName: 'test15', input: '5\n-1000000000 -1000000000 -1000000000 -1000000000 -1000000000', output: 'NOT FOUND', note: 'Toàn -10^9' },
      { id: 16, testName: 'test16', input: '8\n12 34 56 78 90 23 45 67', output: '78', note: 'Các số 2 chữ số' },
      { id: 17, testName: 'test17', input: '10\n1 2 3 4 5 6 7 8 9 10', output: '9', note: '1 đến 10' },
      { id: 18, testName: 'test18', input: '5\n42 42 42 42 1', output: '1', note: 'Gần như toàn bằng nhau' },
      { id: 19, testName: 'test19', input: '6\n-500 0 500 -1000 1000 -1500', output: '500', note: 'Đối xứng qua 0' },
      { id: 20, testName: 'test20', input: '7\n999999998 999999999 1000000000 999999999 999999998 0 1', output: '999999999', note: 'Biên 10^9' },
    ],
    createdAt: Date.now(),
  },

  // 5. Chuỗi: PALIN
  PALIN: {
    id: 'prebuilt-palin',
    topic: 'string',
    topicName: 'Chuỗi ký tự (String)',
    problemName: 'Kiểm tra xâu đối xứng',
    problemCode: 'PALIN',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'easy',
    description: `Một xâu ký tự được gọi là đối xứng (Palindrome) nếu đọc từ trái sang phải cũng giống hệt như đọc từ phải sang trái.
Cho một xâu ký tự s chỉ gồm các chữ cái in thường ('a' đến 'z'). Hãy kiểm tra xem xâu s có đối xứng không.`,
    inputFormat: `Một dòng duy nhất chứa xâu s (1 <= độ dài s <= 10^5).`,
    outputFormat: `In ra 'YES' nếu xâu đối xứng, ngược lại in ra 'NO'.`,
    constraints: `- 60% số test có độ dài s <= 200.
- 40% số test có độ dài s <= 10^5.`,
    sampleInput: `racecar`,
    sampleOutput: `YES`,
    sampleExplanation: `Xâu 'racecar' đọc từ trái sang phải hay từ phải sang trái đều giống nhau.`,
    solutionCpp: `#include <iostream>
#include <string>
using namespace std;

bool isPalindrome(const string &s) {
    int left = 0;
    int right = (int)s.length() - 1;
    while (left < right) {
        if (s[left] != s[right]) return false;
        left++;
        right--;
    }
    return true;
}

int main() {
    // freopen("PALIN.inp", "r", stdin);
    // freopen("PALIN.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string s;
    if (cin >> s) {
        if (isPalindrome(s)) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}`,
    algorithmExplanation: `Dùng kỹ thuật hai con trỏ (Two Pointers):
- Con trỏ left bắt đầu từ 0, con trỏ right bắt đầu từ length - 1.
- So sánh s[left] và s[right], nếu khác nhau lập tức kết luận NO.
- Nếu bằng nhau thì tăng left, giảm right. Quá trình dừng khi left >= right.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Đảo ngược xâu bằng phép cộng xâu dẫn đến độ phức tạp O(N^2) và bị tràn bộ nhớ khi N = 10^5.',
      'Quên xử lý trường hợp xâu có độ dài 1 (luôn đối xứng).',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: 'racecar', output: 'YES', isSample: true, note: 'Ví dụ mẫu' },
      { id: 2, testName: 'test02', input: 'a', output: 'YES', note: 'Xâu 1 ký tự' },
      { id: 3, testName: 'test03', input: 'ab', output: 'NO', note: 'Xâu 2 ký tự khác nhau' },
      { id: 4, testName: 'test04', input: 'aa', output: 'YES', note: 'Xâu 2 ký tự giống nhau' },
      { id: 5, testName: 'test05', input: 'aba', output: 'YES', note: 'Độ dài lẻ 3' },
      { id: 6, testName: 'test06', input: 'abba', output: 'YES', note: 'Độ dài chẵn 4' },
      { id: 7, testName: 'test07', input: 'abcba', output: 'YES', note: 'Độ dài lẻ 5' },
      { id: 8, testName: 'test08', input: 'abccba', output: 'YES', note: 'Độ dài chẵn 6' },
      { id: 9, testName: 'test09', input: 'hello', output: 'NO', note: 'Xâu không đối xứng' },
      { id: 10, testName: 'test10', input: 'madam', output: 'YES', note: 'Từ đối xứng' },
      { id: 11, testName: 'test11', input: 'level', output: 'YES', note: 'Từ đối xứng' },
      { id: 12, testName: 'test12', input: 'algorithm', output: 'NO', note: 'Không đối xứng' },
      { id: 13, testName: 'test13', input: 'radar', output: 'YES', note: 'Từ đối xứng' },
      { id: 14, testName: 'test14', input: 'noon', output: 'YES', note: 'Từ đối xứng chẵn' },
      { id: 15, testName: 'test15', input: 'abcdefghgfedcba', output: 'YES', note: 'Xâu dài đối xứng' },
      { id: 16, testName: 'test16', input: 'abcdefghgfedcbz', output: 'NO', note: 'Sai ký tự cuối' },
      { id: 17, testName: 'test17', input: 'zbcdefghgfedcba', output: 'NO', note: 'Sai ký tự đầu' },
      { id: 18, testName: 'test18', input: 'aaaaaaaaaa', output: 'YES', note: 'Toàn ký tự giống nhau' },
      { id: 19, testName: 'test19', input: 'aaaaaaaaab', output: 'NO', note: 'Khác đúng 1 ký tự cuối' },
      { id: 20, testName: 'test20', input: 'baaaaaaaaa', output: 'NO', note: 'Khác đúng 1 ký tự đầu' },
    ],
    createdAt: Date.now(),
  },

  // 6. Cấu trúc dữ liệu: NGOACDUNG
  NGOACDUNG: {
    id: 'prebuilt-ngoacdung',
    topic: 'struct_ds',
    topicName: 'Cấu trúc dữ liệu cơ bản',
    problemName: 'Kiểm tra dãy ngoặc đúng bằng Stack',
    problemCode: 'NGOACDUNG',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'medium',
    description: `Một dãy ngoặc chỉ gồm các ký tự '(', ')', '[', ']', '{', '}' được gọi là hợp lệ nếu:
1. Mỗi dấu mở ngoặc phải được đóng bởi dấu đóng ngoặc cùng loại.
2. Các dấu ngoặc được đóng theo đúng thứ tự mở trước đóng sau (LIFO).
Hãy kiểm tra xem dãy ngoặc cho trước có hợp lệ hay không.`,
    inputFormat: `Một dòng duy nhất chứa chuỗi s (1 <= độ dài s <= 10^5).`,
    outputFormat: `In ra 'YES' nếu dãy ngoặc hợp lệ, ngược lại in ra 'NO'.`,
    constraints: `- 60% số test có độ dài s <= 1000.
- 40% số test có độ dài s <= 10^5.`,
    sampleInput: `{[()]}`,
    sampleOutput: `YES`,
    sampleExplanation: `Các dấu ngoặc được lồng nhau đúng quy tắc: { [ ( ) ] }.`,
    solutionCpp: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

bool isValidBracket(const string &s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if (c == ')' && top != '(') return false;
            if (c == ']' && top != '[') return false;
            if (c == '}' && top != '{') return false;
        }
    }
    return st.empty();
}

int main() {
    // freopen("NGOACDUNG.inp", "r", stdin);
    // freopen("NGOACDUNG.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string s;
    if (cin >> s) {
        if (isValidBracket(s)) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}`,
    algorithmExplanation: `Sử dụng cấu trúc dữ liệu ngăn xếp std::stack:
- Gặp mở ngoặc: push vào stack.
- Gặp đóng ngoặc: kiểm tra stack rỗng hay không. Nếu rỗng -> NO. Nếu không rỗng, lấy phần tử đỉnh top ra so sánh. Nếu không cùng loại -> NO.
- Cuối cùng nếu stack rỗng -> YES, ngược lại còn dư mở ngoặc -> NO.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Quên kiểm tra st.empty() trước khi gọi st.top() dẫn đến crash chương trình (Segmentation Fault / Runtime Error).',
      'Quên kiểm tra st.empty() ở cuối chương trình (trường hợp còn dư dấu mở ngoặc như "(((").',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '{[()]}', output: 'YES', isSample: true, note: 'Ví dụ' },
      { id: 2, testName: 'test02', input: '()', output: 'YES', note: 'Ngoặc tròn đơn' },
      { id: 3, testName: 'test03', input: '[]', output: 'YES', note: 'Ngoặc vuông đơn' },
      { id: 4, testName: 'test04', input: '{}', output: 'YES', note: 'Ngoặc nhọn đơn' },
      { id: 5, testName: 'test05', input: '(]', output: 'NO', note: 'Không cùng loại' },
      { id: 6, testName: 'test06', input: '([)]', output: 'NO', note: 'Đan xen sai thứ tự' },
      { id: 7, testName: 'test07', input: '{[]}()', output: 'YES', note: 'Nhiều khối liên tiếp' },
      { id: 8, testName: 'test08', input: '(((', output: 'NO', note: 'Dư mở ngoặc' },
      { id: 9, testName: 'test09', input: ')))', output: 'NO', note: 'Dư đóng ngoặc' },
      { id: 10, testName: 'test10', input: ')()(', output: 'NO', note: 'Bắt đầu bằng đóng ngoặc' },
      { id: 11, testName: 'test11', input: '{[()]()}', output: 'YES', note: 'Lồng phức tạp' },
      { id: 12, testName: 'test12', input: '((()))', output: 'YES', note: '3 cặp tròn' },
      { id: 13, testName: 'test13', input: '[[[]]]', output: 'YES', note: '3 cặp vuông' },
      { id: 14, testName: 'test14', input: '{{{{{}}}}}', output: 'YES', note: '5 cặp nhọn' },
      { id: 15, testName: 'test15', input: '((((((((((', output: 'NO', note: '10 dấu mở' },
      { id: 16, testName: 'test16', input: '()()()()()()', output: 'YES', note: 'Dãy lặp tròn' },
      { id: 17, testName: 'test17', input: '({[]})({[]})', output: 'YES', note: '2 khối hợp lệ' },
      { id: 18, testName: 'test18', input: '({[]})({[]}', output: 'NO', note: 'Thiếu 1 ngoặc đóng cuối' },
      { id: 19, testName: 'test19', input: '[({})]([])', output: 'YES', note: 'Phối hợp các loại' },
      { id: 20, testName: 'test20', input: '{[()()]}[{()}]', output: 'YES', note: 'Chuỗi dài hợp lệ' },
    ],
    createdAt: Date.now(),
  },
  // 7. Hai con trỏ / Mảng: WOOD (Khai thác gỗ)
  WOOD: {
    id: 'prebuilt-wood',
    topic: 'array',
    topicName: 'Mảng & Hai con trỏ (Two Pointers)',
    problemName: 'Khai thác gỗ',
    problemCode: 'WOOD',
    timeLimit: '1.0 giây',
    memoryLimit: '256 MB',
    difficulty: 'medium',
    description: `Sau nhà bác nông dân John có trồng $n$ cây gỗ trồng theo hàng ngang, mỗi cây khi khai thác sẽ cho sản lượng gỗ là $a_i \\text{ m}^3$ ($1 \\le i \\le n$). Muốn dựng một cái chuồng bằng gỗ để nhốt những con bò của mình, bác John cần phải có ít nhất $S \\text{ m}^3$ gỗ. Bác quyết định sẽ khai thác gỗ từ hàng cây sau nhà mình. Bác muốn mỹ quan ngôi nhà mình không bị thay đổi nhiều, vì vậy bác chỉ muốn khai thác một đoạn liên tiếp ngắn nhất các cây gỗ của mình sao cho tổng sản lượng gỗ đảm bảo ít nhất là $S \\text{ m}^3$.

Hãy lập trình cho biết độ dài đoạn ngắn nhất liên tiếp các cây gỗ có tổng sản lượng thỏa mãn yêu cầu đề bài.`,
    inputFormat: `• Dòng 1: Hai số nguyên dương $n$ ($n \\le 10^5$) và $S$ ($S \\le 2 \\times 10^9$).
• Dòng 2: $n$ số nguyên dương $a_1, a_2, \\dots, a_n$ thể hiện sản lượng gỗ của mỗi cây gỗ ($a_i \\le 10^9$).`,
    outputFormat: `• Một dòng duy nhất chứa kết quả của bài toán (nếu không có bất kỳ đoạn nào thỏa mãn, in ra 0).`,
    constraints: `- 20% số test đầu tiên tương ứng với 20% số điểm với $n \\le 100$.
- 30% số test tiếp theo tương ứng với 30% số điểm với $100 < n \\le 1000$.
- 50% số điểm còn lại tương ứng với 50% số test với $1000 < n \\le 10^5$.`,
    sampleInput: `10 17
5 1 3 5 10 7 4 9 2 8`,
    sampleOutput: `2`,
    sampleExplanation: `Đoạn liên tiếp ngắn nhất thỏa mãn là hai cây gỗ [10, 7] có tổng sản lượng 10 + 7 = 17 >= S (S = 17) và độ dài là 2.`,
    solutionCpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // freopen("WOOD.inp", "r", stdin);
    // freopen("WOOD.out", "w", stdout);
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    long long S;
    if (!(cin >> n >> S)) return 0;

    vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    // Kỹ thuật hai con trỏ (Two Pointers / Sliding Window)
    int left = 0;
    long long current_sum = 0;
    int min_len = n + 1;

    for (int right = 0; right < n; ++right) {
        current_sum += a[right];

        // Thu hẹp cửa sổ từ phía trái khi tổng vẫn đảm bảo >= S
        while (current_sum >= S) {
            min_len = min(min_len, right - left + 1);
            current_sum -= a[left];
            left++;
        }
    }

    if (min_len > n) {
        cout << 0 << "\\n";
    } else {
        cout << min_len << "\\n";
    }

    return 0;
}`,
    algorithmExplanation: `1. Phân tích bài toán: Cần tìm đoạn con liên tiếp a[L..R] sao cho tổng a[L] + ... + a[R] >= S và (R - L + 1) nhỏ nhất. Do tất cả a[i] > 0, hàm tổng là hàm đơn điệu tăng dần.
2. Phương pháp Hai con trỏ (Two Pointers / Kỹ thuật cửa sổ trượt):
   - Sử dụng con trỏ right chạy từ đầu đến cuối mảng, cộng dồn giá trị a[right] vào current_sum.
   - Khi current_sum >= S, ta liên tục cập nhật min_len = min(min_len, right - left + 1) và dịch con trỏ left sang phải (trừ a[left] khỏi current_sum) cho đến khi current_sum < S.
   - Mỗi phần tử được duyệt qua đúng 2 lần (1 lần bởi right và 1 lần bởi left), do đó độ phức tạp chỉ là O(N).
3. Đánh giá độ phức tạp:
   - Thời gian: O(N) với N = 10^5 chạy trong khoảng 0.02 giây, vượt xa yêu cầu 1.0 giây.
   - Bộ nhớ: O(N) để lưu mảng a.`,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    commonMistakes: [
      'Tràn số nguyên 32-bit: Tổng mảng có thể lên tới N * a[i] = 10^5 * 10^9 = 10^14, vượt quá kiểu int (2*10^9). Bắt buộc phải dùng kiểu long long cho biến S và current_sum.',
      'Dùng 2 vòng for lồng nhau O(N^2) để kiểm tra mọi đoạn con sẽ bị quá thời gian (Time Limit Exceeded - TLE) khi N = 10^5.',
      'Quên xử lý trường hợp tổng toàn bộ mảng nhỏ hơn S (không có đoạn nào thỏa mãn), cần in ra 0 theo quy định đề bài.',
    ],
    testCases: [
      { id: 1, testName: 'test01', input: '10 17\n5 1 3 5 10 7 4 9 2 8', output: '2', isSample: true, note: 'Ví dụ đề bài: đoạn [10, 7]' },
      { id: 2, testName: 'test02', input: '5 10\n2 3 12 1 4', output: '1', note: 'Một phần tử duy nhất thỏa mãn (12 >= 10)' },
      { id: 3, testName: 'test03', input: '5 100\n10 20 15 5 10', output: '0', note: 'Tổng toàn mảng không đủ S (in ra 0)' },
      { id: 4, testName: 'test04', input: '4 10\n1 2 3 4', output: '4', note: 'Cần toàn bộ mảng mới đủ S = 10' },
      { id: 5, testName: 'test05', input: '6 15\n5 5 5 5 5 5', output: '3', note: 'Các phần tử bằng nhau' },
      { id: 6, testName: 'test06', input: '8 20\n2 4 6 8 10 12 14 16', output: '2', note: 'Dãy tăng dần đều' },
      { id: 7, testName: 'test07', input: '7 7\n2 1 5 2 3 2 1', output: '2', note: 'Nhiều đoạn cùng độ dài thỏa mãn' },
      { id: 8, testName: 'test08', input: '1 10\n10', output: '1', note: 'Biên n = 1 và đủ S' },
      { id: 9, testName: 'test09', input: '1 10\n9', output: '0', note: 'Biên n = 1 và thiếu' },
      { id: 10, testName: 'test10', input: '12 100\n10 25 30 15 5 40 60 20 10 5 8 12', output: '2', note: 'Đoạn nằm ở giữa mảng [40, 60]' },
      { id: 11, testName: 'test11', input: '15 250\n15 35 20 10 80 90 75 10 25 30 40 50 15 20 10', output: '4', note: 'Subtask 1: n <= 100' },
      { id: 12, testName: 'test12', input: '10 1000\n100 200 300 400 50 60 70 80 90 100', output: '4', note: 'Đoạn đầu mảng lớn nhất' },
      { id: 13, testName: 'test13', input: '10 1000\n50 60 70 80 90 100 100 200 300 400', output: '4', note: 'Đoạn cuối mảng lớn nhất' },
      { id: 14, testName: 'test14', input: '20 500\n10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90 95 100 105', output: '6', note: 'Dãy số học cấp số cộng' },
      { id: 15, testName: 'test15', input: '14 2000000000\n1000000000 1000000000 500 600 700 800 900 1000 1100 1200 1300 1400 1500 1600', output: '2', note: 'Số lớn S = 2*10^9' },
      { id: 16, testName: 'test16', input: '16 35\n1 2 3 4 5 1 2 3 4 5 1 2 3 4 5 20', output: '6', note: 'Đoạn dài ở cuối' },
      { id: 17, testName: 'test17', input: '25 100\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1', output: '0', note: 'Mảng gồm toàn số 1 nhỏ hơn S' },
      { id: 18, testName: 'test18', input: '30 300\n10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10', output: '30', note: 'Toàn bộ 30 số 10' },
      { id: 19, testName: 'test19', input: '18 150\n5 10 15 20 25 30 35 40 45 50 20 15 10 5 1 2 3 4', output: '4', note: 'Subtask 2: n = 18' },
      { id: 20, testName: 'test20', input: '22 1000000000\n100000000 200000000 300000000 400000000 500000000 600000000 700000000 800000000 900000000 1000000000 100 200 300 400 500 600 700 800 900 1000 2000 3000', output: '1', note: 'Subtask 3: Số lớn nhất a_i = 10^9' },
    ],
    createdAt: Date.now(),
  },
};
