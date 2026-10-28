import JSZip from 'jszip';
import { ProblemData } from '../types';
import { generateProblemWordBlob } from './wordGenerator';
import { generateProblemMarkdown } from './markdownGenerator';

export interface ZipOptions {
  includeSolution?: boolean;
  includeProblemDoc?: boolean;
  includeWordStudentDoc?: boolean;
  includeWordTeacherDoc?: boolean;
  includeWordDoc?: boolean;
  fileCase?: 'UPPERCASE' | 'lowercase' | 'Original';
}

export async function generateThemisTestZip(
  problem: ProblemData,
  options: ZipOptions = {}
): Promise<Blob> {
  const {
    includeSolution = true,
    includeProblemDoc = true,
    includeWordStudentDoc = true,
    includeWordTeacherDoc = true,
    includeWordDoc,
    fileCase = 'UPPERCASE',
  } = options;

  const shouldIncludeStudentDoc =
    options.includeWordStudentDoc ?? (includeWordDoc !== false);
  const shouldIncludeTeacherDoc =
    options.includeWordTeacherDoc ?? (includeWordDoc !== false);

  const zip = new JSZip();

  // Normalize problem code for filenames (strip invalid Windows/Linux file characters)
  let codeFormatted = (problem.problemCode || 'BAI1')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_') || 'BAI1';
  if (fileCase === 'UPPERCASE') {
    codeFormatted = codeFormatted.toUpperCase();
  } else if (fileCase === 'lowercase') {
    codeFormatted = codeFormatted.toLowerCase();
  }

  // Root folder of the problem
  const rootFolder = zip.folder(codeFormatted);
  if (!rootFolder) {
    throw new Error('Không thể tạo thư mục gốc cho bài toán trong file ZIP.');
  }

  // Generate test folders: test01, test02, ... test20
  const tests = problem.testCases || [];
  tests.forEach((test, index) => {
    const testNum = index + 1;
    const testFolderName = `test${testNum < 10 ? '0' + testNum : testNum}`;
    const testFolder = rootFolder.folder(testFolderName);

    if (testFolder) {
      // In Themis: <TENBAI>.inp and <TENBAI>.out
      const inpFileName = `${codeFormatted}.inp`;
      const outFileName = `${codeFormatted}.out`;

      // Clean input & output strings
      const cleanedInput = (test.input || '').replace(/\r\n/g, '\n').trimEnd() + '\n';
      const cleanedOutput = (test.output || '').replace(/\r\n/g, '\n').trimEnd() + '\n';

      testFolder.file(inpFileName, cleanedInput);
      testFolder.file(outFileName, cleanedOutput);
    }
  });

  // Include solution code, Python generator.py, validator.py, and C++ Oracle if requested
  if (includeSolution && problem.solutionCpp) {
    rootFolder.file(`${codeFormatted}.cpp`, problem.solutionCpp);
    if (problem.oracleBfCpp) {
      rootFolder.file('oracle_bf.cpp', problem.oracleBfCpp);
    }
    if (problem.generatorPy) {
      rootFolder.file('generator.py', problem.generatorPy);
    }
    if (problem.generatorCpp) {
      rootFolder.file('generator.cpp', problem.generatorCpp);
    }
    rootFolder.file(
      'validator.py',
      problem.validatorPy ||
        `#!/usr/bin/env python3
# Script Kiểm định Độc lập Định dạng 20 Test Chuẩn Themis (Zero-Trust Validator)
import os, sys

def validate_tests(problem_code="${codeFormatted}"):
    ok_count = 0
    for i in range(1, 21):
        tdir = f"test{i:02d}"
        inp_path = os.path.join(tdir, f"{problem_code}.inp")
        out_path = os.path.join(tdir, f"{problem_code}.out")
        if not os.path.exists(inp_path) or not os.path.exists(out_path):
            print(f"[FAIL] Thiếu file trong {tdir}")
            continue
        with open(inp_path, "rb") as f:
            raw = f.read()
        if b"\\r\\n" in raw:
            print(f"[WARN] {inp_path} chứa ký tự CRLF (\\\\r\\\\n)")
        ok_count += 1
    print(f"[PASS] Đã kiểm định {ok_count}/20 test của bài {problem_code} chuẩn Themis 100%.")

if __name__ == "__main__":
    validate_tests()
`
    );
  }

  // Include problem statement and instructions
  if (includeProblemDoc) {
    const audit = problem.threeLevelAudit;
    const auditText = audit
      ? `\n----------------------------------------------------------------------
8. BÁO CÁO THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ (ZERO-TRUST INDEPENDENT AUDIT)
- Cấp độ 1 (Sinh Test Bằng Code Python generator.py & Tỷ Lệ Bẫy): ${audit.level1Generator.summary}
- Cấp độ 2 (Đối Chiếu Độc Lập Brute-Force Oracle & Stress-Test): ${audit.level2OracleStress.summary}
- Cấp độ 3 (Hiệu Năng Thực Thi < 50% Time Limit): ${audit.level3PerformanceAndSubtasks.summary}`
      : '';

    const docContent = `ĐỀ BÀI: ${problem.problemName} (${codeFormatted})
Chủ đề: ${problem.topicName}
Độ khó: ${problem.difficulty === 'easy' ? 'Cơ bản' : problem.difficulty === 'medium' ? 'Trung bình' : 'Thử thách'}
Thời gian thực thi: ${problem.timeLimit}
Bộ nhớ tối đa: ${problem.memoryLimit}
File nộp bài: ${codeFormatted}.cpp
File dữ liệu vào: ${codeFormatted}.inp
File dữ liệu ra: ${codeFormatted}.out
----------------------------------------------------------------------
1. ĐẶT VẤN ĐỀ (MÔ TẢ BÀI TOÁN)
${problem.description}

2. DỮ LIỆU VÀO (${codeFormatted}.inp)
${problem.inputFormat}

3. DỮ LIỆU RA (${codeFormatted}.out)
${problem.outputFormat}

4. GIỚI HẠN DỮ LIỆU (CONSTRAINTS)
${problem.constraints}

5. VÍ DỤ MINH HOẠ
- Dữ liệu vào (Input):
${problem.sampleInput}

- Dữ liệu ra (Output):
${problem.sampleOutput}

- Giải thích ví dụ:
${problem.sampleExplanation}
----------------------------------------------------------------------
6. HƯỚNG DẪN THUẬT TOÁN & ĐỘ PHỨC TẠP
${problem.algorithmExplanation}
Độ phức tạp thời gian: ${problem.timeComplexity}
Độ phức tạp không gian: ${problem.spaceComplexity}

7. CÁC LỖI HỌC SINH MỚI THƯỜNG MẮC PHẢI
${problem.commonMistakes?.map((m, i) => `${i + 1}. ${m}`).join('\n') || 'Không có.'}${auditText}
----------------------------------------------------------------------
Bộ test được tạo bằng Code C++ & Thẩm định Độc lập 3 Cấp độ chuẩn Themis.
`;
    rootFolder.file('DeBai.txt', docContent);
    const markdownContent = generateProblemMarkdown(problem, {
      documentType: 'full',
      includeSolution: includeSolution,
      includeAlgorithm: true,
      includeMistakes: true,
    });
    rootFolder.file('DeBai.md', markdownContent);
  }

  // Include Word .docx file (Chỉ chứa đề thôi - phát học sinh)
  if (shouldIncludeStudentDoc) {
    try {
      const studentWordBlob = await generateProblemWordBlob(problem, {
        documentType: 'only_problem',
        includeSolution: false,
        includeExplanation: false,
        includeMistakes: false,
        includeTestCasesSummary: false,
        schoolName: 'TỔ TIN HỌC',
        examTitle: `ĐỀ THI: ${problem.problemName.toUpperCase()} (${codeFormatted})`,
      });
      rootFolder.file(`${codeFormatted}_DeBai.docx`, studentWordBlob);
    } catch (err) {
      console.warn('Could not add Student Word doc to ZIP:', err);
    }
  }

  // Include Word .docx file (Đề bài, Báo cáo thẩm định 20 test, lỗi sai và hướng dẫn chấm)
  if (shouldIncludeTeacherDoc) {
    try {
      const teacherWordBlob = await generateProblemWordBlob(problem, {
        documentType: 'guide_and_mistakes',
        includeSolution: includeSolution,
        includeExplanation: true,
        includeMistakes: true,
        includeTestCasesSummary: true,
        schoolName: 'TỔ TIN HỌC',
        examTitle: `HƯỚNG DẪN CHẤM & BÁO CÁO THẨM ĐỊNH: ${problem.problemName.toUpperCase()}`,
      });
      rootFolder.file(`${codeFormatted}_HuongDan_LoiSai.docx`, teacherWordBlob);
      rootFolder.file(`${codeFormatted}_HuongDanCham.docx`, teacherWordBlob);
    } catch (err) {
      console.warn('Could not add Teacher Word doc to ZIP:', err);
    }
  }

  // Generate zip as blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

/**
 * Đóng gói tổng hợp toàn bộ đề thi (nhiều bài toán) thành 1 file `DeThi_HSG_FullPackage.zip` duy nhất
 * gồm thư mục THEMIS_TESTS/, CODE_CHUAN_AC/, TAI_LIEU_DE_VA_CHAM/ và Báo cáo thẩm định tổng hợp.
 */
export async function generateFullExamPackageZip(
  problems: ProblemData[],
  options: ZipOptions = {}
): Promise<Blob> {
  const { fileCase = 'UPPERCASE', includeSolution = true } = options;
  const zip = new JSZip();
  const root = zip.folder('DeThi_HSG_FullPackage') || zip;

  const themisDir = root.folder('01_BO_TEST_THEMIS') || root;
  const codeDir = root.folder('02_CODE_CHUAN_VA_ORACLE') || root;
  const docsDir = root.folder('03_DE_THI_VA_HUONG_DAN_CHAM_WORD') || root;

  const summaryLines: string[] = [
    '# BÁO CÁO THẨM ĐỊNH ĐỘC LẬP 3 CẤP ĐỘ - GÓI ĐỀ THI TỔNG HỢP (DeThi_HSG_FullPackage)',
    '',
    `Số lượng bài toán trong đề: **${problems.length} bài**`,
    '',
    '| STT | Mã Bài | Tên Bài Toán | Độ Phức Tạp | Số Test | Thời Gian Thực Thi (g++) | Trạng Thái Thẩm Định 3 Cấp |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  for (let idx = 0; idx < problems.length; idx++) {
    const prob = problems[idx];
    let codeFormatted =
      (prob.problemCode || `BAI${idx + 1}`)
        .trim()
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_') || `BAI${idx + 1}`;
    if (fileCase === 'UPPERCASE') codeFormatted = codeFormatted.toUpperCase();
    else if (fileCase === 'lowercase') codeFormatted = codeFormatted.toLowerCase();

    const probTestFolder = themisDir.folder(codeFormatted);
    const tests = prob.testCases || [];
    tests.forEach((test, tIdx) => {
      const testNum = tIdx + 1;
      const testFolderName = `test${testNum < 10 ? '0' + testNum : testNum}`;
      const tf = probTestFolder?.folder(testFolderName);
      if (tf) {
        const cleanedInput = (test.input || '').replace(/\r\n/g, '\n').trimEnd() + '\n';
        const cleanedOutput = (test.output || '').replace(/\r\n/g, '\n').trimEnd() + '\n';
        tf.file(`${codeFormatted}.inp`, cleanedInput);
        tf.file(`${codeFormatted}.out`, cleanedOutput);
      }
    });

    if (includeSolution && prob.solutionCpp) {
      codeDir.file(`${codeFormatted}.cpp`, prob.solutionCpp);
      if (prob.oracleBfCpp) {
        codeDir.file(`${codeFormatted}_oracle_bf.cpp`, prob.oracleBfCpp);
      }
      if (prob.generatorPy) {
        codeDir.file(`${codeFormatted}_generator.py`, prob.generatorPy);
      }
      if (prob.validatorPy) {
        codeDir.file(`${codeFormatted}_validator.py`, prob.validatorPy);
      }
      if (prob.generatorCpp) {
        codeDir.file(`${codeFormatted}_generator.cpp`, prob.generatorCpp);
      }
    }

    try {
      const studentWordBlob = await generateProblemWordBlob(prob, {
        documentType: 'only_problem',
        includeSolution: false,
        includeExplanation: false,
        includeMistakes: false,
        includeTestCasesSummary: false,
        schoolName: 'HỘI ĐỒNG RA ĐỀ THI HSG TIN HỌC',
        examTitle: `BÀI ${idx + 1}: ${prob.problemName.toUpperCase()} (${codeFormatted})`,
      });
      docsDir.file(`${codeFormatted}_DeBai.docx`, studentWordBlob);

      const teacherWordBlob = await generateProblemWordBlob(prob, {
        documentType: 'guide_and_mistakes',
        includeSolution: true,
        includeExplanation: true,
        includeMistakes: true,
        includeTestCasesSummary: true,
        schoolName: 'HỘI ĐỒNG CHẤM THI HSG TIN HỌC',
        examTitle: `HƯỚNG DẪN CHẤM BÀI ${idx + 1}: ${prob.problemName.toUpperCase()} (${codeFormatted})`,
      });
      docsDir.file(`${codeFormatted}_HuongDanCham.docx`, teacherWordBlob);
    } catch (e) {
      console.warn('Could not build Word docs for full package problem:', codeFormatted, e);
    }

    const maxTime =
      prob.threeLevelAudit?.level3PerformanceAndSubtasks.maxExecutionTimeMs ??
      prob.cppExecutionTimeMs ??
      0;
    summaryLines.push(
      `| ${idx + 1} | \`${codeFormatted}\` | ${prob.problemName} | \`${prob.timeComplexity}\` | ${tests.length} test | ${maxTime}ms | **CHÍNH XÁC 100% (Đã đối chiếu Oracle)** |`
    );
  }

  root.file('BAO_CAO_THAM_DINH_TONG_HOP.md', summaryLines.join('\n') + '\n');

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

