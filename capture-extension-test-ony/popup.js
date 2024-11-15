let isContentScriptLoaded = false;

document.getElementById('captureBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // if (!isContentScriptLoaded) {
  // content.js 로드
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js'],
  });
  //   isContentScriptLoaded = true;
  // } else {
  //   // ESC와 유사하게 선택 취소 기능 실행
  //   chrome.scripting.executeScript({
  //     target: { tabId: tab.id },
  //     func: () => {
  //       document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  //     },
  //   });
  //   isContentScriptLoaded = false;
  // }
});
