// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'displayImage') {
    displayCapturedImage(message.dataUrl);
  }
});

document.getElementById('captureBtn').addEventListener('click', async () => {
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
      }
    `,
  });

  // html2canvas 스크립트 주입
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['lib/html2canvas.min.js'],
  });

  // 캡처 로직 실행
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeCapture,
  });
});

// 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl) {
  const imageContainer = document.getElementById('imageContainer');
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
  imageContainer.insertBefore(imgWrapper, imageContainer.firstChild);

  // 로컬 스토리지에 저장
  saveToStorage(dataUrl, timestamp);
}

// 로컬 스토리지에 이미지 저장
async function saveToStorage(dataUrl, timestamp) {
  const storage = await chrome.storage.local.get('capturedImages');
  const images = storage.capturedImages || [];
  images.unshift({ dataUrl, timestamp });
  await chrome.storage.local.set({ capturedImages: images });
}

// 페이지 로드시 저장된 이미지 불러오기
window.addEventListener('load', async () => {
  const storage = await chrome.storage.local.get('capturedImages');
  if (storage.capturedImages) {
    storage.capturedImages.forEach(({ dataUrl, timestamp }) => {
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
    });
  }
});

function initializeCapture() {
  let startX,
    startY,
    isSelecting = false;
  const overlay = document.createElement('div');
  overlay.className = 'capture-overlay';

  const selection = document.createElement('div');
  selection.className = 'capture-selection';

  document.body.appendChild(overlay);
  document.body.appendChild(selection);

  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
  });

  overlay.addEventListener('mousemove', (e) => {
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

  overlay.addEventListener('mouseup', async (e) => {
    isSelecting = false;

    const rect = selection.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    try {
      // html2canvas가 전역으로 사용 가능
      const screenshot = await html2canvas(document.body, {
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
        logging: false,
        useCORS: true,
      });

      const dataUrl = screenshot.toDataURL();

      chrome.runtime.sendMessage({
        type: 'displayImage',
        dataUrl: dataUrl,
      });
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    }

    overlay.remove();
    selection.remove();
  });
}
