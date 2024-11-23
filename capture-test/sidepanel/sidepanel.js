function clickTab(event) {
  const id = event.target.id;
  const nowSelectedTab = document.querySelector(`#${id}`);
  const prevSelectedTab = document.querySelector(`.selectedTab`);
  if (prevSelectedTab == nowSelectedTab) return;
  nowSelectedTab.className = 'selectedTab';
  prevSelectedTab.className = '';
}

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
  const capturedImageList = document.querySelector('.capturedImageList');
  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'image-wrapper';

  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'captured-image';

  const timestamp = new Date().toLocaleString();
  const caption = document.createElement('time');
  caption.className = 'image-caption';
  caption.textContent = timestamp;

  imgWrapper.appendChild(img);
  imgWrapper.appendChild(caption);
  capturedImageList.insertBefore(imgWrapper, capturedImageList.firstChild);
  // const fragment = document.createDocumentFragment();
  // fragment.appendChild(imgWrapper);
  // capturedImageList.prepend(fragment);

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
      const capturedImageList = document.querySelector('.capturedImageList');
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
      capturedImageList.appendChild(imgWrapper);
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

  const startSelecting = (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
  };

  let throttleTimer;
  const updateSelection = (e) => {
    if (!isSelecting || throttleTimer) return;

    throttleTimer = setTimeout(() => {
      const currentX = e.clientX;
      const currentY = e.clientY;

      const width = currentX - startX;
      const height = currentY - startY;

      selection.style.width = Math.abs(width) + 'px';
      selection.style.height = Math.abs(height) + 'px';
      selection.style.left = (width < 0 ? currentX : startX) + 'px';
      selection.style.top = (height < 0 ? currentY : startY) + 'px';

      throttleTimer = null;
    }, 16); // 약 60fps를 기준으로 설정
  };

  const completeSelection = async (e) => {
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
        scale: 1, // 스케일 조정 (기본값: 2, 낮추면 성능 개선)
        scrollX: 0, // 캔버스 스크롤 조정
        scrollY: 0,
      });

      const dataUrl = screenshot.toDataURL();

      chrome.runtime.sendMessage({
        type: 'displayImage',
        dataUrl: dataUrl,
      });
    } catch (error) {
      console.error('캡처 중 오류 발생:', error);
    } finally {
      overlay.remove();
      selection.remove();

      // 이벤트 리스너 제거
      overlay.removeEventListener('mousedown', startSelecting);
      overlay.removeEventListener('mousemove', updateSelection);
      overlay.removeEventListener('mouseup', completeSelection);
    }
  };
}
