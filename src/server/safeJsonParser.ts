/**
 * Resilient JSON parser and repair utility for LLM responses.
 * Handles:
 * - Truncated strings due to token limits ("Unterminated string in JSON")
 * - Unclosed brackets and braces
 * - Trailing commas and unfinished key-values
 * - Markdown code blocks (```json ... ```)
 */

export function repairTruncatedJson(str: string): string {
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (ch === '\\' && !isEscaped) {
        isEscaped = true;
      } else if (ch === '"' && !isEscaped) {
        inString = false;
      } else {
        isEscaped = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        stack.push('}');
      } else if (ch === '[') {
        stack.push(']');
      } else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }
  }

  let res = str;
  if (inString) {
    res += '"';
  }

  // Remove any trailing dangling colon, comma or whitespace before closing brackets
  res = res.replace(/,\s*$/, '').replace(/:\s*$/, ': null');

  while (stack.length > 0) {
    res += stack.pop();
  }
  return res;
}

export function trimToLastValidElementAndClose(str: string): string {
  let inString = false;
  let isEscaped = false;
  let lastGoodIdx = -1;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (ch === '\\' && !isEscaped) isEscaped = true;
      else if (ch === '"' && !isEscaped) inString = false;
      else isEscaped = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === '}' || ch === ']') lastGoodIdx = i;
    }
  }

  if (lastGoodIdx > 0) {
    const truncated = str.slice(0, lastGoodIdx + 1);
    return repairTruncatedJson(truncated);
  }
  return repairTruncatedJson(str);
}

export function safeJsonParse<T = any>(raw: string | undefined | null, fallback: T = {} as T): T {
  if (!raw) return fallback;
  let text = String(raw).trim();

  // Strip code fences
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  text = text.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (_e1) {
    // Continue to repair
  }

  // 2. Repair open strings and brackets
  try {
    const repaired = repairTruncatedJson(text);
    return JSON.parse(repaired);
  } catch (_e2) {
    // Continue to peel back to last valid closed element
  }

  // 3. Trim back to last complete element and close
  try {
    const cutRepaired = trimToLastValidElementAndClose(text);
    return JSON.parse(cutRepaired);
  } catch (_e3) {
    // Return fallback
  }

  return fallback;
}
