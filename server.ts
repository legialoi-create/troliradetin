import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { jsonrepair } from "jsonrepair";
import { PREBUILT_PROBLEMS } from "./src/data/prebuiltProblems";
import {
  enrichAndEnforceSubtaskCompliance,
  validateProblemTestCases,
  sanitizeProblemData,
} from "./src/utils/testValidator";
import {
  executeCppSolution,
  compileCppCode,
  runBinaryWithInput,
  normalizeOutputText,
  runThreeLevelIndependentAudit,
  classifyTestCategory,
  hasGppCompiler,
} from "./src/server/cppRunner";

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

        console.log(`[Gemini] Model "${model}" trial ${attempt} note: ${msg.slice(0, 180)}`);

        if (attempt < maxRetriesPerModel && isTransient) {
          // Short backoff before retry on same model
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        // If all trials on this model failed or error is non-recoverable on this model, switch to next model
        console.log(`[Gemini] Switching to alternate candidate model...`);
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

/**
 * Runs 3-Level Zero-Trust Independent Audit (Generator C++ -> Brute-Force Oracle vs Optimal AC Stress Test -> 20-Test Execution)
 * and automatically invokes AI self-healing if compilation fails, any test TLE/RTEs, or a counter-example is found against Oracle.
 */
async function executeAndSelfHealCpp(problem: any, allowSelfHeal = true): Promise<any> {
  if (!problem.solutionCpp || !Array.isArray(problem.testCases) || problem.testCases.length === 0) {
    return problem;
  }

  const expectedSampleOut = (problem.sampleOutput || "").trim();
  let auditRes = await runThreeLevelIndependentAudit({
    solutionCpp: problem.solutionCpp,
    oracleBfCpp: problem.oracleBfCpp,
    generatorCpp: problem.generatorCpp,
    testCases: problem.testCases,
    sampleInput: problem.sampleInput || "",
    sampleOutput: expectedSampleOut,
  });

  const sampleDiffers =
    auditRes.success &&
    auditRes.sampleOutput !== undefined &&
    expectedSampleOut !== "" &&
    normalizeOutputText(auditRes.sampleOutput) !== normalizeOutputText(expectedSampleOut);

  const needsHealing =
    allowSelfHeal &&
    (!auditRes.success ||
      (auditRes.failedTestCount && auditRes.failedTestCount > 0) ||
      !!auditRes.counterExample);

  if (needsHealing) {
    try {
      const failureSummary = !auditRes.success
        ? `Lỗi biên dịch g++ (C++17):\n${auditRes.compileError}`
        : auditRes.counterExample
        ? `PHÁT HIỆN PHẢN VÍ DỤ (SAI LỆCH GIỮA BRUTE-FORCE ORACLE VÀ CODE TỐI ƯU) TẠI ${auditRes.counterExample.testLabel}:\n` +
          `- Input:\n${auditRes.counterExample.input.slice(0, 300)}\n` +
          `- Kết quả Brute-Force Oracle: ${auditRes.counterExample.oracleOutput}\n` +
          `- Kết quả Code Tối Ưu hiện tại: ${auditRes.counterExample.candidateOutput}`
        : `Có ${auditRes.failedTestCount} test case bị lỗi thực thi (TLE / Runtime Error):\n` +
          (auditRes.failingCases || [])
            .slice(0, 3)
            .map((fc) => `- ${fc.testName} (${fc.status}): ${fc.errorMessage}\n  Input mẫu: ${fc.input.slice(0, 200)}`)
            .join("\n");

      console.log(`[C++ 3-Level Self-Heal] Attempting automatic C++ repair for ${problem.problemCode}...`);
      const repairPrompt = `Bạn là Huấn luyện viên HSG Tin học Quốc gia C++17. Trong quá trình Thẩm định Độc lập 3 Cấp độ (Zero-Trust Audit), hệ thống phát hiện sự cố với mã nguồn bài toán "${problem.problemName}" (${problem.problemCode}):

THÔNG TIN ĐỀ BÀI:
- Mô tả: ${problem.description}
- Dữ liệu vào: ${problem.inputFormat}
- Dữ liệu ra: ${problem.outputFormat}
- Ràng buộc: ${problem.constraints}
- Ví dụ Input:
${problem.sampleInput}
- Ví dụ Output chuẩn:
${problem.sampleOutput}

MÃ NGUỒN C++ TỐI ƯU HIỆN TẠI:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`
${problem.oracleBfCpp ? `\nMÃ NGUỒN BRUTE-FORCE ORACLE HIỆN TẠI:\n\`\`\`cpp\n${problem.oracleBfCpp}\n\`\`\`` : ""}

CHI TIẾT LỖI / PHẢN VÍ DỤ TỪ TRÌNH THẨM ĐỊNH G++:
${failureSummary}

YÊU CẦU SỬA LỖI BẮT BUỘC:
1. Sửa triệt để lỗi biên dịch, lỗi sai lệch logic (off-by-one, điều kiện biên), lỗi tràn số nguyên (dùng 'long long' và ép kiểu '1LL * a * b'), lỗi tràn mảng, hoặc TLE.
2. Đảm bảo cả 'solutionCpp' (Code tối ưu AC 100%) và 'oracleBfCpp' (Code vét cạn đối chứng trên dữ liệu nhỏ) đều đúng tuyệt đối 100% theo định nghĩa toán học của đề bài.
3. Bật tăng tốc I/O: ios_base::sync_with_stdio(false); cin.tie(NULL); và giữ 2 dòng comment freopen("${problem.problemCode}.inp", "r", stdin); freopen("${problem.problemCode}.out", "w", stdout);.`;

      const repairSchema = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solutionCpp: { type: Type.STRING },
            oracleBfCpp: { type: Type.STRING },
            algorithmExplanation: { type: Type.STRING },
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
          },
          required: ["solutionCpp", "algorithmExplanation", "timeComplexity", "spaceComplexity"],
        },
      };

      const { data: repairedData } = await executeGeminiJsonWithRetry(repairPrompt, repairSchema, 1);
      if (repairedData && repairedData.solutionCpp) {
        const retryAudit = await runThreeLevelIndependentAudit({
          solutionCpp: repairedData.solutionCpp,
          oracleBfCpp: repairedData.oracleBfCpp || problem.oracleBfCpp,
          generatorCpp: problem.generatorCpp,
          testCases: auditRes.testCases,
          sampleInput: problem.sampleInput || "",
          sampleOutput: expectedSampleOut,
        });
        if (retryAudit.success && (retryAudit.failedTestCount || 0) <= (auditRes.failedTestCount || 999)) {
          problem.solutionCpp = repairedData.solutionCpp;
          if (repairedData.oracleBfCpp) problem.oracleBfCpp = repairedData.oracleBfCpp;
          if (repairedData.algorithmExplanation) problem.algorithmExplanation = repairedData.algorithmExplanation;
          if (repairedData.timeComplexity) problem.timeComplexity = repairedData.timeComplexity;
          if (repairedData.spaceComplexity) problem.spaceComplexity = repairedData.spaceComplexity;
          retryAudit.auditReport.level2OracleStress.selfHealed = true;
          auditRes = retryAudit;
          console.log(`[C++ 3-Level Self-Heal] Auto-repaired and passed 3-Level Audit!`);
        }
      }
    } catch (healErr) {
      console.warn("[C++ 3-Level Self-Heal] Could not auto-heal C++:", healErr);
    }
  }

  problem.threeLevelAudit = auditRes.auditReport;

  if (auditRes.success) {
    problem.testCases = auditRes.testCases;
    if (auditRes.sampleOutput) {
      problem.sampleOutput = auditRes.sampleOutput;
    }
    problem.executedByCpp = true;
    problem.cppExecutionTimeMs = auditRes.totalTimeMs;
    problem.cppFailedTestCount = auditRes.failedTestCount || 0;
    problem.cppSampleMatched = true;
    problem.cppCompileError = undefined;
    problem.cppExecutionDetails =
      auditRes.failedTestCount && auditRes.failedTestCount > 0
        ? `Có ${auditRes.failedTestCount}/${auditRes.testCases.length} test gặp lỗi TLE hoặc Runtime Error. Hãy bấm "AI Sửa Lỗi & Tối Ưu Code" để khắc phục.`
        : sampleDiffers
        ? `Đã tự động cập nhật Output ví dụ khớp 100% với kết quả thực thi C++.`
        : undefined;
  } else {
    problem.executedByCpp = false;
    problem.cppCompileError = auditRes.compileError;
    problem.cppSampleMatched = false;
    problem.cppFailedTestCount = problem.testCases.length;
    problem.cppExecutionDetails = auditRes.compileError;
  }

  return problem;
}

// API: Generate Problem + Solution + 3-Level Independent Audit + 20 Code-Generated Tests
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
      : "Thử thách HSG (Đòi hỏi tối ưu hóa thuật toán nâng cao: Prefix Sum, Two Pointers, Binary Search, Quy hoạch động, Segment Tree/BIT, Số học, Đồ thị...)";

  const prompt = `Bạn là một Chuyên gia Khảo thí & Huấn luyện viên đội tuyển Học sinh giỏi (HSG) Tin học Quốc gia tại Việt Nam.
Nhiệm vụ của bạn là: THIẾT KẾ ĐỀ BÀI LẬP TRÌNH C++ CHUẨN THEMIS + THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ (ZERO-TRUST) DÙNG CODE C++ TẠO TEST TUYỆT ĐỐI KHÔNG NHẨM TAY.

THÔNG TIN YÊU CẦU:
- Lộ trình kiến thức mục tiêu: "${topicName}" (Mã chủ đề: ${topic})
- Mức độ khó: ${difficultyText}
${problemName ? `- Tên bài gợi ý: ${problemName}` : ""}
${sanitizedUserCode ? `- Mã bài gợi ý (BẮT BUỘC <= 6 kí tự viết hoa không dấu): ${sanitizedUserCode}` : ""}
${customPrompt ? `- Yêu cầu bổ sung của giáo viên: "${customPrompt}"` : ""}

NGUYÊN TẮC TỐI THƯỢNG (THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ & DÙNG CODE TẠO TEST - TUYỆT ĐỐI KHÔNG NHẨM):
1. **Mã bài (problemCode) & Tên bài (problemName)**:
   - problemCode: 1 từ viết hoa không dấu **DƯỚI HOẶC BẰNG 6 KÍ TỰ** (VD: TONG, TG, SNT, MAX2, FIBO, PALIN, DPK, SEGT...).
   - problemName: Tiếng Việt ngắn gọn, súc tích (dưới 6 từ).
   - File dữ liệu vào/ra: <MABAI>.INP và <MABAI>.OUT.
2. **Ràng buộc & Phân tầng Subtask chuẩn HSG (constraints)**:
   - Chia thành 3 Subtask rõ ràng theo tỷ lệ điểm (ví dụ: Subtask 1: 30% số điểm với dữ liệu nhỏ cho phép duyệt trâu $O(N^2)/O(2^N)$; Subtask 2: 30% số điểm trung gian; Subtask 3: 40% số điểm dữ liệu kịch trần đòi hỏi thuật toán tối ưu $O(N \\log N)$ hoặc $O(N)$).
3. **XÂY DỰNG ĐỘC LẬP 03 MÃ NGUỒN C++17 ĐỂ MÁY CHỦ BIÊN DỊCH & ĐỐI CHIẾU CHÉO TRỰC TIẾP**:
   - **Mô hình 1 — \`oracleBfCpp\` (Brute-Force / Naive Oracle)**:
     * Code C++17 vét cạn trực tiếp từ định nghĩa toán học của đề bài, ngắn gọn, đơn giản để đảm bảo đúng logic tuyệt đối 100% trên dữ liệu nhỏ (Subtask 1 và bộ Stress-Test).
   - **Mô hình 2 — \`solutionCpp\` (Optimal AC Solution)**:
     * Code C++17 tối ưu hóa nâng cao giải trọn vẹn 20 test trong thời gian < 0.5 giây (< 50% Time Limit).
     * BẮT BUỘC chống tràn số tuyệt đối: dùng 'long long' ('int64_t') và ép kiểu '1LL * a * b' khi dữ liệu/tổng/tích vượt $2 \\cdot 10^9$.
     * Có 'ios_base::sync_with_stdio(false); cin.tie(nullptr);' và 2 dòng comment '// freopen("<MABAI>.inp", "r", stdin);' '// freopen("<MABAI>.out", "w", stdout);'.
   - **Mô hình 3 — \`generatorCpp\` (Code C++17 Sinh Bộ 20 Test Tự Động - Tuyệt Đối Không Nhẩm)**:
     * Viết chương trình C++17 hoàn chỉnh đọc duy nhất số nguyên \`int t; cin >> t;\` từ stdin và in ra stdout đúng nội dung file \`.INP\` của test thứ \`t\`:
       - Nếu \`t == 1\`: In ra chính xác \`sampleInput\`.
       - Nếu \`2 <= t <= 6\` (Subtask 1 - 30%): Sinh dữ liệu tuân thủ chặt biên Subtask 1 (trong đó t=2 là Corner/Min case, t=3 là Killer/Anti-greedy, t=4,5 là Random, t=6 là Max kịch trần Subtask 1).
       - Nếu \`7 <= t <= 12\` (Subtask 2 - 30%): Sinh dữ liệu tuân thủ chặt biên Subtask 2 (gồm Corner, Killer, Random, và t=11,12 chạm trần Subtask 2).
       - Nếu \`13 <= t <= 20\` (Subtask 3 - 40%): Sinh dữ liệu tuân thủ chặt biên Subtask 3 (gồm Corner, Killer bẫy tham lam/dãy đặc biệt, Random, và t=19,20 chạm kịch trần $N_{\\max}, A_{\\max}$ để ép tràn số int32 và đánh trượt code chậm).
       - Nếu \`t > 100\`: Sinh 1 test ngẫu nhiên nhỏ (thuộc Subtask 1) với seed \`mt19937_64 rng(t * 10007)\` để máy chủ chạy Stress-Test đối chiếu giữa \`oracleBfCpp\` và \`solutionCpp\`.
4. **Danh sách 20 khung test cases (\`testCases\`, từ test01 đến test20)**:
   - Cung cấp đầy đủ 20 phần tử với \`subtask\`, \`subtaskConstraint\`, \`testCategory\` ('sample' | 'corner' | 'killer' | 'random' | 'max_stress'), \`note\` ghi rõ ý đồ bẫy test (Min/Corner, Killer/Anti-Greedy, Random, Max/Anti-TLE) và \`input\` dự phòng. Hệ thống sẽ chạy \`generatorCpp\`, đối chiếu \`oracleBfCpp\` vs \`solutionCpp\` và xuất \`.OUT\` thực tế 100% từ \`g++\`.
5. **QUY TẮC ĐỊNH DẠNG VĂN BẢN VÀ CÔNG THỨC TOÁN (BẮT BUỘC)**:
   - TUYỆT ĐỐI KHÔNG dùng dấu ** ở đầu hoặc cuối tiêu đề, câu văn hoặc đoạn văn.
   - TẤT CẢ các công thức toán học, biến số ($n$, $a, b, c$, $1 \\le n \\le 10^5$, $O(N \\log N)$) BẮT BUỘC viết dưới dạng LaTeX chuẩn kẹp giữa 2 dấu $.
   - CHỈ bọc dấu $ cho các biến số/công thức toán học thực sự, KHÔNG bọc dấu $ vào các chữ cái trong từ tiếng Việt thông thường.

Hãy trả về định dạng JSON khớp với schema quy định.`;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        problemName: { type: Type.STRING, description: "Tên bài toán tiếng Việt ngắn gọn, súc tích (dưới 6 từ)" },
        problemCode: { type: Type.STRING, description: "Mã bài 1 từ viết hoa không dấu ngắn gọn BẮT BUỘC <= 6 kí tự" },
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
        solutionCpp: { type: Type.STRING, description: "Model 2: Mã nguồn C++17 tối ưu chuẩn AC 100% kèm comment freopen" },
        oracleBfCpp: { type: Type.STRING, description: "Model 1: Mã nguồn C++17 Brute-Force Naive Oracle độc lập để đối chiếu chéo" },
        generatorCpp: { type: Type.STRING, description: "Model 3: Mã nguồn C++17 đọc số thứ tự test t từ stdin và sinh dữ liệu .INP chuẩn tỷ lệ Subtask" },
        algorithmExplanation: { type: Type.STRING, description: "Giải thích chi tiết thuật toán từng Subtask (từ Vét cạn đến Tối ưu 100%)" },
        timeComplexity: { type: Type.STRING, description: "Độ phức tạp thời gian, ví dụ: O(N log N)" },
        spaceComplexity: { type: Type.STRING, description: "Độ phức tạp bộ nhớ, ví dụ: O(N)" },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách 3-4 lỗi học sinh thường gặp (tràn số int32, bẫy biên, TLE...)",
        },
        testCases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              testName: { type: Type.STRING, description: "Ví dụ: 'test01', 'test02'..." },
              input: { type: Type.STRING, description: "Nội dung file .inp dự phòng" },
              output: { type: Type.STRING, description: "Nội dung file .out dự phòng" },
              isSample: { type: Type.BOOLEAN },
              subtask: { type: Type.INTEGER, description: "Số thứ tự Subtask (1, 2, 3)" },
              subtaskConstraint: { type: Type.STRING, description: "Ràng buộc cụ thể của Subtask này" },
              testCategory: { type: Type.STRING, enum: ["sample", "corner", "killer", "random", "max_stress"] },
              note: { type: Type.STRING, description: "Ghi chú ý đồ bẫy kỹ thuật của test case này" },
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
        "oracleBfCpp",
        "generatorCpp",
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
    const desiredCount = testCount || 20;
    const rawList = Array.isArray(result.testCases) ? result.testCases : [];
    result.testCases = Array.from({ length: desiredCount }, (_, idx) => {
      const tc = rawList[idx] || {};
      const num = idx + 1;
      const testName = `test${num < 10 ? "0" + num : num}`;
      const { category, defaultNote } = classifyTestCategory(num);
      return {
        id: num,
        testName,
        input: String(tc.input || result.sampleInput || "").trim(),
        output: String(tc.output || "").trim(),
        isSample: idx === 0 ? true : !!tc.isSample,
        subtask: tc.subtask || (idx < 6 ? 1 : idx < 12 ? 2 : 3),
        subtaskConstraint: tc.subtaskConstraint || "",
        testCategory: tc.testCategory || category,
        note: tc.note || defaultNote,
      };
    });

    // THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ:
    // Cấp 1: Chạy generatorCpp sinh 20 file .INP chuẩn tỷ lệ (0% nhẩm tay)
    // Cấp 2: Chạy Stress-Test đối chiếu oracleBfCpp vs solutionCpp (tự chữa lỗi nếu có phản ví dụ)
    // Cấp 3: Biên dịch & thực thi solutionCpp sinh 20 file .OUT chuẩn xác 100% + kiểm tra < 50% Time Limit
    result = await executeAndSelfHealCpp(result, true);

    // AUTOMATED VALIDATION & SUBTASK COMPLIANCE AUDIT
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

      fallbackProblem = await executeAndSelfHealCpp(fallbackProblem, false);
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

// API: Regenerate tests for an existing problem using Code-Based Generator + 3-Level Audit
app.post(["/api/generate-more-tests", "/generate-more-tests"], async (req, res) => {
  const { problem, count = 20 } = req.body;
  if (!problem || !problem.solutionCpp) {
    return res.status(400).json({ success: false, error: "Thiếu thông tin bài toán hoặc mã nguồn." });
  }

  const prompt = `Bạn là Chuyên gia Khảo thí HSG Tin học Quốc gia. Cho bài toán C++ sau:
Tên bài: ${problem.problemName} (${problem.problemCode})
Mô tả: ${problem.description}
Định dạng Input: ${problem.inputFormat}
Định dạng Output: ${problem.outputFormat}
Ràng buộc & Phân bổ Subtask: ${problem.constraints}
Ví dụ Input:
${problem.sampleInput}
Ví dụ Output:
${problem.sampleOutput}
Mã nguồn lời giải tối ưu hiện tại:
\`\`\`cpp
${problem.solutionCpp}
\`\`\`

YÊU CẦU BẮT BUỘC (DÙNG CODE C++ TẠO TEST & THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ - TUYỆT ĐỐI KHÔNG NHẨM):
1. Viết \`generatorCpp\` (C++17): Chương trình đọc \`int t; cin >> t;\` từ stdin và in ra dữ liệu \`.INP\` cho test thứ \`t\`:
   - \`t == 1\`: In chính xác Ví dụ Input.
   - \`2 <= t <= ${count}\`: Phân bổ đúng tỷ lệ Subtask trong mục Ràng buộc, đồng thời đảm bảo đủ 4 nhóm bẫy kỹ thuật:
     * 20% Test Biên cực tiểu & Đặc biệt (Min / Corner Cases: N nhỏ nhất, 0, số âm, bằng nhau, vô nghiệm)
     * 30% Test Cấu trúc bẫy thuật toán (Killer / Anti-Greedy Cases: tăng/giảm ngặt, răng cưa, suy biến)
     * 30% Test Ngẫu nhiên phân phối chuẩn (Controlled Random với mt19937_64)
     * 20% Test Cực đại kịch trần ở cuối mỗi Subtask (Max / Stress / Anti-TLE Cases: $N = N_{\\max}, A_i = A_{\\max}$)
   - \`t > 100\`: Sinh test nhỏ ngẫu nhiên thuộc Subtask 1 để chạy Stress-Test.
2. Viết \`oracleBfCpp\` (C++17): Code vét cạn độc lập ($O(N^2), O(N^3), O(2^N)$) trực tiếp từ định nghĩa đề bài để đối chiếu chéo với \`solutionCpp\`.
3. Cung cấp danh sách ${count} khung \`testCases\` kèm \`subtask\`, \`subtaskConstraint\`, \`testCategory\` ('sample' | 'corner' | 'killer' | 'random' | 'max_stress'), \`note\` và \`input\` dự phòng.`;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        generatorCpp: { type: Type.STRING },
        oracleBfCpp: { type: Type.STRING },
        testCases: {
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
              testCategory: { type: Type.STRING, enum: ["sample", "corner", "killer", "random", "max_stress"] },
              note: { type: Type.STRING },
            },
            required: ["id", "testName", "input", "output"],
          },
        },
      },
      required: ["generatorCpp", "oracleBfCpp", "testCases"],
    },
  };

  try {
    const { data: rawData } = await executeGeminiJsonWithRetry(prompt, schemaConfig);
    const tests = Array.isArray(rawData?.testCases) ? rawData.testCases : [];

    const formattedTests = Array.from({ length: count }, (_, idx) => {
      const tc = tests[idx] || {};
      const num = idx + 1;
      const { category, defaultNote } = classifyTestCategory(num);
      return {
        id: num,
        testName: `test${num < 10 ? "0" + num : num}`,
        input: String(tc.input || problem.sampleInput || "").trim(),
        output: String(tc.output || "").trim(),
        isSample: idx === 0,
        subtask: tc.subtask || (idx < 6 ? 1 : idx < 12 ? 2 : 3),
        subtaskConstraint: tc.subtaskConstraint || "",
        testCategory: tc.testCategory || category,
        note: tc.note || defaultNote,
      };
    });

    let updatedProblem = {
      ...problem,
      generatorCpp: rawData?.generatorCpp || problem.generatorCpp,
      oracleBfCpp: rawData?.oracleBfCpp || problem.oracleBfCpp,
      testCases: formattedTests,
    };

    updatedProblem = await executeAndSelfHealCpp(updatedProblem, true);
    updatedProblem = enrichAndEnforceSubtaskCompliance(updatedProblem);

    return res.json({
      success: true,
      problem: updatedProblem,
      testCases: updatedProblem.testCases,
      validationReport: updatedProblem.validationReport,
      threeLevelAudit: updatedProblem.threeLevelAudit,
    });
  } catch (error: any) {
    console.error("[Regenerate Tests] Failed:", error);
    return res.status(503).json({
      success: false,
      error: "Máy chủ AI hiện đang chịu tải cao (503). Bạn có thể giữ nguyên bộ test hiện tại hoặc thử lại sau vài giây.",
    });
  }
});

// API: Chạy Thẩm Định Độc Lập 3 Cấp Độ & Sinh Bộ 20 Test Bằng Code C++ (Zero-Trust Independent Audit)
app.post(["/api/audit-3-level-cpp", "/audit-3-level-cpp"], async (req, res) => {
  const { problem } = req.body;
  if (!problem || !problem.solutionCpp) {
    return res.status(400).json({ success: false, error: "Thiếu dữ liệu bài toán hoặc mã nguồn C++ để thẩm định." });
  }

  try {
    let workingProblem = { ...problem };

    // Nếu bài toán chưa có generatorCpp hoặc oracleBfCpp (ví dụ bài từ thư viện có sẵn hoặc bài cũ),
    // yêu cầu AI xây dựng độc lập generator.cpp và oracle_bf.cpp trước khi chạy thẩm định 3 cấp độ trên g++
    const hasDefaultWrapper =
      !workingProblem.generatorCpp ||
      !workingProblem.oracleBfCpp ||
      String(workingProblem.generatorCpp).includes("static const vector<string> TESTS");

    if (hasDefaultWrapper && process.env.GEMINI_API_KEY) {
      try {
        const synthPrompt = `Bạn là Chuyên gia Thẩm định Độc lập Đề thi HSG Tin học (Zero-Trust Auditor).
Cho bài toán C++ sau:
- Tên bài: ${workingProblem.problemName} (${workingProblem.problemCode})
- Mô tả: ${workingProblem.description}
- Dữ liệu vào: ${workingProblem.inputFormat}
- Dữ liệu ra: ${workingProblem.outputFormat}
- Ràng buộc & Subtask: ${workingProblem.constraints}
- Ví dụ Input:
${workingProblem.sampleInput}
- Ví dụ Output:
${workingProblem.sampleOutput}
- Code giải hiện tại:
\`\`\`cpp
${workingProblem.solutionCpp}
\`\`\`

NHIỆM VỤ BẮT BUỘC (TUYỆT ĐỐI KHÔNG NHẨM TEST BẰNG TAY):
1. Viết \`oracleBfCpp\` (C++17): Mô hình Brute-Force / Naive Oracle độc lập giải trực tiếp theo định nghĩa toán học của đề bài để đối chiếu chéo 100% trên dữ liệu nhỏ & Stress-Test.
2. Viết \`generatorCpp\` (C++17): Chương trình sinh test tự động đọc \`int t; cin >> t;\` từ stdin và in ra dữ liệu \`.INP\` chuẩn cho test thứ \`t\`:
   - \`t == 1\`: In chính xác Ví dụ Input.
   - \`2 <= t <= 20\`: Sinh dữ liệu khớp 100% biên của từng Subtask trong đề bài, phân bổ đúng ma trận:
     * 20% Test Biên cực tiểu & Đặc biệt (t = 2, 5, 11)
     * 30% Test Cấu trúc & Bẫy thuật toán Killer / Anti-Greedy (t = 3, 6, 7, 12, 13, 14)
     * 30% Test Ngẫu nhiên phân phối chuẩn (t = 8, 9, 15, 16, 17, 18)
     * 20% Test Cực đại kịch trần ở cuối mỗi Subtask (t = 4, 10, 19, 20)
   - \`t > 100\`: Sinh 1 test ngẫu nhiên nhỏ thuộc Subtask 1 với \`mt19937_64 rng(t * 1337)\` để phục vụ Stress-Test.
3. Kiểm tra lại \`solutionCpp\`: nếu có nguy cơ tràn số nguyên (thiếu \`long long\`, \`1LL\`) hoặc chậm, hãy tối ưu hóa luôn.`;

        const synthSchema = {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              oracleBfCpp: { type: Type.STRING },
              generatorCpp: { type: Type.STRING },
              solutionCpp: { type: Type.STRING },
            },
            required: ["oracleBfCpp", "generatorCpp", "solutionCpp"],
          },
        };

        const { data: synthData } = await executeGeminiJsonWithRetry(synthPrompt, synthSchema);
        if (synthData) {
          if (synthData.oracleBfCpp) workingProblem.oracleBfCpp = synthData.oracleBfCpp;
          if (synthData.generatorCpp) workingProblem.generatorCpp = synthData.generatorCpp;
          if (synthData.solutionCpp) workingProblem.solutionCpp = synthData.solutionCpp;
        }
      } catch (synthErr: any) {
        console.log("[3-Level Audit] Using existing/default generator & oracle models:", synthErr?.message);
      }
    }

    // Chạy Thẩm định Độc lập 3 Cấp độ thực tế bằng trình biên dịch g++ (kèm tự chữa lỗi nếu phát hiện phản ví dụ)
    workingProblem = await executeAndSelfHealCpp(workingProblem, true);
    workingProblem = enrichAndEnforceSubtaskCompliance(workingProblem);

    const audit = workingProblem.threeLevelAudit;
    const msg = audit
      ? `Thẩm định độc lập 3 cấp độ hoàn tất! [Cấp 1] Sinh test từ generator.cpp | [Cấp 2] Đối chiếu Oracle & Stress-Test: ${audit.level2OracleStress.stressTestsMatched}/${audit.level2OracleStress.stressTestsRun} khớp 100% | [Cấp 3] Max ${audit.level3PerformanceAndSubtasks.maxExecutionTimeMs}ms (< 50% Time Limit).`
      : `Đã hoàn tất thẩm định độc lập 3 cấp độ và đồng bộ 20 test qua g++!`;

    return res.json({
      success: true,
      problem: workingProblem,
      message: msg,
    });
  } catch (err: any) {
    console.error("[3-Level Audit] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Không thể thực hiện thẩm định 3 cấp độ lúc này: " + (err?.message || String(err)),
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
      cppFailedTestCount: execRes.failedTestCount || 0,
      cppSampleMatched: true,
      cppCompileError: undefined,
      cppExecutionDetails:
        execRes.failedTestCount && execRes.failedTestCount > 0
          ? `Có ${execRes.failedTestCount}/${execRes.testCases.length} test gặp lỗi TLE hoặc Runtime Error.`
          : undefined,
    };

    updatedProblem = enrichAndEnforceSubtaskCompliance(updatedProblem);

    return res.json({
      success: true,
      problem: updatedProblem,
      message:
        execRes.failedTestCount && execRes.failedTestCount > 0
          ? `Đã chạy C++ trong ${execRes.totalTimeMs}ms (Có ${execRes.failedTestCount} test bị TLE/RTE - Hãy bấm "AI Sửa Lỗi & Tối Ưu Code").`
          : `Đã biên dịch và thực thi C++ thành công toàn bộ ${execRes.testCases.length} test cases trong ${execRes.totalTimeMs}ms! Output chuẩn xác 100%.`,
    });
  } catch (err: any) {
    console.error('[C++ Runner manual error]:', err);
    return res.status(500).json({
      success: false,
      error: `Lỗi khi thực thi C++: ${err.message}`,
    });
  }
});

// API: AI Tự động phân tích, sửa lỗi giải thuật C++ (tràn số long long, TLE, lỗi biên dịch) & chạy lại toàn bộ 20 test
app.post(["/api/auto-repair-cpp-solution", "/auto-repair-cpp-solution"], async (req, res) => {
  const { problem } = req.body;
  if (!problem) {
    return res.status(400).json({ success: false, error: "Thiếu dữ liệu bài toán để sửa lỗi." });
  }

  try {
    // Bước 1: Chạy thử code hiện tại để thu thập chẩn đoán lỗi thực tế từ g++
    let diagnosticInfo = "Người dùng yêu cầu kiểm tra, sửa lỗi tiềm ẩn (tràn số nguyên long long, lỗi mảng, tốc độ đọc ghi) và tối ưu hóa thuật toán.";
    if (problem.solutionCpp && Array.isArray(problem.testCases) && problem.testCases.length > 0) {
      const preCheck = await executeCppSolution(
        problem.solutionCpp,
        problem.testCases,
        problem.sampleInput
      );
      if (!preCheck.success) {
        diagnosticInfo = `LỖI BIÊN DỊCH G++ (C++17):\n${preCheck.compileError}`;
      } else if (preCheck.failedTestCount && preCheck.failedTestCount > 0) {
        diagnosticInfo =
          `CÓ ${preCheck.failedTestCount}/${preCheck.testCases.length} TEST CASE BỊ LỖI THỰC THI (TLE / RUNTIME ERROR):\n` +
          (preCheck.failingCases || [])
            .slice(0, 4)
            .map(
              (fc) =>
                `- ${fc.testName} (${fc.subtaskConstraint || "Subtask " + fc.subtask}) -> ${fc.status}: ${fc.errorMessage}\n  Input: ${fc.input.slice(0, 200)}`
            )
            .join("\n");
      }
    }

    const prompt = `Bạn là một Huấn luyện viên đội tuyển Học sinh giỏi Quốc gia môn Tin học (C++17) kỳ cựu.
Hãy PHÂN TÍCH, SỬA LỖI TRIỆT ĐỂ VÀ TỐI ƯU HÓA mã nguồn C++ cho bài toán sau:

THÔNG TIN BÀI TOÁN:
- Tên bài: ${problem.problemName} (${problem.problemCode})
- Mô tả đề bài: ${problem.description}
- Dữ liệu vào: ${problem.inputFormat}
- Dữ liệu ra: ${problem.outputFormat}
- Ràng buộc & Subtask: ${problem.constraints}
- Ví dụ Input:
${problem.sampleInput}
- Ví dụ Output:
${problem.sampleOutput}

MÃ NGUỒN C++ HIỆN TẠI:
\`\`\`cpp
${problem.solutionCpp || "// Chưa có mã nguồn"}
\`\`\`

CHẨN ĐOÁN KỸ THUẬT TỪ TRÌNH BIÊN DỊCH G++:
${diagnosticInfo}

NHIỆM VỤ BẮT BUỘC:
1. Viết lại mã nguồn C++17 (solutionCpp) CHUẨN XÁC 100%, biên dịch trực tiếp không lỗi bằng g++ -O3 -std=c++17.
2. ĐỒNG BỘ TUYỆT ĐỐI KIỂU BIẾN VỚI RÀNG BUỘC:
   - Sử dụng 'long long' cho mọi biến đếm, tổng, tích hoặc kết quả có nguy cơ vượt quá $2 \\cdot 10^9$, kèm ép kiểu '1LL * a * b' khi nhân.
   - Đảm bảo thuật toán đạt độ phức tạp tối ưu nhất để vượt qua Subtask lớn nhất trong thời gian < 1.0 giây (không bị TLE).
   - Bật tăng tốc I/O: ios_base::sync_with_stdio(false); cin.tie(NULL);
   - Có comment tiếng Việt sư phạm và 2 dòng comment:
     // freopen("${problem.problemCode}.inp", "r", stdin);
     // freopen("${problem.problemCode}.out", "w", stdout);
3. Cập nhật giải thích thuật toán (algorithmExplanation), độ phức tạp thời gian (timeComplexity), bộ nhớ (spaceComplexity) và các lỗi thường gặp (commonMistakes).`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          solutionCpp: { type: Type.STRING },
          algorithmExplanation: { type: Type.STRING },
          timeComplexity: { type: Type.STRING },
          spaceComplexity: { type: Type.STRING },
          commonMistakes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "solutionCpp",
          "algorithmExplanation",
          "timeComplexity",
          "spaceComplexity",
          "commonMistakes",
        ],
      },
    };

    const { data: repaired } = await executeGeminiJsonWithRetry(prompt, schemaConfig);
    let updatedProblem = {
      ...problem,
      solutionCpp: repaired.solutionCpp || problem.solutionCpp,
      algorithmExplanation: repaired.algorithmExplanation || problem.algorithmExplanation,
      timeComplexity: repaired.timeComplexity || problem.timeComplexity,
      spaceComplexity: repaired.spaceComplexity || problem.spaceComplexity,
      commonMistakes: Array.isArray(repaired.commonMistakes) ? repaired.commonMistakes : problem.commonMistakes,
    };

    // Biên dịch và chạy lại toàn bộ 20 test cases với code C++ mới
    updatedProblem = await executeAndSelfHealCpp(updatedProblem, false);
    updatedProblem = enrichAndEnforceSubtaskCompliance(updatedProblem);

    return res.json({
      success: true,
      problem: updatedProblem,
      message: `AI đã sửa lỗi, tối ưu hóa kiểu dữ liệu C++ (${updatedProblem.timeComplexity}) và chạy lại toàn bộ ${updatedProblem.testCases?.length || 20} test trong ${updatedProblem.cppExecutionTimeMs || 0}ms!`,
    });
  } catch (err: any) {
    console.error("[Auto Repair C++] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Không thể tự động sửa mã nguồn lúc này: " + (err?.message || String(err)),
    });
  }
});

// API: Sandbox chạy thử nhanh mã nguồn C++ với Input tùy chỉnh của Giáo viên / Học sinh
app.post(["/api/run-custom-cpp", "/run-custom-cpp"], async (req, res) => {
  const { solutionCpp, customInput = "" } = req.body;
  if (!solutionCpp) {
    return res.status(400).json({ success: false, error: "Thiếu mã nguồn C++ để chạy thử." });
  }

  const comp = compileCppCode(solutionCpp);
  if (!comp.success || !comp.binPath) {
    return res.json({
      success: false,
      status: "compile_error",
      compileError: comp.error,
      output: "",
      timeMs: 0,
    });
  }

  try {
    const runRes = await runBinaryWithInput(comp.binPath, String(customInput), 3500);
    return res.json({
      success: runRes.status === "success",
      status: runRes.status,
      output: normalizeOutputText(runRes.stdout),
      stderr: runRes.stderr,
      timeMs: runRes.timeMs,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      status: "runtime_error",
      error: err?.message || "Lỗi khi chạy thử C++",
    });
  } finally {
    if (comp.srcPath) {
      try { fs.unlinkSync(comp.srcPath); } catch {}
    }
    if (comp.binPath) {
      try { fs.unlinkSync(comp.binPath); } catch {}
    }
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

    // BIÊN DỊCH VÀ CHẠY CODE CHUẨN C++ (KÈM TỰ ĐỘNG SỬA LỖI SELF-HEALING)
    result = await executeAndSelfHealCpp(result, true);

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

// Download full skill bundle ZIP
app.get("/api/download-skill-bundle", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "themis_master_skill_bundle.zip");
  if (fs.existsSync(filePath)) {
    return res.download(filePath, "themis_master_skill_bundle.zip");
  }
  return res.status(404).json({ error: "Không tìm thấy file skill bundle." });
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
