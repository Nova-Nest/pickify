// 캡쳐이미지 없애기
document.getElementById('deleteButton').addEventListener('click', () => {});

function clickDeleteButton() {
  console.log('클릭 딜리트 버튼');
  const nowCapturedImage = document.getElementById('nowCapturedImage');
  console.log(nowCapturedImage, 'nowCapturedImage');
  nowCapturedImage.innerHTML = '';
  nowCapturedImage.className = 'noImage';

  chrome.storage.local.set({
    capturedImage: {
      dataUrl: '',
      timestamp: '',
    },
  });
}
