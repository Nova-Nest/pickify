chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureArea') {
    const { startX, startY, width, height } = request.captureArea;
    console.log(request, 'ref');

    chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        // 캔버스에 선택 영역만큼 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(img, startX, startY, width, height, 0, 0, width, height);

        // 잘라낸 이미지를 다운로드
        const croppedDataUrl = canvas.toDataURL('image/png');
        chrome.downloads.download({
          url: croppedDataUrl,
          filename: 'capture.png',
          saveAs: true,
        });
      };
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.system.display.getInfo((displays) => {
    // 첫 번째 디스플레이의 가로 해상도 사용
    const screenWidth = displays[0].workArea.width;

    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400, // 창 너비
      height: 600, // 창 높이
      left: screenWidth - 400, // 오른쪽에 고정되도록 위치 설정
      top: 0,
    });
  });
});
