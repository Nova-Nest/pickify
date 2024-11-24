# Using the Gemini API in a Chrome Extension.

This sample demonstrates how to use the Gemini Cloud API in a Chrome Extension.

## Overview

The extension provides a chat interface for the Gemini API. To learn more about the API head over to [https://ai.google.dev/](https://ai.google.dev/).

## Running this extension

1. Clone this repository.
2. Download the Gemini API client by running:
   ```sh
   npm install
   ```
3. [Retrieve an API key](https://ai.google.dev/gemini-api/docs/api-key) and update [functional-samples/ai.gemini-in-the-cloud/sidepanel/index.js](functional-samples/ai.gemini-in-the-cloud/sidepanel/index.js) (only for testing).    
   [API 키 가져오기](https://aistudio.google.com/app/apikey?hl=ko) 를 통해 자신의 API 키를 생성합니다.
   ![스크린샷 2024-11-23 오후 9 44 44](https://github.com/user-attachments/assets/3d5ffad1-0dbb-49b1-94a9-925c162d9629)
4. hbk-ai-test/config.js 파일을 생성하고 자신의 API 키를 입력합니다.
   ```sh
   export const API_KEY = "YOUR_API_KEY";
   ```
5. Compile the JS bundle for the sidepanel implementation by running:
   ```sh
   npm run build
   ```
6. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
7. Click the extension icon.
8. Interact with the prompt API in the sidebar.
9. 캡처 버튼을 통해 현재 화면을 캡처합니다.
10. 캡처된 이미지는 사이드패널에 표시됩니다.
11. 캡처된 이미지는 로컬 스토리지에 저장됩니다.
12. 분석 버튼을 통해 캡처된 이미지를 분석합니다.
13. 분석 결과는 사이드패널에 표시됩니다.