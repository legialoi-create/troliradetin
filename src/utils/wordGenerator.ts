import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageNumber,
  Footer,
} from 'docx';
import { ProblemData } from '../types';
import { standardizeLatexMath } from './markdownGenerator';

export interface WordExportOptions {
  includeSolution?: boolean;
  includeExplanation?: boolean;
  includeMistakes?: boolean;
  includeTestCasesSummary?: boolean;
  includeSchoolHeader?: boolean;
  schoolName?: string;
  examTitle?: string;
  problemNumber?: string;
  fileBaseName?: string;
  exampleHeaderFormat?: 'TitleCase' | 'UpperCase' | 'AllUpper' | 'LowerCase';
  ioSectionStyle?: 'vietnamese' | 'english';
  submissionFileName?: string;
  documentType?: 'only_problem' | 'guide_and_mistakes' | 'full';
}

/**
 * Returns formatted file names for example table (e.g. Wood.inp, Wood.out or WOOD.inp, WOOD.out)
 */
export function getExampleFileNames(
  problemCode: string,
  customBaseName?: string,
  format: 'TitleCase' | 'UpperCase' | 'AllUpper' | 'LowerCase' = 'TitleCase'
): { inp: string; out: string; base: string } {
  let base = (customBaseName || '').trim();
  if (!base) {
    base = problemCode.trim();
  }

  let formattedBase = base;
  if (format === 'TitleCase') {
    formattedBase = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    return {
      base: formattedBase,
      inp: `${formattedBase}.inp`,
      out: `${formattedBase}.out`,
    };
  } else if (format === 'UpperCase') {
    formattedBase = base.toUpperCase();
    return {
      base: formattedBase,
      inp: `${formattedBase}.inp`,
      out: `${formattedBase}.out`,
    };
  } else if (format === 'AllUpper') {
    formattedBase = base.toUpperCase();
    return {
      base: formattedBase,
      inp: `${formattedBase}.INP`,
      out: `${formattedBase}.OUT`,
    };
  } else if (format === 'LowerCase') {
    formattedBase = base.toLowerCase();
    return {
      base: formattedBase,
      inp: `${formattedBase}.inp`,
      out: `${formattedBase}.out`,
    };
  }

  return {
    base: formattedBase,
    inp: `${formattedBase}.inp`,
    out: `${formattedBase}.out`,
  };
}

/**
 * Normalizes math expressions into standard LaTeX wrapped with $ ... $
 * e.g. converts `1 <= n <= 10^5` -> `$1 \le n \le 10^5$`
 * and standardizes internal operators (<= to \le, >= to \ge, != to \ne).
 */
export function cleanMarkdownAndStandardizeLatex(raw: string): string {
  if (!raw) return '';
  return standardizeLatexMath(raw);
}

/**
 * Parses a line into docx FormattedTokens:
 * - Strips all `**` markers completely (converting bold markdown to TextRun bold).
 * - Leaves LaTeX math wrapped in `$` and styled distinctively in italic.
 * - Converts backticks `code` to monospaced TextRun.
 * - Strips any stray leading or trailing markdown artifacts.
 */
interface FormattedToken {
  text: string;
  bold?: boolean;
  italics?: boolean;
  font?: string;
  size?: number;
  color?: string;
}

function parseLineToTokens(line: string, baseSize = 23, inheritBold = false): FormattedToken[] {
  let cleaned = line.trim();

  // If the whole line was wrapped in **...** (e.g. **Subtask 1:** or **Dữ liệu vào:**)
  if (/^\*\*(.+)\*\*[:.]?$/.test(cleaned)) {
    cleaned = cleaned.replace(/^\*\*/, '').replace(/\*\*([:.]?)$/, '$1');
    return parseLineToTokens(cleaned, baseSize, true);
  }

  // Regex to split by bold **...**, LaTeX $...$, and code `...`
  const regex = /(\*\*([^*]+)\*\*)|(\$([^$]+)\$)|(`([^`]+)`)/g;
  const tokens: FormattedToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const plain = cleaned.slice(lastIndex, match.index).replace(/\*\*/g, '');
      if (plain) {
        tokens.push({
          text: plain,
          bold: inheritBold,
          font: 'Times New Roman',
          size: baseSize,
          color: inheritBold ? '0F172A' : '1E293B',
        });
      }
    }

    if (match[1]) {
      // Bold run: strip ** completely
      const boldText = match[2].replace(/\*\*/g, '');
      if (boldText.includes('$')) {
        const subTokens = parseLineToTokens(boldText, baseSize, true);
        tokens.push(...subTokens);
      } else {
        tokens.push({
          text: boldText,
          bold: true,
          font: 'Times New Roman',
          size: baseSize,
          color: '0F172A',
        });
      }
    } else if (match[3]) {
      // Math formula: output $...$ with italic styling as requested by user
      tokens.push({
        text: `$${match[4].trim()}$`,
        bold: inheritBold,
        italics: true,
        font: 'Times New Roman',
        size: baseSize,
        color: '0A2540',
      });
    } else if (match[5]) {
      // Inline code
      tokens.push({
        text: match[6],
        bold: inheritBold,
        font: 'Consolas',
        size: baseSize - 2,
        color: '1E40AF',
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const trailing = cleaned.slice(lastIndex).replace(/\*\*/g, '');
    if (trailing) {
      tokens.push({
        text: trailing,
        bold: inheritBold,
        font: 'Times New Roman',
        size: baseSize,
        color: inheritBold ? '0F172A' : '1E293B',
      });
    }
  }

  return tokens;
}

/**
 * Tokenizes a line of text, stripping ** markdown bold markers, converting $...$
 * to formatted LaTeX math TextRuns, and keeping inline code styled.
 */
function parseLineToTextRuns(line: string, baseSize = 23): TextRun[] {
  const tokens = parseLineToTokens(line, baseSize);
  return tokens.map(
    (tok) =>
      new TextRun({
        text: tok.text,
        bold: tok.bold,
        italics: tok.italics,
        font: tok.font,
        size: tok.size,
        color: tok.color,
      })
  );
}

export async function generateProblemWordBlob(
  problem: ProblemData,
  options: WordExportOptions = {}
): Promise<Blob> {
  const isOnlyProblem = options.documentType === 'only_problem';
  const isGuideAndMistakes = options.documentType === 'guide_and_mistakes';

  const includeSolution = isOnlyProblem
    ? false
    : options.includeSolution ?? true;
  const includeExplanation = isOnlyProblem
    ? false
    : isGuideAndMistakes
    ? true
    : options.includeExplanation ?? true;
  const includeMistakes = isOnlyProblem
    ? false
    : isGuideAndMistakes
    ? true
    : options.includeMistakes ?? (options.includeExplanation ?? true);
  const includeTestCasesSummary = isOnlyProblem
    ? false
    : options.includeTestCasesSummary ?? false;

  const {
    includeSchoolHeader = false,
    schoolName = 'SỞ GD&ĐT - TRƯỜNG THPT CHUYÊN',
    examTitle = 'KỲ THI CHỌN ĐỘI TUYỂN TIN HỌC',
    problemNumber: customProblemNumber,
    fileBaseName,
    exampleHeaderFormat = 'TitleCase',
    ioSectionStyle = 'vietnamese',
    submissionFileName,
  } = options;

  const exampleFiles = getExampleFileNames(
    problem.problemCode,
    fileBaseName,
    exampleHeaderFormat
  );

  const subFileText = submissionFileName
    ? submissionFileName.trim()
    : `${exampleFiles.base.toLowerCase()}.cpp hoặc ${exampleFiles.base.toLowerCase()}.py`;

  const children: any[] = [];

  // Determine default problem number if not explicitly given
  const defaultNum =
    problem.problemCode === 'WOOD' ? '4' :
    problem.problemCode === 'TAMGIAC' ? '1' :
    problem.problemCode === 'KTSNT' ? '2' :
    problem.problemCode === 'FIBO' ? '3' :
    problem.problemCode === 'SECONDMAX' ? '4' :
    problem.problemCode === 'PALIN' ? '5' :
    problem.problemCode === 'NGOACDUNG' ? '6' : '1';

  const probNum = customProblemNumber || defaultNum;
  const cleanTitle = problem.problemName.replace(/^Bài\s*\d+[.:]\s*/i, '').trim();

  // ==========================================
  // 1. NATIONAL & INSTITUTIONAL EXAM HEADER (OPTIONAL)
  // ==========================================
  if (includeSchoolHeader) {
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            // Left column: School / Department
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: schoolName.toUpperCase(),
                      font: 'Times New Roman',
                      size: 20, // 10pt
                      bold: true,
                      color: '1E293B',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'BAN KHẢO THÍ & BỒI DƯỠNG HSG',
                      font: 'Times New Roman',
                      size: 19,
                      color: '475569',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text: '───────────────',
                      font: 'Times New Roman',
                      size: 16,
                      color: '94A3B8',
                    }),
                  ],
                }),
              ],
            }),

            // Right column: National Motto
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                      font: 'Times New Roman',
                      size: 20, // 10pt
                      bold: true,
                      color: '1E293B',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Độc lập - Tự do - Hạnh phúc',
                      font: 'Times New Roman',
                      size: 19,
                      bold: true,
                      italics: true,
                      color: '1E293B',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text: '───────────────',
                      font: 'Times New Roman',
                      size: 16,
                      color: '94A3B8',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    children.push(headerTable);

    // Exam Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 30 },
        children: [
          new TextRun({
            text: examTitle.toUpperCase(),
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '0F2C59',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: 'Môn thi: TIN HỌC (LẬP TRÌNH C++)  •  Hệ thống chấm: THEMIS',
            font: 'Times New Roman',
            size: 19,
            italics: true,
            color: '475569',
          }),
        ],
      })
    );
  }

  // ==========================================
  // 2. PROBLEM TITLE LINE:
  // Bài 4. Khai thác gỗ                  Tên file: WOOD.CPP
  // ==========================================
  const titleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          // Left cell: "Bài 4. Khai thác gỗ"
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `Bài ${probNum}. ${cleanTitle}`,
                    font: 'Times New Roman',
                    size: 26, // 13pt
                    bold: true,
                    color: '0F2C59',
                  }),
                ],
              }),
            ],
          }),
          // Right cell: "Tên file: vn.cpp hoặc vn.py"
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `Tên file: ${subFileText}`,
                    font: 'Times New Roman',
                    size: 24, // 12pt
                    bold: true,
                    color: '0F2C59',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(titleTable);
  children.push(new Paragraph({ spacing: { after: 60 } }));

  // ==========================================
  // 3. PROBLEM DESCRIPTION (MÔ TẢ BÀI TOÁN)
  // ==========================================
  const stdDesc = cleanMarkdownAndStandardizeLatex(problem.description || '');
  const descParagraphs = stdDesc.split('\n');

  descParagraphs.forEach((para) => {
    const trimmed = para.trim();
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 60 } }));
      return;
    }

    const runs = parseLineToTextRuns(trimmed, 24); // 12pt standard
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH, // Justified
        indent: { firstLine: 480 }, // Indent first line of paragraph (standard Vietnamese doc style)
        spacing: { after: 100, line: 276 },
        children: runs,
      })
    );
  });

  // ==========================================
  // 4. INPUT SECTION
  // ==========================================
  const inputSectionTitle = ioSectionStyle === 'vietnamese' ? 'Dữ liệu vào:' : 'INPUT';
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 50 },
      children: [
        new TextRun({
          text: inputSectionTitle,
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    })
  );

  const stdInput = cleanMarkdownAndStandardizeLatex(problem.inputFormat || '');
  const inputLines = stdInput.split('\n');

  inputLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let textToParse = trimmed;
    // Strip leading bullet if already present
    if (/^[-*•+]\s+/.test(trimmed)) {
      textToParse = trimmed.replace(/^[-*•+]\s+/, '');
    }

    const runs = parseLineToTextRuns(textToParse, 24);
    children.push(
      new Paragraph({
        indent: { left: 360, hanging: 240 },
        spacing: { after: 60, line: 276 },
        children: [
          new TextRun({
            text: '•  ',
            font: 'Times New Roman',
            size: 22,
            bold: true,
            color: '0F2C59',
          }),
          ...runs,
        ],
      })
    );
  });

  // ==========================================
  // 5. OUTPUT SECTION
  // ==========================================
  const outputSectionTitle = ioSectionStyle === 'vietnamese' ? 'Dữ liệu ra:' : 'OUTPUT';
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 50 },
      children: [
        new TextRun({
          text: outputSectionTitle,
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    })
  );

  const stdOutput = cleanMarkdownAndStandardizeLatex(problem.outputFormat || '');
  const outputLines = stdOutput.split('\n');

  outputLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let textToParse = trimmed;
    if (/^[-*•+]\s+/.test(trimmed)) {
      textToParse = trimmed.replace(/^[-*•+]\s+/, '');
    }

    const runs = parseLineToTextRuns(textToParse, 24);
    children.push(
      new Paragraph({
        indent: { left: 360, hanging: 240 },
        spacing: { after: 60, line: 276 },
        children: [
          new TextRun({
            text: '•  ',
            font: 'Times New Roman',
            size: 22,
            bold: true,
            color: '0F2C59',
          }),
          ...runs,
        ],
      })
    );
  });

  // ==========================================
  // 6. VÍ DỤ MINH HỌA (BẢNG: Tên_bài.inp | Tên_bài.out)
  // ==========================================
  children.push(
    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text: 'Ví dụ:',
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    })
  );

  const sampleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 70, bottom: 70, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: exampleFiles.inp,
                    font: 'Times New Roman',
                    size: 22, // 11pt
                    bold: true,
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 70, bottom: 70, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: exampleFiles.out,
                    font: 'Times New Roman',
                    size: 22, // 11pt
                    bold: true,
                    color: '000000',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: (problem.sampleInput || '').split('\n').map(
              (line) =>
                new Paragraph({
                  spacing: { line: 240, after: 20 },
                  children: [
                    new TextRun({
                      text: line || ' ',
                      font: 'Consolas',
                      size: 20, // 10pt
                      color: '000000',
                    }),
                  ],
                })
            ),
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: (problem.sampleOutput || '').split('\n').map(
              (line) =>
                new Paragraph({
                  spacing: { line: 240, after: 20 },
                  children: [
                    new TextRun({
                      text: line || ' ',
                      font: 'Consolas',
                      size: 20, // 10pt
                      color: '000000',
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
    ],
  });

  children.push(sampleTable);

  // ==========================================
  // 7. RÀNG BUỘC VÀ PHÂN BỔ SUBTASK (* Ràng buộc:)
  // ==========================================
  children.push(
    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text: '* Ràng buộc:',
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
          color: '0F2C59',
        }),
      ],
    })
  );

  const stdConstraints = cleanMarkdownAndStandardizeLatex(problem.constraints || '');
  const constraintLines = stdConstraints.split('\n');

  constraintLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let textToParse = trimmed;
    if (/^[-*•+]\s+/.test(trimmed)) {
      textToParse = trimmed.replace(/^[-*•+]\s+/, '');
    }

    const runs = parseLineToTextRuns(textToParse, 23);
    children.push(
      new Paragraph({
        indent: { left: 360, hanging: 240 },
        spacing: { after: 50, line: 276 },
        children: [
          new TextRun({
            text: '- ',
            font: 'Times New Roman',
            size: 23,
            bold: true,
            color: '0F2C59',
          }),
          ...runs,
        ],
      })
    );
  });

  // ==========================================
  // 8. BỔ SUNG PHÍA DƯỚI (NHỮNG THỨ CẦN THIẾT CHO GIÁO VIÊN & HỌC SINH)
  // ==========================================

  // 8.1. GIẢI THÍCH VÍ DỤ (nếu có)
  if (problem.sampleExplanation) {
    const stdExp = cleanMarkdownAndStandardizeLatex(problem.sampleExplanation);
    const expRuns = parseLineToTextRuns(stdExp, 23);

    children.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({
            text: '* Giải thích ví dụ:',
            font: 'Times New Roman',
            size: 23,
            bold: true,
            color: '0F2C59',
          }),
        ],
      }),
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 100, line: 276 },
        children: expRuns,
      })
    );
  }

  // ==========================================
  // 8.2. CÁC LỖI SAI HỌC SINH THƯỜNG MẮC PHẢI (TÙY CHỌN)
  // ==========================================
  if (includeMistakes) {
    const mistakesList =
      problem.commonMistakes && problem.commonMistakes.length > 0
        ? problem.commonMistakes
        : [
            'Tràn số nguyên 32-bit: Cần chú ý dùng kiểu dữ liệu `long long` khi dữ liệu hoặc giá trị tích/tổng vượt quá $2 \\times 10^9$.',
            'Chưa xử lý hết các trường hợp biên đặc biệt (ví dụ: $N=0, 1$, mảng toàn số âm, không tìm thấy kết quả thì in ra -1).',
            'Vượt quá giới hạn thời gian chạy (Time Limit Exceeded - TLE) do dùng thuật toán vét cạn chưa tối ưu cho subtask lớn.',
            'Quên cấu hình đọc/ghi tệp theo định dạng của hệ thống chấm Themis (`freopen`).',
          ];

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: '* Các lỗi sai học sinh thường mắc phải (Lưu ý sư phạm):',
            font: 'Times New Roman',
            size: 24,
            bold: true,
            color: 'B91C1C', // Deep red
          }),
        ],
      })
    );

    mistakesList.forEach((mistake, idx) => {
      const cleanedMistake = cleanMarkdownAndStandardizeLatex(mistake);
      children.push(
        new Paragraph({
          indent: { left: 360, hanging: 240 },
          spacing: { after: 50, line: 276 },
          children: [
            new TextRun({
              text: `Lỗi ${idx + 1}: `,
              font: 'Times New Roman',
              size: 22,
              bold: true,
              color: 'B91C1C',
            }),
            ...parseLineToTextRuns(cleanedMistake, 22),
          ],
        })
      );
    });
  }

  // ==========================================
  // 8.3. HƯỚNG DẪN GIẢI & PHÂN TÍCH THUẬT TOÁN (TÙY CHỌN)
  // ==========================================
  if (includeExplanation && problem.algorithmExplanation) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: '* Hướng dẫn giải & Phân tích thuật toán:',
            font: 'Times New Roman',
            size: 24,
            bold: true,
            color: '0F2C59',
          }),
        ],
      })
    );

    const stdAlgo = cleanMarkdownAndStandardizeLatex(problem.algorithmExplanation);
    const algoLines = stdAlgo.split('\n');

    algoLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const isNumbered = /^\d+[.)]\s+/.test(trimmed);
      const runs = parseLineToTextRuns(trimmed, 23);

      children.push(
        new Paragraph({
          indent: isNumbered ? { left: 360 } : { left: 180 },
          spacing: { after: 60, line: 276 },
          children: runs,
        })
      );
    });

    // Complexity Evaluation
    const tc = cleanMarkdownAndStandardizeLatex(problem.timeComplexity || 'O(N)');
    const sc = cleanMarkdownAndStandardizeLatex(problem.spaceComplexity || 'O(1)');

    children.push(
      new Paragraph({
        indent: { left: 360, hanging: 240 },
        spacing: { before: 60, after: 40 },
        children: [
          new TextRun({
            text: '•  Độ phức tạp thời gian (Time Complexity): ',
            font: 'Times New Roman',
            size: 22,
            bold: true,
          }),
          ...parseLineToTextRuns(tc, 22),
        ],
      }),
      new Paragraph({
        indent: { left: 360, hanging: 240 },
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '•  Độ phức tạp bộ nhớ (Space Complexity): ',
            font: 'Times New Roman',
            size: 22,
            bold: true,
          }),
          ...parseLineToTextRuns(sc, 22),
        ],
      })
    );
  }

  // 8.4. MÃ NGUỒN C++ THAM KHẢO CHUẨN THEMIS (TÙY CHỌN)
  if (includeSolution && problem.solutionCpp) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `* Mã nguồn C++ tham khảo chuẩn Themis (${problem.problemCode.toUpperCase()}.CPP):`,
            font: 'Times New Roman',
            size: 24,
            bold: true,
            color: '0F2C59',
          }),
        ],
      })
    );

    const codeLines = problem.solutionCpp.split('\n');
    const codeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 16, color: '2563EB' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: codeLines.map(
                (line) =>
                  new Paragraph({
                    spacing: { line: 240, after: 20 },
                    children: [
                      new TextRun({
                        text: line || ' ',
                        font: 'Consolas',
                        size: 19, // 9.5pt
                        color: line.trim().startsWith('//') ? '64748B' : '0F172A',
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    });

    children.push(codeTable);
  }

  // 8.4. BẢNG DANH MỤC CÁC BỘ TEST THEMIS (TÙY CHỌN)
  if (includeTestCasesSummary && problem.testCases && problem.testCases.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `* Bảng danh mục ${problem.testCases.length} bộ test Themis:`,
            font: 'Times New Roman',
            size: 24,
            bold: true,
            color: '0F2C59',
          }),
        ],
      })
    );

    const testRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Thư mục', bold: true, font: 'Times New Roman', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Dữ liệu vào (.inp)', bold: true, font: 'Times New Roman', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Kết quả (.out)', bold: true, font: 'Times New Roman', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Mục đích test', bold: true, font: 'Times New Roman', size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ];

    problem.testCases.forEach((tc) => {
      testRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
              },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: tc.testName, font: 'Consolas', size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
              },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: tc.input.length > 35 ? tc.input.slice(0, 32) + '...' : tc.input,
                      font: 'Consolas',
                      size: 18,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
              },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: tc.output.length > 25 ? tc.output.slice(0, 22) + '...' : tc.output,
                      font: 'Consolas',
                      size: 18,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
              },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: tc.note || (tc.isSample ? 'Ví dụ mẫu' : 'Test ngẫu nhiên'),
                      font: 'Times New Roman',
                      size: 18,
                      color: '475569',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: testRows,
      })
    );
  }

  // ==========================================
  // FOOTER WITH PAGE NUMBERS
  // ==========================================
  const docFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `Bài thi: ${problem.problemCode}  •  `,
            font: 'Times New Roman',
            size: 18,
            color: '64748B',
          }),
          new TextRun({
            text: 'Trang ',
            font: 'Times New Roman',
            size: 18,
            color: '64748B',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: 'Times New Roman',
            size: 18,
            bold: true,
            color: '1E293B',
          }),
          new TextRun({
            text: ' / ',
            font: 'Times New Roman',
            size: 18,
            color: '64748B',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: 'Times New Roman',
            size: 18,
            color: '64748B',
          }),
        ],
      }),
    ],
  });

  // Create docx document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 20mm
              bottom: 1134,
              left: 1417, // 25mm standard for binding
              right: 1134,
            },
          },
        },
        footers: {
          default: docFooter,
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

