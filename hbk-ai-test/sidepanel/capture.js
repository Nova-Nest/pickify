// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'displayImage') {
    displayCapturedImage(message.dataUrl);
  }
});

document.getElementById('capture-button').addEventListener('click', async () => {
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
        background: rgba(0, 0, 0, 0.3);
        cursor: crosshair;
        z-index: 999999;
      }
      .capture-selection {
        position: absolute;
        border: 2px solid #0095ff;
        background: rgba(0, 149, 255, 0.1);
        z-index: 99999;
      }
    `
  });
  // 캡처 로직 실행
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeCapture
  });
});

// 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl) {
  const imageContainer = document.getElementById('imageContainer');
  // 기존 내용 초기화
  imageContainer.innerHTML = '';
  
  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'image-wrapper';
  
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'captured-image';
  
  const timestamp = new Date().toLocaleString();
  const caption = document.createElement('div');
  caption.className = 'image-caption';
  caption.textContent = timestamp;
  
  imgWrapper.appendChild(img);
  imgWrapper.appendChild(caption);
  imageContainer.replaceChildren(imgWrapper);
  
  // 로컬 스토리지에 저장
  saveToStorage(dataUrl, timestamp);
}

// 로컬 스토리지에 이미지 저장
async function saveToStorage(dataUrl, timestamp) {
  await chrome.storage.local.set({ 
    capturedImages: { 
      dataUrl, 
      timestamp 
    } 
  });
}

// 페이지 로드시 저장된 이미지 불러오기
window.addEventListener('load', async () => {
  const storage = await chrome.storage.local.get('capturedImages');
  if (storage.capturedImages) {
    const { dataUrl, timestamp } = storage.capturedImages;
    const imageContainer = document.getElementById('imageContainer');
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'image-wrapper';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'captured-image';
    
    const caption = document.createElement('div');
    caption.className = 'image-caption';
    caption.textContent = timestamp;
    
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(caption);
    imageContainer.appendChild(imgWrapper);
  }
});

function initializeCapture() {
  let startX, startY, isSelecting = false;
  const overlay = document.createElement('div');
  overlay.className = 'capture-overlay';
  
  const selection = document.createElement('div');
  selection.className = 'capture-selection';
  
  document.body.appendChild(overlay);
  document.body.appendChild(selection);
  
  overlay.addEventListener('pointerup', async (e) => {
    if (!isSelecting) return;
    isSelecting = false;
    
    const rect = selection.getBoundingClientRect();
    
    // 캡처 요청을 사이드패널로 전송
    chrome.runtime.sendMessage({ 
      type: 'requestCapture', 
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    });

    overlay.remove();
    selection.remove();
  });
  
  overlay.addEventListener('pointerdown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
  });
  
  overlay.addEventListener('pointermove', (e) => {
    if (!isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = currentX - startX;
    const height = currentY - startY;
    
    selection.style.width = Math.abs(width) + 'px';
    selection.style.height = Math.abs(height) + 'px';
    selection.style.left = (width < 0 ? currentX : startX) + 'px';
    selection.style.top = (height < 0 ? currentY : startY) + 'px';
  });
}

// 사이드패널에서 캡처 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'requestCapture') {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {format: 'png'});
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = message.rect.width;
      canvas.height = message.rect.height;
      
      ctx.drawImage(img, 
        message.rect.left, message.rect.top, 
        message.rect.width, message.rect.height,
        0, 0, message.rect.width, message.rect.height
      );
      
      const croppedDataUrl = canvas.toDataURL();
      displayCapturedImage(croppedDataUrl);
      
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    }
  }
});