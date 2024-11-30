import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '../../config.js';

// Gemini 모델 초기화
const genAI = new GoogleGenerativeAI(API_KEY);
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 제미나이에게 보낼 이미지 데이터화하는 함수
export async function dataUrlToGenerativePart(dataUrl) {
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  return {
    inlineData: { data: base64Data, mimeType: mimeType },
  };
}
