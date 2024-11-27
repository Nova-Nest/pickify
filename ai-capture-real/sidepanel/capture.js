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
  if (changeInfo.status === "complete") {
    await injectCSS(tabId);
  }
});

// 1. 캡쳐 버튼을 클릭해서 이미지데이터를 만든다

document.getElementById("captureBtn").addEventListener("click", async () => {
  console.log("captureBtn clicked");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 캡처 로직 실행
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeCapture,
  });
});

function initializeCapture() {
  const isAlreadyOverlay = document.querySelector(".capture-overlay");
  console.log(isAlreadyOverlay, "isAlreadyOverlay");
  if (isAlreadyOverlay) return;
  // 초기 셋팅
  let startX,
    startY,
    isSelecting = false;
  const overlay = document.createElement("div");
  overlay.className = "capture-overlay";

  const selection = document.createElement("div");
  selection.className = "capture-selection";
  overlay.appendChild(selection);
  document.body.appendChild(overlay);
  // document.body.appendChild(selection);

  // pointerdown시 실행 함수
  const startSelecting = (e) => {
    console.log("start", e);
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = clientX + "px";
    selection.style.top = clientY + "px";
  };

  const updateSelection = (e) => {
    if (!isSelecting) {
      return;
    }
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    selection.style.width = Math.abs(width) + "px";
    selection.style.height = Math.abs(height) + "px";
    selection.style.left = (width < 0 ? currentX : startX) + "px";
    selection.style.top = (height < 0 ? currentY : startY) + "px";
  };

  // pointerup시 실행 함수
  const completeSelection = async (e) => {
    console.log(isSelecting, "isSelecting");
    console.log(e, "mouseup");
    if (!isSelecting) {
      // 돔요소 없애기
      overlay.remove();
      selection.remove();
      return;
    }
    isSelecting = false;
    const rect = selection.getBoundingClientRect();
    console.log(rect, "getBoundingClientRect");

    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = currentX - startX;
    const height = currentY - startY;
    // client말고 페이지x로 해볼것...
    // 캡처 영역이 넓을 경우 요청을 사이드패널로 전송
    if (!rect.width <= 2 && !rect.height <= 2) {
      chrome.runtime.sendMessage({
        type: "requestCapture",
        rect: {
          left: width < 0 ? currentX : startX,
          top: height < 0 ? currentY : startY,
          width: Math.abs(width),
          height: Math.abs(height),
        },
        window: {
          devicePixelRatio: window.devicePixelRatio,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        },
      });
    }
    // 돔요소 없애기
    overlay.remove();
    selection.remove();
    // 이벤트 리스너 제거
    overlay.removeEventListener("pointerdown", startSelecting);
    overlay.removeEventListener("pointermove", updateSelection);
    overlay.removeEventListener("pointerup", completeSelection);
  };

  overlay.addEventListener("pointerdown", startSelecting);
  overlay.addEventListener("pointermove", updateSelection);
  overlay.addEventListener("pointerup", completeSelection);
}

// 사이드패널에서 캡처 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "requestCapture") {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: "png",
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const canvas2 = document.createElement("canvas");
      const ctx2 = canvas.getContext("2d");

      // canvas.width = 1280;
      // canvas.height = 2280;
      // canvas.width = message.rect.width;
      // canvas.height = message.rect.height;

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

      const scale = message.window.devicePixelRatio; // 디바이스 픽셀 배율
      canvas.width = message.rect.width * scale;
      canvas.height = message.rect.height * scale;
      ctx.scale(scale, scale);
      // 이랬더니 스크롤을 더했더니 훨씬 밑에를 캡쳐함 - 아까는 위를 캡쳐했는데
      ctx.drawImage(
        img,
        message.rect.left * scale,
        message.rect.top * scale,
        message.rect.width * scale,
        message.rect.height * scale,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedDataUrl = canvas.toDataURL();
      displayCapturedImage(croppedDataUrl, dataUrl);
    } catch (error) {
      console.error("캡처 중 오류 발생:", error);
    }
  }
});

//-----------------

//2. 캡처된 이미지를 사이드패널에 표시

// 캡처된 이미지를 사이드패널에 표시하는 함수
function displayCapturedImage(dataUrl, imageUrl) {
  const nowCapturedFullImage = document.getElementById("nowCapturedFullImage");
  nowCapturedFullImage.innerHTML = "";
  const nowcapturedFullImg = document.createElement("img");
  nowcapturedFullImg.src = imageUrl;
  nowCapturedFullImage.appendChild(nowcapturedFullImg);

  const nowCapturedImage = document.getElementById("nowCapturedImage");
  // 기존 내용 초기화
  nowCapturedImage.innerHTML = "";

  // 캡쳐이미지
  const capturedImg = document.createElement("img");
  const timestamp = new Date().toLocaleString();
  capturedImg.src = dataUrl;
  capturedImg.alt = "screen image" + timestamp;

  // x버튼
  const xButton = document.createElement("button");
  xButton.type = "button";
  xButton.id = "deleteButton";
  const xImg = document.createElement("img");
  xImg.src = "../images/x.svg";
  xImg.alt = "delete icon";
  xButton.appendChild(xImg);

  nowCapturedImage.appendChild(capturedImg);
  nowCapturedImage.appendChild(xButton);
  nowCapturedImage.className = "";

  // 로컬 스토리지에 저장
  saveToStorage(dataUrl, timestamp);

  // x버튼에 캡쳐이미지 없애기 함수 걸기
  document
    .getElementById("deleteButton")
    .addEventListener("click", clickDeleteButton);
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
  const nowCapturedImage = document.getElementById("nowCapturedImage");
  nowCapturedImage.innerHTML = "";
  nowCapturedImage.className = "noImage";

  chrome.storage.local.set({
    capturedImage: {
      dataUrl: "",
      timestamp: "",
    },
  });
};
