import { ProblemData } from '../types';
import { downloadBlob } from './zipGenerator';

/**
 * Normalizes any text or mathematical expressions into LaTeX standard enclosed in $...$
 * - Preserves existing $...$ and standardizes operators within (\le, \ge, \ne, \times, \dots).
 * - Leaves code blocks (```...```) and inline code (`...`) untouched.
 * - Converts raw inequalities (e.g. 1 <= n <= 10^5) into LaTeX ($1 \le n \le 10^5$).
 * - Converts powers (e.g. 10^5, 10^9, 10^18, 2^31-1) into ($10^5$, $10^9$).
 * - Converts big-O notations into ($O(N \log N)$).
 * - Converts Vietnamese variable phrases (e.g. số nguyên dương n, mảng a, đỉnh u) into LaTeX ($n$, $a$, $u$).
 */
export function standardizeLatexMath(raw: string): string {
  if (!raw) return '';

  // 1. Separate code blocks and inline code to prevent altering code
  const codeBlocks: string[] = [];
  let s = raw.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `___CODE_BLOCK_${idx}___`;
  });

  // 2. Pre-normalize unicode symbols & flattened copy-paste exponents
  s = s
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/…/g, '...')
    // Fix OCR flattened exponents: e.g. n <= 105 -> n <= 10^5
    .replace(/(<=|<|>=|>|=)\s*105\b/g, '$1 10^5')
    .replace(/(<=|<|>=|>|=)\s*106\b/g, '$1 10^6')
    .replace(/(<=|<|>=|>|=)\s*109\b/g, '$1 10^9')
    .replace(/(<=|<|>=|>|=)\s*1018\b/g, '$1 10^{18}')
    .replace(/\b2\*109\b/g, '2*10^9')
    .replace(/\b2\*10\^9\b/g, '2 \\times 10^9')
    .replace(/\b2\.10\^(\d+)\b/g, '2 \\times 10^{$1}');

  // 3. Protect existing LaTeX formulas enclosed in $...$ and clean internal operators
  const mathItems: string[] = [];
  s = s.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    let cleanF = formula
      .replace(/<=/g, ' \\le ')
      .replace(/>=/g, ' \\ge ')
      .replace(/!=/g, ' \\ne ')
      .replace(/\s*\*\s*/g, ' \\times ')
      .replace(/(\.\.\.|…)/g, ' \\dots ')
      .replace(/\s+/g, ' ')
      .trim();

    // Standardize power braces: 10^18 -> 10^{18} if multi-digit
    cleanF = cleanF.replace(/10\^(\d{2,})/g, '10^{$1}');
    const idx = mathItems.length;
    mathItems.push(cleanF);
    return `___MATH_ITEM_${idx}___`;
  });

  // 4. Sequence representations: a1, a2, ..., an -> a_1, a_2, \dots, a_n
  s = s.replace(/\b([a-zA-Z])1,\s*([a-zA-Z])2,\s*(\.\.\.|…|\\dots),\s*([a-zA-Z])n\b/g, (_m, v1, _v2, _d, _vn) => {
    const idx = mathItems.length;
    mathItems.push(`${v1}_1, ${v1}_2, \\dots, ${v1}_n`);
    return `___MATH_ITEM_${idx}___`;
  });

  // 5. Dual inequalities without $: e.g. 1 <= n <= 10^5, -10^9 <= a[i] <= 10^9, 1 <= u, v <= n
  s = s.replace(
    /(-?\d+\^?\d*|-?10\^?\d*|[a-zA-Z][a-zA-Z0-9_]*)\s*(<=|>=|<|>|=|!=)\s*([a-zA-Z0-9_\[\],\s\(\)]+?)\s*(<=|>=|<|>|=|!=)\s*(2\s*\\times\s*10\^?\d*|2\s*\*\s*10\^?\d*|10\^?\d+|\d+\^?\d*|[a-zA-Z0-9_]+)\b/g,
    (_match, p1, op1, p2, op2, p3) => {
      const o1 = op1 === '<=' ? '\\le' : op1 === '>=' ? '\\ge' : op1 === '!=' ? '\\ne' : op1;
      const o2 = op2 === '<=' ? '\\le' : op2 === '>=' ? '\\ge' : op2 === '!=' ? '\\ne' : op2;
      let left = p1.trim();
      let mid = p2.trim().replace(/\[([a-zA-Z0-9_]+)\]/g, '_$1'); // a[i] -> a_i
      let right = p3.trim().replace(/\*/g, ' \\times ');
      if (right === '105') right = '10^5';
      if (right === '109') right = '10^9';
      if (right.startsWith('10^') && right.length > 4) right = right.replace(/10\^(\d+)/, '10^{$1}');
      const idx = mathItems.length;
      mathItems.push(`${left} ${o1} ${mid} ${o2} ${right}`);
      return `___MATH_ITEM_${idx}___`;
    }
  );

  // 6. Single inequalities without $: e.g. n <= 10^5, a, b <= 10^9, ai <= 10^9, u != v
  s = s.replace(
    /\b([a-zA-Z][a-zA-Z0-9_\[\],\s]*?)\s*(<=|>=|!=|<|>)\s*(2\s*\\times\s*10\^?\d*|2\s*\*\s*10\^?\d*|10\^\d+|\d+\^?\d*|\d+)\b/g,
    (_match, p1, op, p2) => {
      const o = op === '<=' ? '\\le' : op === '>=' ? '\\ge' : op === '!=' ? '\\ne' : op;
      let varName = p1.trim().replace(/\[([a-zA-Z0-9_]+)\]/g, '_$1');
      if (varName === 'ai') varName = 'a_i';
      let val = p2.trim().replace(/\*/g, ' \\times ');
      if (val === '105') val = '10^5';
      if (val === '109') val = '10^9';
      if (val.startsWith('10^') && val.length > 4) val = val.replace(/10\^(\d+)/, '10^{$1}');
      const idx = mathItems.length;
      mathItems.push(`${varName} ${o} ${val}`);
      return `___MATH_ITEM_${idx}___`;
    }
  );

  // 7. Complexity Big-O: O(N), O(N log N), O(N^2), O(1), O(sqrt(N))
  s = s.replace(/\bO\(([a-zA-Z0-9_\s\^\*\/\+\(\)]+)\)/g, (_match, inner) => {
    let cleanInner = inner
      .replace(/log/g, '\\log ')
      .replace(/sqrt\(N\)/gi, '\\sqrt{N}')
      .replace(/sqrt\(n\)/gi, '\\sqrt{n}')
      .trim();
    const idx = mathItems.length;
    mathItems.push(`O(${cleanInner})`);
    return `___MATH_ITEM_${idx}___`;
  });

  // 8. Modulo / Arithmetic constants: 10^9 + 7, 10^9+7, 10^9 + 9
  s = s.replace(/\b(10\^\d+)\s*([\+\-])\s*(\d+)\b/g, (_m, p1, op, p2) => {
    let base = p1.trim();
    if (base.startsWith('10^') && base.length > 4) base = base.replace(/10\^(\d+)/, '10^{$1}');
    const idx = mathItems.length;
    mathItems.push(`${base} ${op} ${p2.trim()}`);
    return `___MATH_ITEM_${idx}___`;
  });

  // 9. Standalone powers: 10^5, 10^9, 10^18, 2^31 - 1, 2^63 - 1
  s = s.replace(/\b(10\^\d+|2\^\d+)(\s*-\s*1)?\b/g, (match) => {
    let m = match.trim();
    if (m.startsWith('10^') && m.length > 4) m = m.replace(/10\^(\d+)/, '10^{$1}');
    const idx = mathItems.length;
    mathItems.push(m);
    return `___MATH_ITEM_${idx}___`;
  });

  // 10. Matrix and grid dimensions: n x m, N x M, n * m
  s = s.replace(
    /(\b(ma trận|bảng|kích thước|lưới|bàn cờ)\s+)([a-zA-Z0-9]+)\s*[xX×*]\s*([a-zA-Z0-9]+)\b/gi,
    (_m, prefix, _space, d1, d2) => {
      const idx = mathItems.length;
      mathItems.push(`${d1} \\times ${d2}`);
      return `${prefix}___MATH_ITEM_${idx}___`;
    }
  );

  // 11. Units and volume: e.g. ai m3, S m3, m3, cm3, mm3
  s = s.replace(/\b([a-zA-Z][a-zA-Z0-9_]*)\s+(m3|cm3|mm3)\b/g, (_m, v, u) => {
    const idx = mathItems.length;
    let varClean = v === 'ai' ? 'a_i' : v;
    const unitLatex = u === 'm3' ? '\\text{m}^3' : u === 'cm3' ? '\\text{cm}^3' : '\\text{mm}^3';
    mathItems.push(`${varClean} \\text{ } ${unitLatex}`);
    return `___MATH_ITEM_${idx}___`;
  });
  s = s.replace(/\b(m3|cm3|mm3)\b/g, (_m, u) => {
    const idx = mathItems.length;
    const unitLatex = u === 'm3' ? '\\text{m}^3' : u === 'cm3' ? '\\text{cm}^3' : '\\text{mm}^3';
    mathItems.push(unitLatex);
    return `___MATH_ITEM_${idx}___`;
  });

  // 12. Array subscript variables: a_i, A_i, a[i]
  s = s.replace(/\b([a-zA-Z])\[([a-zA-Z0-9_]+)\]/g, (_m, arr, idx) => {
    const itemIdx = mathItems.length;
    mathItems.push(`${arr}_${idx}`);
    return `___MATH_ITEM_${itemIdx}___`;
  });

  // 12. Vietnamese mathematical phrasing variables:
  // e.g. "số nguyên dương n", "tổng của S", "đỉnh u", "đoạn [l, r]"
  s = s.replace(
    /(^|\s|\()((số nguyên dương|số nguyên|số tự nhiên|số|ước số|bội số|giá trị|tổng|tích|hiệu|độ dài|chiều dài|vị trí|chỉ số|đỉnh|cạnh|mảng|dãy số|dãy)\s+(của\s+)?)([a-zA-Z])(?=$|\s|[.,:;()\[\]])/gi,
    (_m, before, prefix, _word, _cua, v) => {
      const idx = mathItems.length;
      mathItems.push(v);
      return `${before}${prefix}___MATH_ITEM_${idx}___`;
    }
  );

  // Segments and intervals: đoạn [1, n], đoạn [l, r], khoảng (l, r)
  s = s.replace(
    /(\b(đoạn|khoảng|nửa khoảng)\s+)(\[|\()([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)(\]|\))/gi,
    (_m, prefix, _space, openB, p1, p2, closeB) => {
      const idx = mathItems.length;
      mathItems.push(`${openB}${p1}, ${p2}${closeB}`);
      return `${prefix}___MATH_ITEM_${idx}___`;
    }
  );

  // Variables followed by quantity words: "n phần tử", "k số", "m dòng", "q truy vấn"
  s = s.replace(
    /(^|\s|\()([a-zA-Z])(\s+(phần tử|số nguyên|số|dòng|cột|ký tự|đỉnh|cạnh|truy vấn|bước|lần|cây|que củi))(?=$|\s|[.,:;()\[\]])/g,
    (_m, before, v, suffix) => {
      const idx = mathItems.length;
      mathItems.push(v);
      return `${before}___MATH_ITEM_${idx}___${suffix}`;
    }
  );

  // Subtask line format: e.g. "Subtask 1 (30%): n <= 100" or "Subtask 2 (30%): n <= 10^5, a_i <= 1000"
  // Ensured by inequality matches above.

  // 11. Restore all math items wrapped strictly in $...$
  s = s.replace(/___MATH_ITEM_(\d+)___/g, (_m, id) => {
    const mathContent = mathItems[parseInt(id, 10)];
    return `$${mathContent}$`;
  });

  // 12. Restore code blocks
  s = s.replace(/___CODE_BLOCK_(\d+)___/g, (_m, id) => {
    return codeBlocks[parseInt(id, 10)];
  });

  return s;
}

export interface ProblemMarkdownOptions {
  documentType?: 'only_problem' | 'guide_and_mistakes' | 'full';
  includeSolution?: boolean;
  includeAlgorithm?: boolean;
  includeMistakes?: boolean;
  includeSubtasks?: boolean;
}

/**
 * Generates a complete, beautiful GitHub Flavored Markdown (GFM) file
 * with ALL mathematical expressions formatted in standard LaTeX enclosed in $...$
 */
export function generateProblemMarkdown(
  problem: ProblemData,
  options: ProblemMarkdownOptions = {}
): string {
  const {
    documentType = 'full',
    includeSolution = documentType !== 'only_problem',
    includeAlgorithm = documentType !== 'only_problem',
    includeMistakes = documentType !== 'only_problem',
    includeSubtasks = true,
  } = options;

  const codeFormatted = problem.problemCode ? problem.problemCode.toUpperCase() : 'PROBLEM';
  const nameFormatted = problem.problemName || 'Bài toán';

  // Standardize math in each section
  const stdDescription = standardizeLatexMath(problem.description || '');
  const stdInputFormat = standardizeLatexMath(problem.inputFormat || '');
  const stdOutputFormat = standardizeLatexMath(problem.outputFormat || '');
  const stdConstraints = standardizeLatexMath(problem.constraints || '');
  const stdExplanation = standardizeLatexMath(problem.sampleExplanation || '');
  const stdAlgorithm = standardizeLatexMath(problem.algorithmExplanation || '');
  const stdTimeComplexity = standardizeLatexMath(problem.timeComplexity || 'O(N)');
  const stdSpaceComplexity = standardizeLatexMath(problem.spaceComplexity || 'O(1)');

  const lines: string[] = [];

  // Title & Metadata
  lines.push(`# ĐỀ BÀI: ${nameFormatted.toUpperCase()}`);
  lines.push('');
  lines.push(`| Thông số | Giá trị quy định |`);
  lines.push(`| :--- | :--- |`);
  lines.push(`| **Mã bài toán** | \`${codeFormatted}\` |`);
  lines.push(`| **Chủ đề thuật toán** | ${problem.topicName || 'Lập trình thi đấu C++'} |`);
  lines.push(
    `| **Độ khó** | ${
      problem.difficulty === 'easy'
        ? 'Cơ bản (Dành cho học sinh mới)'
        : problem.difficulty === 'medium'
        ? 'Trung bình (Vừa sức HSG)'
        : 'Thử thách (Nâng cao HSG Tỉnh/Quốc Gia)'
    } |`
  );
  lines.push(`| **Thời gian chạy tối đa** | \`${problem.timeLimit || '1.0 giây'}\` |`);
  lines.push(`| **Giới hạn bộ nhớ** | \`${problem.memoryLimit || '256 MB'}\` |`);
  lines.push(`| **File mã nguồn nộp** | \`${codeFormatted}.cpp\` |`);
  lines.push(`| **File dữ liệu vào** | \`${codeFormatted}.inp\` |`);
  lines.push(`| **File dữ liệu ra** | \`${codeFormatted}.out\` |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 1. Description
  lines.push('## 1. Đặt vấn đề (Mô tả bài toán)');
  lines.push('');
  lines.push(stdDescription);
  lines.push('');

  // 2. Input Format
  lines.push(`## 2. Dữ liệu vào (Input - \`${codeFormatted}.inp\`)`);
  lines.push('');
  lines.push(stdInputFormat);
  lines.push('');

  // 3. Output Format
  lines.push(`## 3. Dữ liệu ra (Output - \`${codeFormatted}.out\`)`);
  lines.push('');
  lines.push(stdOutputFormat);
  lines.push('');

  // 4. Constraints & Subtasks
  lines.push('## 4. Giới hạn dữ liệu & Phân bổ Subtask (Constraints)');
  lines.push('');
  lines.push(stdConstraints);
  lines.push('');

  // 5. Example
  lines.push('## 5. Ví dụ minh họa');
  lines.push('');
  lines.push('### Ví dụ mẫu');
  lines.push('');
  lines.push(`| Dữ liệu vào (\`${codeFormatted}.inp\`) | Dữ liệu ra (\`${codeFormatted}.out\`) |`);
  lines.push('| :--- | :--- |');
  
  // Format sample input/output for markdown table
  const inputEscaped = (problem.sampleInput || '')
    .trim()
    .split('\n')
    .map((l) => `\`${l.trim()}\``)
    .join('<br>');
  const outputEscaped = (problem.sampleOutput || '')
    .trim()
    .split('\n')
    .map((l) => `\`${l.trim()}\``)
    .join('<br>');

  lines.push(`| ${inputEscaped} | ${outputEscaped} |`);
  lines.push('');

  lines.push('**Chi tiết dữ liệu mẫu dạng khối mã nguồn:**');
  lines.push('');
  lines.push(`**Input (\`${codeFormatted}.inp\`):**`);
  lines.push('```text');
  lines.push((problem.sampleInput || '').trim());
  lines.push('```');
  lines.push('');
  lines.push(`**Output (\`${codeFormatted}.out\`):**`);
  lines.push('```text');
  lines.push((problem.sampleOutput || '').trim());
  lines.push('```');
  lines.push('');

  if (stdExplanation) {
    lines.push('**Giải thích ví dụ:**');
    lines.push('');
    lines.push(stdExplanation);
    lines.push('');
  }

  // If only problem is requested, stop here
  if (documentType === 'only_problem') {
    lines.push('---');
    lines.push('*Bộ đề thi được khởi tạo tự động bởi Hệ thống Trợ lí Ra đề C++ chuẩn chấm thi Themis.*');
    return lines.join('\n');
  }

  // 6. Algorithm & Complexity
  if (includeAlgorithm && (problem.algorithmExplanation || problem.timeComplexity)) {
    lines.push('---');
    lines.push('');
    lines.push('## 6. Hướng dẫn giải & Phân tích thuật toán');
    lines.push('');
    if (stdAlgorithm) {
      lines.push(stdAlgorithm);
      lines.push('');
    }
    lines.push('- **Độ phức tạp thời gian:** ' + (stdTimeComplexity.startsWith('$') ? stdTimeComplexity : `$${stdTimeComplexity}$`));
    lines.push('- **Độ phức tạp không gian (bộ nhớ):** ' + (stdSpaceComplexity.startsWith('$') ? stdSpaceComplexity : `$${stdSpaceComplexity}$`));
    lines.push('');
  }

  // 7. Common Mistakes
  if (includeMistakes && problem.commonMistakes && problem.commonMistakes.length > 0) {
    lines.push('## 7. Các lỗi sai học sinh thường mắc phải & Bẫy Subtask');
    lines.push('');
    problem.commonMistakes.forEach((mistake, idx) => {
      const stdMistake = standardizeLatexMath(mistake);
      lines.push(`${idx + 1}. ${stdMistake}`);
    });
    lines.push('');
  }

  // 8. C++ Solution
  if (includeSolution && problem.solutionCpp) {
    lines.push(`## 8. Mã nguồn C++ chuẩn (${codeFormatted}.cpp)`);
    lines.push('');
    lines.push('```cpp');
    lines.push(problem.solutionCpp.trim());
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('*Bộ đề thi và hướng dẫn chấm được khởi tạo tự động bởi Hệ thống Trợ lí Ra đề C++ chuẩn Themis.*');

  return lines.join('\n');
}

/**
 * Trigger browser download of the problem markdown file
 */
export function downloadProblemMarkdown(
  problem: ProblemData,
  options: ProblemMarkdownOptions = {}
): void {
  const content = generateProblemMarkdown(problem, options);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const code = problem.problemCode ? problem.problemCode.toUpperCase() : 'DEBAI';
  const suffix = options.documentType === 'only_problem' ? '_DeBai.md' : '_DeBai_HuongDan.md';
  downloadBlob(blob, `${code}${suffix}`);
}
