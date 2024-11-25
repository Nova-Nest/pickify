// 1. 캡쳐 버튼을 클릭해서 이미지데이터를 만든다

document.getElementById('captureBtn').addEventListener('click', async () => {
  console.log('captureBtn clicked');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // CSS 주입
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
     .capture-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
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
  document.body.appendChild(overlay);
  document.body.appendChild(selection);

  // pointerdown시 실행 함수
  const startSelecting = (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
  };

  // pointermove시 실행 함수
  // let throttleTimer;
  const updateSelection = (e) => {
    if (!isSelecting) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    selection.style.width = Math.abs(width) + 'px';
    selection.style.height = Math.abs(height) + 'px';
    selection.style.left = (width < 0 ? currentX : startX) + 'px';
    selection.style.top = (height < 0 ? currentY : startY) + 'px';
    // throttleTimer = setTimeout(() => {

    //   throttleTimer = null;
    // }, 16); // 약 60fps를 기준으로 설정
  };

  // pointerup시 실행 함수
  const completeSelection = async (e) => {
    console.log(isSelecting, 'isSelecting');
    console.log(isSelecting, 'mouseup');
    if (!isSelecting) {
      // 돔요소 없애기
      overlay.remove();
      selection.remove();
      // 이벤트 리스너 제거
      overlay.removeEventListener('mousedown', startSelecting);
      overlay.removeEventListener('mousemove', updateSelection);
      overlay.removeEventListener('mouseup', completeSelection);
      return;
    }
    isSelecting = false;
    const rect = selection.getBoundingClientRect();

    // 캡처 요청을 사이드패널로 전송
    chrome.runtime.sendMessage({
      type: 'requestCapture',
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
    // 돔요소 없애기
    overlay.remove();
    selection.remove();
    // 이벤트 리스너 제거
    overlay.removeEventListener('mousedown', startSelecting);
    overlay.removeEventListener('mousemove', updateSelection);
    overlay.removeEventListener('mouseup', completeSelection);
  };

  overlay.addEventListener('pointerdown', startSelecting);
  overlay.addEventListener('pointermove', updateSelection);
  overlay.addEventListener('pointerup', completeSelection);
}

// 사이드패널에서 캡처 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'requestCapture') {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1280;
      canvas.height = 2280;
      // canvas.width = message.rect.width;
      // canvas.height = message.rect.height;

      ctx.drawImage(img, 0, 0);
      // ctx.drawImage(
      //   img,
      //   message.rect.left,
      //   message.rect.top,
      //   message.rect.width,
      //   message.rect.height,
      //   0,
      //   0,
      //   message.rect.width,
      //   message.rect.height
      // );

      const croppedDataUrl = canvas.toDataURL();
      displayCapturedImage(croppedDataUrl);
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    }
  }
});

//-----------------

//2. 캡처된 이미지를 사이드패널에 표시

// 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl) {
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  // 기존 내용 초기화
  nowCapturedImage.innerHTML = '';

  // 캡쳐이미지
  const capturedImg = document.createElement('img');
  const timestamp = new Date().toLocaleString();
  capturedImg.src = dataUrl;
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
  saveToStorage(dataUrl, timestamp);

  // x버튼에 캡쳐이미지 없애기 함수 걸기
  document.getElementById('deleteButton').addEventListener('click', clickDeleteButton);
}

// 로컬 스토리지에 이미지 저장하는 함수
async function saveToStorage(dataUrl, timestamp) {
  await chrome.storage.local.set({
    capturedImage: {
      dataUrl,
      timestamp,
    },
  });
}

const clickDeleteButton = () => {
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  nowCapturedImage.innerHTML = '';
  nowCapturedImage.className = 'noImage';

  chrome.storage.local.set({
    capturedImage: {
      dataUrl: '',
      timestamp: '',
    },
  });
};
