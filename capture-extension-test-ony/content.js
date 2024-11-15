let startX, startY, endX, endY;
let isSelecting = false;
let selectionBox = null;
console.log('dsd');

const mousedownFunc = (e) => {
  isSelecting = true;
  startX = e.pageX;
  startY = e.pageY;

  selectionBox = document.createElement('div');
  selectionBox.style.position = 'absolute';
  selectionBox.style.border = '2px dashed #0099FF';
  selectionBox.style.backgroundColor = 'rgba(0, 153, 255, 0.3)';
  selectionBox.style.left = `${startX}px`;
  selectionBox.style.top = `${startY}px`;
  document.body.appendChild(selectionBox);
};

const mousemoveFunc = (e) => {
  if (!isSelecting) return;
  endX = e.pageX;
  endY = e.pageY;

  selectionBox.style.width = `${Math.abs(endX - startX)}px`;
  selectionBox.style.height = `${Math.abs(endY - startY)}px`;
  selectionBox.style.left = `${Math.min(startX, endX)}px`;
  selectionBox.style.top = `${Math.min(startY, endY)}px`;
};
const mouseUpFunc = () => {
  console.log('Selected area:', { startX, startY, endX, endY });
  // 여기는 캡쳐되는 브라우저 콘솔에 찍힘
  isSelecting = false;N

  const captureArea = {
    startX: Math.min(startX, endX),
    startY: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };

  // 선택 영역 정보를 background.js로 전송
  chrome.runtime.sendMessage({ action: 'captureArea', captureArea });

  document.body.removeChild(selectionBox);
  selectionBox = null;
};

document.addEventListener('mousedown', mousedownFunc);
document.addEventListener('mousemove', mousemoveFunc);
document.addEventListener('mouseup', mouseUpFunc);

// esc키 누르면
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    console.log('Selection cancelled');

    document.removeEventListener('mousedown', mousedownFunc);
    document.removeEventListener('mousemove', mousemoveFunc);
    document.removeEventListener('mouseup', mouseUpFunc);

    document.dispatchEvent;
  }
});
