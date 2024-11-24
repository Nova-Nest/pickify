import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '../config.js';

const genAI = new GoogleGenerativeAI(API_KEY);

// DOM 요소들을 가져옵니다
// const userInput = document.getElementById("user-input");
const imageWrapper = document.getElementById('image-wrapper');
const responseDiv = document.getElementById('response');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

async function generateResponse(prompt) {
  try {
    loadingDiv.hidden = false;
    responseDiv.hidden = true;
    errorDiv.hidden = true;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

// 버튼을 클릭할떄 되는게 아니라 storage에 이미지가 있다면 되도록 처리해야함
// Analyze 버튼 클릭 이벤트 핸들러
document.getElementById('analyze-button').addEventListener('click', async () => {
  try {
    console.log()
    // 저장된 이미지 가져오기
    const storage = await chrome.storage.local.get('capturedImage');
    if (!storage.capturedImage) {
      console.error('No captured image found');
      return;
    }

    const { dataUrl } = storage.capturedImage;

    // Gemini 모델 초기화
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt =
      "What's in this image? And can you recommend a product that goes well with it and give me the link to the image and the url where the image is located? For example, if there is a knit in the image, I would like to recommend pants that match it, and if there is a MacBook, I would like to recommend a trick pad.";
    const imagePart = await dataUrlToGenerativePart(dataUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // 분석 결과 표시
    const relatedCombinationList = document.getElementById('relatedCombinationList');
    if (relatedCombinationList) {
      relatedCombinationList.textContent = text;
      relatedCombinationList.hidden = false;
    }
  } catch (error) {
    console.error('Analysis failed:', error);
  }
});
