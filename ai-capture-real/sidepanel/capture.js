import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '../config.js';
import { getData } from './utils/getData.js';
import { postData } from './utils/postData.js';
import { getFromStorage, setToStorage } from './utils/storage.js';
import { postDataSome } from './utils/postDataSome.js';
// import { dummmyImageSearchData } from './dummyData.js';

// Gemini 모델 초기화
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 0. 초기 CSS 주입
async function injectCSS(tabId) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    css: `
   .capture-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100svh;
      cursor: crosshair;
      z-index: 999999;
    }
    .capture-selection {
      position: absolute;
      border: 1px dashed #E1FF3D;
      background: transparent;
      box-shadow : rgba(0,0,0,0.5) 0 0 0 9999px;
      z-index: 9999999;
    }
  `,
  });
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await injectCSS(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    await injectCSS(tabId);
  }
});

// 1. 캡쳐 버튼을 클릭해서 이미지데이터를 만든다
document.getElementById('captureBtn').addEventListener('click', async () => {
  console.log('captureBtn clicked');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 캡처 로직 실행
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeCapture,
  });
});

function initializeCapture() {
  const isAlreadyOverlay = document.querySelector('.capture-overlay');
  console.log(isAlreadyOverlay, 'isAlreadyOverlay');
  if (isAlreadyOverlay) return;
  // 초기 셋팅
  let startX,
    startY,
    isSelecting = false;
  const overlay = document.createElement('div');
  overlay.className = 'capture-overlay';

  const selection = document.createElement('div');
  selection.className = 'capture-selection';
  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  // pointerdown시 실행 함수
  const startSelecting = (e) => {
    console.log('start', e);
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = clientX + 'px';
    selection.style.top = clientY + 'px';
  };
  // pointermove시 실행 함수
  const updateSelection = (e) => {
    if (!isSelecting) {
      return;
    }
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    selection.style.width = Math.abs(width) + 'px';
    selection.style.height = Math.abs(height) + 'px';
    selection.style.left = (width < 0 ? currentX : startX) + 'px';
    selection.style.top = (height < 0 ? currentY : startY) + 'px';
  };
  // pointerup시 실행 함수
  const completeSelection = async (e) => {
    console.log(isSelecting, 'isSelecting');
    console.log(e, 'mouseup');
    if (!isSelecting) {
      // 돔요소 없애기
      overlay.remove();
      selection.remove();
      return;
    }
    isSelecting = false;
    const rect = selection.getBoundingClientRect();
    console.log(rect, 'getBoundingClientRect');

    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = currentX - startX;
    const height = currentY - startY;
    // 캡처 영역이 넓을 경우 요청을 사이드패널로 전송
    if (!rect.width <= 2 && !rect.height <= 2) {
      chrome.runtime.sendMessage({
        type: 'requestCapture',
        rect: {
          left: width < 0 ? currentX : startX,
          top: height < 0 ? currentY : startY,
          width: Math.abs(width),
          height: Math.abs(height),
        },
        window: {
          devicePixelRatio: window.devicePixelRatio,
        },
      });
    }
    // 돔요소 없애기
    overlay.remove();
    selection.remove();
    // 이벤트 리스너 제거
    overlay.removeEventListener('pointerdown', startSelecting);
    overlay.removeEventListener('pointermove', updateSelection);
    overlay.removeEventListener('pointerup', completeSelection);
  };

  overlay.addEventListener('pointerdown', startSelecting);
  overlay.addEventListener('pointermove', updateSelection);
  overlay.addEventListener('pointerup', completeSelection);
}

//-----------------

// 사이드패널에서 캡처 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'requestCapture') {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
      });

      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = message.rect.width;
        canvas.height = message.rect.height;

        ctx.drawImage(
          img,
          message.rect.left * message.window.devicePixelRatio,
          message.rect.top * message.window.devicePixelRatio,
          message.rect.width * message.window.devicePixelRatio,
          message.rect.height * message.window.devicePixelRatio,
          0,
          0,
          message.rect.width,
          message.rect.height
        );
        const croppedDataUrl = canvas.toDataURL();

        displayCapturedImage(croppedDataUrl);
        const { imageInfo } = await getWordAndKeyword(croppedDataUrl);
        const { uploadedImageUrl } = await uploadCapturedImage(croppedDataUrl);
        const { userUuid } = await getUserUuid();
        console.log(imageInfo, 'imageInfo');
        console.log(uploadedImageUrl, 'uploadedImageUrl');
        console.log(userUuid, 'userUuid');

        if (imageInfo && uploadedImageUrl && userUuid) {
          getSearchedImageListAndDisplay({ imageUrl: uploadedImageUrl, userUuid, ...imageInfo });
        }
      };
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    }
  }
});

//-----------------

// 2-2. 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl) {
  // 기존 내용 초기화
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  const searchedImageList = document.querySelector('.searchedImageList');
  const relatedCombinationList = document.querySelector('.relatedCombinationList');
  nowCapturedImage.innerHTML = '';
  searchedImageList.innerHTML = '';
  relatedCombinationList.innerHTML = '';

  // 캡쳐이미지
  const capturedImg = document.createElement('img');
  const timestamp = new Date().toLocaleString();
  capturedImg.src = dataUrl;
  capturedImg.alt = 'screen image' + timestamp;
  capturedImg.alt = 'screen image' + timestamp;

  // x버튼
  const xButton = document.createElement('button');
  xButton.type = 'button';
  xButton.id = 'deleteButton';
  const xImg = document.createElement('img');
  xImg.src = '../images/x.svg';
  xImg.alt = 'delete icon';
  xButton.appendChild(xImg);

  nowCapturedImage.appendChild(capturedImg);
  nowCapturedImage.appendChild(xButton);
  nowCapturedImage.className = '';

  // 로컬 스토리지에 저장
  setToStorage('capturedImage', { dataUrl, timestamp });

  // x버튼에 캡쳐이미지 없애기 함수 걸기
  document.getElementById('deleteButton').addEventListener('click', clickDeleteButton);

  // 검색결과 흰색 영역 보이기
  const searchResult = document.querySelector('.searchResult');
  searchResult.style.transform = 'translate(0, 0)';
  // selectedTab 초기화
  const searchImgButton = document.querySelector('#searchImgButton');
  const recommendCombinationButton = document.querySelector('#recommendCombinationButton');
  searchImgButton.className = 'selectedTab';
  recommendCombinationButton.className = '';
}

// 2-3. 이미지의 signedUrl을 만들고 백엔드에 업로드하는 함수
async function uploadCapturedImage(dataUrl) {
  // Base64 이미지를 Blob으로 변환
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('이미지 변환 실패');
  const blob = await response.blob();

  try {
    // 백엔드에서 Signed URL 받아오기
    const { signedUrl } = await getData(`/signedUrl?contentType=${blob.type}&minutes=10`);

    // Signed URL로 이미지 업로드
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type,
      },
    });

    if (uploadResponse.ok) {
      console.log('이미지 업로드 성공!');
      return { uploadedImageUrl: signedUrl };
    } else {
      throw new Error('이미지 업로드 실패');
    }
  } catch (error) {
    console.error('업로드 과정 중 오류:', error);
    caption.textContent = `${timestamp} (업로드 실패: ${error.message})`;
  }
}

// 2-4. 제미나이에게 단어와 키워드 추출하는 함수
async function getWordAndKeyword(dataUrl) {
  try {
    const prompt =
      "Returns just an JSON object with the value of 'name' being what is in the image and the value of 'keywords' being an array containing 5 noun words that are keywords related to it.";
    const imagePart = await dataUrlToGenerativePart(dataUrl);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const rawText = response.text();
    // const cleanText = rawText.replace(/```json|```/g, '').trim();
    const match = rawText.match(/```json([\s\S]*?)```/);
    const cleanText = match[1].trim();
    const imageInfo = JSON.parse(cleanText);
    return { imageInfo };
  } catch (error) {
    console.error('이미지 분석 실패', error);
  }
}

//  2-5. 스토리지 userUuid 저장해서 같이 보내는 함수
async function getUserUuid() {
  try {
    let userUuid = await getFromStorage('userUuid');

    if (!userUuid) {
      // UUID가 없을 경우 생성 및 저장
      const generateUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      userUuid = generateUUID();

      await setToStorage('userUuid', userUuid);
      console.log('새로운 userUuid가 생성되었습니다:', userUuid);
    } else {
      console.log('기존 userUuid를 반환합니다:', userUuid);
    }

    return { userUuid };
  } catch (error) {
    console.error('UUID 처리 중 오류 발생:', error);
    throw error;
  }
}

// 2-6. 위의 이미지 정보를 백엔드에 보내서 데이터를 받아 패널에 그리는 함수
async function getSearchedImageListAndDisplay(imageData) {
  const result = await postDataSome('/picky/extract', imageData);

  setToStorage('nowCaptureId', result.id);
  const searchedImageList = document.querySelector('.searchedImageList');
  searchedImageList.innerHTML = '';

  result.data.forEach((oneItem, index) => {
    const item = document.createElement('li');
    item.role = 'button';
    const img = document.createElement('img');
    img.src = oneItem.imageUrl;
    img.alt = `${oneItem.title}`;
    const a = document.createElement('a');
    a.className = 'itemInfo';
    a.target = '_blank';
    a.href = oneItem.searchUrl;
    const h3 = document.createElement('h3');
    h3.innerText = oneItem.title;

    a.appendChild(h3);
    item.appendChild(img);
    item.appendChild(a);
    searchedImageList.appendChild(item);
  });
}

//---------- 기타 함수------------

// 삭제 버튼 눌렀을 떄 지우는 함수
const clickDeleteButton = () => {
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  nowCapturedImage.innerHTML = '';
  nowCapturedImage.classList.add('noImage');

  // 흰색 영역 없애기
  const searchResult = document.querySelector('.searchResult');
  searchResult.style.transform = 'translate(0, 100%)';

  // 검색 결과 내용 지우기
  const searchedImageList = document.querySelector('.searchedImageList');
  const relatedCombinationList = document.querySelector('.relatedCombinationList');
  searchedImageList.innerHTML = '';
  relatedCombinationList.innerHTML = '';

  // 스토리지 초기화
  setToStorage('capturedImage', '');
  setToStorage('nowCaptureId', '');
};

// 제미나이에게 보낼 이미지 데이터화하는 함수
async function dataUrlToGenerativePart(dataUrl) {
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  return {
    inlineData: { data: base64Data, mimeType: mimeType },
  };
}
