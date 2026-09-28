import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { jsonrepair } from "jsonrepair";
import { PREBUILT_PROBLEMS } from "./src/data/prebuiltProblems";
import { enrichAndEnforceSubtaskCompliance, validateProblemTestCases } from "./src/utils/testValidator";
import { executeCppSolution } from "./src/server/cppRunner";

dotenv.config();

const app = express();
const PORT = 3000;

// Safe body parser for both standalone server and serverless environments (e.g. Vercel)
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});

// Middleware to normalize URL in case Vercel rewrote it
app.use((req, _res, next) => {
  const originalUrl =
    (req.headers["x-matched-path"] as string) ||
    (req.headers["x-invoke-path"] as string);
  if (originalUrl && originalUrl.startsWith("/api")) {
    req.url = originalUrl;
  }
  next();
});

// Candidate models for automatic fallback when one experiences 503 high demand or token limits
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISSING_GEMINI_API_KEY: Chưa cài đặt biến môi trường GEMINI_API_KEY. Vui lòng vào Vercel Project Settings > Environment Variables để thêm GEMINI_API_KEY và Redeploy."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Robust JSON parser that handles markdown code fences, unescaped characters,
 * and truncated/unterminated JSON strings from AI generation.
 */
export function safeParseOrRepairJson<T = any>(rawText: string): T {
  if (!rawText || !rawText.trim()) {
    throw new Error("Phản hồi từ AI bị rỗng.");
  }

  let cleaned = rawText.trim();
  // Strip markdown code fences if model wrapped the JSON in ```json ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Strategy 1: Direct JSON parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (err1: any) {
    // Strategy 2: jsonrepair (fixes unterminated strings, unescaped quotes/newlines, trailing commas, missing closing brackets)
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired) as T;
    } catch (err2: any) {
      // Strategy 3: Find outermost object or array boundary and repair
      try {
        const firstBrace = cleaned.indexOf("{");
        const firstBracket = cleaned.indexOf("[");
        let startIdx = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
          startIdx = firstBrace;
        } else if (firstBracket !== -1) {
          startIdx = firstBracket;
        }

        if (startIdx !== -1) {
          const slice = cleaned.slice(startIdx);
          const repairedSlice = jsonrepair(slice);
          return JSON.parse(repairedSlice) as T;
        }
      } catch (err3: any) {
        // Strategy 4: Handle unclosed quotes at end of truncated string then repair
        try {
          let patched = cleaned;
          const quotes = (patched.match(/(?<!\\)"/g) || []).length;
          if (quotes % 2 !== 0) {
            patched += '"';
          }
          const repairedPatched = jsonrepair(patched);
          return JSON.parse(repairedPatched) as T;
        } catch (err4: any) {
          // All strategies exhausted
        }
      }

      console.error("[JSON Parser] All JSON parsing & repair attempts failed. Raw snippet:", cleaned.slice(0, 300));
      throw new Error(`SyntaxError: Không thể phân tích JSON từ AI: ${err1.message}`);
    }
  }
}

// Resilient API runner that handles 503 (high demand), 429, and JSON parsing errors with retries and model fallback
async function executeGeminiJsonWithRetry<T = any>(
  prompt: string,
  config: any,
  maxRetriesPerModel = 2
): Promise<{ data: T; modelUsed: string; rawText: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini] Generating with model "${model}" (trial ${attempt}/${maxRetriesPerModel})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const rawText = response?.text || "";
        if (!rawText) {
          throw new Error("Phản hồi từ AI bị rỗng.");
        }

        // Validate and parse JSON immediately inside the retry loop
        const data = safeParseOrRepairJson<T>(rawText);
        console.log(`[Gemini] Successfully generated and parsed valid JSON with "${model}"`);
        return { data, modelUsed: model, rawText };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("overloaded") ||
          msg.includes("SyntaxError") ||
          msg.includes("Unterminated string") ||
          msg.includes("JSON");

        console.warn(`[Gemini] Model "${model}" trial ${attempt} failed: ${msg}`);

        if (attempt < maxRetriesPerModel && isTransient) {
          // Short backoff before retry on same model
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        // If all trials on this model failed or error is non-recoverable on this model, switch to next model
        console.warn(`[Gemini] Switching to alternate candidate model...`);
        break;
      }
    }
  }

  throw lastError || new Error("Mô hình AI hiện đang chịu tải cao tạm thời. Vui lòng thử lại sau giây lát.");
}

// Find offline fallback problem by topic or code if all models are unavailable
function getOfflineFallback(topic: string, problemCode?: string): any {
  const cleanCode = (problemCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (cleanCode && PREBUILT_PROBLEMS[cleanCode]) {
    return JSON.parse(JSON.stringify(PREBUILT_PROBLEMS[cleanCode]));
  }

  const topicMap: Record<string, string> = {
    branching: "TG",
    loop: "KTSNT",
    function: "FIBO",
    array: "MAX2",
    string: "PALIN",
    struct_ds: "NGOAC",
  };

  const code = topicMap[topic] || "TG";
  const problem = PREBUILT_PROBLEMS[code] || PREBUILT_PROBLEMS["TG"] || Object.values(PREBUILT_PROBLEMS)[0];
  return JSON.parse(JSON.stringify(problem));
}

// Health check
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    candidateModels: CANDIDATE_MODELS,
    time: new Date().toISOString(),
  });
});

// Helper: Normalize & ensure problem code is uppercase, alphanumeric, under 6 chars
function normalizeProblemCode(code: string | undefined, defaultPrefix = "BAI"): string {
  let cleaned = (code || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
  if (!cleaned) cleaned = defaultPrefix;
  return cleaned.slice(0, 6);
}

// API: Generate Problem + Solution + 20 Tests
app.post(["/api/generate-problem", "/generate-problem"], async (req, res) => {
  const {
    topic = "branching",
    topicName = "Cấu trúc rẽ nhánh",
    difficulty = "easy",
    customPrompt = "",
    problemCode = "",
    problemName = "",
    testCount = 20,
  } = req.body;

  const sanitizedUserCode = problemCode ? normalizeProblemCode(problemCode) : "";

  const difficultyText =
    difficulty === "easy"
      ? "Cơ bản (Dành cho học sinh mới học lập trình C++, thuật toán trực tiếp, dễ hiểu)"
      : difficulty === "medium"
      ? "Trung bình (Cần kết hợp 2-3 bước tư duy, bẫy nhẹ ở điều kiện biên)"
      : "Thử thách (Đòi hỏi tư duy tối ưu thời gian/bộ nhớ nhẹ, xử lý kỹ thuật toán)";

  const prompt = `Bạn là một chuyên gia khảo thí và giáo viên bồi dưỡng Tin học / C++ kỳ cựu tại Việt Nam.
Nhiệm vụ của bạn là: RA MỘT ĐỀ BÀI LẬP TRÌNH C++ CHUẨN SƯ PHẠM + MÃ NGUỒN LỜI GIẢI CHUẨN + ĐÚNG ${testCount} BỘ TEST CHUẨN THI THEMIS.

THÔNG TIN YÊU CẦU:
- Lộ trình kiến thức mục tiêu: "${topicName}" (Mã chủ đề: ${topic})
  Lộ trình tổng quát cho học sinh mới bắt đầu gồm: Cấu trúc rẽ nhánh → Cấu trúc lặp → Hàm → Mảng → Chuỗi → Cấu trúc dữ liệu.
- Mức độ khó: ${difficultyText}
${problemName ? `- Tên bài gợi ý: ${problemName}` : ""}
${sanitizedUserCode ? `- Mã bài gợi ý (BẮT BUỘC dưới hoặc bằng 6 kí tự viết hoa không dấu): ${sanitizedUserCode}` : ""}
${customPrompt ? `- Yêu cầu bổ sung của giáo viên: "${customPrompt}"` : ""}

QUY TẮC BẮT BUỘC VỀ TÊN BÀI, MÃ BÀI, INPUT, OUTPUT VIỆT HOÁ NGẮN GỌN (DƯỚI 6 KÍ TỰ):
1. **Mã bài (problemCode)**:
   - BẮT BUỘC là 1 từ viết hoa không dấu, thuần Việt ngắn gọn **DƯỚI HOẶC BẰNG 6 KÍ TỰ** (Tối đa 6 ký tự, ví dụ: TONG, TG, SNT, MAX2, FIBO, PALIN, UCLN, BCNN, NGOAC, DEMTU, MANG, XAU, DEMNT, SOCHAN, TDIEN, SNGAY...).
   - Tuyệt đối không đặt mã bài dài hơn 6 ký tự.
2. **Tên bài (problemName)**:
   - Tiếng Việt thuần túy ngắn gọn, súc tích, sư phạm (dưới 6 từ, ví dụ: "Phân loại tam giác", "Kiểm tra số nguyên tố", "Tính tổng mảng", "Tìm số lớn nhì", "Dãy Fibonacci", "Xâu đối xứng", "Ước chung lớn nhất"...).
3. **Định dạng file Dữ liệu vào & Dữ liệu ra**:
   - File dữ liệu vào: <MABAI>.INP (ví dụ: TONG.INP, TG.INP, SNT.INP)
   - File dữ liệu ra: <MABAI>.OUT (ví dụ: TONG.OUT, TG.OUT, SNT.OUT)
   - Cả hai file đều đồng bộ theo mã bài dưới 6 ký tự trên.
4. **Mô tả Dữ liệu vào (inputFormat) & Dữ liệu ra (outputFormat)**:
   - Trình bày thuần Việt, súc tích, ngắn gọn, chỉ rõ từng dòng chứa gì, cách nhau khoảng trắng hay xuống dòng.
5. **Ràng buộc dữ liệu (constraints)**:
   - BẮT BUỘC chia thành 2 đến 3 Subtask với tỷ lệ phần trăm số test/điểm cụ thể.
     Ví dụ:
     - 20% số test có $n \\le 100$.
     - 30% số test tiếp theo có $100 < n \\le 1000$.
     - 50% số test còn lại có $1000 < n \\le 10^5$.
6. **Mã nguồn lời giải (solutionCpp) & Kiểu biến (Data Types) CHUẨN XÁC 100%**:
   - Viết bằng C++ chuẩn (sử dụng #include <iostream>, #include <vector>, #include <string>, #include <iomanip>, v.v.).
   - **ĐỒNG BỘ TUYỆT ĐỐI KIỂU BIẾN VỚI RÀNG BUỘC ĐỀ BÀI**:
     * Nếu giá trị của biến, tổng, tích hoặc kết quả có thể vượt quá $2 \\cdot 10^9$ (ví dụ: $n \\le 10^9$ tính tổng, $n \\le 10^{12}$, $n \\le 10^{18}$, tổng mảng $10^5 \\times 10^9 = 10^{14}$), BẮT BUỘC dùng kiểu 'long long' (hoặc 'unsigned long long') trong C++, kèm ép kiểu khi nhân '(long long)a * b' để TRÁNH TRÀN SỐ NGUYÊN (Integer Overflow).
     * Với số thực: dùng 'double' hoặc 'long double', in kết quả kèm 'fixed << setprecision(k)' đúng số chữ số thập phân đề yêu cầu.
     * Với xâu ký tự: dùng 'string', xử lý đọc cả dòng 'getline(cin, s)' nếu chuỗi có khoảng trắng.
     * Tên các biến khai báo trong code C++ phải khớp với tên biến được nhắc đến trong Đề bài và Ràng buộc ($n$, $k$, $a, b$, $A_i$,...).
   - Comment tiếng Việt giải thích rõ ràng từng khối lệnh.
   - Có 2 dòng comment đọc ghi file cho hệ thống chấm Themis sử dụng đúng mã bài <= 6 ký tự:
     // freopen("<MABAI>.inp", "r", stdin);
     // freopen("<MABAI>.out", "w", stdout);
   - Mã nguồn phải chuẩn, tối ưu, biên dịch trực tiếp không có lỗi bằng g++ (C++17).
7. **Bộ đúng ${testCount} test cases (test01 đến test${testCount < 10 ? "0" + testCount : testCount})**:
   - Hệ thống sẽ biên dịch và chạy trực tiếp file C++ này với stdin/stdout để sinh output thực tế cho từng test case.
   - KIỂM TRA ĐÚNG RÀNG BUỘC CÁC SUBTASK:
     * test01: BẮT BUỘC trùng khớp 100% từng ký tự với sampleInput và sampleOutput trong đề bài (isSample = true).
     * Phân chia các test case khớp đúng tỷ lệ % của từng Subtask trong đề bài.
     * MỌI test case thuộc Subtask nào thì dữ liệu vào PHẢI TUÂN THỦ NGHIÊM NGẶT giới hạn của Subtask đó.
     * Các test cuối cùng của Subtask lớn nhất PHẢI chạm ngưỡng giới hạn tối đa đề bài.
8. **QUY TẮC ĐỊNH DẠNG VĂN BẢN VÀ CÔNG THỨC TOÁN (BẮT BUỘC)**:
   - TUYỆT ĐỐI KHÔNG dùng dấu ** ở đầu hoặc cuối tiêu đề, câu văn hoặc đoạn văn.
   - TẤT CẢ các công thức toán học, biến số ($n$, $a, b, c$, $1 \\le n \\le 10^5$, $a, b \\le 10^9$, $10^9$, $O(N)$, $A_i$) BẮT BUỘC phải viết dưới dạng LaTeX chuẩn kẹp giữa 2 dấu $ ở đầu và cuối: ví dụ $1 \\le n \\le 10^5$, không viết thô dạng 1 <= n <= 10^5.
   - CHỈ bọc dấu $ cho các biến số/công thức toán học thực sự. TUYỆT ĐỐI KHÔNG bọc dấu $ vào các chữ cái nằm trong từ ngữ tiếng Việt thông thường.

Hãy trả về định dạng JSON khớp với schema quy định.`;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        problemName: { type: Type.STRING, description: "Tên bài toán tiếng Việt ngắn gọn, súc tích (dưới 6 từ)" },
        problemCode: { type: Type.STRING, description: "Mã bài 1 từ viết hoa không dấu ngắn gọn BẮT BUỘC dưới hoặc bằng 6 kí tự (ví dụ: TONG, TG, SNT, MAX2)" },
        timeLimit: { type: Type.STRING, description: "Thời gian chạy, ví dụ: '1.0 giây'" },
        memoryLimit: { type: Type.STRING, description: "Bộ nhớ tối đa, ví dụ: '256 MB'" },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
        description: { type: Type.STRING, description: "Mô tả đề bài chi tiết hấp dẫn" },
        inputFormat: { type: Type.STRING, description: "Quy cách dữ liệu vào thuần Việt ngắn gọn" },
        outputFormat: { type: Type.STRING, description: "Quy cách dữ liệu ra thuần Việt ngắn gọn" },
        constraints: { type: Type.STRING, description: "Giới hạn và phân bổ subtask" },
        sampleInput: { type: Type.STRING, description: "Dữ liệu vào của test ví dụ" },
        sampleOutput: { type: Type.STRING, description: "Dữ liệu ra tương ứng của test ví dụ" },
        sampleExplanation: { type: Type.STRING, description: "Giải thích test ví dụ" },
        solutionCpp: { type: Type.STRING, description: "Mã nguồn C++ lời giải hoàn chỉnh kèm 2 dòng comment freopen file .inp/.out dưới 6 kí tự" },
        algorithmExplanation: { type: Type.STRING, description: "Giải thích thuật toán sư phạm" },
        timeComplexity: { type: Type.STRING, description: "Độ phức tạp thời gian, ví dụ: O(N)" },
        spaceComplexity: { type: Type.STRING, description: "Độ phức tạp bộ nhớ, ví dụ: O(1)" },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách 3-4 lỗi học sinh mới học thường gặp",
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              testName: { type: Type.STRING, description: "Ví dụ: 'test01', 'test02'..." },
              input: { type: Type.STRING, description: "Nội dung file .inp" },
              output: { type: Type.STRING, description: "Nội dung file .out tương ứng chính xác" },
              isSample: { type: Type.BOOLEAN },
              subtask: { type: Type.INTEGER, description: "Số thứ tự Subtask (1, 2, 3)" },
              subtaskConstraint: { type: Type.STRING, description: "Ràng buộc cụ thể của Subtask này" },
              note: { type: Type.STRING, description: "Ghi chú ý đồ của test case này" },
            },
            required: ["id", "testName", "input", "output"],
          },
        },
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
        "testCases",
      ],
    },
  };

  try {
    const { data: rawResult, modelUsed } = await executeGeminiJsonWithRetry(prompt, schemaConfig);
    let result = (rawResult || {}) as any;

    // Format and sanitize
    result.id = `prob-${Date.now()}`;
    result.topic = topic;
    result.topicName = topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;

    // Enforce problemCode length <= 6 and uppercase alphanumeric
    result.problemCode = normalizeProblemCode(result.problemCode || sanitizedUserCode, "BAI");

    // Ensure 20 tests are numbered nicely
    if (Array.isArray(result.testCases)) {
      result.testCases = result.testCases.map((tc: any, idx: number) => {
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
          note: tc.note || (idx === 0 ? "Test ví dụ đề bài" : `Test trường hợp ${num}`),
        };
      });
    }

    // GIẢI PHÁP 3: BIÊN DỊCH VÀ CHẠY CODE CHUẨN C++ ĐỂ SINH OUTPUT CHÍNH XÁC 100%
    if (result.solutionCpp && Array.isArray(result.testCases) && result.testCases.length > 0) {
      try {
        console.log(`[C++ Engine] Compiling & executing C++ solution for ${result.problemCode}...`);
        const execRes = await executeCppSolution(
          result.solutionCpp,
          result.testCases,
          result.sampleInput
        );
        if (execRes.success) {
          result.testCases = execRes.testCases;
          if (execRes.sampleOutput) {
            result.sampleOutput = execRes.sampleOutput;
          }
          result.executedByCpp = true;
          result.cppExecutionTimeMs = execRes.totalTimeMs;
          console.log(`[C++ Engine] Successfully executed all ${result.testCases.length} tests in ${execRes.totalTimeMs}ms (100% accurate output)`);
        } else {
          console.warn('[C++ Engine] Compilation warning/error:', execRes.compileError);
          result.cppCompileError = execRes.compileError;
        }
      } catch (runErr) {
        console.error('[C++ Engine] Execution error:', runErr);
      }
    }

    // AUTOMATED VALIDATION & SUBTASK COMPLIANCE AUDIT
    // Verifies test01 matches sampleInput/sampleOutput, checks subtask limits, and builds validationReport
    result = enrichAndEnforceSubtaskCompliance(result);

    return res.json({ success: true, problem: result });
  } catch (error: any) {
    console.error("[Generate Problem] All AI models failed, using fallback library:", error);

    // If AI fails completely due to temporary 503 overload, serve from vetted prebuilt library
    try {
      let fallbackProblem = getOfflineFallback(topic, problemCode);
      fallbackProblem.id = `fallback-${Date.now()}`;
      fallbackProblem.createdAt = Date.now();
      fallbackProblem.isFromCurriculumLibrary = true;

      fallbackProblem = enrichAndEnforceSubtaskCompliance(fallbackProblem);

      return res.json({
        success: true,
        problem: fallbackProblem,
        notice: "Máy chủ AI hiện đang quá tải tạm thời (503). Hệ thống đã nạp bộ đề mẫu chuẩn 20 test tương ứng trong ngân hàng khảo thí để bạn tiếp tục làm việc mà không bị gián đoạn.",
      });
    } catch (fallbackError: any) {
      return res.status(503).json({
        success: false,
        error: "Máy chủ AI hiện đang chịu tải cao tạm thời (503). Vui lòng thử lại sau vài giây.",
      });
    }
  }
});

// API: Regenerate tests for an existing problem with strict subtask verification
app.post(["/api/generate-more-tests", "/generate-more-tests"], async (req, res) => {
  const { problem, count = 20 } = req.body;
  if (!problem || !problem.solutionCpp) {
    return res.status(400).json({ success: false, error: "Thiếu thông tin bài toán hoặc mã nguồn." });
  }

  const prompt = `Cho bài toán C++ sau:
Tên bài: ${problem.problemName} (${problem.problemCode})
Mô tả: ${problem.description}
Định dạng Input: ${problem.inputFormat}
Định dạng Output: ${problem.outputFormat}
Ràng buộc & Phân bổ Subtask: ${problem.constraints}
Mã nguồn lời giải:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`

YÊU CẦU:
Hãy sinh ra BỘ ${count} TEST CASES MỚI HOÀN TOÀN CHUẨN XÁC ĐỐI CHIẾU 100% VỚI MÃ NGUỒN VÀ RÀNG BUỘC SUBTASK TRÊN:
1. test01: BẮT BUỘC trùng khớp 100% từng ký tự với Dữ liệu vào mẫu: "${problem.sampleInput}" và Dữ liệu ra mẫu: "${problem.sampleOutput}".
2. Phân chia đều theo tỷ lệ phần trăm của các Subtask trong mục Ràng buộc.
3. Mỗi test phải tuân thủ nghiêm ngặt giới hạn kích thước và giá trị của Subtask đó, không được vượt quá giới hạn.
4. Các test cuối của Subtask cao nhất phải chạm trần giới hạn tối đa của đề bài.
Bao gồm từ test01 đến test${count < 10 ? "0" + count : count}.`;

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
          note: { type: Type.STRING },
        },
        required: ["id", "testName", "input", "output"],
      },
    },
  };

  try {
    const { data: rawTests } = await executeGeminiJsonWithRetry(prompt, schemaConfig);
    const tests = Array.isArray(rawTests) ? rawTests : (rawTests as any)?.testCases || [];

    const formattedTests = tests.map((tc: any, idx: number) => {
      const num = idx + 1;
      return {
        id: num,
        testName: `test${num < 10 ? "0" + num : num}`,
        input: String(tc.input || "").trim(),
        output: String(tc.output || "").trim(),
        isSample: idx === 0,
        subtask: tc.subtask,
        subtaskConstraint: tc.subtaskConstraint,
        note: tc.note || `Test case ${num}`,
      };
    });

    let finalTests = formattedTests;
    // GIẢI PHÁP 3: BIÊN DỊCH VÀ CHẠY CODE CHUẨN C++ ĐỂ SINH OUTPUT CHÍNH XÁC 100%
    if (problem.solutionCpp && Array.isArray(formattedTests) && formattedTests.length > 0) {
      try {
        console.log(`[C++ Engine] Compiling & executing C++ solution for regenerated tests...`);
        const execRes = await executeCppSolution(
          problem.solutionCpp,
          formattedTests,
          problem.sampleInput
        );
        if (execRes.success) {
          finalTests = execRes.testCases;
          console.log(`[C++ Engine] Regenerated tests executed in ${execRes.totalTimeMs}ms with 100% precision`);
        }
      } catch (e) {
        console.error('[C++ Runner in generate-more-tests] error:', e);
      }
    }

    const mockProblem = {
      ...problem,
      testCases: finalTests,
    };
    const validatedProblem = enrichAndEnforceSubtaskCompliance(mockProblem);

    return res.json({
      success: true,
      testCases: validatedProblem.testCases,
      validationReport: validatedProblem.validationReport,
    });
  } catch (error: any) {
    console.error("[Regenerate Tests] Failed:", error);
    return res.status(503).json({
      success: false,
      error: "Máy chủ AI hiện đang chịu tải cao (503). Bạn có thể giữ nguyên bộ test hiện tại hoặc thử lại sau vài giây.",
    });
  }
});

// API: GIẢI PHÁP 3 - Đồng bộ & Sinh lại toàn bộ Output test cases từ Mã nguồn C++ chuẩn
app.post(["/api/sync-tests-with-cpp", "/sync-tests-with-cpp"], async (req, res) => {
  const { problem } = req.body;
  if (!problem || !problem.solutionCpp) {
    return res.status(400).json({ success: false, error: "Thiếu mã nguồn C++ chuẩn để thực thi." });
  }

  try {
    console.log(`[C++ Engine] Manual trigger: Compiling & executing for ${problem.problemCode || 'problem'}...`);
    const execRes = await executeCppSolution(
      problem.solutionCpp,
      problem.testCases || [],
      problem.sampleInput
    );

    if (!execRes.success) {
      return res.status(400).json({
        success: false,
        compileError: execRes.compileError,
        error: `Không thể biên dịch mã nguồn C++: ${execRes.compileError}`,
      });
    }

    let updatedProblem = {
      ...problem,
      testCases: execRes.testCases,
      sampleOutput: execRes.sampleOutput || problem.sampleOutput,
      executedByCpp: true,
      cppExecutionTimeMs: execRes.totalTimeMs,
    };

    updatedProblem = enrichAndEnforceSubtaskCompliance(updatedProblem);

    return res.json({
      success: true,
      problem: updatedProblem,
      message: `Đã biên dịch và thực thi C++ thành công toàn bộ ${execRes.testCases.length} test cases trong ${execRes.totalTimeMs}ms! Output chuẩn xác 100%.`,
    });
  } catch (err: any) {
    console.error('[C++ Runner manual error]:', err);
    return res.status(500).json({
      success: false,
      error: `Lỗi khi thực thi C++: ${err.message}`,
    });
  }
});

// API: Validate problem test cases against subtask constraints & specifications
app.post(["/api/validate-problem-tests", "/validate-problem-tests"], (req, res) => {
  const { problem } = req.body;
  if (!problem) {
    return res.status(400).json({ success: false, error: "Thiếu dữ liệu bài toán để kiểm tra." });
  }

  try {
    const validated = enrichAndEnforceSubtaskCompliance(problem);
    return res.json({
      success: true,
      problem: validated,
      validationReport: validated.validationReport,
    });
  } catch (err: any) {
    console.error("[Validate Tests] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Không thể kiểm tra bộ test: " + (err?.message || String(err)),
    });
  }
});

// API: Refine a specific section (1. Đặt vấn đề, 2. Dữ liệu vào, 3. Dữ liệu ra, 4. Ràng buộc, 5. Ví dụ)
// and automatically regenerate the matching 20 test cases
app.post(["/api/refine-problem-section", "/refine-problem-section"], async (req, res) => {
  const { problem, sectionKey, sectionTitle, userPrompt } = req.body;

  if (!problem || !userPrompt) {
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin bài toán hoặc nội dung gợi ý điều chỉnh từ giáo viên.",
    });
  }

  const testCount = problem.testCases?.length || 20;

  const prompt = `Bạn là một chuyên gia khảo thí và giáo viên bồi dưỡng Tin học / C++ kỳ cựu tại Việt Nam.
Giáo viên đang có bài toán C++ sau và muốn ĐIỀU CHỈNH / SỬA ĐỔI MỤC "${sectionTitle || sectionKey}" THEO GỢI Ý CỦA GIÁO VIÊN.
SAU KHI ĐỔI XONG, BẠN PHẢI ĐỒNG BỘ LẠI TOÀN BỘ ĐỀ BÀI, MÃ NGUỒN C++ LỜI GIẢI VÀ TẠO BỘ ${testCount} TEST CASES MỚI HOÀN TOÀN CHUẨN XÁC KHỚP VỚI NỘI DUNG VỪA SỬA.

BÀI TOÁN HIỆN TẠI:
- Tên bài: ${problem.problemName} (${problem.problemCode})
- Chủ đề: ${problem.topicName || problem.topic}
- Độ khó: ${problem.difficulty}
- 1. Đặt vấn đề (description):
${problem.description}
- 2. Dữ liệu vào (inputFormat):
${problem.inputFormat}
- 3. Dữ liệu ra (outputFormat):
${problem.outputFormat}
- 4. Ràng buộc & Subtask (constraints):
${problem.constraints}
- 5. Ví dụ (sample):
  Input: ${problem.sampleInput}
  Output: ${problem.sampleOutput}
  Giải thích: ${problem.sampleExplanation}
- Lời giải C++ hiện tại:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`

YÊU CẦU GỢI Ý ĐIỀU CHỈNH TỪ GIÁO VIÊN CHO MỤC "${sectionTitle || sectionKey}":
"${userPrompt}"

NHIỆM VỤ BẮT BUỘC:
1. Tiếp thu chính xác và trọn vẹn gợi ý của giáo viên để viết lại mục "${sectionTitle || sectionKey}".
2. Đồng bộ hóa các mục liên quan nếu việc sửa đổi làm ảnh hưởng (ví dụ: sửa dữ liệu vào thì phải sửa định dạng vào, ví dụ mẫu, lời giải C++; sửa ràng buộc thì phải cập nhật phân bổ Subtask và thuật toán).
3. LỜI GIẢI C++ (solutionCpp) & KIỂU BIẾN CHUẨN XÁC 100%:
   - Phải hoạt động chính xác 100% với đề bài sau khi sửa, biên dịch trực tiếp không lỗi bằng g++ (C++17).
   - ĐỒNG BỘ TUYỆT ĐỐI KIỂU BIẾN: Nếu giá trị/tổng/tích $> 2 \\cdot 10^9$ (ví dụ: $n \\le 10^{12}, 10^{18}$), BẮT BUỘC dùng 'long long' kèm ép kiểu khi nhân '(long long)a * b' để TRÁNH TRÀN SỐ NGUYÊN (Integer Overflow). Dùng 'double' cho số thực, 'string' cho xâu ký tự. Tên biến phải khớp với Đề bài.
   - Có comment tiếng Việt sư phạm và 2 dòng freopen("${problem.problemCode}.inp", "r", stdin); freopen("${problem.problemCode}.out", "w", stdout);.
4. TẠO LẠI BỘ ĐÚNG ${testCount} TEST CASES MỚI PHÙ HỢP SAU KHI SỬA (test01 đến test${testCount < 10 ? "0" + testCount : testCount}):
   - test01: BẮT BUỘC trùng khớp 100% từng ký tự với sampleInput và sampleOutput mới (isSample = true).
   - Phân chia test theo đúng tỷ lệ các Subtask trong ràng buộc mới (ví dụ 20% test nhỏ, 30% test vừa, 50% test lớn).
   - Dữ liệu input phải tuân thủ nghiêm ngặt ràng buộc của Subtask. Hệ thống sẽ biên dịch và chạy trực tiếp file C++ này để sinh output chính xác 100%.
5. QUY TẮC ĐỊNH DẠNG VĂN BẢN VÀ CÔNG THỨC TOÁN (BẮT BUỘC):
   - TUYỆT ĐỐI KHÔNG dùng dấu ** ở đầu hoặc cuối tiêu đề, câu văn hoặc đoạn văn.
   - TẤT CẢ các công thức toán, biến số ($n$, $a, b$, $1 \\le n \\le 10^5$, $O(N)$) BẮT BUỘC kẹp giữa 2 dấu $ theo cú pháp LaTeX chuẩn.
   - CHỈ bọc dấu $ cho các biến số/công thức toán học thực sự. TUYỆT ĐỐI KHÔNG bọc dấu $ vào các chữ cái nằm trong từ ngữ tiếng Việt thông thường (ví dụ: KHÔNG được viết "mộ$t$", "$d$ương", "$l$ẻ", "$c$hẵn" - phải viết đúng là "một", "dương", "lẻ", "chẵn").

Hãy trả về định dạng JSON khớp với schema quy định.`;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        problemName: { type: Type.STRING, description: "Tên bài toán tiếng Việt" },
        problemCode: { type: Type.STRING, description: "Mã bài 1 từ viết hoa không dấu ngắn gọn" },
        timeLimit: { type: Type.STRING, description: "Thời gian chạy, ví dụ: '1.0 giây'" },
        memoryLimit: { type: Type.STRING, description: "Bộ nhớ tối đa, ví dụ: '256 MB'" },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
        description: { type: Type.STRING, description: "Mô tả đề bài chi tiết sau khi điều chỉnh" },
        inputFormat: { type: Type.STRING, description: "Quy cách dữ liệu vào sau khi điều chỉnh" },
        outputFormat: { type: Type.STRING, description: "Quy cách dữ liệu ra sau khi điều chỉnh" },
        constraints: { type: Type.STRING, description: "Giới hạn và phân bổ subtask sau khi điều chỉnh" },
        sampleInput: { type: Type.STRING, description: "Dữ liệu vào của test ví dụ mới" },
        sampleOutput: { type: Type.STRING, description: "Dữ liệu ra tương ứng của test ví dụ mới" },
        sampleExplanation: { type: Type.STRING, description: "Giải thích test ví dụ mới" },
        solutionCpp: { type: Type.STRING, description: "Mã nguồn C++ lời giải chuẩn xác tương ứng" },
        algorithmExplanation: { type: Type.STRING, description: "Giải thích thuật toán sư phạm" },
        timeComplexity: { type: Type.STRING, description: "Độ phức tạp thời gian, ví dụ: O(N)" },
        spaceComplexity: { type: Type.STRING, description: "Độ phức tạp bộ nhớ, ví dụ: O(1)" },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách 3-4 lỗi học sinh thường gặp",
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              testName: { type: Type.STRING, description: "Ví dụ: 'test01', 'test02'..." },
              input: { type: Type.STRING, description: "Nội dung file .inp" },
              output: { type: Type.STRING, description: "Nội dung file .out tương ứng chính xác" },
              isSample: { type: Type.BOOLEAN },
              subtask: { type: Type.INTEGER, description: "Số thứ tự Subtask (1, 2, 3)" },
              subtaskConstraint: { type: Type.STRING, description: "Ràng buộc cụ thể của Subtask này" },
              note: { type: Type.STRING, description: "Ghi chú ý đồ của test case này" },
            },
            required: ["id", "testName", "input", "output"],
          },
        },
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
        "testCases",
      ],
    },
  };

  try {
    const { data: rawResult, modelUsed } = await executeGeminiJsonWithRetry(prompt, schemaConfig);
    let result = (rawResult || {}) as any;

    // Preserve metadata
    result.id = problem.id || `prob-${Date.now()}`;
    result.topic = problem.topic;
    result.topicName = problem.topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;

    // Preserve problemCode if AI modified it unnecessarily or ensure under 6 chars
    result.problemCode = normalizeProblemCode(result.problemCode || problem.problemCode, "BAI");

    // Format tests
    if (Array.isArray(result.testCases)) {
      result.testCases = result.testCases.map((tc: any, idx: number) => {
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
          note: tc.note || (idx === 0 ? "Test ví dụ đề bài" : `Test trường hợp ${num}`),
        };
      });
    }

    // BIÊN DỊCH VÀ CHẠY CODE CHUẨN C++ ĐỂ SINH OUTPUT CHÍNH XÁC 100%
    if (result.solutionCpp && Array.isArray(result.testCases) && result.testCases.length > 0) {
      try {
        console.log(`[C++ Engine] Compiling & executing C++ solution for refined problem ${result.problemCode}...`);
        const execRes = await executeCppSolution(
          result.solutionCpp,
          result.testCases,
          result.sampleInput
        );
        if (execRes.success) {
          result.testCases = execRes.testCases;
          if (execRes.sampleOutput) {
            result.sampleOutput = execRes.sampleOutput;
          }
          result.executedByCpp = true;
          result.cppExecutionTimeMs = execRes.totalTimeMs;
          console.log(`[C++ Engine] Successfully executed all ${result.testCases.length} tests in ${execRes.totalTimeMs}ms (100% accurate output)`);
        } else {
          console.warn('[C++ Engine] Compilation warning/error:', execRes.compileError);
          result.cppCompileError = execRes.compileError;
        }
      } catch (runErr) {
        console.error('[C++ Engine] Execution error:', runErr);
      }
    }

    // AUTOMATED VALIDATION & SUBTASK ENFORCEMENT
    result = enrichAndEnforceSubtaskCompliance(result);

    return res.json({
      success: true,
      problem: result,
      message: `Đã cập nhật mục "${sectionTitle || sectionKey}" và tự động tạo lại bộ ${result.testCases?.length || 20} test mới phù hợp!`,
    });
  } catch (error: any) {
    console.error("[Refine Section] Failed:", error);
    return res.status(503).json({
      success: false,
      error: "Máy chủ AI hiện đang chịu tải cao (503). Vui lòng thử lại sau vài giây.",
    });
  }
});

// Setup Vite or Static File Serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
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

// In local or container runtime, start server. On Vercel, it is handled as a serverless function.
if (!process.env.VERCEL) {
  setupVite();
}

export default app;
