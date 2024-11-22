import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '../config.js';

const genAI = new GoogleGenerativeAI(API_KEY);

// DOM 요소들을 가져옵니다
// const userInput = document.getElementById("user-input");
const imageWrapper = document.getElementById("image-wrapper");
const analyzeBtn = document.getElementById("analyze-button");
const responseDiv = document.getElementById("response");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");

async function generateResponse(prompt) {
  try {
    loadingDiv.hidden = false;
    responseDiv.hidden = true;
    errorDiv.hidden = true;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    responseDiv.textContent = text;
    responseDiv.hidden = false;
  } catch (error) {
    errorDiv.textContent = `오류가 발생했습니다: ${error.message}`;
    errorDiv.hidden = false;
  } finally {
    loadingDiv.hidden = true;
  }
}

// Converts a dataUrl to a GoogleGenerativeAI.Part object
async function dataUrlToGenerativePart(dataUrl) {
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  return {
    inlineData: { data: base64Data, mimeType: mimeType },
  };
}

// Analyze 버튼 클릭 이벤트 핸들러
document.getElementById('analyze-button').addEventListener('click', async () => {
  try {
    // 저장된 이미지 가져오기
    const storage = await chrome.storage.local.get('capturedImages');
    if (!storage.capturedImages) {
      console.error('No captured image found');
      return;
    }

    const { dataUrl } = storage.capturedImages;
    
    // Gemini 모델 초기화
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "What's in this image? Please describe it in detail.";
    const imagePart = await dataUrlToGenerativePart(dataUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // 분석 결과 표시
    const analysisResult = document.getElementById('analysisResult');
    if (analysisResult) {
      analysisResult.textContent = text;
      analysisResult.hidden = false;
    }

  } catch (error) {
    console.error('Analysis failed:', error);
  }
});
