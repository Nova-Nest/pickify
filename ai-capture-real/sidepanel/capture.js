import { getSearchedImage } from './searchImage.js';
import { setToStorage } from './utils/storage.js';

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
      // 1. 이미지 캡쳐 후 자르기
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

        // 3. 이미지 검색
        getSearchedImage(croppedDataUrl);
      };
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    }
  }
});

// 2. 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl) {
  // 기존 내용 초기화
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  nowCapturedImage.innerHTML = '';

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
