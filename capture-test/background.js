// 익스텐션 아이콘 클릭시 사이드패널 열기
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
  });
  
  // 캡쳐된 이미지 메시지 처리
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.type === 'capturedImage') {
      // 사이드패널에 이미지 표시
      chrome.runtime.sendMessage({ 
        type: 'displayImage', 
        dataUrl: message.dataUrl 
      });
    }
  });