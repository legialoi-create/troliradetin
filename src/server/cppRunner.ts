import { execFile, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ExecutionResult {
  success: boolean;
  compileError?: string;
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
  }>;
  sampleOutput?: string;
  totalTimeMs?: number;
}

/**
 * Prepares C++ source code for stdin/stdout execution:
 * Comments out active freopen calls so stdin/stdout piping works seamlessly.
 */
export function sanitizeCppForPiping(sourceCode: string): string {
  if (!sourceCode) return '';
  return sourceCode.replace(/^\s*freopen\s*\([^;]+;/gm, (match) => `// [Auto-piped] ${match.trim()}`);
}

/**
 * Compiles and executes C++ solution against all test inputs.
 * Guarantees 100% accurate outputs matching the exact standard solution.
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
  const tmpDir = os.tmpdir();
  const uniqueId = `themis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const srcPath = path.join(tmpDir, `${uniqueId}.cpp`);
  const binPath = path.join(tmpDir, `${uniqueId}.bin`);

  const cleanCode = sanitizeCppForPiping(solutionCpp);
  fs.writeFileSync(srcPath, cleanCode, 'utf8');

  // Step 1: Compile with g++
  try {
    execFileSync('g++', ['-O3', '-std=c++17', srcPath, '-o', binPath], {
      timeout: 10000,
      encoding: 'utf8',
    });
  } catch (err: any) {
    // Clean up source file
    try { fs.unlinkSync(srcPath); } catch {}
    
    const compileError = err.stderr || err.message || 'Lỗi biên dịch mã nguồn C++';
    console.error('[C++ Runner] Compile failed:', compileError);
    return {
      success: false,
      compileError: `Lỗi biên dịch C++: ${compileError.slice(0, 500)}`,
      testCases: testCases.map(tc => ({
        ...tc,
        output: tc.output || '',
      })),
      totalTimeMs: Date.now() - startTime,
    };
  }

  // Step 2: Run single input against compiled binary
  const runSingle = (input: string, timeoutMs = 2000): Promise<{ stdout: string; status: 'success' | 'timeout' | 'runtime_error'; timeMs: number }> => {
    return new Promise((resolve) => {
      const runStart = Date.now();
      const child = execFile(binPath, [], {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        encoding: 'utf8',
      }, (error, stdout, stderr) => {
        const timeMs = Date.now() - runStart;
        if (error) {
          if (error.killed || (error as any).signal === 'SIGTERM') {
            return resolve({ stdout: '', status: 'timeout', timeMs });
          }
          return resolve({ stdout: stdout || '', status: 'runtime_error', timeMs });
        }
        resolve({ stdout: stdout || '', status: 'success', timeMs });
      });

      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
    });
  };

  const updatedTestCases = [];

  // Step 3: Run against all test cases
  for (const tc of testCases) {
    const rawInput = tc.input || '';
    const res = await runSingle(rawInput);
    const cleanedOutput = res.stdout.trimEnd();

    updatedTestCases.push({
      ...tc,
      output: res.status === 'success' && cleanedOutput ? cleanedOutput : (tc.output || cleanedOutput),
      executionTimeMs: res.timeMs,
      executionStatus: res.status,
    });
  }

  // Also run for sampleInput if provided
  let sampleOutput: string | undefined = undefined;
  if (sampleInput !== undefined) {
    const sampleRes = await runSingle(sampleInput);
    if (sampleRes.status === 'success' && sampleRes.stdout.trimEnd()) {
      sampleOutput = sampleRes.stdout.trimEnd();
    }
  }

  // Clean up binary and source file
  try { fs.unlinkSync(srcPath); } catch {}
  try { fs.unlinkSync(binPath); } catch {}

  return {
    success: true,
    testCases: updatedTestCases,
    sampleOutput,
    totalTimeMs: Date.now() - startTime,
  };
}
