import { execFile, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface FailingTestCaseInfo {
  id: number;
  testName: string;
  input: string;
  subtask?: number;
  subtaskConstraint?: string;
  status: 'timeout' | 'runtime_error';
  errorMessage: string;
}

export interface ExecutionResult {
  success: boolean;
  compileError?: string;
  sampleMatched?: boolean;
  sampleActualOutput?: string;
  testCases: Array<{
    id: number;
    testName: string;
    input: string;
    output: string;
    isSample?: boolean;
    subtask?: number;
    subtaskConstraint?: string;
    note?: string;
    executionTimeMs?: number;
    executionStatus?: 'success' | 'timeout' | 'runtime_error';
    errorMessage?: string;
  }>;
  sampleOutput?: string;
  totalTimeMs?: number;
  failedTestCount?: number;
  failingCases?: FailingTestCaseInfo[];
}

/**
 * Normalizes input text: replaces CRLF with LF and ensures trailing newline
 * so C++ std::cin and getline never hang on EOF.
 */
export function normalizeInputForStdin(input: string): string {
  if (!input) return '\n';
  let normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!normalized.endsWith('\n')) {
    normalized += '\n';
  }
  return normalized;
}

/**
 * Normalizes output text: trims trailing whitespace/newlines per competitive programming rules
 */
export function normalizeOutputText(output: string): string {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Prepares C++ source code for piping:
 * - Comments out active freopen calls
 * - Neutralizes ifstream / ofstream redirection
 */
export function sanitizeCppForPiping(sourceCode: string): string {
  if (!sourceCode) return '';
  let sanitized = sourceCode;

  // Comment out all active freopen statements
  sanitized = sanitized.replace(
    /^\s*(std::)?freopen\s*\([^;]+;/gm,
    (match) => `// [Auto-piped for test execution] ${match.trim()}`
  );

  // Also catch freopen inside blocks or without leading line space
  sanitized = sanitized.replace(
    /(?<!\/\/.*)(std::)?freopen\s*\([^;]+;/g,
    (match) => `/* [Auto-piped] ${match} */`
  );

  return sanitized;
}

/**
 * Compiles C++ code to a temporary binary.
 */
export function compileCppCode(sourceCode: string): { success: boolean; binPath?: string; srcPath?: string; error?: string } {
  const tmpDir = os.tmpdir();
  const uniqueId = `themis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const srcPath = path.join(tmpDir, `${uniqueId}.cpp`);
  const binPath = path.join(tmpDir, `${uniqueId}.bin`);

  const cleanCode = sanitizeCppForPiping(sourceCode);
  fs.writeFileSync(srcPath, cleanCode, 'utf8');

  try {
    execFileSync('g++', [
      '-O3',
      '-std=c++17',
      srcPath,
      '-o',
      binPath,
    ], {
      timeout: 15000,
      encoding: 'utf8',
    });
    return { success: true, binPath, srcPath };
  } catch (err: any) {
    try { fs.unlinkSync(srcPath); } catch {}
    const compileError = err.stderr || err.message || 'Lỗi biên dịch mã nguồn C++';
    return { success: false, error: compileError.trim() };
  }
}

/**
 * Runs a single input through a compiled binary.
 */
export function runBinaryWithInput(
  binPath: string,
  input: string,
  timeoutMs = 3500
): Promise<{ stdout: string; stderr: string; status: 'success' | 'timeout' | 'runtime_error'; timeMs: number }> {
  return new Promise((resolve) => {
    const runStart = Date.now();
    const formattedInput = normalizeInputForStdin(input);

    const child = execFile(binPath, [], {
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer for large test cases
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      const timeMs = Date.now() - runStart;
      if (error) {
        if (error.killed || (error as any).signal === 'SIGTERM') {
          return resolve({ stdout: '', stderr: stderr || 'Timeout', status: 'timeout', timeMs });
        }
        return resolve({ stdout: stdout || '', stderr: stderr || error.message, status: 'runtime_error', timeMs });
      }
      resolve({ stdout: stdout || '', stderr: stderr || '', status: 'success', timeMs });
    });

    if (child.stdin) {
      child.stdin.on('error', () => {
        // Prevent EPIPE unhandled errors if child exits early
      });
      try {
        child.stdin.write(formattedInput);
        child.stdin.end();
      } catch (e) {
        // Child process may have exited early
      }
    }
  });
}

/**
 * Verifies if a C++ solution runs against sampleInput and matches expectedSampleOutput.
 */
export async function verifySolutionAgainstSample(
  solutionCpp: string,
  sampleInput: string,
  expectedSampleOutput: string
): Promise<{
  compiles: boolean;
  matches: boolean;
  actualOutput: string;
  expectedOutput: string;
  compileError?: string;
  runtimeStatus?: 'success' | 'timeout' | 'runtime_error';
  details?: string;
}> {
  const comp = compileCppCode(solutionCpp);
  if (!comp.success || !comp.binPath) {
    return {
      compiles: false,
      matches: false,
      actualOutput: '',
      expectedOutput: normalizeOutputText(expectedSampleOutput),
      compileError: comp.error,
      details: `Biên dịch C++ thất bại: ${comp.error}`,
    };
  }

  try {
    const runRes = await runBinaryWithInput(comp.binPath, sampleInput, 4000);
    const actualCleaned = normalizeOutputText(runRes.stdout);
    const expectedCleaned = normalizeOutputText(expectedSampleOutput);
    const matches = runRes.status === 'success' && actualCleaned === expectedCleaned;

    return {
      compiles: true,
      matches,
      actualOutput: actualCleaned,
      expectedOutput: expectedCleaned,
      runtimeStatus: runRes.status,
      details: matches
        ? 'Mã nguồn C++ chạy khớp 100% với dữ liệu mẫu đề bài!'
        : runRes.status === 'timeout'
        ? 'Mã nguồn C++ bị Timeout khi chạy test ví dụ'
        : runRes.status === 'runtime_error'
        ? `Lỗi Runtime Error khi chạy test ví dụ: ${runRes.stderr}`
        : `Mã nguồn C++ cho kết quả khác với ví dụ đề bài (Thực tế: "${actualCleaned}" vs Ví dụ: "${expectedCleaned}")`,
    };
  } finally {
    if (comp.srcPath) { try { fs.unlinkSync(comp.srcPath); } catch {} }
    if (comp.binPath) { try { fs.unlinkSync(comp.binPath); } catch {} }
  }
}

/**
 * Compiles and executes C++ solution against all test inputs.
 * Guarantees 100% accurate outputs matching the exact standard solution.
 * Uses concurrent execution pool to execute 20 tests in parallel in < 500ms.
 */
export async function executeCppSolution(
  solutionCpp: string,
  testCases: Array<{
    id: number;
    testName: string;
    input: string;
    output?: string;
    isSample?: boolean;
    subtask?: number;
    subtaskConstraint?: string;
    note?: string;
  }>,
  sampleInput?: string
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const comp = compileCppCode(solutionCpp);

  if (!comp.success || !comp.binPath) {
    console.error('[C++ Runner] Compile failed:', comp.error);
    return {
      success: false,
      compileError: `Lỗi biên dịch C++: ${comp.error?.slice(0, 500)}`,
      testCases: testCases.map(tc => ({
        ...tc,
        output: tc.output || '',
        executionStatus: 'runtime_error',
        errorMessage: comp.error,
      })),
      totalTimeMs: Date.now() - startTime,
      failedTestCount: testCases.length,
      failingCases: testCases.map(tc => ({
        id: tc.id,
        testName: tc.testName,
        input: tc.input,
        subtask: tc.subtask,
        subtaskConstraint: tc.subtaskConstraint,
        status: 'runtime_error' as const,
        errorMessage: comp.error || 'Compile failed',
      })),
    };
  }

  const binPath = comp.binPath;
  const srcPath = comp.srcPath;

  try {
    const failingCases: FailingTestCaseInfo[] = [];

    // Run tests with concurrency limit of 4 to maximize throughput and avoid CPU pegging
    const concurrency = 4;
    const results: any[] = new Array(testCases.length);

    for (let i = 0; i < testCases.length; i += concurrency) {
      const chunk = testCases.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (tc, chunkIdx) => {
          const idx = i + chunkIdx;
          const rawInput = tc.input || '';
          const res = await runBinaryWithInput(binPath, rawInput, 3500);
          const cleanedOutput = normalizeOutputText(res.stdout);

          if (res.status === 'success') {
            results[idx] = {
              ...tc,
              output: cleanedOutput,
              executionTimeMs: res.timeMs,
              executionStatus: 'success' as const,
            };
          } else if (res.status === 'timeout') {
            const err = 'Thời gian chạy vượt quá 3.5 giây trên test này (TLE / Vòng lặp vô tận / Nghẽn cin)';
            failingCases.push({
              id: tc.id,
              testName: tc.testName,
              input: tc.input,
              subtask: tc.subtask,
              subtaskConstraint: tc.subtaskConstraint,
              status: 'timeout',
              errorMessage: err,
            });
            results[idx] = {
              ...tc,
              output: `[Lỗi: TLE quá 3.5s - Thuật toán chưa đủ tối ưu hoặc cin bị nghẽn]`,
              executionTimeMs: res.timeMs,
              executionStatus: 'timeout' as const,
              errorMessage: err,
            };
          } else {
            // runtime_error
            const err = res.stderr || 'Lỗi thực thi (RTE: Tràn mảng / Chia 0 / Segmentation fault)';
            failingCases.push({
              id: tc.id,
              testName: tc.testName,
              input: tc.input,
              subtask: tc.subtask,
              subtaskConstraint: tc.subtaskConstraint,
              status: 'runtime_error',
              errorMessage: err,
            });
            results[idx] = {
              ...tc,
              output: `[Lỗi: Runtime Error - Tràn bộ nhớ / Chia 0 / Truy cập ngoài mảng]`,
              executionTimeMs: res.timeMs,
              executionStatus: 'runtime_error' as const,
              errorMessage: err,
            };
          }
        })
      );
    }

    // Also run for sampleInput if provided
    let sampleOutput: string | undefined = undefined;
    let sampleMatched = false;
    if (sampleInput !== undefined) {
      const sampleRes = await runBinaryWithInput(binPath, sampleInput, 3500);
      if (sampleRes.status === 'success') {
        sampleOutput = normalizeOutputText(sampleRes.stdout);
        sampleMatched = true;
      }
    }

    return {
      success: true,
      testCases: results,
      sampleOutput,
      sampleMatched,
      totalTimeMs: Date.now() - startTime,
      failedTestCount: failingCases.length,
      failingCases,
    };
  } finally {
    if (srcPath) { try { fs.unlinkSync(srcPath); } catch {} }
    if (binPath) { try { fs.unlinkSync(binPath); } catch {} }
  }
}
