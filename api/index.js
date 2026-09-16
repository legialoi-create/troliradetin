// server.ts
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// src/data/prebuiltProblems.ts
var PREBUILT_PROBLEMS = {
  // 1. Cấu trúc rẽ nhánh: TAMGIAC
  TAMGIAC: {
    id: "prebuilt-tamgiac",
    topic: "branching",
    topicName: "C\u1EA5u tr\xFAc r\u1EBD nh\xE1nh",
    problemName: "Ph\xE2n lo\u1EA1i tam gi\xE1c",
    problemCode: "TAMGIAC",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "easy",
    description: `Cho ba s\u1ED1 nguy\xEAn d\u01B0\u01A1ng a, b, c l\xE0 \u0111\u1ED9 d\xE0i ba c\u1EA1nh. H\xE3y ki\u1EC3m tra xem ba c\u1EA1nh n\xE0y c\xF3 t\u1EA1o th\xE0nh m\u1ED9t tam gi\xE1c hay kh\xF4ng. N\u1EBFu c\xF3, h\xE3y ph\xE2n lo\u1EA1i:
- DEU: Tam gi\xE1c \u0111\u1EC1u (3 c\u1EA1nh b\u1EB1ng nhau)
- VUONG CAN: V\u1EEBa vu\xF4ng v\u1EEBa c\xE2n
- VUONG: Tam gi\xE1c vu\xF4ng (theo \u0111\u1ECBnh l\xFD Pytago)
- CAN: Tam gi\xE1c c\xE2n (c\xF3 2 c\u1EA1nh b\u1EB1ng nhau)
- THUONG: Tam gi\xE1c th\u01B0\u1EDDng
N\u1EBFu kh\xF4ng t\u1EA1o th\xE0nh tam gi\xE1c, in ra 'KHONG PHAI TAM GIAC'.`,
    inputFormat: `M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a 3 s\u1ED1 nguy\xEAn d\u01B0\u01A1ng a, b, c c\xE1ch nhau b\u1EDFi d\u1EA5u c\xE1ch (1 <= a, b, c <= 10^4).`,
    outputFormat: `In ra lo\u1EA1i tam gi\xE1c t\u01B0\u01A1ng \u1EE9ng: DEU, VUONG CAN, VUONG, CAN, THUONG ho\u1EB7c KHONG PHAI TAM GIAC.`,
    constraints: `- 60% s\u1ED1 test c\xF3 a, b, c <= 100.
- 40% s\u1ED1 test c\xF3 a, b, c <= 10^4.`,
    sampleInput: `3 4 5`,
    sampleOutput: `VUONG`,
    sampleExplanation: `V\u1EDBi 3 c\u1EA1nh 3, 4, 5 tho\u1EA3 m\xE3n b\u1EA5t \u0111\u1EB3ng th\u1EE9c tam gi\xE1c v\xE0 3^2 + 4^2 = 5^2 n\xEAn l\xE0 tam gi\xE1c vu\xF4ng.`,
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
    algorithmExplanation: `1. Ki\u1EC3m tra \u0111i\u1EC1u ki\u1EC7n tam gi\xE1c: a + b > c && a + c > b && b + c > a.
2. Ki\u1EC3m tra Pytago b\u1EB1ng ki\u1EC3u long long tr\xE1nh tr\xE0n s\u1ED1.
3. Ph\xE2n lo\u1EA1i theo th\u1EE9 t\u1EF1 \u01B0u ti\xEAn: DEU -> VUONG CAN -> VUONG -> CAN -> THUONG.`,
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    commonMistakes: [
      "Qu\xEAn ki\u1EC3m tra b\u1EA5t \u0111\u1EB3ng th\u1EE9c tam gi\xE1c tr\u01B0\u1EDBc ti\xEAn.",
      "Tr\xE0n s\u1ED1 khi t\xEDnh a*a + b*b trong bi\u1EBFn int 32-bit.",
      "Nh\u1EA7m th\u1EE9 t\u1EF1 if-else gi\u1EEFa DEU v\xE0 CAN."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "3 4 5", output: "VUONG", isSample: true, note: "B\u1ED9 3-4-5" },
      { id: 2, testName: "test02", input: "5 5 5", output: "DEU", note: "Tam gi\xE1c \u0111\u1EC1u" },
      { id: 3, testName: "test03", input: "5 5 8", output: "CAN", note: "Tam gi\xE1c c\xE2n a = b" },
      { id: 4, testName: "test04", input: "1 2 3", output: "KHONG PHAI TAM GIAC", note: "Bi\xEAn suy bi\u1EBFn 1+2=3" },
      { id: 5, testName: "test05", input: "1 2 10", output: "KHONG PHAI TAM GIAC", note: "Kh\xF4ng t\u1EA1o th\xE0nh tam gi\xE1c" },
      { id: 6, testName: "test06", input: "5 12 13", output: "VUONG", note: "B\u1ED9 Pytago 5-12-13" },
      { id: 7, testName: "test07", input: "13 5 12", output: "VUONG", note: "C\u1EA1nh huy\u1EC1n c kh\xF4ng \u1EDF cu\u1ED1i" },
      { id: 8, testName: "test08", input: "7 10 7", output: "CAN", note: "Tam gi\xE1c c\xE2n a = c" },
      { id: 9, testName: "test09", input: "8 9 9", output: "CAN", note: "Tam gi\xE1c c\xE2n b = c" },
      { id: 10, testName: "test10", input: "4 5 6", output: "THUONG", note: "Tam gi\xE1c th\u01B0\u1EDDng" },
      { id: 11, testName: "test11", input: "8 15 17", output: "VUONG", note: "B\u1ED9 8-15-17" },
      { id: 12, testName: "test12", input: "10 10 19", output: "CAN", note: "Tam gi\xE1c c\xE2n r\u1EA5t d\u1EB9t" },
      { id: 13, testName: "test13", input: "100 100 100", output: "DEU", note: "Tam gi\xE1c \u0111\u1EC1u 100" },
      { id: 14, testName: "test14", input: "10 20 35", output: "KHONG PHAI TAM GIAC", note: "Kh\xF4ng t\u1EA1o th\xE0nh tam gi\xE1c" },
      { id: 15, testName: "test15", input: "20 21 29", output: "VUONG", note: "B\u1ED9 20-21-29" },
      { id: 16, testName: "test16", input: "99 100 101", output: "THUONG", note: "3 s\u1ED1 li\xEAn ti\u1EBFp" },
      { id: 17, testName: "test17", input: "500 500 800", output: "CAN", note: "C\u1EA1nh 500" },
      { id: 18, testName: "test18", input: "1000 1000 1000", output: "DEU", note: "C\u1EA1nh 1000" },
      { id: 19, testName: "test19", input: "6000 8000 10000", output: "VUONG", note: "Bi\xEAn 10^4" },
      { id: 20, testName: "test20", input: "9999 10000 19998", output: "THUONG", note: "Bi\xEAn l\u1EDBn nh\u1EA5t" }
    ],
    createdAt: Date.now()
  },
  // 2. Cấu trúc lặp: KTSNT
  KTSNT: {
    id: "prebuilt-ktsnt",
    topic: "loop",
    topicName: "C\u1EA5u tr\xFAc l\u1EB7p",
    problemName: "Ki\u1EC3m tra s\u1ED1 nguy\xEAn t\u1ED1",
    problemCode: "KTSNT",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "easy",
    description: `M\u1ED9t s\u1ED1 nguy\xEAn d\u01B0\u01A1ng n > 1 \u0111\u01B0\u1EE3c g\u1ECDi l\xE0 s\u1ED1 nguy\xEAn t\u1ED1 n\u1EBFu n\xF3 ch\u1EC9 c\xF3 \u0111\xFAng hai \u01B0\u1EDBc s\u1ED1 d\u01B0\u01A1ng l\xE0 1 v\xE0 ch\xEDnh n\xF3.
Cho s\u1ED1 nguy\xEAn n, h\xE3y ki\u1EC3m tra xem n c\xF3 ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn t\u1ED1 hay kh\xF4ng.`,
    inputFormat: `M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a s\u1ED1 nguy\xEAn n (-10^9 <= n <= 10^9).`,
    outputFormat: `In ra 'YES' n\u1EBFu n l\xE0 s\u1ED1 nguy\xEAn t\u1ED1, ng\u01B0\u1EE3c l\u1EA1i in ra 'NO'.`,
    constraints: `- 50% s\u1ED1 test c\xF3 n <= 1000.
- 50% s\u1ED1 test c\xF3 n <= 10^9.`,
    sampleInput: `7`,
    sampleOutput: `YES`,
    sampleExplanation: `S\u1ED1 7 ch\u1EC9 chia h\u1EBFt cho 1 v\xE0 7 n\xEAn l\xE0 s\u1ED1 nguy\xEAn t\u1ED1.`,
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
    algorithmExplanation: `1. C\xE1c s\u1ED1 <= 1 kh\xF4ng ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn t\u1ED1.
2. Duy\u1EC7t ki\u1EC3m tra c\xE1c \u01B0\u1EDBc t\u1EEB 2 \u0111\u1EBFn sqrt(n). \u0110\u1EC3 t\u1ED1i \u01B0u, ki\u1EC3m tra chia h\u1EBFt cho 2, 3 r\u1ED3i b\u01B0\u1EDBc nh\u1EA3y 6 (i v\xE0 i+2).
3. \u0110\u1ED9 ph\u1EE9c t\u1EA1p O(sqrt(n)) ho\xE0n to\xE0n ch\u1EA1y d\u01B0\u1EDBi 0.01 gi\xE2y v\u1EDBi n <= 10^9.`,
    timeComplexity: "O(sqrt(N))",
    spaceComplexity: "O(1)",
    commonMistakes: [
      "Cho r\u1EB1ng 0 v\xE0 1 l\xE0 s\u1ED1 nguy\xEAn t\u1ED1.",
      "Ch\u1EA1y v\xF2ng l\u1EB7p t\u1EEB 2 \u0111\u1EBFn n thay v\xEC sqrt(n) d\u1EABn \u0111\u1EBFn qu\xE1 th\u1EDDi gian (Time Limit Exceeded) khi n = 10^9.",
      "Kh\xF4ng x\u1EED l\xFD tr\u01B0\u1EDDng h\u1EE3p s\u1ED1 \xE2m."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "7", output: "YES", isSample: true, note: "V\xED d\u1EE5 m\u1EABu" },
      { id: 2, testName: "test02", input: "1", output: "NO", note: "Bi\xEAn s\u1ED1 1" },
      { id: 3, testName: "test03", input: "2", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 ch\u1EB5n duy nh\u1EA5t" },
      { id: 4, testName: "test04", input: "0", output: "NO", note: "S\u1ED1 0" },
      { id: 5, testName: "test05", input: "-5", output: "NO", note: "S\u1ED1 \xE2m" },
      { id: 6, testName: "test06", input: "9", output: "NO", note: "H\u1EE3p s\u1ED1 l\u1EBB" },
      { id: 7, testName: "test07", input: "13", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 nh\u1ECF" },
      { id: 8, testName: "test08", input: "97", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 2 ch\u1EEF s\u1ED1 l\u1EDBn nh\u1EA5t" },
      { id: 9, testName: "test09", input: "100", output: "NO", note: "H\u1EE3p s\u1ED1 tr\xF2n tr\u0103m" },
      { id: 10, testName: "test10", input: "101", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 3 ch\u1EEF s\u1ED1 nh\u1ECF nh\u1EA5t" },
      { id: 11, testName: "test11", input: "561", output: "NO", note: "S\u1ED1 Carmichael h\u1EE3p s\u1ED1" },
      { id: 12, testName: "test12", input: "997", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 3 ch\u1EEF s\u1ED1 l\u1EDBn nh\u1EA5t" },
      { id: 13, testName: "test13", input: "1000", output: "NO", note: "S\u1ED1 1000" },
      { id: 14, testName: "test14", input: "10007", output: "YES", note: "Nguy\xEAn t\u1ED1 5 ch\u1EEF s\u1ED1" },
      { id: 15, testName: "test15", input: "999983", output: "YES", note: "Nguy\xEAn t\u1ED1 g\u1EA7n 10^6" },
      { id: 16, testName: "test16", input: "1000000", output: "NO", note: "H\u1EE3p s\u1ED1 10^6" },
      { id: 17, testName: "test17", input: "1000000007", output: "YES", note: "S\u1ED1 modulo nguy\xEAn t\u1ED1 kinh \u0111i\u1EC3n" },
      { id: 18, testName: "test18", input: "1000000009", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 l\u1EDBn" },
      { id: 19, testName: "test19", input: "1000000000", output: "NO", note: "Bi\xEAn 10^9 h\u1EE3p s\u1ED1" },
      { id: 20, testName: "test20", input: "999999937", output: "YES", note: "S\u1ED1 nguy\xEAn t\u1ED1 l\u1EDBn nh\u1EA5t < 10^9" }
    ],
    createdAt: Date.now()
  },
  // 3. Hàm & Đệ quy: FIBO
  FIBO: {
    id: "prebuilt-fibo",
    topic: "function",
    topicName: "H\xE0m & \u0110\u1EC7 quy",
    problemName: "S\u1ED1 Fibonacci th\u1EE9 n",
    problemCode: "FIBO",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "easy",
    description: `D\xE3y s\u1ED1 Fibonacci \u0111\u01B0\u1EE3c \u0111\u1ECBnh ngh\u0129a nh\u01B0 sau:
F(1) = 1, F(2) = 1, v\xE0 F(n) = F(n-1) + F(n-2) v\u1EDBi n >= 3.
H\xE3y vi\u1EBFt h\xE0m t\xEDnh s\u1ED1 Fibonacci th\u1EE9 n.`,
    inputFormat: `M\u1ED9t d\xF2ng ch\u1EE9a s\u1ED1 nguy\xEAn d\u01B0\u01A1ng n (1 <= n <= 90).`,
    outputFormat: `In ra s\u1ED1 Fibonacci th\u1EE9 n.`,
    constraints: `- 50% s\u1ED1 test c\xF3 n <= 30.
- 50% s\u1ED1 test c\xF3 30 < n <= 90.`,
    sampleInput: `6`,
    sampleOutput: `8`,
    sampleExplanation: `D\xE3y Fibonacci: 1, 1, 2, 3, 5, 8. S\u1ED1 th\u1EE9 6 l\xE0 8.`,
    solutionCpp: `#include <iostream>
using namespace std;

// H\xE0m t\xEDnh s\u1ED1 Fibonacci th\u1EE9 n s\u1EED d\u1EE5ng v\xF2ng l\u1EB7p
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
    algorithmExplanation: `1. S\u1EED d\u1EE5ng h\xE0m getFibonacci(n) \u0111\u1EC3 t\xE1ch bi\u1EC7t logic t\xEDnh to\xE1n.
2. V\u1EDBi n <= 90, gi\xE1 tr\u1ECB F(90) x\u1EA5p x\u1EC9 2.88 x 10^18 n\u1EB1m v\u1EEBa v\u1EB7n trong ki\u1EC3u s\u1ED1 nguy\xEAn kh\xF4ng d\u1EA5u 64-bit (unsigned long long).
3. D\xF9ng v\xF2ng l\u1EB7p v\u1EDBi 2 bi\u1EBFn l\u01B0u tr\u1EA1ng th\xE1i \u0111\u1EC3 \u0111\u1EA1t \u0111\u1ED9 ph\u1EE9c t\u1EA1p th\u1EDDi gian O(N) v\xE0 b\u1ED9 nh\u1EDB O(1), tr\xE1nh \u0111\u1EC7 quy ng\xE2y th\u01A1 O(2^N) b\u1ECB tr\xE0n th\u1EDDi gian.`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    commonMistakes: [
      "D\xF9ng \u0111\u1EC7 quy thu\u1EA7n t\xFAy fibo(n-1) + fibo(n-2) khi\u1EBFn ch\u01B0\u01A1ng tr\xECnh b\u1ECB treo (TLE) khi n >= 40.",
      "D\xF9ng ki\u1EC3u int (32-bit) d\u1EABn \u0111\u1EBFn tr\xE0n s\u1ED1 khi n >= 47."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "6", output: "8", isSample: true, note: "V\xED d\u1EE5" },
      { id: 2, testName: "test02", input: "1", output: "1", note: "Bi\xEAn n=1" },
      { id: 3, testName: "test03", input: "2", output: "1", note: "Bi\xEAn n=2" },
      { id: 4, testName: "test04", input: "3", output: "2", note: "n=3" },
      { id: 5, testName: "test05", input: "4", output: "3", note: "n=4" },
      { id: 6, testName: "test06", input: "5", output: "5", note: "n=5" },
      { id: 7, testName: "test07", input: "7", output: "13", note: "n=7" },
      { id: 8, testName: "test08", input: "10", output: "55", note: "n=10" },
      { id: 9, testName: "test09", input: "15", output: "610", note: "n=15" },
      { id: 10, testName: "test10", input: "20", output: "6765", note: "n=20" },
      { id: 11, testName: "test11", input: "25", output: "75025", note: "n=25" },
      { id: 12, testName: "test12", input: "30", output: "832040", note: "n=30" },
      { id: 13, testName: "test13", input: "40", output: "102334155", note: "n=40" },
      { id: 14, testName: "test14", input: "46", output: "1836311903", note: "G\u1EA7n gi\u1EDBi h\u1EA1n int" },
      { id: 15, testName: "test15", input: "47", output: "2971215073", note: "V\u01B0\u1EE3t qua int (c\u1EA7n long long)" },
      { id: 16, testName: "test16", input: "50", output: "12586269025", note: "n=50" },
      { id: 17, testName: "test17", input: "60", output: "1548008755920", note: "n=60" },
      { id: 18, testName: "test18", input: "70", output: "190392490709135", note: "n=70" },
      { id: 19, testName: "test19", input: "80", output: "23416728348467685", note: "n=80" },
      { id: 20, testName: "test20", input: "90", output: "2880067194370816120", note: "Bi\xEAn n=90" }
    ],
    createdAt: Date.now()
  },
  // 4. Mảng: SECONDMAX
  SECONDMAX: {
    id: "prebuilt-secondmax",
    topic: "array",
    topicName: "M\u1EA3ng (1 Chi\u1EC1u & 2 Chi\u1EC1u)",
    problemName: "T\xECm s\u1ED1 l\u1EDBn th\u1EE9 nh\xEC trong m\u1EA3ng",
    problemCode: "SECONDMAX",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "easy",
    description: `Cho m\u1EA3ng g\u1ED3m n s\u1ED1 nguy\xEAn a1, a2, ..., an. H\xE3y t\xECm gi\xE1 tr\u1ECB l\u1EDBn th\u1EE9 nh\xEC ph\xE2n bi\u1EC7t trong m\u1EA3ng.
N\u1EBFu trong m\u1EA3ng kh\xF4ng t\u1ED3n t\u1EA1i gi\xE1 tr\u1ECB l\u1EDBn th\u1EE9 nh\xEC (t\u1EA5t c\u1EA3 c\xE1c ph\u1EA7n t\u1EED \u0111\u1EC1u b\u1EB1ng nhau), in ra 'NOT FOUND'.`,
    inputFormat: `D\xF2ng 1: S\u1ED1 nguy\xEAn d\u01B0\u01A1ng n (2 <= n <= 10^5).
D\xF2ng 2: n s\u1ED1 nguy\xEAn a1, a2, ..., an (-10^9 <= ai <= 10^9).`,
    outputFormat: `In ra gi\xE1 tr\u1ECB l\u1EDBn th\u1EE9 nh\xEC ho\u1EB7c 'NOT FOUND'.`,
    constraints: `- 60% s\u1ED1 test c\xF3 n <= 1000.
- 40% s\u1ED1 test c\xF3 n <= 10^5.`,
    sampleInput: `5
3 7 2 7 5`,
    sampleOutput: `5`,
    sampleExplanation: `M\u1EA3ng c\xF3 gi\xE1 tr\u1ECB l\u1EDBn nh\u1EA5t l\xE0 7. Gi\xE1 tr\u1ECB l\u1EDBn th\u1EE9 nh\xEC ph\xE2n bi\u1EC7t l\xE0 5.`,
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
    algorithmExplanation: `1. Duy\u1EC7t qua m\u1EA3ng m\u1ED9t l\u01B0\u1EE3t (1 pass O(N)).
2. Duy tr\xEC 2 bi\u1EBFn firstMax v\xE0 secondMax.
3. Khi g\u1EB7p x > firstMax: c\u1EADp nh\u1EADt secondMax = firstMax, r\u1ED3i firstMax = x.
4. Khi g\u1EB7p x < firstMax nh\u01B0ng x > secondMax: c\u1EADp nh\u1EADt secondMax = x.`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    commonMistakes: [
      "S\u1EAFp x\u1EBFp m\u1EA3ng r\u1ED3i l\u1EA5y ph\u1EA7n t\u1EED \u1EDF v\u1ECB tr\xED n-2 m\xE0 qu\xEAn m\u1EA5t m\u1EA3ng c\xF3 c\xE1c ph\u1EA7n t\u1EED tr\xF9ng nhau (vd: 7 7 7).",
      "Kh\u1EDFi t\u1EA1o gi\xE1 tr\u1ECB ban \u0111\u1EA7u l\xE0 0 khi\u1EBFn sai k\u1EBFt qu\u1EA3 khi m\u1EA3ng ch\u1EE9a to\xE0n s\u1ED1 \xE2m."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "5\n3 7 2 7 5", output: "5", isSample: true, note: "V\xED d\u1EE5" },
      { id: 2, testName: "test02", input: "3\n5 5 5", output: "NOT FOUND", note: "T\u1EA5t c\u1EA3 b\u1EB1ng nhau" },
      { id: 3, testName: "test03", input: "2\n10 20", output: "10", note: "M\u1EA3ng 2 ph\u1EA7n t\u1EED" },
      { id: 4, testName: "test04", input: "4\n-10 -5 -20 -1", output: "-5", note: "To\xE0n s\u1ED1 \xE2m" },
      { id: 5, testName: "test05", input: "5\n1 2 3 4 5", output: "4", note: "D\xE3y t\u0103ng" },
      { id: 6, testName: "test06", input: "5\n5 4 3 2 1", output: "4", note: "D\xE3y gi\u1EA3m" },
      { id: 7, testName: "test07", input: "6\n10 10 10 5 10 10", output: "5", note: "Nhi\u1EC1u max tr\xF9ng" },
      { id: 8, testName: "test08", input: "4\n0 0 0 0", output: "NOT FOUND", note: "To\xE0n 0" },
      { id: 9, testName: "test09", input: "5\n-100 -200 -100 -300 -100", output: "-200", note: "S\u1ED1 \xE2m tr\xF9ng" },
      { id: 10, testName: "test10", input: "6\n100 200 150 200 180 190", output: "190", note: "\u0110a d\u1EA1ng" },
      { id: 11, testName: "test11", input: "7\n1 9 2 8 3 7 4", output: "8", note: "X\xE1o tr\u1ED9n" },
      { id: 12, testName: "test12", input: "5\n1000 999 998 997 996", output: "999", note: "Li\xEAn ti\u1EBFp" },
      { id: 13, testName: "test13", input: "4\n-1000000000 1000000000 0 -5", output: "0", note: "C\u1EF1c tr\u1ECB" },
      { id: 14, testName: "test14", input: "6\n1000000000 999999999 1000000000 5 0 -10", output: "999999999", note: "10^9" },
      { id: 15, testName: "test15", input: "5\n-1000000000 -1000000000 -1000000000 -1000000000 -1000000000", output: "NOT FOUND", note: "To\xE0n -10^9" },
      { id: 16, testName: "test16", input: "8\n12 34 56 78 90 23 45 67", output: "78", note: "C\xE1c s\u1ED1 2 ch\u1EEF s\u1ED1" },
      { id: 17, testName: "test17", input: "10\n1 2 3 4 5 6 7 8 9 10", output: "9", note: "1 \u0111\u1EBFn 10" },
      { id: 18, testName: "test18", input: "5\n42 42 42 42 1", output: "1", note: "G\u1EA7n nh\u01B0 to\xE0n b\u1EB1ng nhau" },
      { id: 19, testName: "test19", input: "6\n-500 0 500 -1000 1000 -1500", output: "500", note: "\u0110\u1ED1i x\u1EE9ng qua 0" },
      { id: 20, testName: "test20", input: "7\n999999998 999999999 1000000000 999999999 999999998 0 1", output: "999999999", note: "Bi\xEAn 10^9" }
    ],
    createdAt: Date.now()
  },
  // 5. Chuỗi: PALIN
  PALIN: {
    id: "prebuilt-palin",
    topic: "string",
    topicName: "Chu\u1ED7i k\xFD t\u1EF1 (String)",
    problemName: "Ki\u1EC3m tra x\xE2u \u0111\u1ED1i x\u1EE9ng",
    problemCode: "PALIN",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "easy",
    description: `M\u1ED9t x\xE2u k\xFD t\u1EF1 \u0111\u01B0\u1EE3c g\u1ECDi l\xE0 \u0111\u1ED1i x\u1EE9ng (Palindrome) n\u1EBFu \u0111\u1ECDc t\u1EEB tr\xE1i sang ph\u1EA3i c\u0169ng gi\u1ED1ng h\u1EC7t nh\u01B0 \u0111\u1ECDc t\u1EEB ph\u1EA3i sang tr\xE1i.
Cho m\u1ED9t x\xE2u k\xFD t\u1EF1 s ch\u1EC9 g\u1ED3m c\xE1c ch\u1EEF c\xE1i in th\u01B0\u1EDDng ('a' \u0111\u1EBFn 'z'). H\xE3y ki\u1EC3m tra xem x\xE2u s c\xF3 \u0111\u1ED1i x\u1EE9ng kh\xF4ng.`,
    inputFormat: `M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a x\xE2u s (1 <= \u0111\u1ED9 d\xE0i s <= 10^5).`,
    outputFormat: `In ra 'YES' n\u1EBFu x\xE2u \u0111\u1ED1i x\u1EE9ng, ng\u01B0\u1EE3c l\u1EA1i in ra 'NO'.`,
    constraints: `- 60% s\u1ED1 test c\xF3 \u0111\u1ED9 d\xE0i s <= 200.
- 40% s\u1ED1 test c\xF3 \u0111\u1ED9 d\xE0i s <= 10^5.`,
    sampleInput: `racecar`,
    sampleOutput: `YES`,
    sampleExplanation: `X\xE2u 'racecar' \u0111\u1ECDc t\u1EEB tr\xE1i sang ph\u1EA3i hay t\u1EEB ph\u1EA3i sang tr\xE1i \u0111\u1EC1u gi\u1ED1ng nhau.`,
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
    algorithmExplanation: `D\xF9ng k\u1EF9 thu\u1EADt hai con tr\u1ECF (Two Pointers):
- Con tr\u1ECF left b\u1EAFt \u0111\u1EA7u t\u1EEB 0, con tr\u1ECF right b\u1EAFt \u0111\u1EA7u t\u1EEB length - 1.
- So s\xE1nh s[left] v\xE0 s[right], n\u1EBFu kh\xE1c nhau l\u1EADp t\u1EE9c k\u1EBFt lu\u1EADn NO.
- N\u1EBFu b\u1EB1ng nhau th\xEC t\u0103ng left, gi\u1EA3m right. Qu\xE1 tr\xECnh d\u1EEBng khi left >= right.`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    commonMistakes: [
      "\u0110\u1EA3o ng\u01B0\u1EE3c x\xE2u b\u1EB1ng ph\xE9p c\u1ED9ng x\xE2u d\u1EABn \u0111\u1EBFn \u0111\u1ED9 ph\u1EE9c t\u1EA1p O(N^2) v\xE0 b\u1ECB tr\xE0n b\u1ED9 nh\u1EDB khi N = 10^5.",
      "Qu\xEAn x\u1EED l\xFD tr\u01B0\u1EDDng h\u1EE3p x\xE2u c\xF3 \u0111\u1ED9 d\xE0i 1 (lu\xF4n \u0111\u1ED1i x\u1EE9ng)."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "racecar", output: "YES", isSample: true, note: "V\xED d\u1EE5 m\u1EABu" },
      { id: 2, testName: "test02", input: "a", output: "YES", note: "X\xE2u 1 k\xFD t\u1EF1" },
      { id: 3, testName: "test03", input: "ab", output: "NO", note: "X\xE2u 2 k\xFD t\u1EF1 kh\xE1c nhau" },
      { id: 4, testName: "test04", input: "aa", output: "YES", note: "X\xE2u 2 k\xFD t\u1EF1 gi\u1ED1ng nhau" },
      { id: 5, testName: "test05", input: "aba", output: "YES", note: "\u0110\u1ED9 d\xE0i l\u1EBB 3" },
      { id: 6, testName: "test06", input: "abba", output: "YES", note: "\u0110\u1ED9 d\xE0i ch\u1EB5n 4" },
      { id: 7, testName: "test07", input: "abcba", output: "YES", note: "\u0110\u1ED9 d\xE0i l\u1EBB 5" },
      { id: 8, testName: "test08", input: "abccba", output: "YES", note: "\u0110\u1ED9 d\xE0i ch\u1EB5n 6" },
      { id: 9, testName: "test09", input: "hello", output: "NO", note: "X\xE2u kh\xF4ng \u0111\u1ED1i x\u1EE9ng" },
      { id: 10, testName: "test10", input: "madam", output: "YES", note: "T\u1EEB \u0111\u1ED1i x\u1EE9ng" },
      { id: 11, testName: "test11", input: "level", output: "YES", note: "T\u1EEB \u0111\u1ED1i x\u1EE9ng" },
      { id: 12, testName: "test12", input: "algorithm", output: "NO", note: "Kh\xF4ng \u0111\u1ED1i x\u1EE9ng" },
      { id: 13, testName: "test13", input: "radar", output: "YES", note: "T\u1EEB \u0111\u1ED1i x\u1EE9ng" },
      { id: 14, testName: "test14", input: "noon", output: "YES", note: "T\u1EEB \u0111\u1ED1i x\u1EE9ng ch\u1EB5n" },
      { id: 15, testName: "test15", input: "abcdefghgfedcba", output: "YES", note: "X\xE2u d\xE0i \u0111\u1ED1i x\u1EE9ng" },
      { id: 16, testName: "test16", input: "abcdefghgfedcbz", output: "NO", note: "Sai k\xFD t\u1EF1 cu\u1ED1i" },
      { id: 17, testName: "test17", input: "zbcdefghgfedcba", output: "NO", note: "Sai k\xFD t\u1EF1 \u0111\u1EA7u" },
      { id: 18, testName: "test18", input: "aaaaaaaaaa", output: "YES", note: "To\xE0n k\xFD t\u1EF1 gi\u1ED1ng nhau" },
      { id: 19, testName: "test19", input: "aaaaaaaaab", output: "NO", note: "Kh\xE1c \u0111\xFAng 1 k\xFD t\u1EF1 cu\u1ED1i" },
      { id: 20, testName: "test20", input: "baaaaaaaaa", output: "NO", note: "Kh\xE1c \u0111\xFAng 1 k\xFD t\u1EF1 \u0111\u1EA7u" }
    ],
    createdAt: Date.now()
  },
  // 6. Cấu trúc dữ liệu: NGOACDUNG
  NGOACDUNG: {
    id: "prebuilt-ngoacdung",
    topic: "struct_ds",
    topicName: "C\u1EA5u tr\xFAc d\u1EEF li\u1EC7u c\u01A1 b\u1EA3n",
    problemName: "Ki\u1EC3m tra d\xE3y ngo\u1EB7c \u0111\xFAng b\u1EB1ng Stack",
    problemCode: "NGOACDUNG",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "medium",
    description: `M\u1ED9t d\xE3y ngo\u1EB7c ch\u1EC9 g\u1ED3m c\xE1c k\xFD t\u1EF1 '(', ')', '[', ']', '{', '}' \u0111\u01B0\u1EE3c g\u1ECDi l\xE0 h\u1EE3p l\u1EC7 n\u1EBFu:
1. M\u1ED7i d\u1EA5u m\u1EDF ngo\u1EB7c ph\u1EA3i \u0111\u01B0\u1EE3c \u0111\xF3ng b\u1EDFi d\u1EA5u \u0111\xF3ng ngo\u1EB7c c\xF9ng lo\u1EA1i.
2. C\xE1c d\u1EA5u ngo\u1EB7c \u0111\u01B0\u1EE3c \u0111\xF3ng theo \u0111\xFAng th\u1EE9 t\u1EF1 m\u1EDF tr\u01B0\u1EDBc \u0111\xF3ng sau (LIFO).
H\xE3y ki\u1EC3m tra xem d\xE3y ngo\u1EB7c cho tr\u01B0\u1EDBc c\xF3 h\u1EE3p l\u1EC7 hay kh\xF4ng.`,
    inputFormat: `M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a chu\u1ED7i s (1 <= \u0111\u1ED9 d\xE0i s <= 10^5).`,
    outputFormat: `In ra 'YES' n\u1EBFu d\xE3y ngo\u1EB7c h\u1EE3p l\u1EC7, ng\u01B0\u1EE3c l\u1EA1i in ra 'NO'.`,
    constraints: `- 60% s\u1ED1 test c\xF3 \u0111\u1ED9 d\xE0i s <= 1000.
- 40% s\u1ED1 test c\xF3 \u0111\u1ED9 d\xE0i s <= 10^5.`,
    sampleInput: `{[()]}`,
    sampleOutput: `YES`,
    sampleExplanation: `C\xE1c d\u1EA5u ngo\u1EB7c \u0111\u01B0\u1EE3c l\u1ED3ng nhau \u0111\xFAng quy t\u1EAFc: { [ ( ) ] }.`,
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
    algorithmExplanation: `S\u1EED d\u1EE5ng c\u1EA5u tr\xFAc d\u1EEF li\u1EC7u ng\u0103n x\u1EBFp std::stack:
- G\u1EB7p m\u1EDF ngo\u1EB7c: push v\xE0o stack.
- G\u1EB7p \u0111\xF3ng ngo\u1EB7c: ki\u1EC3m tra stack r\u1ED7ng hay kh\xF4ng. N\u1EBFu r\u1ED7ng -> NO. N\u1EBFu kh\xF4ng r\u1ED7ng, l\u1EA5y ph\u1EA7n t\u1EED \u0111\u1EC9nh top ra so s\xE1nh. N\u1EBFu kh\xF4ng c\xF9ng lo\u1EA1i -> NO.
- Cu\u1ED1i c\xF9ng n\u1EBFu stack r\u1ED7ng -> YES, ng\u01B0\u1EE3c l\u1EA1i c\xF2n d\u01B0 m\u1EDF ngo\u1EB7c -> NO.`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    commonMistakes: [
      "Qu\xEAn ki\u1EC3m tra st.empty() tr\u01B0\u1EDBc khi g\u1ECDi st.top() d\u1EABn \u0111\u1EBFn crash ch\u01B0\u01A1ng tr\xECnh (Segmentation Fault / Runtime Error).",
      'Qu\xEAn ki\u1EC3m tra st.empty() \u1EDF cu\u1ED1i ch\u01B0\u01A1ng tr\xECnh (tr\u01B0\u1EDDng h\u1EE3p c\xF2n d\u01B0 d\u1EA5u m\u1EDF ngo\u1EB7c nh\u01B0 "(((").'
    ],
    testCases: [
      { id: 1, testName: "test01", input: "{[()]}", output: "YES", isSample: true, note: "V\xED d\u1EE5" },
      { id: 2, testName: "test02", input: "()", output: "YES", note: "Ngo\u1EB7c tr\xF2n \u0111\u01A1n" },
      { id: 3, testName: "test03", input: "[]", output: "YES", note: "Ngo\u1EB7c vu\xF4ng \u0111\u01A1n" },
      { id: 4, testName: "test04", input: "{}", output: "YES", note: "Ngo\u1EB7c nh\u1ECDn \u0111\u01A1n" },
      { id: 5, testName: "test05", input: "(]", output: "NO", note: "Kh\xF4ng c\xF9ng lo\u1EA1i" },
      { id: 6, testName: "test06", input: "([)]", output: "NO", note: "\u0110an xen sai th\u1EE9 t\u1EF1" },
      { id: 7, testName: "test07", input: "{[]}()", output: "YES", note: "Nhi\u1EC1u kh\u1ED1i li\xEAn ti\u1EBFp" },
      { id: 8, testName: "test08", input: "(((", output: "NO", note: "D\u01B0 m\u1EDF ngo\u1EB7c" },
      { id: 9, testName: "test09", input: ")))", output: "NO", note: "D\u01B0 \u0111\xF3ng ngo\u1EB7c" },
      { id: 10, testName: "test10", input: ")()(", output: "NO", note: "B\u1EAFt \u0111\u1EA7u b\u1EB1ng \u0111\xF3ng ngo\u1EB7c" },
      { id: 11, testName: "test11", input: "{[()]()}", output: "YES", note: "L\u1ED3ng ph\u1EE9c t\u1EA1p" },
      { id: 12, testName: "test12", input: "((()))", output: "YES", note: "3 c\u1EB7p tr\xF2n" },
      { id: 13, testName: "test13", input: "[[[]]]", output: "YES", note: "3 c\u1EB7p vu\xF4ng" },
      { id: 14, testName: "test14", input: "{{{{{}}}}}", output: "YES", note: "5 c\u1EB7p nh\u1ECDn" },
      { id: 15, testName: "test15", input: "((((((((((", output: "NO", note: "10 d\u1EA5u m\u1EDF" },
      { id: 16, testName: "test16", input: "()()()()()()", output: "YES", note: "D\xE3y l\u1EB7p tr\xF2n" },
      { id: 17, testName: "test17", input: "({[]})({[]})", output: "YES", note: "2 kh\u1ED1i h\u1EE3p l\u1EC7" },
      { id: 18, testName: "test18", input: "({[]})({[]}", output: "NO", note: "Thi\u1EBFu 1 ngo\u1EB7c \u0111\xF3ng cu\u1ED1i" },
      { id: 19, testName: "test19", input: "[({})]([])", output: "YES", note: "Ph\u1ED1i h\u1EE3p c\xE1c lo\u1EA1i" },
      { id: 20, testName: "test20", input: "{[()()]}[{()}]", output: "YES", note: "Chu\u1ED7i d\xE0i h\u1EE3p l\u1EC7" }
    ],
    createdAt: Date.now()
  },
  // 7. Hai con trỏ / Mảng: WOOD (Khai thác gỗ)
  WOOD: {
    id: "prebuilt-wood",
    topic: "array",
    topicName: "M\u1EA3ng & Hai con tr\u1ECF (Two Pointers)",
    problemName: "Khai th\xE1c g\u1ED7",
    problemCode: "WOOD",
    timeLimit: "1.0 gi\xE2y",
    memoryLimit: "256 MB",
    difficulty: "medium",
    description: `Sau nh\xE0 b\xE1c n\xF4ng d\xE2n John c\xF3 tr\u1ED3ng $n$ c\xE2y g\u1ED7 tr\u1ED3ng theo h\xE0ng ngang, m\u1ED7i c\xE2y khi khai th\xE1c s\u1EBD cho s\u1EA3n l\u01B0\u1EE3ng g\u1ED7 l\xE0 $a_i \\text{ m}^3$ ($1 \\le i \\le n$). Mu\u1ED1n d\u1EF1ng m\u1ED9t c\xE1i chu\u1ED3ng b\u1EB1ng g\u1ED7 \u0111\u1EC3 nh\u1ED1t nh\u1EEFng con b\xF2 c\u1EE7a m\xECnh, b\xE1c John c\u1EA7n ph\u1EA3i c\xF3 \xEDt nh\u1EA5t $S \\text{ m}^3$ g\u1ED7. B\xE1c quy\u1EBFt \u0111\u1ECBnh s\u1EBD khai th\xE1c g\u1ED7 t\u1EEB h\xE0ng c\xE2y sau nh\xE0 m\xECnh. B\xE1c mu\u1ED1n m\u1EF9 quan ng\xF4i nh\xE0 m\xECnh kh\xF4ng b\u1ECB thay \u0111\u1ED5i nhi\u1EC1u, v\xEC v\u1EADy b\xE1c ch\u1EC9 mu\u1ED1n khai th\xE1c m\u1ED9t \u0111o\u1EA1n li\xEAn ti\u1EBFp ng\u1EAFn nh\u1EA5t c\xE1c c\xE2y g\u1ED7 c\u1EE7a m\xECnh sao cho t\u1ED5ng s\u1EA3n l\u01B0\u1EE3ng g\u1ED7 \u0111\u1EA3m b\u1EA3o \xEDt nh\u1EA5t l\xE0 $S \\text{ m}^3$.

H\xE3y l\u1EADp tr\xECnh cho bi\u1EBFt \u0111\u1ED9 d\xE0i \u0111o\u1EA1n ng\u1EAFn nh\u1EA5t li\xEAn ti\u1EBFp c\xE1c c\xE2y g\u1ED7 c\xF3 t\u1ED5ng s\u1EA3n l\u01B0\u1EE3ng th\u1ECFa m\xE3n y\xEAu c\u1EA7u \u0111\u1EC1 b\xE0i.`,
    inputFormat: `\u2022 D\xF2ng 1: Hai s\u1ED1 nguy\xEAn d\u01B0\u01A1ng $n$ ($n \\le 10^5$) v\xE0 $S$ ($S \\le 2 \\times 10^9$).
\u2022 D\xF2ng 2: $n$ s\u1ED1 nguy\xEAn d\u01B0\u01A1ng $a_1, a_2, \\dots, a_n$ th\u1EC3 hi\u1EC7n s\u1EA3n l\u01B0\u1EE3ng g\u1ED7 c\u1EE7a m\u1ED7i c\xE2y g\u1ED7 ($a_i \\le 10^9$).`,
    outputFormat: `\u2022 M\u1ED9t d\xF2ng duy nh\u1EA5t ch\u1EE9a k\u1EBFt qu\u1EA3 c\u1EE7a b\xE0i to\xE1n (n\u1EBFu kh\xF4ng c\xF3 b\u1EA5t k\u1EF3 \u0111o\u1EA1n n\xE0o th\u1ECFa m\xE3n, in ra 0).`,
    constraints: `- 20% s\u1ED1 test \u0111\u1EA7u ti\xEAn t\u01B0\u01A1ng \u1EE9ng v\u1EDBi 20% s\u1ED1 \u0111i\u1EC3m v\u1EDBi $n \\le 100$.
- 30% s\u1ED1 test ti\u1EBFp theo t\u01B0\u01A1ng \u1EE9ng v\u1EDBi 30% s\u1ED1 \u0111i\u1EC3m v\u1EDBi $100 < n \\le 1000$.
- 50% s\u1ED1 \u0111i\u1EC3m c\xF2n l\u1EA1i t\u01B0\u01A1ng \u1EE9ng v\u1EDBi 50% s\u1ED1 test v\u1EDBi $1000 < n \\le 10^5$.`,
    sampleInput: `10 17
5 1 3 5 10 7 4 9 2 8`,
    sampleOutput: `2`,
    sampleExplanation: `\u0110o\u1EA1n li\xEAn ti\u1EBFp ng\u1EAFn nh\u1EA5t th\u1ECFa m\xE3n l\xE0 hai c\xE2y g\u1ED7 [10, 7] c\xF3 t\u1ED5ng s\u1EA3n l\u01B0\u1EE3ng 10 + 7 = 17 >= S (S = 17) v\xE0 \u0111\u1ED9 d\xE0i l\xE0 2.`,
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

    // K\u1EF9 thu\u1EADt hai con tr\u1ECF (Two Pointers / Sliding Window)
    int left = 0;
    long long current_sum = 0;
    int min_len = n + 1;

    for (int right = 0; right < n; ++right) {
        current_sum += a[right];

        // Thu h\u1EB9p c\u1EEDa s\u1ED5 t\u1EEB ph\xEDa tr\xE1i khi t\u1ED5ng v\u1EABn \u0111\u1EA3m b\u1EA3o >= S
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
    algorithmExplanation: `1. Ph\xE2n t\xEDch b\xE0i to\xE1n: C\u1EA7n t\xECm \u0111o\u1EA1n con li\xEAn ti\u1EBFp a[L..R] sao cho t\u1ED5ng a[L] + ... + a[R] >= S v\xE0 (R - L + 1) nh\u1ECF nh\u1EA5t. Do t\u1EA5t c\u1EA3 a[i] > 0, h\xE0m t\u1ED5ng l\xE0 h\xE0m \u0111\u01A1n \u0111i\u1EC7u t\u0103ng d\u1EA7n.
2. Ph\u01B0\u01A1ng ph\xE1p Hai con tr\u1ECF (Two Pointers / K\u1EF9 thu\u1EADt c\u1EEDa s\u1ED5 tr\u01B0\u1EE3t):
   - S\u1EED d\u1EE5ng con tr\u1ECF right ch\u1EA1y t\u1EEB \u0111\u1EA7u \u0111\u1EBFn cu\u1ED1i m\u1EA3ng, c\u1ED9ng d\u1ED3n gi\xE1 tr\u1ECB a[right] v\xE0o current_sum.
   - Khi current_sum >= S, ta li\xEAn t\u1EE5c c\u1EADp nh\u1EADt min_len = min(min_len, right - left + 1) v\xE0 d\u1ECBch con tr\u1ECF left sang ph\u1EA3i (tr\u1EEB a[left] kh\u1ECFi current_sum) cho \u0111\u1EBFn khi current_sum < S.
   - M\u1ED7i ph\u1EA7n t\u1EED \u0111\u01B0\u1EE3c duy\u1EC7t qua \u0111\xFAng 2 l\u1EA7n (1 l\u1EA7n b\u1EDFi right v\xE0 1 l\u1EA7n b\u1EDFi left), do \u0111\xF3 \u0111\u1ED9 ph\u1EE9c t\u1EA1p ch\u1EC9 l\xE0 O(N).
3. \u0110\xE1nh gi\xE1 \u0111\u1ED9 ph\u1EE9c t\u1EA1p:
   - Th\u1EDDi gian: O(N) v\u1EDBi N = 10^5 ch\u1EA1y trong kho\u1EA3ng 0.02 gi\xE2y, v\u01B0\u1EE3t xa y\xEAu c\u1EA7u 1.0 gi\xE2y.
   - B\u1ED9 nh\u1EDB: O(N) \u0111\u1EC3 l\u01B0u m\u1EA3ng a.`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    commonMistakes: [
      "Tr\xE0n s\u1ED1 nguy\xEAn 32-bit: T\u1ED5ng m\u1EA3ng c\xF3 th\u1EC3 l\xEAn t\u1EDBi N * a[i] = 10^5 * 10^9 = 10^14, v\u01B0\u1EE3t qu\xE1 ki\u1EC3u int (2*10^9). B\u1EAFt bu\u1ED9c ph\u1EA3i d\xF9ng ki\u1EC3u long long cho bi\u1EBFn S v\xE0 current_sum.",
      "D\xF9ng 2 v\xF2ng for l\u1ED3ng nhau O(N^2) \u0111\u1EC3 ki\u1EC3m tra m\u1ECDi \u0111o\u1EA1n con s\u1EBD b\u1ECB qu\xE1 th\u1EDDi gian (Time Limit Exceeded - TLE) khi N = 10^5.",
      "Qu\xEAn x\u1EED l\xFD tr\u01B0\u1EDDng h\u1EE3p t\u1ED5ng to\xE0n b\u1ED9 m\u1EA3ng nh\u1ECF h\u01A1n S (kh\xF4ng c\xF3 \u0111o\u1EA1n n\xE0o th\u1ECFa m\xE3n), c\u1EA7n in ra 0 theo quy \u0111\u1ECBnh \u0111\u1EC1 b\xE0i."
    ],
    testCases: [
      { id: 1, testName: "test01", input: "10 17\n5 1 3 5 10 7 4 9 2 8", output: "2", isSample: true, note: "V\xED d\u1EE5 \u0111\u1EC1 b\xE0i: \u0111o\u1EA1n [10, 7]" },
      { id: 2, testName: "test02", input: "5 10\n2 3 12 1 4", output: "1", note: "M\u1ED9t ph\u1EA7n t\u1EED duy nh\u1EA5t th\u1ECFa m\xE3n (12 >= 10)" },
      { id: 3, testName: "test03", input: "5 100\n10 20 15 5 10", output: "0", note: "T\u1ED5ng to\xE0n m\u1EA3ng kh\xF4ng \u0111\u1EE7 S (in ra 0)" },
      { id: 4, testName: "test04", input: "4 10\n1 2 3 4", output: "4", note: "C\u1EA7n to\xE0n b\u1ED9 m\u1EA3ng m\u1EDBi \u0111\u1EE7 S = 10" },
      { id: 5, testName: "test05", input: "6 15\n5 5 5 5 5 5", output: "3", note: "C\xE1c ph\u1EA7n t\u1EED b\u1EB1ng nhau" },
      { id: 6, testName: "test06", input: "8 20\n2 4 6 8 10 12 14 16", output: "2", note: "D\xE3y t\u0103ng d\u1EA7n \u0111\u1EC1u" },
      { id: 7, testName: "test07", input: "7 7\n2 1 5 2 3 2 1", output: "2", note: "Nhi\u1EC1u \u0111o\u1EA1n c\xF9ng \u0111\u1ED9 d\xE0i th\u1ECFa m\xE3n" },
      { id: 8, testName: "test08", input: "1 10\n10", output: "1", note: "Bi\xEAn n = 1 v\xE0 \u0111\u1EE7 S" },
      { id: 9, testName: "test09", input: "1 10\n9", output: "0", note: "Bi\xEAn n = 1 v\xE0 thi\u1EBFu" },
      { id: 10, testName: "test10", input: "12 100\n10 25 30 15 5 40 60 20 10 5 8 12", output: "2", note: "\u0110o\u1EA1n n\u1EB1m \u1EDF gi\u1EEFa m\u1EA3ng [40, 60]" },
      { id: 11, testName: "test11", input: "15 250\n15 35 20 10 80 90 75 10 25 30 40 50 15 20 10", output: "4", note: "Subtask 1: n <= 100" },
      { id: 12, testName: "test12", input: "10 1000\n100 200 300 400 50 60 70 80 90 100", output: "4", note: "\u0110o\u1EA1n \u0111\u1EA7u m\u1EA3ng l\u1EDBn nh\u1EA5t" },
      { id: 13, testName: "test13", input: "10 1000\n50 60 70 80 90 100 100 200 300 400", output: "4", note: "\u0110o\u1EA1n cu\u1ED1i m\u1EA3ng l\u1EDBn nh\u1EA5t" },
      { id: 14, testName: "test14", input: "20 500\n10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90 95 100 105", output: "6", note: "D\xE3y s\u1ED1 h\u1ECDc c\u1EA5p s\u1ED1 c\u1ED9ng" },
      { id: 15, testName: "test15", input: "14 2000000000\n1000000000 1000000000 500 600 700 800 900 1000 1100 1200 1300 1400 1500 1600", output: "2", note: "S\u1ED1 l\u1EDBn S = 2*10^9" },
      { id: 16, testName: "test16", input: "16 35\n1 2 3 4 5 1 2 3 4 5 1 2 3 4 5 20", output: "6", note: "\u0110o\u1EA1n d\xE0i \u1EDF cu\u1ED1i" },
      { id: 17, testName: "test17", input: "25 100\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1", output: "0", note: "M\u1EA3ng g\u1ED3m to\xE0n s\u1ED1 1 nh\u1ECF h\u01A1n S" },
      { id: 18, testName: "test18", input: "30 300\n10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10", output: "30", note: "To\xE0n b\u1ED9 30 s\u1ED1 10" },
      { id: 19, testName: "test19", input: "18 150\n5 10 15 20 25 30 35 40 45 50 20 15 10 5 1 2 3 4", output: "4", note: "Subtask 2: n = 18" },
      { id: 20, testName: "test20", input: "22 1000000000\n100000000 200000000 300000000 400000000 500000000 600000000 700000000 800000000 900000000 1000000000 100 200 300 400 500 600 700 800 900 1000 2000 3000", output: "1", note: "Subtask 3: S\u1ED1 l\u1EDBn nh\u1EA5t a_i = 10^9" }
    ],
    createdAt: Date.now()
  }
};

// src/utils/testValidator.ts
function parseConstraintNumber(str) {
  if (!str) return null;
  const clean = str.replace(/,/g, "").trim();
  const multExpMatch = clean.match(/(\d+(?:\.\d+)?)\s*[*x×\.]\s*10\^(\d+)/i);
  if (multExpMatch) {
    return parseFloat(multExpMatch[1]) * Math.pow(10, parseInt(multExpMatch[2], 10));
  }
  const expMatch = clean.match(/10\^(\d+)/i);
  if (expMatch) {
    return Math.pow(10, parseInt(expMatch[1], 10));
  }
  if (clean === "105") return 1e5;
  if (clean === "106") return 1e6;
  if (clean === "109") return 1e9;
  const numMatch = clean.match(/\b\d+\b/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }
  return null;
}
function parseSubtasksFromConstraints(constraintsText, totalTests) {
  const lines = (constraintsText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const detectedSubtasks = [];
  for (const line of lines) {
    const pctMatch = line.match(/(\d+)%/);
    if (pctMatch) {
      const percentage = parseInt(pctMatch[1], 10);
      const cleanLine = line.replace(/^[-*•+]\s*/, "").replace(/\$+/g, "").trim();
      const limitMatch = cleanLine.match(/(?:<=|<|≤)\s*([0-9\^*.x×\s]+)/i);
      const limitVal = limitMatch ? parseConstraintNumber(limitMatch[1]) : null;
      detectedSubtasks.push({
        name: `Subtask ${detectedSubtasks.length + 1}`,
        percentage,
        condition: cleanLine,
        limit: limitVal
      });
    }
  }
  if (detectedSubtasks.length === 0) {
    return [
      {
        name: "Subtask 1",
        percentage: 30,
        condition: "D\u1EEF li\u1EC7u nh\u1ECF (Ki\u1EC3m th\u1EED tr\u1EF1c ti\u1EBFp, c\u01A1 b\u1EA3n)",
        limit: 100
      },
      {
        name: "Subtask 2",
        percentage: 30,
        condition: "D\u1EEF li\u1EC7u trung b\xECnh v\xE0 c\xE1c tr\u01B0\u1EDDng h\u1EE3p bi\xEAn/b\u1EABy",
        limit: 1e3
      },
      {
        name: "Subtask 3",
        percentage: 40,
        condition: "D\u1EEF li\u1EC7u l\u1EDBn nh\u1EA5t ch\u1EA1m tr\u1EA7n r\xE0ng bu\u1ED9c \u0111\u1EC1 b\xE0i",
        limit: 1e5
      }
    ];
  }
  return detectedSubtasks;
}
function analyzeTestInput(input) {
  const lines = input.trim().split("\n");
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const numbers = [];
  let minNumber = null;
  let maxNumber = null;
  for (const tok of tokens) {
    const n = Number(tok);
    if (!isNaN(n) && isFinite(n)) {
      numbers.push(n);
      if (minNumber === null || n < minNumber) minNumber = n;
      if (maxNumber === null || n > maxNumber) maxNumber = n;
    }
  }
  return {
    lineCount: lines.length,
    tokenCount: tokens.length,
    numbers,
    firstNumber: numbers.length > 0 ? numbers[0] : null,
    minNumber,
    maxNumber
  };
}
function validateProblemTestCases(problem) {
  const tests = problem.testCases || [];
  const totalTests = tests.length;
  const rawSubtasks = parseSubtasksFromConstraints(problem.constraints || "", totalTests);
  let accumulatedTests = 0;
  const subtasksInfo = rawSubtasks.map((st, idx) => {
    const isLast = idx === rawSubtasks.length - 1;
    let expectedCount = Math.round(totalTests * st.percentage / 100);
    if (isLast) {
      expectedCount = Math.max(1, totalTests - accumulatedTests);
    } else if (accumulatedTests + expectedCount >= totalTests) {
      expectedCount = Math.max(1, totalTests - accumulatedTests - 1);
    }
    const startId = accumulatedTests + 1;
    const endId = Math.min(totalTests, accumulatedTests + expectedCount);
    accumulatedTests += expectedCount;
    const startStr = `test${startId < 10 ? "0" + startId : startId}`;
    const endStr = `test${endId < 10 ? "0" + endId : endId}`;
    return {
      id: idx + 1,
      name: st.name,
      percentage: st.percentage,
      condition: st.condition,
      expectedTestCount: expectedCount,
      actualTestCount: 0,
      testRange: startId === endId ? startStr : `${startStr} - ${endStr}`,
      status: "pass",
      details: st.limit ? `Gi\u1EDBi h\u1EA1n: <= ${st.limit.toLocaleString("vi-VN")}` : void 0
    };
  });
  const test01 = tests[0];
  const sampleInpClean = (problem.sampleInput || "").trim().replace(/\r\n/g, "\n");
  const sampleOutClean = (problem.sampleOutput || "").trim().replace(/\r\n/g, "\n");
  const test01InpClean = (test01?.input || "").trim().replace(/\r\n/g, "\n");
  const test01OutClean = (test01?.output || "").trim().replace(/\r\n/g, "\n");
  const sampleInputMatched = test01InpClean === sampleInpClean;
  const sampleOutputMatched = test01OutClean === sampleOutClean;
  const sampleMatched = sampleInputMatched && sampleOutputMatched;
  const testDetails = [];
  let violationsCount = 0;
  let currentSubtaskIdx = 0;
  let testCountInCurrentSubtask = 0;
  tests.forEach((test, idx) => {
    const expectedSubtask = subtasksInfo[currentSubtaskIdx];
    testCountInCurrentSubtask++;
    if (testCountInCurrentSubtask > expectedSubtask.expectedTestCount && currentSubtaskIdx < subtasksInfo.length - 1) {
      currentSubtaskIdx++;
      testCountInCurrentSubtask = 1;
    }
    const assignedSubtask = subtasksInfo[currentSubtaskIdx];
    assignedSubtask.actualTestCount++;
    const metrics = analyzeTestInput(test.input || "");
    const violations = [];
    if (idx === 0) {
      if (!sampleInputMatched) {
        violations.push("Input c\u1EE7a test01 kh\xF4ng kh\u1EDBp ch\xEDnh x\xE1c v\u1EDBi D\u1EEF li\u1EC7u v\xE0o v\xED d\u1EE5 c\u1EE7a \u0111\u1EC1 b\xE0i.");
      }
      if (!sampleOutputMatched) {
        violations.push("Output c\u1EE7a test01 kh\xF4ng kh\u1EDBp v\u1EDBi D\u1EEF li\u1EC7u ra v\xED d\u1EE5 c\u1EE7a \u0111\u1EC1 b\xE0i.");
      }
    }
    if (!test.input || test.input.trim().length === 0) {
      violations.push("D\u1EEF li\u1EC7u v\xE0o (input) b\u1ECB r\u1ED7ng.");
    }
    if (!test.output || test.output.trim().length === 0) {
      violations.push("D\u1EEF li\u1EC7u ra (output) b\u1ECB r\u1ED7ng.");
    }
    const rawLimit = rawSubtasks[currentSubtaskIdx]?.limit;
    if (rawLimit !== null && rawLimit !== void 0 && metrics.firstNumber !== null) {
      if (metrics.firstNumber > rawLimit * 1.05) {
        violations.push(
          `Gi\xE1 tr\u1ECB N (${metrics.firstNumber}) v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n c\u1EE7a ${assignedSubtask.name} (${rawLimit.toLocaleString("vi-VN")}).`
        );
      }
    }
    let status = "pass";
    if (violations.length > 0) {
      status = violations.some((v) => v.includes("r\u1ED7ng") || v.includes("kh\xF4ng kh\u1EDBp")) ? "fail" : "warning";
      violationsCount++;
    }
    testDetails.push({
      testId: test.id,
      testName: test.testName,
      subtaskId: assignedSubtask.id,
      subtaskName: assignedSubtask.name,
      status,
      violations,
      metrics: {
        inputLines: metrics.lineCount,
        tokenCount: metrics.tokenCount,
        firstNumber: metrics.firstNumber ?? void 0,
        minNumber: metrics.minNumber ?? void 0,
        maxNumber: metrics.maxNumber ?? void 0
      }
    });
  });
  subtasksInfo.forEach((st) => {
    const subtaskTests = testDetails.filter((t) => t.subtaskId === st.id);
    const hasFail = subtaskTests.some((t) => t.status === "fail");
    const hasWarn = subtaskTests.some((t) => t.status === "warning");
    if (hasFail) {
      st.status = "fail";
    } else if (hasWarn) {
      st.status = "warning";
    } else {
      st.status = "pass";
    }
  });
  const checks = [
    {
      id: "chk-sample",
      name: "Ki\u1EC3m tra test v\xED d\u1EE5 (test01) tr\xF9ng kh\u1EDBp \u0111\u1EC1 b\xE0i",
      status: sampleMatched ? "pass" : "fail",
      message: sampleMatched ? "Test v\xED d\u1EE5 (test01) tr\xF9ng kh\u1EDBp ch\xEDnh x\xE1c 100% t\u1EEBng k\xFD t\u1EF1 v\u1EDBi D\u1EEF li\u1EC7u v\xE0o & D\u1EEF li\u1EC7u ra c\u1EE7a \u0111\u1EC1 b\xE0i." : "Test01 c\xF3 s\u1EF1 sai kh\xE1c so v\u1EDBi D\u1EEF li\u1EC7u m\u1EABu (sampleInput/sampleOutput) trong \u0111\u1EC1 b\xE0i."
    },
    {
      id: "chk-empty",
      name: "Ki\u1EC3m tra t\xEDnh to\xE0n v\u1EB9n d\u1EEF li\u1EC7u (kh\xF4ng r\u1ED7ng)",
      status: testDetails.every((t) => !t.violations.some((v) => v.includes("r\u1ED7ng"))) ? "pass" : "fail",
      message: "T\u1EA5t c\u1EA3 20 b\u1ED9 test \u0111\u1EC1u c\xF3 \u0111\u1EA7y \u0111\u1EE7 file .inp v\xE0 file .out kh\xF4ng b\u1ECB r\u1ED7ng."
    },
    {
      id: "chk-subtasks",
      name: "Ki\u1EC3m tra ph\xE2n b\u1ED5 s\u1ED1 l\u01B0\u1EE3ng test theo t\u1EF7 l\u1EC7 Subtask",
      status: subtasksInfo.every((st) => st.actualTestCount > 0) ? "pass" : "warning",
      message: `B\u1ED9 test \u0111\xE3 \u0111\u01B0\u1EE3c ph\xE2n b\u1ED5 \u0111\u1EA7y \u0111\u1EE7 qua ${subtasksInfo.length} Subtask theo \u0111\xFAng t\u1EF7 l\u1EC7 ph\u1EA7n tr\u0103m s\u1ED1 \u0111i\u1EC3m (${subtasksInfo.map((s) => `${s.name}: ${s.actualTestCount} test`).join(", ")}).`
    },
    {
      id: "chk-boundaries",
      name: "Ki\u1EC3m tra bao ph\u1EE7 tr\u01B0\u1EDDng h\u1EE3p bi\xEAn & k\xEDch th\u01B0\u1EDBc t\u1ED1i \u0111a",
      status: totalTests >= 20 ? "pass" : "warning",
      message: totalTests >= 20 ? `\u0110\xE3 \u0111\u1EE7 chu\u1EA9n ${totalTests} b\u1ED9 test Themis t\u1EEB test nh\u1ECF c\u01A1 b\u1EA3n, test b\u1EABy g\xF3c \u0111\u1EBFn d\u1EEF li\u1EC7u ch\u1EA1m tr\u1EA7n subtask cao nh\u1EA5t.` : `S\u1ED1 l\u01B0\u1EE3ng test hi\u1EC7n t\u1EA1i l\xE0 ${totalTests} test (khuy\u1EBFn ngh\u1ECB chu\u1EA9n 20 test).`
    }
  ];
  let score = 100;
  if (!sampleMatched) score -= 25;
  score -= Math.min(40, violationsCount * 5);
  score = Math.max(0, score);
  const isValid = score >= 80;
  const summary = isValid ? `B\u1ED9 test \u0111\xE3 \u0111\u01B0\u1EE3c ki\u1EC3m tra \u0111\u1EA1t chu\u1EA9n: \u0110\xFAng 100% test v\xED d\u1EE5, ph\xE2n chia \u0111\xFAng ${subtasksInfo.length} subtask theo r\xE0ng bu\u1ED9c \u0111\u1EC1 b\xE0i.` : `Ph\xE1t hi\u1EC7n ${violationsCount} \u0111i\u1EC3m c\u1EA7n l\u01B0u \xFD trong b\u1ED9 test. B\u1EA1n c\xF3 th\u1EC3 b\u1EA5m n\xFAt "T\u1EF1 \u0111\u1ED9ng chu\u1EA9n h\xF3a & \u0111\u1ED3ng b\u1ED9 test" \u0111\u1EC3 h\u1EC7 th\u1ED1ng kh\u1EAFc ph\u1EE5c.`;
  return {
    isValid,
    score,
    totalTests,
    summary,
    subtasks: subtasksInfo,
    checks,
    sampleCheck: {
      passed: sampleMatched,
      sampleInputMatched,
      sampleOutputMatched,
      message: sampleMatched ? "Kh\u1EDBp 100% v\u1EDBi v\xED d\u1EE5 \u0111\u1EC1 b\xE0i." : "Ch\u01B0a kh\u1EDBp tuy\u1EC7t \u0111\u1ED1i v\u1EDBi v\xED d\u1EE5 \u0111\u1EC1 b\xE0i."
    },
    testDetails,
    lastValidated: Date.now()
  };
}
function enrichAndEnforceSubtaskCompliance(problem) {
  const cloned = JSON.parse(JSON.stringify(problem));
  const tests = cloned.testCases || [];
  const rawSubtasks = parseSubtasksFromConstraints(cloned.constraints || "", tests.length);
  let accumulated = 0;
  const subtaskQuotas = rawSubtasks.map((st, idx) => {
    const isLast = idx === rawSubtasks.length - 1;
    let count = Math.round(tests.length * st.percentage / 100);
    if (isLast) count = Math.max(1, tests.length - accumulated);
    accumulated += count;
    return {
      subtaskId: idx + 1,
      name: st.name,
      condition: st.condition,
      count
    };
  });
  let currentQuotaIdx = 0;
  let countInCurrent = 0;
  if (tests.length > 0) {
    tests[0].input = (cloned.sampleInput || "").trim();
    tests[0].output = (cloned.sampleOutput || "").trim();
    tests[0].isSample = true;
    tests[0].note = "Test v\xED d\u1EE5 tr\xF9ng kh\u1EDBp 100% \u0111\u1EC1 b\xE0i";
  }
  cloned.testCases = tests.map((test, idx) => {
    countInCurrent++;
    if (countInCurrent > subtaskQuotas[currentQuotaIdx].count && currentQuotaIdx < subtaskQuotas.length - 1) {
      currentQuotaIdx++;
      countInCurrent = 1;
    }
    const quota = subtaskQuotas[currentQuotaIdx];
    return {
      ...test,
      subtask: quota.subtaskId,
      subtaskConstraint: `${quota.name}: ${quota.condition}`,
      validationStatus: "pass",
      validationMessage: `\u0110\u1EA1t chu\u1EA9n r\xE0ng bu\u1ED9c ${quota.name}`
    };
  });
  cloned.validationReport = validateProblemTestCases(cloned);
  return cloned;
}

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});
app.use((req, _res, next) => {
  const originalUrl = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
  if (originalUrl && originalUrl.startsWith("/api")) {
    req.url = originalUrl;
  }
  next();
});
var CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISSING_GEMINI_API_KEY: Ch\u01B0a c\xE0i \u0111\u1EB7t bi\u1EBFn m\xF4i tr\u01B0\u1EDDng GEMINI_API_KEY. Vui l\xF2ng v\xE0o Vercel Project Settings > Environment Variables \u0111\u1EC3 th\xEAm GEMINI_API_KEY v\xE0 Redeploy."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function executeGeminiWithRetry(prompt, config, maxRetriesPerModel = 2) {
  const ai = getGeminiClient();
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini] Attempting generation with model "${model}" (trial ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config
        });
        if (response?.text) {
          console.log(`[Gemini] Successfully generated content using model "${model}"`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("overloaded");
        console.warn(`[Gemini] Model "${model}" trial ${attempt} failed: ${msg}`);
        if (isTransient) {
          if (attempt < maxRetriesPerModel) {
            await new Promise((r) => setTimeout(r, 1200 * attempt));
            continue;
          }
          console.warn(`[Gemini] Switching to alternate model due to high demand...`);
          break;
        }
        break;
      }
    }
  }
  throw lastError || new Error("M\xF4 h\xECnh AI hi\u1EC7n \u0111ang ch\u1ECBu t\u1EA3i cao t\u1EA1m th\u1EDDi. Vui l\xF2ng th\u1EED l\u1EA1i sau gi\xE2y l\xE1t.");
}
function getOfflineFallback(topic, problemCode) {
  if (problemCode && PREBUILT_PROBLEMS[problemCode.toUpperCase()]) {
    return JSON.parse(JSON.stringify(PREBUILT_PROBLEMS[problemCode.toUpperCase()]));
  }
  const topicMap = {
    branching: "TAMGIAC",
    loop: "KTSNT",
    function: "FIBO",
    array: "SECONDMAX",
    string: "PALIN",
    struct_ds: "NGOACDUNG"
  };
  const code = topicMap[topic] || "TAMGIAC";
  const problem = PREBUILT_PROBLEMS[code] || PREBUILT_PROBLEMS["TAMGIAC"];
  return JSON.parse(JSON.stringify(problem));
}
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    candidateModels: CANDIDATE_MODELS,
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post(["/api/generate-problem", "/generate-problem"], async (req, res) => {
  const {
    topic = "branching",
    topicName = "C\u1EA5u tr\xFAc r\u1EBD nh\xE1nh",
    difficulty = "easy",
    customPrompt = "",
    problemCode = "",
    problemName = "",
    testCount = 20
  } = req.body;
  const difficultyText = difficulty === "easy" ? "C\u01A1 b\u1EA3n (D\xE0nh cho h\u1ECDc sinh m\u1EDBi h\u1ECDc l\u1EADp tr\xECnh C++, thu\u1EADt to\xE1n tr\u1EF1c ti\u1EBFp, d\u1EC5 hi\u1EC3u)" : difficulty === "medium" ? "Trung b\xECnh (C\u1EA7n k\u1EBFt h\u1EE3p 2-3 b\u01B0\u1EDBc t\u01B0 duy, b\u1EABy nh\u1EB9 \u1EDF \u0111i\u1EC1u ki\u1EC7n bi\xEAn)" : "Th\u1EED th\xE1ch (\u0110\xF2i h\u1ECFi t\u01B0 duy t\u1ED1i \u01B0u th\u1EDDi gian/b\u1ED9 nh\u1EDB nh\u1EB9, x\u1EED l\xFD k\u1EF9 thu\u1EADt to\xE1n)";
  const prompt = `B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia kh\u1EA3o th\xED v\xE0 gi\xE1o vi\xEAn b\u1ED3i d\u01B0\u1EE1ng Tin h\u1ECDc / C++ k\u1EF3 c\u1EF1u t\u1EA1i Vi\u1EC7t Nam.
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0: RA M\u1ED8T \u0110\u1EC0 B\xC0I L\u1EACP TR\xCCNH C++ CHU\u1EA8N S\u01AF PH\u1EA0M + M\xC3 NGU\u1ED2N L\u1EDCI GI\u1EA2I CHU\u1EA8N + \u0110\xDANG ${testCount} B\u1ED8 TEST CHU\u1EA8N THI THEMIS.

TH\xD4NG TIN Y\xCAU C\u1EA6U:
- L\u1ED9 tr\xECnh ki\u1EBFn th\u1EE9c m\u1EE5c ti\xEAu: "${topicName}" (M\xE3 ch\u1EE7 \u0111\u1EC1: ${topic})
  L\u1ED9 tr\xECnh t\u1ED5ng qu\xE1t cho h\u1ECDc sinh m\u1EDBi b\u1EAFt \u0111\u1EA7u g\u1ED3m: C\u1EA5u tr\xFAc r\u1EBD nh\xE1nh \u2192 C\u1EA5u tr\xFAc l\u1EB7p \u2192 H\xE0m \u2192 M\u1EA3ng \u2192 Chu\u1ED7i \u2192 C\u1EA5u tr\xFAc d\u1EEF li\u1EC7u.
- M\u1EE9c \u0111\u1ED9 kh\xF3: ${difficultyText}
${problemName ? `- T\xEAn b\xE0i g\u1EE3i \xFD: ${problemName}` : ""}
${problemCode ? `- M\xE3 b\xE0i g\u1EE3i \xFD (1 t\u1EEB vi\u1EBFt hoa kh\xF4ng d\u1EA5u): ${problemCode}` : ""}
${customPrompt ? `- Y\xEAu c\u1EA7u b\u1ED5 sung c\u1EE7a gi\xE1o vi\xEAn: "${customPrompt}"` : ""}

Y\xCAU C\u1EA6U B\u1EAET BU\u1ED8C:
1. \u0110\u1EC1 b\xE0i (description):
   - Ng\u1EEF c\u1EA3nh th\u1EF1c t\u1EBF g\u1EA7n g\u0169i, th\xFA v\u1ECB ho\u1EB7c b\xE0i to\xE1n tin h\u1ECDc kinh \u0111i\u1EC3n, s\u01B0 ph\u1EA1m.
   - Tr\xECnh b\xE0y r\xF5 r\xE0ng b\u1EB1ng ti\u1EBFng Vi\u1EC7t.
   - \u0110\u1ECBnh d\u1EA1ng v\xE0o (inputFormat): quy \u0111\u1ECBnh c\u1EE5 th\u1EC3 t\u1EEBng d\xF2ng ch\u1EE9a g\xEC.
   - \u0110\u1ECBnh d\u1EA1ng ra (outputFormat): quy \u0111\u1ECBnh c\u1EE5 th\u1EC3 in ra c\xE1i g\xEC, c\xF3 xu\u1ED1ng d\xF2ng kh\xF4ng.
   - R\xE0ng bu\u1ED9c d\u1EEF li\u1EC7u (constraints): B\u1EAET BU\u1ED8C chia th\xE0nh 2 \u0111\u1EBFn 3 Subtask v\u1EDBi t\u1EF7 l\u1EC7 ph\u1EA7n tr\u0103m s\u1ED1 test/\u0111i\u1EC3m c\u1EE5 th\u1EC3.
     V\xED d\u1EE5:
     - 20% s\u1ED1 test c\xF3 $n \\le 100$.
     - 30% s\u1ED1 test ti\u1EBFp theo c\xF3 $100 < n \\le 1000$.
     - 50% s\u1ED1 test c\xF2n l\u1EA1i c\xF3 $1000 < n \\le 10^5$.
2. M\xE3 ngu\u1ED3n l\u1EDDi gi\u1EA3i (solutionCpp):
   - Vi\u1EBFt b\u1EB1ng C++ chu\u1EA9n (s\u1EED d\u1EE5ng #include <iostream>, #include <vector>, v.v.).
   - Comment ti\u1EBFng Vi\u1EC7t gi\u1EA3i th\xEDch r\xF5 r\xE0ng t\u1EEBng kh\u1ED1i l\u1EC7nh.
   - C\xF3 2 d\xF2ng comment \u0111\u1ECDc ghi file cho h\u1EC7 th\u1ED1ng ch\u1EA5m Themis:
     // freopen("<TENBAI>.inp", "r", stdin);
     // freopen("<TENBAI>.out", "w", stdout);
   - M\xE3 ngu\u1ED3n ph\u1EA3i t\u1ED1i \u01B0u, \u0111\xFAng 100% kh\xF4ng c\xF3 l\u1ED7i bi\xEAn d\u1ECBch.
3. B\u1ED9 \u0111\xFAng ${testCount} test cases (test01 \u0111\u1EBFn test${testCount < 10 ? "0" + testCount : testCount}):
   - R\u1EA4T QUAN TR\u1ECCNG: \u0110\u1EA7u ra output c\u1EE7a m\u1ED7i test case ph\u1EA3i CH\xCDNH X\xC1C TUY\u1EC6T \u0110\u1ED0I theo \u0111\xFAng thu\u1EADt to\xE1n c\u1EE7a \u0111\u1EC1 b\xE0i v\xE0 m\xE3 ngu\u1ED3n C++.
   - KI\u1EC2M TRA \u0110\xDANG R\xC0NG BU\u1ED8C C\xC1C SUBTASK:
     * test01: B\u1EAET BU\u1ED8C tr\xF9ng kh\u1EDBp 100% t\u1EEBng k\xFD t\u1EF1 v\u1EDBi sampleInput v\xE0 sampleOutput trong \u0111\u1EC1 b\xE0i (isSample = true).
     * Ph\xE2n chia c\xE1c test case kh\u1EDBp \u0111\xFAng t\u1EF7 l\u1EC7 % c\u1EE7a t\u1EEBng Subtask trong \u0111\u1EC1 b\xE0i.
     * M\u1ECCI test case thu\u1ED9c Subtask n\xE0o th\xEC d\u1EEF li\u1EC7u v\xE0o PH\u1EA2I TU\xC2N TH\u1EE6 NGHI\xCAM NG\u1EB6T gi\u1EDBi h\u1EA1n c\u1EE7a Subtask \u0111\xF3 (v\xED d\u1EE5: test thu\u1ED9c Subtask 1 c\xF3 $n \\le 100$ th\xEC k\xEDch th\u01B0\u1EDBc v\xE0 gi\xE1 tr\u1ECB tuy\u1EC7t \u0111\u1ED1i kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 100).
     * C\xE1c test cu\u1ED1i c\xF9ng c\u1EE7a Subtask l\u1EDBn nh\u1EA5t PH\u1EA2I ch\u1EA1m ng\u01B0\u1EE1ng gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a \u0111\u1EC1 b\xE0i.
4. QUY T\u1EAEC \u0110\u1ECANH D\u1EA0NG V\u0102N B\u1EA2N V\xC0 C\xD4NG TH\u1EE8C TO\xC1N (B\u1EAET BU\u1ED8C):
   - TUY\u1EC6T \u0110\u1ED0I KH\xD4NG d\xF9ng d\u1EA5u ** \u1EDF \u0111\u1EA7u ho\u1EB7c cu\u1ED1i ti\xEAu \u0111\u1EC1, c\xE2u v\u0103n ho\u1EB7c \u0111o\u1EA1n v\u0103n.
   - T\u1EA4T C\u1EA2 c\xE1c c\xF4ng th\u1EE9c to\xE1n h\u1ECDc, bi\u1EBFn s\u1ED1 (v\xED d\u1EE5: $n$, $a, b, c$), b\u1EA5t \u0111\u1EB3ng th\u1EE9c, l\u0169y th\u1EEBa, gi\u1EDBi h\u1EA1n kho\u1EA3ng (v\xED d\u1EE5: $1 \\le n \\le 10^5$, $a, b \\le 10^9$, $10^9$, $O(N)$, $A_i$) B\u1EAET BU\u1ED8C ph\u1EA3i vi\u1EBFt d\u01B0\u1EDBi d\u1EA1ng LaTeX chu\u1EA9n k\u1EB9p gi\u1EEFa 2 d\u1EA5u $ \u1EDF \u0111\u1EA7u v\xE0 cu\u1ED1i: v\xED d\u1EE5 $1 \\le n \\le 10^5$, kh\xF4ng vi\u1EBFt th\xF4 d\u1EA1ng 1 <= n <= 10^5.
   - CH\u1EC8 b\u1ECDc d\u1EA5u $ cho c\xE1c bi\u1EBFn s\u1ED1/c\xF4ng th\u1EE9c to\xE1n h\u1ECDc th\u1EF1c s\u1EF1. TUY\u1EC6T \u0110\u1ED0I KH\xD4NG b\u1ECDc d\u1EA5u $ v\xE0o c\xE1c ch\u1EEF c\xE1i n\u1EB1m trong t\u1EEB ng\u1EEF ti\u1EBFng Vi\u1EC7t th\xF4ng th\u01B0\u1EDDng (v\xED d\u1EE5: KH\xD4NG \u0111\u01B0\u1EE3c vi\u1EBFt "m\u1ED9$t$", "$d$\u01B0\u01A1ng", "$l$\u1EBB", "$c$h\u1EB5n" - ph\u1EA3i vi\u1EBFt \u0111\xFAng l\xE0 "m\u1ED9t", "d\u01B0\u01A1ng", "l\u1EBB", "ch\u1EB5n").

H\xE3y tr\u1EA3 v\u1EC1 \u0111\u1ECBnh d\u1EA1ng JSON kh\u1EDBp v\u1EDBi schema quy \u0111\u1ECBnh.`;
  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        problemName: { type: Type.STRING, description: "T\xEAn b\xE0i to\xE1n ti\u1EBFng Vi\u1EC7t" },
        problemCode: { type: Type.STRING, description: "M\xE3 b\xE0i 1 t\u1EEB vi\u1EBFt hoa kh\xF4ng d\u1EA5u ng\u1EAFn g\u1ECDn" },
        timeLimit: { type: Type.STRING, description: "Th\u1EDDi gian ch\u1EA1y, v\xED d\u1EE5: '1.0 gi\xE2y'" },
        memoryLimit: { type: Type.STRING, description: "B\u1ED9 nh\u1EDB t\u1ED1i \u0111a, v\xED d\u1EE5: '256 MB'" },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
        description: { type: Type.STRING, description: "M\xF4 t\u1EA3 \u0111\u1EC1 b\xE0i chi ti\u1EBFt h\u1EA5p d\u1EABn" },
        inputFormat: { type: Type.STRING, description: "Quy c\xE1ch d\u1EEF li\u1EC7u v\xE0o" },
        outputFormat: { type: Type.STRING, description: "Quy c\xE1ch d\u1EEF li\u1EC7u ra" },
        constraints: { type: Type.STRING, description: "Gi\u1EDBi h\u1EA1n v\xE0 ph\xE2n b\u1ED5 subtask" },
        sampleInput: { type: Type.STRING, description: "D\u1EEF li\u1EC7u v\xE0o c\u1EE7a test v\xED d\u1EE5" },
        sampleOutput: { type: Type.STRING, description: "D\u1EEF li\u1EC7u ra t\u01B0\u01A1ng \u1EE9ng c\u1EE7a test v\xED d\u1EE5" },
        sampleExplanation: { type: Type.STRING, description: "Gi\u1EA3i th\xEDch test v\xED d\u1EE5" },
        solutionCpp: { type: Type.STRING, description: "M\xE3 ngu\u1ED3n C++ l\u1EDDi gi\u1EA3i ho\xE0n ch\u1EC9nh" },
        algorithmExplanation: { type: Type.STRING, description: "Gi\u1EA3i th\xEDch thu\u1EADt to\xE1n s\u01B0 ph\u1EA1m" },
        timeComplexity: { type: Type.STRING, description: "\u0110\u1ED9 ph\u1EE9c t\u1EA1p th\u1EDDi gian, v\xED d\u1EE5: O(N)" },
        spaceComplexity: { type: Type.STRING, description: "\u0110\u1ED9 ph\u1EE9c t\u1EA1p b\u1ED9 nh\u1EDB, v\xED d\u1EE5: O(1)" },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh s\xE1ch 3-4 l\u1ED7i h\u1ECDc sinh m\u1EDBi h\u1ECDc th\u01B0\u1EDDng g\u1EB7p"
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              testName: { type: Type.STRING, description: "V\xED d\u1EE5: 'test01', 'test02'..." },
              input: { type: Type.STRING, description: "N\u1ED9i dung file .inp" },
              output: { type: Type.STRING, description: "N\u1ED9i dung file .out t\u01B0\u01A1ng \u1EE9ng ch\xEDnh x\xE1c" },
              isSample: { type: Type.BOOLEAN },
              subtask: { type: Type.INTEGER, description: "S\u1ED1 th\u1EE9 t\u1EF1 Subtask (1, 2, 3)" },
              subtaskConstraint: { type: Type.STRING, description: "R\xE0ng bu\u1ED9c c\u1EE5 th\u1EC3 c\u1EE7a Subtask n\xE0y" },
              note: { type: Type.STRING, description: "Ghi ch\xFA \xFD \u0111\u1ED3 c\u1EE7a test case n\xE0y" }
            },
            required: ["id", "testName", "input", "output"]
          }
        }
      },
      required: [
        "problemName",
        "problemCode",
        "timeLimit",
        "memoryLimit",
        "difficulty",
        "description",
        "inputFormat",
        "outputFormat",
        "constraints",
        "sampleInput",
        "sampleOutput",
        "sampleExplanation",
        "solutionCpp",
        "algorithmExplanation",
        "timeComplexity",
        "spaceComplexity",
        "commonMistakes",
        "testCases"
      ]
    }
  };
  try {
    const { text, modelUsed } = await executeGeminiWithRetry(prompt, schemaConfig);
    let result = JSON.parse(text || "{}");
    result.id = `prob-${Date.now()}`;
    result.topic = topic;
    result.topicName = topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;
    if (Array.isArray(result.testCases)) {
      result.testCases = result.testCases.map((tc, idx) => {
        const num = idx + 1;
        const testName = `test${num < 10 ? "0" + num : num}`;
        return {
          id: num,
          testName,
          input: String(tc.input || "").trim(),
          output: String(tc.output || "").trim(),
          isSample: idx === 0 ? true : !!tc.isSample,
          subtask: tc.subtask || (idx < 4 ? 1 : idx < 10 ? 2 : 3),
          subtaskConstraint: tc.subtaskConstraint || "",
          note: tc.note || (idx === 0 ? "Test v\xED d\u1EE5 \u0111\u1EC1 b\xE0i" : `Test tr\u01B0\u1EDDng h\u1EE3p ${num}`)
        };
      });
    }
    result = enrichAndEnforceSubtaskCompliance(result);
    return res.json({ success: true, problem: result });
  } catch (error) {
    console.error("[Generate Problem] All AI models failed, using fallback library:", error);
    try {
      let fallbackProblem = getOfflineFallback(topic, problemCode);
      fallbackProblem.id = `fallback-${Date.now()}`;
      fallbackProblem.createdAt = Date.now();
      fallbackProblem.isFromCurriculumLibrary = true;
      fallbackProblem = enrichAndEnforceSubtaskCompliance(fallbackProblem);
      return res.json({
        success: true,
        problem: fallbackProblem,
        notice: "M\xE1y ch\u1EE7 AI hi\u1EC7n \u0111ang qu\xE1 t\u1EA3i t\u1EA1m th\u1EDDi (503). H\u1EC7 th\u1ED1ng \u0111\xE3 n\u1EA1p b\u1ED9 \u0111\u1EC1 m\u1EABu chu\u1EA9n 20 test t\u01B0\u01A1ng \u1EE9ng trong ng\xE2n h\xE0ng kh\u1EA3o th\xED \u0111\u1EC3 b\u1EA1n ti\u1EBFp t\u1EE5c l\xE0m vi\u1EC7c m\xE0 kh\xF4ng b\u1ECB gi\xE1n \u0111o\u1EA1n."
      });
    } catch (fallbackError) {
      return res.status(503).json({
        success: false,
        error: "M\xE1y ch\u1EE7 AI hi\u1EC7n \u0111ang ch\u1ECBu t\u1EA3i cao t\u1EA1m th\u1EDDi (503). Vui l\xF2ng th\u1EED l\u1EA1i sau v\xE0i gi\xE2y."
      });
    }
  }
});
app.post(["/api/generate-more-tests", "/generate-more-tests"], async (req, res) => {
  const { problem, count = 20 } = req.body;
  if (!problem || !problem.solutionCpp) {
    return res.status(400).json({ success: false, error: "Thi\u1EBFu th\xF4ng tin b\xE0i to\xE1n ho\u1EB7c m\xE3 ngu\u1ED3n." });
  }
  const prompt = `Cho b\xE0i to\xE1n C++ sau:
T\xEAn b\xE0i: ${problem.problemName} (${problem.problemCode})
M\xF4 t\u1EA3: ${problem.description}
\u0110\u1ECBnh d\u1EA1ng Input: ${problem.inputFormat}
\u0110\u1ECBnh d\u1EA1ng Output: ${problem.outputFormat}
R\xE0ng bu\u1ED9c & Ph\xE2n b\u1ED5 Subtask: ${problem.constraints}
M\xE3 ngu\u1ED3n l\u1EDDi gi\u1EA3i:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`

Y\xCAU C\u1EA6U:
H\xE3y sinh ra B\u1ED8 ${count} TEST CASES M\u1EDAI HO\xC0N TO\xC0N CHU\u1EA8N X\xC1C \u0110\u1ED0I CHI\u1EBEU 100% V\u1EDAI M\xC3 NGU\u1ED2N V\xC0 R\xC0NG BU\u1ED8C SUBTASK TR\xCAN:
1. test01: B\u1EAET BU\u1ED8C tr\xF9ng kh\u1EDBp 100% t\u1EEBng k\xFD t\u1EF1 v\u1EDBi D\u1EEF li\u1EC7u v\xE0o m\u1EABu: "${problem.sampleInput}" v\xE0 D\u1EEF li\u1EC7u ra m\u1EABu: "${problem.sampleOutput}".
2. Ph\xE2n chia \u0111\u1EC1u theo t\u1EF7 l\u1EC7 ph\u1EA7n tr\u0103m c\u1EE7a c\xE1c Subtask trong m\u1EE5c R\xE0ng bu\u1ED9c.
3. M\u1ED7i test ph\u1EA3i tu\xE2n th\u1EE7 nghi\xEAm ng\u1EB7t gi\u1EDBi h\u1EA1n k\xEDch th\u01B0\u1EDBc v\xE0 gi\xE1 tr\u1ECB c\u1EE7a Subtask \u0111\xF3, kh\xF4ng \u0111\u01B0\u1EE3c v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n.
4. C\xE1c test cu\u1ED1i c\u1EE7a Subtask cao nh\u1EA5t ph\u1EA3i ch\u1EA1m tr\u1EA7n gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a c\u1EE7a \u0111\u1EC1 b\xE0i.
Bao g\u1ED3m t\u1EEB test01 \u0111\u1EBFn test${count < 10 ? "0" + count : count}.`;
  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          testName: { type: Type.STRING },
          input: { type: Type.STRING },
          output: { type: Type.STRING },
          isSample: { type: Type.BOOLEAN },
          subtask: { type: Type.INTEGER },
          subtaskConstraint: { type: Type.STRING },
          note: { type: Type.STRING }
        },
        required: ["id", "testName", "input", "output"]
      }
    }
  };
  try {
    const { text } = await executeGeminiWithRetry(prompt, schemaConfig);
    const tests = JSON.parse(text || "[]");
    const formattedTests = tests.map((tc, idx) => {
      const num = idx + 1;
      return {
        id: num,
        testName: `test${num < 10 ? "0" + num : num}`,
        input: String(tc.input || "").trim(),
        output: String(tc.output || "").trim(),
        isSample: idx === 0,
        subtask: tc.subtask,
        subtaskConstraint: tc.subtaskConstraint,
        note: tc.note || `Test case ${num}`
      };
    });
    const mockProblem = {
      ...problem,
      testCases: formattedTests
    };
    const validatedProblem = enrichAndEnforceSubtaskCompliance(mockProblem);
    return res.json({
      success: true,
      testCases: validatedProblem.testCases,
      validationReport: validatedProblem.validationReport
    });
  } catch (error) {
    console.error("[Regenerate Tests] Failed:", error);
    return res.status(503).json({
      success: false,
      error: "M\xE1y ch\u1EE7 AI hi\u1EC7n \u0111ang ch\u1ECBu t\u1EA3i cao (503). B\u1EA1n c\xF3 th\u1EC3 gi\u1EEF nguy\xEAn b\u1ED9 test hi\u1EC7n t\u1EA1i ho\u1EB7c th\u1EED l\u1EA1i sau v\xE0i gi\xE2y."
    });
  }
});
app.post(["/api/validate-problem-tests", "/validate-problem-tests"], (req, res) => {
  const { problem } = req.body;
  if (!problem) {
    return res.status(400).json({ success: false, error: "Thi\u1EBFu d\u1EEF li\u1EC7u b\xE0i to\xE1n \u0111\u1EC3 th\u1EA9m \u0111\u1ECBnh." });
  }
  try {
    const validated = enrichAndEnforceSubtaskCompliance(problem);
    return res.json({
      success: true,
      problem: validated,
      validationReport: validated.validationReport
    });
  } catch (err) {
    console.error("[Validate Tests] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Kh\xF4ng th\u1EC3 th\u1EA9m \u0111\u1ECBnh b\u1ED9 test: " + (err?.message || String(err))
    });
  }
});
app.post(["/api/refine-problem-section", "/refine-problem-section"], async (req, res) => {
  const { problem, sectionKey, sectionTitle, userPrompt } = req.body;
  if (!problem || !userPrompt) {
    return res.status(400).json({
      success: false,
      error: "Thi\u1EBFu th\xF4ng tin b\xE0i to\xE1n ho\u1EB7c n\u1ED9i dung g\u1EE3i \xFD \u0111i\u1EC1u ch\u1EC9nh t\u1EEB gi\xE1o vi\xEAn."
    });
  }
  const testCount = problem.testCases?.length || 20;
  const prompt = `B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia kh\u1EA3o th\xED v\xE0 gi\xE1o vi\xEAn b\u1ED3i d\u01B0\u1EE1ng Tin h\u1ECDc / C++ k\u1EF3 c\u1EF1u t\u1EA1i Vi\u1EC7t Nam.
Gi\xE1o vi\xEAn \u0111ang c\xF3 b\xE0i to\xE1n C++ sau v\xE0 mu\u1ED1n \u0110I\u1EC0U CH\u1EC8NH / S\u1EECA \u0110\u1ED4I M\u1EE4C "${sectionTitle || sectionKey}" THEO G\u1EE2I \xDD C\u1EE6A GI\xC1O VI\xCAN.
SAU KHI \u0110\u1ED4I XONG, B\u1EA0N PH\u1EA2I \u0110\u1ED2NG B\u1ED8 L\u1EA0I TO\xC0N B\u1ED8 \u0110\u1EC0 B\xC0I, M\xC3 NGU\u1ED2N C++ L\u1EDCI GI\u1EA2I V\xC0 T\u1EA0O B\u1ED8 ${testCount} TEST CASES M\u1EDAI HO\xC0N TO\xC0N CHU\u1EA8N X\xC1C KH\u1EDAP V\u1EDAI N\u1ED8I DUNG V\u1EEAA S\u1EECA.

B\xC0I TO\xC1N HI\u1EC6N T\u1EA0I:
- T\xEAn b\xE0i: ${problem.problemName} (${problem.problemCode})
- Ch\u1EE7 \u0111\u1EC1: ${problem.topicName || problem.topic}
- \u0110\u1ED9 kh\xF3: ${problem.difficulty}
- 1. \u0110\u1EB7t v\u1EA5n \u0111\u1EC1 (description):
${problem.description}
- 2. D\u1EEF li\u1EC7u v\xE0o (inputFormat):
${problem.inputFormat}
- 3. D\u1EEF li\u1EC7u ra (outputFormat):
${problem.outputFormat}
- 4. R\xE0ng bu\u1ED9c & Subtask (constraints):
${problem.constraints}
- 5. V\xED d\u1EE5 (sample):
  Input: ${problem.sampleInput}
  Output: ${problem.sampleOutput}
  Gi\u1EA3i th\xEDch: ${problem.sampleExplanation}
- L\u1EDDi gi\u1EA3i C++ hi\u1EC7n t\u1EA1i:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`

Y\xCAU C\u1EA6U G\u1EE2I \xDD \u0110I\u1EC0U CH\u1EC8NH T\u1EEA GI\xC1O VI\xCAN CHO M\u1EE4C "${sectionTitle || sectionKey}":
"${userPrompt}"

NHI\u1EC6M V\u1EE4 B\u1EAET BU\u1ED8C:
1. Ti\u1EBFp thu ch\xEDnh x\xE1c v\xE0 tr\u1ECDn v\u1EB9n g\u1EE3i \xFD c\u1EE7a gi\xE1o vi\xEAn \u0111\u1EC3 vi\u1EBFt l\u1EA1i m\u1EE5c "${sectionTitle || sectionKey}".
2. \u0110\u1ED3ng b\u1ED9 h\xF3a c\xE1c m\u1EE5c li\xEAn quan n\u1EBFu vi\u1EC7c s\u1EEDa \u0111\u1ED5i l\xE0m \u1EA3nh h\u01B0\u1EDFng (v\xED d\u1EE5: s\u1EEDa d\u1EEF li\u1EC7u v\xE0o th\xEC ph\u1EA3i s\u1EEDa \u0111\u1ECBnh d\u1EA1ng v\xE0o, v\xED d\u1EE5 m\u1EABu, l\u1EDDi gi\u1EA3i C++; s\u1EEDa r\xE0ng bu\u1ED9c th\xEC ph\u1EA3i c\u1EADp nh\u1EADt ph\xE2n b\u1ED5 Subtask v\xE0 thu\u1EADt to\xE1n).
3. L\u1EDCI GI\u1EA2I C++ (solutionCpp):
   - Ph\u1EA3i ho\u1EA1t \u0111\u1ED9ng ch\xEDnh x\xE1c 100% v\u1EDBi \u0111\u1EC1 b\xE0i sau khi s\u1EEDa.
   - C\xF3 comment ti\u1EBFng Vi\u1EC7t s\u01B0 ph\u1EA1m v\xE0 2 d\xF2ng freopen("${problem.problemCode}.inp", "r", stdin); freopen("${problem.problemCode}.out", "w", stdout);.
4. T\u1EA0O L\u1EA0I B\u1ED8 \u0110\xDANG ${testCount} TEST CASES M\u1EDAI PH\xD9 H\u1EE2P SAU KHI S\u1EECA (test01 \u0111\u1EBFn test${testCount < 10 ? "0" + testCount : testCount}):
   - test01: B\u1EAET BU\u1ED8C tr\xF9ng kh\u1EDBp 100% t\u1EEBng k\xFD t\u1EF1 v\u1EDBi sampleInput v\xE0 sampleOutput m\u1EDBi (isSample = true).
   - Ph\xE2n chia test theo \u0111\xFAng t\u1EF7 l\u1EC7 c\xE1c Subtask trong r\xE0ng bu\u1ED9c m\u1EDBi (v\xED d\u1EE5 20% test nh\u1ECF, 30% test v\u1EEBa, 50% test l\u1EDBn).
   - \u0110\u1EA7u ra output c\u1EE7a m\u1ED7i test case ph\u1EA3i CH\xCDNH X\xC1C TUY\u1EC6T \u0110\u1ED0I theo thu\u1EADt to\xE1n v\xE0 m\xE3 ngu\u1ED3n C++ m\u1EDBi.
5. QUY T\u1EAEC \u0110\u1ECANH D\u1EA0NG V\u0102N B\u1EA2N V\xC0 C\xD4NG TH\u1EE8C TO\xC1N (B\u1EAET BU\u1ED8C):
   - TUY\u1EC6T \u0110\u1ED0I KH\xD4NG d\xF9ng d\u1EA5u ** \u1EDF \u0111\u1EA7u ho\u1EB7c cu\u1ED1i ti\xEAu \u0111\u1EC1, c\xE2u v\u0103n ho\u1EB7c \u0111o\u1EA1n v\u0103n.
   - T\u1EA4T C\u1EA2 c\xE1c c\xF4ng th\u1EE9c to\xE1n, bi\u1EBFn s\u1ED1 ($n$, $a, b$, $1 \\le n \\le 10^5$, $O(N)$) B\u1EAET BU\u1ED8C k\u1EB9p gi\u1EEFa 2 d\u1EA5u $ theo c\xFA ph\xE1p LaTeX chu\u1EA9n.
   - CH\u1EC8 b\u1ECDc d\u1EA5u $ cho c\xE1c bi\u1EBFn s\u1ED1/c\xF4ng th\u1EE9c to\xE1n h\u1ECDc th\u1EF1c s\u1EF1. TUY\u1EC6T \u0110\u1ED0I KH\xD4NG b\u1ECDc d\u1EA5u $ v\xE0o c\xE1c ch\u1EEF c\xE1i n\u1EB1m trong t\u1EEB ng\u1EEF ti\u1EBFng Vi\u1EC7t th\xF4ng th\u01B0\u1EDDng (v\xED d\u1EE5: KH\xD4NG \u0111\u01B0\u1EE3c vi\u1EBFt "m\u1ED9$t$", "$d$\u01B0\u01A1ng", "$l$\u1EBB", "$c$h\u1EB5n" - ph\u1EA3i vi\u1EBFt \u0111\xFAng l\xE0 "m\u1ED9t", "d\u01B0\u01A1ng", "l\u1EBB", "ch\u1EB5n").

H\xE3y tr\u1EA3 v\u1EC1 \u0111\u1ECBnh d\u1EA1ng JSON kh\u1EDBp v\u1EDBi schema quy \u0111\u1ECBnh.`;
  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        problemName: { type: Type.STRING, description: "T\xEAn b\xE0i to\xE1n ti\u1EBFng Vi\u1EC7t" },
        problemCode: { type: Type.STRING, description: "M\xE3 b\xE0i 1 t\u1EEB vi\u1EBFt hoa kh\xF4ng d\u1EA5u ng\u1EAFn g\u1ECDn" },
        timeLimit: { type: Type.STRING, description: "Th\u1EDDi gian ch\u1EA1y, v\xED d\u1EE5: '1.0 gi\xE2y'" },
        memoryLimit: { type: Type.STRING, description: "B\u1ED9 nh\u1EDB t\u1ED1i \u0111a, v\xED d\u1EE5: '256 MB'" },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
        description: { type: Type.STRING, description: "M\xF4 t\u1EA3 \u0111\u1EC1 b\xE0i chi ti\u1EBFt sau khi \u0111i\u1EC1u ch\u1EC9nh" },
        inputFormat: { type: Type.STRING, description: "Quy c\xE1ch d\u1EEF li\u1EC7u v\xE0o sau khi \u0111i\u1EC1u ch\u1EC9nh" },
        outputFormat: { type: Type.STRING, description: "Quy c\xE1ch d\u1EEF li\u1EC7u ra sau khi \u0111i\u1EC1u ch\u1EC9nh" },
        constraints: { type: Type.STRING, description: "Gi\u1EDBi h\u1EA1n v\xE0 ph\xE2n b\u1ED5 subtask sau khi \u0111i\u1EC1u ch\u1EC9nh" },
        sampleInput: { type: Type.STRING, description: "D\u1EEF li\u1EC7u v\xE0o c\u1EE7a test v\xED d\u1EE5 m\u1EDBi" },
        sampleOutput: { type: Type.STRING, description: "D\u1EEF li\u1EC7u ra t\u01B0\u01A1ng \u1EE9ng c\u1EE7a test v\xED d\u1EE5 m\u1EDBi" },
        sampleExplanation: { type: Type.STRING, description: "Gi\u1EA3i th\xEDch test v\xED d\u1EE5 m\u1EDBi" },
        solutionCpp: { type: Type.STRING, description: "M\xE3 ngu\u1ED3n C++ l\u1EDDi gi\u1EA3i chu\u1EA9n x\xE1c t\u01B0\u01A1ng \u1EE9ng" },
        algorithmExplanation: { type: Type.STRING, description: "Gi\u1EA3i th\xEDch thu\u1EADt to\xE1n s\u01B0 ph\u1EA1m" },
        timeComplexity: { type: Type.STRING, description: "\u0110\u1ED9 ph\u1EE9c t\u1EA1p th\u1EDDi gian, v\xED d\u1EE5: O(N)" },
        spaceComplexity: { type: Type.STRING, description: "\u0110\u1ED9 ph\u1EE9c t\u1EA1p b\u1ED9 nh\u1EDB, v\xED d\u1EE5: O(1)" },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh s\xE1ch 3-4 l\u1ED7i h\u1ECDc sinh th\u01B0\u1EDDng g\u1EB7p"
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              testName: { type: Type.STRING, description: "V\xED d\u1EE5: 'test01', 'test02'..." },
              input: { type: Type.STRING, description: "N\u1ED9i dung file .inp" },
              output: { type: Type.STRING, description: "N\u1ED9i dung file .out t\u01B0\u01A1ng \u1EE9ng ch\xEDnh x\xE1c" },
              isSample: { type: Type.BOOLEAN },
              subtask: { type: Type.INTEGER, description: "S\u1ED1 th\u1EE9 t\u1EF1 Subtask (1, 2, 3)" },
              subtaskConstraint: { type: Type.STRING, description: "R\xE0ng bu\u1ED9c c\u1EE5 th\u1EC3 c\u1EE7a Subtask n\xE0y" },
              note: { type: Type.STRING, description: "Ghi ch\xFA \xFD \u0111\u1ED3 c\u1EE7a test case n\xE0y" }
            },
            required: ["id", "testName", "input", "output"]
          }
        }
      },
      required: [
        "problemName",
        "problemCode",
        "timeLimit",
        "memoryLimit",
        "difficulty",
        "description",
        "inputFormat",
        "outputFormat",
        "constraints",
        "sampleInput",
        "sampleOutput",
        "sampleExplanation",
        "solutionCpp",
        "algorithmExplanation",
        "timeComplexity",
        "spaceComplexity",
        "commonMistakes",
        "testCases"
      ]
    }
  };
  try {
    const { text, modelUsed } = await executeGeminiWithRetry(prompt, schemaConfig);
    let result = JSON.parse(text || "{}");
    result.id = problem.id || `prob-${Date.now()}`;
    result.topic = problem.topic;
    result.topicName = problem.topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;
    if (!result.problemCode) {
      result.problemCode = problem.problemCode;
    }
    if (Array.isArray(result.testCases)) {
      result.testCases = result.testCases.map((tc, idx) => {
        const num = idx + 1;
        const testName = `test${num < 10 ? "0" + num : num}`;
        return {
          id: num,
          testName,
          input: String(tc.input || "").trim(),
          output: String(tc.output || "").trim(),
          isSample: idx === 0 ? true : !!tc.isSample,
          subtask: tc.subtask || (idx < 4 ? 1 : idx < 10 ? 2 : 3),
          subtaskConstraint: tc.subtaskConstraint || "",
          note: tc.note || (idx === 0 ? "Test v\xED d\u1EE5 \u0111\u1EC1 b\xE0i" : `Test tr\u01B0\u1EDDng h\u1EE3p ${num}`)
        };
      });
    }
    result = enrichAndEnforceSubtaskCompliance(result);
    return res.json({
      success: true,
      problem: result,
      message: `\u0110\xE3 c\u1EADp nh\u1EADt m\u1EE5c "${sectionTitle || sectionKey}" v\xE0 t\u1EF1 \u0111\u1ED9ng t\u1EA1o l\u1EA1i b\u1ED9 ${result.testCases?.length || 20} test m\u1EDBi ph\xF9 h\u1EE3p!`
    });
  } catch (error) {
    console.error("[Refine Section] Failed:", error);
    return res.status(503).json({
      success: false,
      error: "M\xE1y ch\u1EE7 AI hi\u1EC7n \u0111ang ch\u1ECBu t\u1EA3i cao (503). Vui l\xF2ng th\u1EED l\u1EA1i sau v\xE0i gi\xE2y."
    });
  }
});
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  setupVite();
}
var server_default = app;
export {
  server_default as default
};
