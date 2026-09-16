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

  // Include solution code if requested
  if (includeSolution && problem.solutionCpp) {
    rootFolder.file(`${codeFormatted}.cpp`, problem.solutionCpp);
  }

  // Include problem statement and instructions
  if (includeProblemDoc) {
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
${problem.commonMistakes?.map((m, i) => `${i + 1}. ${m}`).join('\n') || 'Không có.'}
----------------------------------------------------------------------
Bộ test được tạo tự động bởi Trợ Lí Ra Đề C++ (20 test chuẩn Themis).
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

  // Include Word .docx file (Đề bài, các lỗi sai thường gặp và hướng dẫn giải)
  if (shouldIncludeTeacherDoc) {
    try {
      const teacherWordBlob = await generateProblemWordBlob(problem, {
        documentType: 'guide_and_mistakes',
        includeSolution: includeSolution,
        includeExplanation: true,
        includeMistakes: true,
        includeTestCasesSummary: false,
        schoolName: 'TỔ TIN HỌC',
        examTitle: `ĐỀ BÀI, LỖI SAI & HƯỚNG DẪN GIẢI: ${problem.problemName.toUpperCase()}`,
      });
      rootFolder.file(`${codeFormatted}_HuongDan_LoiSai.docx`, teacherWordBlob);
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
