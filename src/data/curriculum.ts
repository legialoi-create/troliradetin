import { CurriculumTopic, ProblemData } from '../types';

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    id: 'branching',
    order: 1,
    title: 'Cấu trúc rẽ nhánh',
    shortTitle: 'Rẽ nhánh',
    badge: 'Chương 1',
    description: 'Câu lệnh if, if...else, switch...case, toán tử so sánh & logic cho học sinh làm quen với tư duy điều kiện.',
    concepts: ['Lệnh if / else', 'Toán tử &&, ||, !', 'Switch-case', 'Tìm số lớn nhất/nhỏ nhất', 'Kiểm tra tam giác', 'Phương trình bậc nhất/hai'],
    suggestedProblems: [
      {
        name: 'Phân loại tam giác',
        code: 'TAMGIAC',
        brief: 'Cho 3 cạnh a, b, c. Xác định xem có tạo thành tam giác không và là tam giác đều, cân, vuông hay thường.',
        difficulty: 'easy',
      },
      {
        name: 'Tính tiền điện bậc thang',
        code: 'TIENDIEN',
        brief: 'Tính hoá đơn tiền điện sinh hoạt theo các bậc thang tiêu thụ điện.',
        difficulty: 'medium',
      },
      {
        name: 'Năm nhuận và số ngày trong tháng',
        code: 'SONGAY',
        brief: 'Nhập vào tháng và năm, xuất ra số ngày chính xác của tháng đó có tính năm nhuận.',
        difficulty: 'easy',
      },
      {
        name: 'Tìm số lớn nhất trong 4 số',
        code: 'MAX4SO',
        brief: 'Nhập vào 4 số nguyên a, b, c, d. Tìm và in ra giá trị lớn nhất.',
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'loop',
    order: 2,
    title: 'Cấu trúc lặp',
    shortTitle: 'Vòng lặp',
    badge: 'Chương 2',
    description: 'Vòng lặp for, while, do-while, vòng lặp lồng nhau, kỹ năng đếm, tính tổng và tích luỹ giá trị.',
    concepts: ['Vòng lặp for', 'Vòng lặp while/do-while', 'Ước số, bội số, số nguyên tố', 'Số hoàn hảo, số chính phương', 'Tính tổng chuỗi số', 'Vẽ hình tam giác/chữ nhật sao'],
    suggestedProblems: [
      {
        name: 'Kiểm tra số nguyên tố',
        code: 'KTSNT',
        brief: 'Kiểm tra một số nguyên n có phải là số nguyên tố hay không (tối ưu căn bậc hai).',
        difficulty: 'easy',
      },
      {
        name: 'Tổng các chữ số của n',
        code: 'TONGCS',
        brief: 'Tính tổng các chữ số của một số nguyên dương n có thể lên đến 18 chữ số.',
        difficulty: 'easy',
      },
      {
        name: 'Ước chung lớn nhất & Bội chung nhỏ nhất',
        code: 'UCLN',
        brief: 'Tìm ước chung lớn nhất và bội chung nhỏ nhất của hai số nguyên dương a và b.',
        difficulty: 'medium',
      },
      {
        name: 'In tam giác số đối xứng',
        code: 'VEHINH',
        brief: 'Nhập số nguyên n, in ra tam giác số hoặc hình sao đối xứng theo quy luật.',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'function',
    order: 3,
    title: 'Hàm & Đệ quy',
    shortTitle: 'Hàm',
    badge: 'Chương 3',
    description: 'Tổ chức mã nguồn thành các module độc lập, truyền tham số theo giá trị/tham chiếu và tư duy đệ quy cơ bản.',
    concepts: ['Khai báo & định nghĩa hàm', 'Tham số giá trị & tham chiếu (&)', 'Hàm trả về giá trị / void', 'Đệ quy cơ bản', 'Hàm đệ quy Fibonacci', 'Hàm đệ quy luỹ thừa'],
    suggestedProblems: [
      {
        name: 'Hàm tính số Fibonacci thứ n',
        code: 'FIBO',
        brief: 'Viết hàm tính số Fibonacci thứ n sử dụng tư duy hàm và vòng lặp/đệ quy có nhớ.',
        difficulty: 'easy',
      },
      {
        name: 'Đếm số lượng số nguyên tố trong đoạn [a, b]',
        code: 'DEMSNT',
        brief: 'Viết hàm kiemTraSNT(x) và dùng vòng lặp đếm số lượng số nguyên tố trong đoạn [a, b].',
        difficulty: 'medium',
      },
      {
        name: 'Hoán vị 2 số & sắp xếp 3 số bằng tham chiếu',
        code: 'HOANVI',
        brief: 'Viết hàm swap(int &a, int &b) để sắp xếp 3 số theo thứ tự tăng dần.',
        difficulty: 'easy',
      },
    ],
  },
  {
    id: 'array',
    order: 4,
    title: 'Mảng (1 Chiều & 2 Chiều)',
    shortTitle: 'Mảng',
    badge: 'Chương 4',
    description: 'Cấu trúc mảng tĩnh, duyệt mảng, tìm kiếm, lọc dữ liệu, sắp xếp cơ bản và ma trận 2 chiều.',
    concepts: ['Mảng 1 chiều', 'Tìm min/max & vị trí', 'Sắp xếp mảng (Selection/Bubble/std::sort)', 'Tìm kiếm tuyến tính & nhị phân', 'Mảng 2 chiều (Ma trận)', 'Đường chéo ma trận vuông'],
    suggestedProblems: [
      {
        name: 'Tìm phần tử lớn thứ nhì trong mảng',
        code: 'SECONDMAX',
        brief: 'Cho mảng n số nguyên. Tìm giá trị lớn thứ nhì phân biệt trong mảng.',
        difficulty: 'easy',
      },
      {
        name: 'Đếm số lần xuất hiện của các phần tử',
        code: 'DEMPHANTU',
        brief: 'Đếm tần suất xuất hiện của từng số trong mảng và in theo thứ tự tăng dần.',
        difficulty: 'medium',
      },
      {
        name: 'Tổng đường chéo chính và phụ của ma trận',
        code: 'TONGCHEO',
        brief: 'Cho ma trận vuông cấp n x n. Tính tổng các phần tử trên đường chéo chính và chéo phụ.',
        difficulty: 'easy',
      },
      {
        name: 'Dãy con tăng dài nhất cơ bản',
        code: 'DAYCONTANG',
        brief: 'Tìm độ dài của dãy con liên tiếp tăng dần dài nhất trong mảng.',
        difficulty: 'medium',
      },
      {
        name: 'Khai thác gỗ (Bài 4)',
        code: 'WOOD',
        brief: 'Tìm độ dài đoạn liên tiếp ngắn nhất các cây gỗ sao cho tổng sản lượng ít nhất là S.',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'string',
    order: 5,
    title: 'Chuỗi ký tự (String)',
    shortTitle: 'Chuỗi',
    badge: 'Chương 5',
    description: 'Kiểu ký tự char, bảng mã ASCII, xâu ký tự std::string, chuẩn hoá văn bản, đảo xâu và đếm từ.',
    concepts: ['std::string trong C++', 'Bảng mã ASCII & xử lý char', 'Xâu đối xứng (Palindrome)', 'Chuẩn hoá họ tên (viết hoa/xoá dấu cách)', 'Đếm số lượng từ', 'Cộng trừ 2 số nguyên lớn bằng chuỗi'],
    suggestedProblems: [
      {
        name: 'Kiểm tra xâu đối xứng (Palindrome)',
        code: 'PALIN',
        brief: 'Kiểm tra một chuỗi ký tự có phải là xâu đối xứng hay không (bỏ qua khoảng trắng và chữ hoa thường).',
        difficulty: 'easy',
      },
      {
        name: 'Chuẩn hoá tên người',
        code: 'CHUANHOA',
        brief: 'Xoá các khoảng trắng thừa ở đầu, cuối và giữa các từ; viết hoa chữ cái đầu mỗi từ.',
        difficulty: 'medium',
      },
      {
        name: 'Đếm số từ trong văn bản',
        code: 'DEMTU',
        brief: 'Cho một câu tiếng Việt không dấu hoặc tiếng Anh. Đếm chính xác số lượng từ trong câu.',
        difficulty: 'easy',
      },
      {
        name: 'Cộng hai số nguyên lớn',
        code: 'BIGADD',
        brief: 'Cho hai số nguyên dương có độ dài lên tới 100 chữ số. Tính tổng của chúng.',
        difficulty: 'hard',
      },
    ],
  },
  {
    id: 'struct_ds',
    order: 6,
    title: 'Cấu trúc dữ liệu cơ bản',
    shortTitle: 'Cấu trúc dữ liệu',
    badge: 'Chương 6',
    description: 'Kiểu cấu trúc struct, thư viện chuẩn STL cơ bản: vector, pair, set, map cho học sinh bắt đầu thi HSG.',
    concepts: ['struct tự định nghĩa', 'std::pair', 'std::vector', 'std::set (tập hợp)', 'std::map (ánh xạ / từ điển)', 'std::stack & kiểm tra dấu ngoặc'],
    suggestedProblems: [
      {
        name: 'Quản lý điểm học sinh bằng struct',
        code: 'QLHOCSINH',
        brief: 'Khai báo struct HocSinh gồm Tên, Toán, Tin. Sắp xếp danh sách học sinh theo điểm trung bình giảm dần.',
        difficulty: 'medium',
      },
      {
        name: 'Kiểm tra dãy ngoặc đúng bằng Stack',
        code: 'NGOACDUNG',
        brief: 'Cho một chuỗi gồm các dấu ngoặc tròn (), vuông [], nhọn {}. Kiểm tra xem chuỗi có hợp lệ không.',
        difficulty: 'medium',
      },
      {
        name: 'Đếm từ khác nhau dùng std::set',
        code: 'TUSET',
        brief: 'Đọc vào một đoạn văn bản và in ra danh sách các từ khác nhau theo thứ tự từ điển.',
        difficulty: 'easy',
      },
      {
        name: 'Tra cứu số điện thoại dùng std::map',
        code: 'DANHBA',
        brief: 'Xây dựng danh bạ điện thoại và thực hiện truy vấn số điện thoại theo tên nhanh chóng.',
        difficulty: 'easy',
      },
    ],
  },
];

// High quality initial sample problem ready out of the box
export const SAMPLE_PROBLEM: ProblemData = {
  id: 'default-tamgiac',
  topic: 'branching',
  topicName: 'Cấu trúc rẽ nhánh',
  problemName: 'Phân loại tam giác',
  problemCode: 'TAMGIAC',
  timeLimit: '1.0 giây',
  memoryLimit: '256 MB',
  difficulty: 'easy',
  description: `Trong giờ học Toán hình, thầy giáo đố các bạn học sinh: Cho ba số nguyên dương $a, b, c$ lần lượt là độ dài ba cạnh. Hãy kiểm tra xem ba cạnh này có thể tạo thành một tam giác hay không.

Nếu tạo thành tam giác, hãy phân loại xem đó là tam giác gì:
- Tam giác đều: Cả 3 cạnh bằng nhau ($a = b = c$).
- Tam giác cân: Có đúng 2 cạnh bằng nhau (không phải đều).
- Tam giác vuông: Bình phương một cạnh bằng tổng bình phương hai cạnh còn lại ($a^2 + b^2 = c^2$ hoặc $a^2 + c^2 = b^2$ hoặc $b^2 + c^2 = a^2$).
- Tam giác vuông cân: Vừa là tam giác vuông vừa là tam giác cân.
- Tam giác thường: Các trường hợp tam giác còn lại.

Nếu ba cạnh không tạo thành tam giác, in ra \`KHONG PHAI TAM GIAC\`.`,
  inputFormat: `Một dòng duy nhất chứa ba số nguyên dương $a, b, c$ cách nhau bởi dấu cách ($1 \\le a, b, c \\le 10^4$).`,
  outputFormat: `In ra màn hình hoặc file kết quả:
- \`DEU\` nếu là tam giác đều.
- \`VUONG CAN\` nếu là tam giác vuông cân.
- \`VUONG\` nếu là tam giác vuông.
- \`CAN\` nếu là tam giác cân.
- \`THUONG\` nếu là tam giác thường.
- \`KHONG PHAI TAM GIAC\` nếu ba cạnh không tạo thành tam giác.`,
  constraints: `- 60% số test có $1 \\le a, b, c \\le 100$.
- 40% số test còn lại có $100 < a, b, c \\le 10^4$.`,
  sampleInput: `3 4 5`,
  sampleOutput: `VUONG`,
  sampleExplanation: `Với ba cạnh 3, 4, 5:
- Điều kiện tam giác thoả mãn vì: $3+4 > 5$, $3+5 > 4$, $4+5 > 3$.
- Ta có $3^2 + 4^2 = 9 + 16 = 25 = 5^2$, do đó đây là tam giác vuông (bộ ba số Pytago kinh điển).`,
  solutionCpp: `#include <iostream>
#include <algorithm>

using namespace std;

int main() {
    // Để tiện chấm thi Themis hoặc nộp online, mở comment 2 dòng dưới nếu đề yêu cầu đọc ghi file:
    // freopen("TAMGIAC.inp", "r", stdin);
    // freopen("TAMGIAC.out", "w", stdout);

    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;

    // 1. Kiểm tra điều kiện tạo thành tam giác: tổng 2 cạnh bất kỳ > cạnh còn lại
    if (a + b <= c || a + c <= b || b + c <= a) {
        cout << "KHONG PHAI TAM GIAC\\n";
        return 0;
    }

    // 2. Kiểm tra tính chất vuông bằng định lý Pytago
    // Lưu ý: Dùng long long để tránh tràn số khi tính bình phương
    bool vuong = (a * a + b * b == c * c) || 
                 (a * a + c * c == b * b) || 
                 (b * b + c * c == a * a);

    // 3. Kiểm tra tính chất đều và cân
    bool deu = (a == b && b == c);
    bool can = (a == b || b == c || a == c);

    if (deu) {
        cout << "DEU\\n";
    } else if (vuong && can) {
        cout << "VUONG CAN\\n";
    } else if (vuong) {
        cout << "VUONG\\n";
    } else if (can) {
        cout << "CAN\\n";
    } else {
        cout << "THUONG\\n";
    }

    return 0;
}`,
  algorithmExplanation: `Thuật toán giải bài toán kiểm tra tam giác:
1. Điều kiện cần và đủ để 3 đoạn thẳng có độ dài a, b, c tạo thành một tam giác là:
   a + b > c VÀ a + c > b VÀ b + c > a.
2. Nếu không thoả, kết luận ngay 'KHONG PHAI TAM GIAC'.
3. Sử dụng định lý Pytago để kiểm tra góc vuông. Chú ý tính toán bằng kiểu số nguyên 64-bit (long long) để phòng ngừa tràn số integer khi a, b, c lớn (lên tới 10^4 thì a^2 = 10^8 nằm trong int, nhưng thói quen dùng long long là cần thiết cho học sinh thi HSG).
4. Phân loại theo thứ tự ưu tiên: Đều -> Vuông Cân -> Vuông -> Cân -> Thường.`,
  timeComplexity: `O(1) - Chỉ thực hiện một số phép so sánh điều kiện cơ bản.`,
  spaceComplexity: `O(1) - Chỉ sử dụng 3 biến chứa độ dài cạnh.`,
  commonMistakes: [
    'Học sinh quên kiểm tra điều kiện tam giác trước, nhảy thẳng vào kiểm tra đều hay cân dẫn đến kết luận sai khi cho bộ số như 1 2 3 hoặc 1 1 5.',
    'Quên trường hợp tam giác vuông cân (ví dụ các cạnh có tỉ lệ 1, 1, căn 2 tuy nhiên với số nguyên chỉ có số xấp xỉ, nhưng cần chú ý thứ tự if-else).',
    'Chỉ kiểm tra a^2 + b^2 == c^2 mà quên mất c chưa chắc là cạnh huyền lớn nhất (chưa sắp xếp 3 cạnh).',
    'Dùng sai toán tử logic (nhầm && thành || khi kiểm tra điều kiện tam giác).',
  ],
  testCases: [
    { id: 1, testName: 'test01', input: '3 4 5', output: 'VUONG', isSample: true, note: 'Test ví dụ (Bộ ba Pytago 3-4-5)' },
    { id: 2, testName: 'test02', input: '5 5 5', output: 'DEU', note: 'Tam giác đều các cạnh bằng nhau' },
    { id: 3, testName: 'test03', input: '5 5 8', output: 'CAN', note: 'Tam giác cân a = b' },
    { id: 4, testName: 'test04', input: '1 2 3', output: 'KHONG PHAI TAM GIAC', note: 'Biên suy biến: 1 + 2 = 3' },
    { id: 5, testName: 'test05', input: '1 2 10', output: 'KHONG PHAI TAM GIAC', note: 'Tổng 2 cạnh nhỏ hơn cạnh thứ 3' },
    { id: 6, testName: 'test06', input: '5 12 13', output: 'VUONG', note: 'Bộ ba Pytago 5-12-13' },
    { id: 7, testName: 'test07', input: '13 5 12', output: 'VUONG', note: 'Cạnh huyền c không đứng cuối cùng' },
    { id: 8, testName: 'test08', input: '7 10 7', output: 'CAN', note: 'Tam giác cân a = c' },
    { id: 9, testName: 'test09', input: '8 9 9', output: 'CAN', note: 'Tam giác cân b = c' },
    { id: 10, testName: 'test10', input: '4 5 6', output: 'THUONG', note: 'Tam giác thường các cạnh khác nhau' },
    { id: 11, testName: 'test11', input: '8 15 17', output: 'VUONG', note: 'Bộ ba Pytago 8-15-17' },
    { id: 12, testName: 'test12', input: '10 10 19', output: 'CAN', note: 'Tam giác cân rất dẹt (gần suy biến)' },
    { id: 13, testName: 'test13', input: '100 100 100', output: 'DEU', note: 'Cạnh tròn 100' },
    { id: 14, testName: 'test14', input: '10 20 35', output: 'KHONG PHAI TAM GIAC', note: 'Không tạo thành tam giác' },
    { id: 15, testName: 'test15', input: '20 21 29', output: 'VUONG', note: 'Bộ ba Pytago 20-21-29' },
    { id: 16, testName: 'test16', input: '99 100 101', output: 'THUONG', note: 'Ba số nguyên liên tiếp' },
    { id: 17, testName: 'test17', input: '500 500 800', output: 'CAN', note: 'Dữ liệu kích thước lớn' },
    { id: 18, testName: 'test18', input: '1000 1000 1000', output: 'DEU', note: 'Giới hạn subtask 1000' },
    { id: 19, testName: 'test19', input: '6000 8000 10000', output: 'VUONG', note: 'Dữ liệu lớn 10^4 (Bộ 3-4-5 phóng to)' },
    { id: 20, testName: 'test20', input: '9999 10000 19998', output: 'THUONG', note: 'Biên tối đa 10^4 thoả điều kiện tam giác' },
  ],
  createdAt: Date.now(),
};
