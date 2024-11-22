import { GoogleGenerativeAI } from '../node_modules/@google/generative-ai/dist/index.mjs';

const genAI = new GoogleGenerativeAI("API_KEY");

// DOM 요소들을 가져옵니다
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
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

// 제출 버튼 클릭 이벤트 처리
submitButton.addEventListener("click", () => {
  const prompt = userInput.value.trim();
  if (prompt) {
    generateResponse(prompt);
  }
});

// Enter 키 입력 처리
userInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const prompt = userInput.value.trim();
    if (prompt) {
      generateResponse(prompt);
    }
  }
});