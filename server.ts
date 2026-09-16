import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PREBUILT_PROBLEMS } from "./src/data/prebuiltProblems";
import { enrichAndEnforceSubtaskCompliance, validateProblemTestCases } from "./src/utils/testValidator";

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

// Candidate models for automatic fallback when one experiences 503 high demand
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
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

// Resilient API runner that handles 503 (high demand) and 429 with retries and model fallback
async function executeGeminiWithRetry(
  prompt: string,
  config: any,
  maxRetriesPerModel = 2
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini] Attempting generation with model "${model}" (trial ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (response?.text) {
          console.log(`[Gemini] Successfully generated content using model "${model}"`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("overloaded");

        console.warn(`[Gemini] Model "${model}" trial ${attempt} failed: ${msg}`);

        if (isTransient) {
          if (attempt < maxRetriesPerModel) {
            // Short backoff before retry on same model
            await new Promise((r) => setTimeout(r, 1200 * attempt));
            continue;
          }
          // If all trials on this model failed with 503/429, fall through to next model
          console.warn(`[Gemini] Switching to alternate model due to high demand...`);
          break;
        }

        // For non-transient errors, break and try next model
        break;
      }
    }
  }

  throw lastError || new Error("Mô hình AI hiện đang chịu tải cao tạm thời. Vui lòng thử lại sau giây lát.");
}

// Find offline fallback problem by topic or code if all models are unavailable
function getOfflineFallback(topic: string, problemCode?: string): any {
  if (problemCode && PREBUILT_PROBLEMS[problemCode.toUpperCase()]) {
    return JSON.parse(JSON.stringify(PREBUILT_PROBLEMS[problemCode.toUpperCase()]));
  }

  const topicMap: Record<string, string> = {
    branching: "TAMGIAC",
    loop: "KTSNT",
    function: "FIBO",
    array: "SECONDMAX",
    string: "PALIN",
    struct_ds: "NGOACDUNG",
  };

  const code = topicMap[topic] || "TAMGIAC";
  const problem = PREBUILT_PROBLEMS[code] || PREBUILT_PROBLEMS["TAMGIAC"];
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
${problemCode ? `- Mã bài gợi ý (1 từ viết hoa không dấu): ${problemCode}` : ""}
${customPrompt ? `- Yêu cầu bổ sung của giáo viên: "${customPrompt}"` : ""}

YÊU CẦU BẮT BUỘC:
1. Đề bài (description):
   - Ngữ cảnh thực tế gần gũi, thú vị hoặc bài toán tin học kinh điển, sư phạm.
   - Trình bày rõ ràng bằng tiếng Việt.
   - Định dạng vào (inputFormat): quy định cụ thể từng dòng chứa gì.
   - Định dạng ra (outputFormat): quy định cụ thể in ra cái gì, có xuống dòng không.
   - Ràng buộc dữ liệu (constraints): BẮT BUỘC chia thành 2 đến 3 Subtask với tỷ lệ phần trăm số test/điểm cụ thể.
     Ví dụ:
     - 20% số test có $n \\le 100$.
     - 30% số test tiếp theo có $100 < n \\le 1000$.
     - 50% số test còn lại có $1000 < n \\le 10^5$.
2. Mã nguồn lời giải (solutionCpp):
   - Viết bằng C++ chuẩn (sử dụng #include <iostream>, #include <vector>, v.v.).
   - Comment tiếng Việt giải thích rõ ràng từng khối lệnh.
   - Có 2 dòng comment đọc ghi file cho hệ thống chấm Themis:
     // freopen("<TENBAI>.inp", "r", stdin);
     // freopen("<TENBAI>.out", "w", stdout);
   - Mã nguồn phải tối ưu, đúng 100% không có lỗi biên dịch.
3. Bộ đúng ${testCount} test cases (test01 đến test${testCount < 10 ? "0" + testCount : testCount}):
   - RẤT QUAN TRỌNG: Đầu ra output của mỗi test case phải CHÍNH XÁC TUYỆT ĐỐI theo đúng thuật toán của đề bài và mã nguồn C++.
   - KIỂM TRA ĐÚNG RÀNG BUỘC CÁC SUBTASK:
     * test01: BẮT BUỘC trùng khớp 100% từng ký tự với sampleInput và sampleOutput trong đề bài (isSample = true).
     * Phân chia các test case khớp đúng tỷ lệ % của từng Subtask trong đề bài.
     * MỌI test case thuộc Subtask nào thì dữ liệu vào PHẢI TUÂN THỦ NGHIÊM NGẶT giới hạn của Subtask đó (ví dụ: test thuộc Subtask 1 có $n \\le 100$ thì kích thước và giá trị tuyệt đối không được vượt quá 100).
     * Các test cuối cùng của Subtask lớn nhất PHẢI chạm ngưỡng giới hạn tối đa đề bài.
4. QUY TẮC ĐỊNH DẠNG VĂN BẢN VÀ CÔNG THỨC TOÁN (BẮT BUỘC):
   - TUYỆT ĐỐI KHÔNG dùng dấu ** ở đầu hoặc cuối tiêu đề, câu văn hoặc đoạn văn.
   - TẤT CẢ các công thức toán học, biến số (ví dụ: $n$, $a, b, c$), bất đẳng thức, lũy thừa, giới hạn khoảng (ví dụ: $1 \\le n \\le 10^5$, $a, b \\le 10^9$, $10^9$, $O(N)$, $A_i$) BẮT BUỘC phải viết dưới dạng LaTeX chuẩn kẹp giữa 2 dấu $ ở đầu và cuối: ví dụ $1 \\le n \\le 10^5$, không viết thô dạng 1 <= n <= 10^5.
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
        description: { type: Type.STRING, description: "Mô tả đề bài chi tiết hấp dẫn" },
        inputFormat: { type: Type.STRING, description: "Quy cách dữ liệu vào" },
        outputFormat: { type: Type.STRING, description: "Quy cách dữ liệu ra" },
        constraints: { type: Type.STRING, description: "Giới hạn và phân bổ subtask" },
        sampleInput: { type: Type.STRING, description: "Dữ liệu vào của test ví dụ" },
        sampleOutput: { type: Type.STRING, description: "Dữ liệu ra tương ứng của test ví dụ" },
        sampleExplanation: { type: Type.STRING, description: "Giải thích test ví dụ" },
        solutionCpp: { type: Type.STRING, description: "Mã nguồn C++ lời giải hoàn chỉnh" },
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
    const { text, modelUsed } = await executeGeminiWithRetry(prompt, schemaConfig);
    let result = JSON.parse(text || "{}");

    // Format and sanitize
    result.id = `prob-${Date.now()}`;
    result.topic = topic;
    result.topicName = topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;

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
    const { text } = await executeGeminiWithRetry(prompt, schemaConfig);
    const tests = JSON.parse(text || "[]");

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

    const mockProblem = {
      ...problem,
      testCases: formattedTests,
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

// API: Validate problem test cases against subtask constraints & specifications
app.post(["/api/validate-problem-tests", "/validate-problem-tests"], (req, res) => {
  const { problem } = req.body;
  if (!problem) {
    return res.status(400).json({ success: false, error: "Thiếu dữ liệu bài toán để thẩm định." });
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
      error: "Không thể thẩm định bộ test: " + (err?.message || String(err)),
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
3. LỜI GIẢI C++ (solutionCpp):
   - Phải hoạt động chính xác 100% với đề bài sau khi sửa.
   - Có comment tiếng Việt sư phạm và 2 dòng freopen("${problem.problemCode}.inp", "r", stdin); freopen("${problem.problemCode}.out", "w", stdout);.
4. TẠO LẠI BỘ ĐÚNG ${testCount} TEST CASES MỚI PHÙ HỢP SAU KHI SỬA (test01 đến test${testCount < 10 ? "0" + testCount : testCount}):
   - test01: BẮT BUỘC trùng khớp 100% từng ký tự với sampleInput và sampleOutput mới (isSample = true).
   - Phân chia test theo đúng tỷ lệ các Subtask trong ràng buộc mới (ví dụ 20% test nhỏ, 30% test vừa, 50% test lớn).
   - Đầu ra output của mỗi test case phải CHÍNH XÁC TUYỆT ĐỐI theo thuật toán và mã nguồn C++ mới.
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
    const { text, modelUsed } = await executeGeminiWithRetry(prompt, schemaConfig);
    let result = JSON.parse(text || "{}");

    // Preserve metadata
    result.id = problem.id || `prob-${Date.now()}`;
    result.topic = problem.topic;
    result.topicName = problem.topicName;
    result.createdAt = Date.now();
    result.generatedByModel = modelUsed;

    // Preserve problemCode if AI modified it unnecessarily
    if (!result.problemCode) {
      result.problemCode = problem.problemCode;
    }

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
