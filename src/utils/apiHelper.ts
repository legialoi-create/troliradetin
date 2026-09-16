/**
 * Helper to safely parse API responses and provide meaningful error messages,
 * especially when deployed to platforms like Vercel, Netlify, or Render
 * where missing backend routes return HTML (e.g. 404 "The page could not be found").
 */
export async function safeParseJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    if (
      text.includes('The page could not be found') ||
      text.includes('404') ||
      response.status === 404
    ) {
      throw new Error(
        'Không tìm thấy dịch vụ Backend API (/api). Nếu bạn đang triển khai trên Vercel, hãy đảm bảo đã cấu hình Serverless Functions (vercel.json) và cài đặt biến môi trường GEMINI_API_KEY trong Project Settings của Vercel.'
      );
    }
    if (text.includes('FUNCTION_INVOCATION_FAILED')) {
      throw new Error(
        'Hàm Backend trên Vercel gặp sự cố (FUNCTION_INVOCATION_FAILED). Nguyên nhân 1: Chưa cấu hình GEMINI_API_KEY. Nguyên nhân 2: Code trên Vercel là bản cũ (chưa cấu hình vùng sin1). Vui lòng cập nhật code mới nhất lên GitHub và Deploy lại.'
      );
    }
    if (response.status === 504 || text.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      throw new Error(
        'Máy chủ phản hồi quá thời gian quy định (Timeout). Vui lòng thử lại với yêu cầu ngắn gọn hơn.'
      );
    }
    throw new Error(
      `Máy chủ phản hồi không hợp lệ (${response.status}): ${text.slice(0, 120)}`
    );
  }

  return data as T;
}
